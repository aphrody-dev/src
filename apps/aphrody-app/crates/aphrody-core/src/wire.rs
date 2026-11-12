//! Wayland-style binary wire framing.
//!
//! Every message is `[object_id u32][size << 16 | opcode u32][payload]` in
//! little-endian byte order, with `size` counting the 8 header bytes and the
//! payload, and payload always padded to a multiple of 4 bytes. This mirrors
//! the real Wayland wire format minus file descriptor passing.

pub const HEADER_LEN: usize = 8;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WireError {
    Truncated,
    BadSize(u32),
    BadString,
    BadSignature(char),
    TooLarge,
}

impl core::fmt::Display for WireError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            WireError::Truncated => write!(f, "truncated message"),
            WireError::BadSize(s) => write!(f, "bad message size {s}"),
            WireError::BadString => write!(f, "malformed string argument"),
            WireError::BadSignature(c) => write!(f, "unknown signature char {c:?}"),
            WireError::TooLarge => write!(f, "message exceeds 65535 bytes"),
        }
    }
}

impl std::error::Error for WireError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Header {
    pub object_id: u32,
    pub opcode: u16,
    pub size: u16,
}

impl Header {
    pub fn parse(buf: &[u8]) -> Result<Header, WireError> {
        if buf.len() < HEADER_LEN {
            return Err(WireError::Truncated);
        }
        let object_id = u32::from_le_bytes([buf[0], buf[1], buf[2], buf[3]]);
        let word = u32::from_le_bytes([buf[4], buf[5], buf[6], buf[7]]);
        let size = (word >> 16) as u16;
        let opcode = (word & 0xFFFF) as u16;
        if (size as usize) < HEADER_LEN || size % 4 != 0 {
            return Err(WireError::BadSize(size as u32));
        }
        Ok(Header { object_id, opcode, size })
    }

    pub fn encode(&self) -> [u8; HEADER_LEN] {
        let mut out = [0u8; HEADER_LEN];
        out[0..4].copy_from_slice(&self.object_id.to_le_bytes());
        let word = ((self.size as u32) << 16) | self.opcode as u32;
        out[4..8].copy_from_slice(&word.to_le_bytes());
        out
    }
}

/// Wire argument. Signature characters: `i` int, `u` uint, `f` fixed 24.8,
/// `s` string, `a` array, `o` object id, `n` new_id.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Arg {
    Int(i32),
    Uint(u32),
    Fixed(i32),
    Str(String),
    Array(Vec<u8>),
    Object(u32),
    NewId(u32),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Message {
    pub object_id: u32,
    pub opcode: u16,
    pub args: Vec<Arg>,
}

fn pad4(n: usize) -> usize {
    (n + 3) & !3
}

impl Message {
    pub fn new(object_id: u32, opcode: u16, args: Vec<Arg>) -> Self {
        Message { object_id, opcode, args }
    }

    pub fn encode_into(&self, out: &mut Vec<u8>) -> Result<(), WireError> {
        let mut payload = Vec::new();
        for a in &self.args {
            match a {
                Arg::Int(v) | Arg::Fixed(v) => payload.extend_from_slice(&v.to_le_bytes()),
                Arg::Uint(v) | Arg::Object(v) | Arg::NewId(v) => {
                    payload.extend_from_slice(&v.to_le_bytes())
                }
                Arg::Str(s) => {
                    let len = s.len() + 1;
                    payload.extend_from_slice(&(len as u32).to_le_bytes());
                    payload.extend_from_slice(s.as_bytes());
                    payload.push(0);
                    payload.resize(payload.len() + (pad4(len) - len), 0);
                }
                Arg::Array(b) => {
                    payload.extend_from_slice(&(b.len() as u32).to_le_bytes());
                    payload.extend_from_slice(b);
                    payload.resize(payload.len() + (pad4(b.len()) - b.len()), 0);
                }
            }
        }
        let total = HEADER_LEN + payload.len();
        if total > u16::MAX as usize {
            return Err(WireError::TooLarge);
        }
        let h = Header { object_id: self.object_id, opcode: self.opcode, size: total as u16 };
        out.extend_from_slice(&h.encode());
        out.extend_from_slice(&payload);
        Ok(())
    }

    pub fn encode(&self) -> Result<Vec<u8>, WireError> {
        let mut v = Vec::new();
        self.encode_into(&mut v)?;
        Ok(v)
    }

    /// Decode one message given its argument signature. Returns the message and
    /// the number of bytes consumed.
    pub fn decode(buf: &[u8], signature: &str) -> Result<(Message, usize), WireError> {
        let h = Header::parse(buf)?;
        let size = h.size as usize;
        if buf.len() < size {
            return Err(WireError::Truncated);
        }
        let args = decode_args(&buf[HEADER_LEN..size], signature)?;
        Ok((Message { object_id: h.object_id, opcode: h.opcode, args }, size))
    }
}

