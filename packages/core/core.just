# @aphrody/core index and native bindings (C header, Python, Java) (imported by the root justfile).

# Index src (+ third_party/vendor with --all) via @aphrody/core into var/index/core.db
[group('core')]
index *args:
    bun packages/core/src/cli.ts index "{{root}}" {{args}}

# Generate skills + docs/reference from the index
[group('core')]
index-gen:
    bun packages/core/src/cli.ts gen "{{root}}"

# Regenerate the core C header (cbindgen)
[group('core')]
core-header:
    cbindgen --config crates/core-capi/cbindgen.toml crates/core-capi -o crates/core-capi/include/aphrody_core.h
# --- Labs (merged from C:\labs): conformance (ay conformance), Lore, Chromium factory ---

# Build native Python core (`crates/core-py` PyO3 ABI3 -> `packages/core-py/src/aphrody_native`)
[group('core')]
py-build:
    cargo build -p aphrody-core-py --release
    cp -f "{{root}}/target/release/aphrody_native.dll" "{{root}}/packages/core-py/src/aphrody_native.pyd" 2>/dev/null || cp -f "{{root}}/target/release/libaphrody_native.so" "{{root}}/packages/core-py/src/aphrody_native.so" 2>/dev/null || true

# Run Python core unit tests (`aysys.dll`, `aphrody_core_capi.dll`, `aphrody_ffi.dll`, `aphrody_native`)
[group('core')]
py-test: py-build
    python -m unittest discover -s "{{root}}/packages/core-py/tests" -v

# Build Java 25 core (`crates/core-jni` + `packages/core-java`) and run FFM + JNI verification
[group('core')]
java-build:
    cargo build -p aphrody-core-jni --release
    javac --release 25 -d "{{root}}/target/core-java/classes" "{{root}}/packages/core-java/src/main/java/com/aphrody/core/"*.java "{{root}}/packages/core-java/src/test/java/com/aphrody/core/"*.java

[group('core')]
java-test: java-build
    java --enable-native-access=ALL-UNNAMED -cp "{{root}}/target/core-java/classes" com.aphrody.core.AphrodyCoreTest
