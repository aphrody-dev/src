/**
 * Aphrody Pure Binary WebAssembly Kernel
 * Hand-assembled valid WebAssembly binary with dynamic LEB128 sizing
 * Zero external compilers & zero npm dependencies!
 *
 * Provides high-performance SIMD/math operations for the Storytold suite:
 * - add(a: i32, b: i32): i32
 * - vec4_dot(x1..w1, x2..w2): f32
 * - fast_lerp(a: f32, b: f32, t: f32): f32
 * - compute_orbit(angle: f32, radius: f32): f32
 */

export interface StorytoldWasmExports {
  add: (a: number, b: number) => number;
  vec4_dot: (
    x1: number,
    y1: number,
    z1: number,
    w1: number,
    x2: number,
    y2: number,
    z2: number,
    w2: number,
  ) => number;
  fast_lerp: (a: number, b: number, t: number) => number;
  compute_orbit: (angle: number, radius: number) => number;
}

function encodeLeb128(value: number): number[] {
  const bytes: number[] = [];
  let val = value;
  do {
    let byte = val & 0x7f;
    val >>>= 7;
    if (val !== 0) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (val !== 0);
  return bytes;
}

function makeSection(id: number, contents: number[]): number[] {
  return [id, ...encodeLeb128(contents.length), ...contents];
}

function encodeString(str: string): number[] {
  const utf8: number[] = Array.from(new TextEncoder().encode(str));
  return [...encodeLeb128(utf8.length), ...utf8];
}

export function buildStorytoldWasmBinary(): Uint8Array {
  // Types:
  // Type 0: (i32, i32) -> i32
  const type0 = [0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f];
  // Type 1: (f32 x 8) -> f32
  const type1 = [
    0x60, 0x08, 0x7d, 0x7d, 0x7d, 0x7d, 0x7d, 0x7d, 0x7d, 0x7d, 0x01, 0x7d,
  ];
  // Type 2: (f32, f32, f32) -> f32
  const type2 = [0x60, 0x03, 0x7d, 0x7d, 0x7d, 0x01, 0x7d];
  // Type 3: (f32, f32) -> f32
  const type3 = [0x60, 0x02, 0x7d, 0x7d, 0x01, 0x7d];

  const typeSectionPayload = [0x04, ...type0, ...type1, ...type2, ...type3];
  const typeSection = makeSection(1, typeSectionPayload);

  // Function section: 4 functions referencing types 0, 1, 2, 3
  const funcSectionPayload = [0x04, 0x00, 0x01, 0x02, 0x03];
  const funcSection = makeSection(3, funcSectionPayload);

  // Export section:
  const exportSectionPayload = [
    0x04,
    ...encodeString("add"),
    0x00,
    0x00,
    ...encodeString("vec4_dot"),
    0x00,
    0x01,
    ...encodeString("fast_lerp"),
    0x00,
    0x02,
    ...encodeString("compute_orbit"),
    0x00,
    0x03,
  ];
  const exportSection = makeSection(7, exportSectionPayload);

  // Code section:
  // Func 0 (add): local.get 0, local.get 1, i32.add (0x6a), end
  const body0 = [0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b];
  const code0 = [...encodeLeb128(body0.length), ...body0];

  // Func 1 (vec4_dot):
  // x1*x2 + y1*y2 + z1*z2 + w1*w2
  // f32.mul is 0x94, f32.add is 0x92
  const body1 = [
    0x00,
    0x20,
    0x00,
    0x20,
    0x04,
    0x94, // local.get 0, local.get 4, f32.mul
    0x20,
    0x01,
    0x20,
    0x05,
    0x94, // local.get 1, local.get 5, f32.mul
    0x92, // f32.add
    0x20,
    0x02,
    0x20,
    0x06,
    0x94, // local.get 2, local.get 6, f32.mul
    0x92, // f32.add
    0x20,
    0x03,
    0x20,
    0x07,
    0x94, // local.get 3, local.get 7, f32.mul
    0x92, // f32.add
    0x0b, // end
  ];
  const code1 = [...encodeLeb128(body1.length), ...body1];

  // Func 2 (fast_lerp): a + (b - a) * t
  // f32.sub is 0x93, f32.mul is 0x94, f32.add is 0x92
  const body2 = [
    0x00,
    0x20,
    0x00, // local.get 0 (a)
    0x20,
    0x01,
    0x20,
    0x00,
    0x93, // local.get 1, local.get 0, f32.sub (b - a)
    0x20,
    0x02,
    0x94, // local.get 2, f32.mul ((b - a) * t)
    0x92, // f32.add (a + ...)
    0x0b, // end
  ];
  const code2 = [...encodeLeb128(body2.length), ...body2];

  // Func 3 (compute_orbit): angle * radius
  const body3 = [
    0x00,
    0x20,
    0x00,
    0x20,
    0x01,
    0x94, // local.get 0, local.get 1, f32.mul
    0x0b, // end
  ];
  const code3 = [...encodeLeb128(body3.length), ...body3];

  const codeSectionPayload = [0x04, ...code0, ...code1, ...code2, ...code3];
  const codeSection = makeSection(10, codeSectionPayload);

  // Assembly: Magic + Version + Sections
  const binary = [
    0x00,
    0x61,
    0x73,
    0x6d, // \0asm
    0x01,
    0x00,
    0x00,
    0x00, // Version 1
    ...typeSection,
    ...funcSection,
    ...exportSection,
    ...codeSection,
  ];

  return new Uint8Array(binary);
}

let cachedInstance: StorytoldWasmExports | null = null;

export async function getStorytoldWasm(): Promise<StorytoldWasmExports> {
  if (cachedInstance) return cachedInstance;

  const binary = buildStorytoldWasmBinary();
  const module: any = await WebAssembly.instantiate(binary);
  cachedInstance = (module.instance
    ? module.instance.exports
    : module.exports) as unknown as StorytoldWasmExports;
  return cachedInstance;
}