fn take_u32(p: &[u8], off: &mut usize) -> Result<u32, WireError> {
    if *off + 4 > p.len() {
        return Err(WireError::Truncated);
    }
    let v = u32::from_le_bytes([p[*off], p[*off + 1], p[*off + 2], p[*off + 3]]);
    *off += 4;
    Ok(v)
}

pub fn decode_args(p: &[u8], signature: &str) -> Result<Vec<Arg>, WireError> {
    let mut off = 0usize;
    let mut args = Vec::with_capacity(signature.len());
    for c in signature.chars() {
        let a = match c {
            'i' => Arg::Int(take_u32(p, &mut off)? as i32),
            'f' => Arg::Fixed(take_u32(p, &mut off)? as i32),
            'u' => Arg::Uint(take_u32(p, &mut off)?),
            'o' => Arg::Object(take_u32(p, &mut off)?),
            'n' => Arg::NewId(take_u32(p, &mut off)?),
            's' | 'a' => {
                let len = take_u32(p, &mut off)? as usize;
                let end = off.checked_add(pad4(len)).ok_or(WireError::Truncated)?;
                if end > p.len() || (c == 's' && len == 0) {
                    return Err(if end > p.len() { WireError::Truncated } else { WireError::BadString });
                }
                let raw = &p[off..off + len];
                off = end;
                if c == 's' {
                    if raw[len - 1] != 0 {
                        return Err(WireError::BadString);
                    }
                    let s = core::str::from_utf8(&raw[..len - 1]).map_err(|_| WireError::BadString)?;
                    Arg::Str(s.to_string())
                } else {
                    Arg::Array(raw.to_vec())
                }
            }
            other => return Err(WireError::BadSignature(other)),
        };
        args.push(a);
    }
    if off != p.len() {
        return Err(WireError::BadSize(p.len() as u32));
    }
    Ok(args)
}

/// Pull the next complete frame from a byte stream. `Ok(None)` means more
/// bytes are needed.
pub fn next_frame(buf: &[u8]) -> Result<Option<(Header, &[u8])>, WireError> {
    if buf.len() < HEADER_LEN {
        return Ok(None);
    }
    let h = Header::parse(buf)?;
    if buf.len() < h.size as usize {
        return Ok(None);
    }
    Ok(Some((h, &buf[HEADER_LEN..h.size as usize])))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn header_layout_matches_wayland() {
        let h = Header { object_id: 1, opcode: 1, size: 12 };
        let b = h.encode();
        assert_eq!(b, [1, 0, 0, 0, 1, 0, 12, 0]);
        assert_eq!(Header::parse(&b).unwrap(), h);
    }

    #[test]
    fn string_padding_and_roundtrip() {
        let m = Message::new(7, 2, vec![Arg::Str("hello".into()), Arg::Uint(9), Arg::Array(vec![1, 2, 3])]);
        let bytes = m.encode().unwrap();
        // header 8 + (4 + pad4(6)=8) + 4 + (4 + 4) = 32
        assert_eq!(bytes.len(), 32);
        assert_eq!(bytes.len() % 4, 0);
        let (d, used) = Message::decode(&bytes, "sua").unwrap();
        assert_eq!(used, 32);
        assert_eq!(d.args[0], Arg::Str("hello".into()));
        assert_eq!(d.args[2], Arg::Array(vec![1, 2, 3]));
    }

    #[test]
    fn rejects_malformed() {
        assert_eq!(Header::parse(&[0; 4]), Err(WireError::Truncated));
        let mut b = Message::new(1, 0, vec![Arg::Uint(1)]).encode().unwrap();
        assert!(Message::decode(&b, "uu").is_err());
        assert!(Message::decode(&b, "x").is_err());
        b.truncate(10);
        assert!(Message::decode(&b, "u").is_err());
        // size not multiple of 4
        assert!(Header::parse(&[1, 0, 0, 0, 0, 0, 9, 0]).is_err());
    }

    #[test]
    fn frame_splitting() {
        let mut stream = Message::new(1, 0, vec![Arg::NewId(2)]).encode().unwrap();
        stream.extend(Message::new(2, 1, vec![]).encode().unwrap());
        let (h, p) = next_frame(&stream).unwrap().unwrap();
        assert_eq!((h.object_id, p.len()), (1, 4));
        let rest = &stream[h.size as usize..];
        let (h2, p2) = next_frame(rest).unwrap().unwrap();
        assert_eq!((h2.object_id, p2.len()), (2, 0));
        assert!(next_frame(&stream[..5]).unwrap().is_none());
    }
}
