//! OPFS storage backend. The `Storage` trait is synchronous while OPFS is
//! asynchronous on the main thread, so this backend keeps an in-memory copy
//! that is hydrated from OPFS at startup and written back asynchronously
//! (write-behind). Keys map to flat OPFS file names with `/` replaced by `~`.

use aphrody_core::store::{Storage, StorageError, StorageResult, validate_key};
use js_sys::{Function, Reflect, Uint8Array};
use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;
use wasm_bindgen::{JsCast, JsValue};
use wasm_bindgen_futures::{JsFuture, spawn_local};
use web_sys::{FileSystemDirectoryHandle, FileSystemFileHandle, FileSystemGetFileOptions, FileSystemWritableFileStream};

#[derive(Default)]
struct Inner {
    data: BTreeMap<String, Vec<u8>>,
    dirty: BTreeSet<String>,
    deleted: BTreeSet<String>,
    running: bool,
    dir: Option<FileSystemDirectoryHandle>,
}

#[derive(Clone)]
pub struct OpfsStorage {
    inner: Rc<RefCell<Inner>>,
}

fn fname(key: &str) -> String {
    key.replace('/', "~")
}

fn kname(file: &str) -> String {
    file.replace('~', "/")
}

fn js(e: JsValue) -> String {
    e.as_string().unwrap_or_else(|| format!("{e:?}"))
}

impl OpfsStorage {
    /// Open the OPFS root and load every file into memory.
    pub async fn open() -> Result<OpfsStorage, String> {
        let nav = web_sys::window().ok_or("no window")?.navigator();
        let sm = nav.storage();
        let dir: FileSystemDirectoryHandle = JsFuture::from(sm.get_directory()).await.map_err(js)?.unchecked_into();
        let mut data = BTreeMap::new();
        let values = Reflect::get(&dir, &"values".into()).map_err(js)?.unchecked_into::<Function>();
        let iter = values.call0(&dir).map_err(js)?;
        let next = Reflect::get(&iter, &"next".into()).map_err(js)?.unchecked_into::<Function>();
        loop {
            let step = JsFuture::from(next.call0(&iter).map_err(js)?.unchecked_into::<js_sys::Promise>()).await.map_err(js)?;
            if Reflect::get(&step, &"done".into()).map_err(js)?.is_truthy() {
                break;
            }
            let handle = Reflect::get(&step, &"value".into()).map_err(js)?;
            let kind = Reflect::get(&handle, &"kind".into()).map_err(js)?.as_string().unwrap_or_default();
            if kind != "file" {
                continue;
            }
            let name = Reflect::get(&handle, &"name".into()).map_err(js)?.as_string().unwrap_or_default();
            let fh: FileSystemFileHandle = handle.unchecked_into();
            let file: web_sys::File = JsFuture::from(fh.get_file()).await.map_err(js)?.unchecked_into();
            let buf = JsFuture::from(file.array_buffer()).await.map_err(js)?;
            data.insert(kname(&name), Uint8Array::new(&buf).to_vec());
        }
        let inner = Inner { data, dir: Some(dir), ..Default::default() };
        Ok(OpfsStorage { inner: Rc::new(RefCell::new(inner)) })
    }

    fn schedule(&self) {
        {
            let mut i = self.inner.borrow_mut();
            if i.running {
                return;
            }
            i.running = true;
        }
        let me = self.clone();
        spawn_local(async move {
            loop {
                let (dir, writes, removes) = {
                    let mut i = me.inner.borrow_mut();
                    if i.dirty.is_empty() && i.deleted.is_empty() {
                        i.running = false;
                        return;
                    }
                    let dirty = std::mem::take(&mut i.dirty);
                    let writes: Vec<(String, Vec<u8>)> =
                        dirty.into_iter().filter_map(|k| i.data.get(&k).map(|v| (k, v.clone()))).collect();
                    let removes: Vec<String> = std::mem::take(&mut i.deleted).into_iter().collect();
                    (i.dir.clone(), writes, removes)
                };
                let Some(dir) = dir else { continue };
                for (k, v) in writes {
                    let _ = write_file(&dir, &fname(&k), &v).await;
                }
                for k in removes {
                    let _ = JsFuture::from(dir.remove_entry(&fname(&k))).await;
                }
            }
        });
    }
}

async fn write_file(dir: &FileSystemDirectoryHandle, name: &str, bytes: &[u8]) -> Result<(), String> {
    let opts = FileSystemGetFileOptions::new();
    opts.set_create(true);
    let fh: FileSystemFileHandle =
        JsFuture::from(dir.get_file_handle_with_options(name, &opts)).await.map_err(js)?.unchecked_into();
    let w: FileSystemWritableFileStream = JsFuture::from(fh.create_writable()).await.map_err(js)?.unchecked_into();
    JsFuture::from(w.write_with_u8_array(bytes).map_err(js)?).await.map_err(js)?;
    JsFuture::from(w.close()).await.map_err(js)?;
    Ok(())
}

impl Storage for OpfsStorage {
    fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>> {
        validate_key(key)?;
        Ok(self.inner.borrow().data.get(key).cloned())
    }
    fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()> {
        validate_key(key)?;
        {
            let mut i = self.inner.borrow_mut();
            i.data.insert(key.to_string(), value.to_vec());
            i.deleted.remove(key);
            i.dirty.insert(key.to_string());
        }
        self.schedule();
        Ok(())
    }
    fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()> {
        validate_key(key)?;
        {
            let mut i = self.inner.borrow_mut();
            i.data.entry(key.to_string()).or_default().extend_from_slice(value);
            i.deleted.remove(key);
            i.dirty.insert(key.to_string());
        }
        self.schedule();
        Ok(())
    }
    fn delete(&mut self, key: &str) -> StorageResult<bool> {
        validate_key(key)?;
        let existed = {
            let mut i = self.inner.borrow_mut();
            let existed = i.data.remove(key).is_some();
            i.dirty.remove(key);
            if existed {
                i.deleted.insert(key.to_string());
            }
            existed
        };
        if existed {
            self.schedule();
        }
        Ok(existed)
    }
    fn list(&self, prefix: &str) -> StorageResult<Vec<String>> {
        Ok(self.inner.borrow().data.keys().filter(|k| k.starts_with(prefix)).cloned().collect())
    }
    fn flush(&mut self) -> StorageResult<()> {
        self.schedule();
        Ok(())
    }
}

#[allow(dead_code)]
fn _assert_error_type(_: StorageError) {}
