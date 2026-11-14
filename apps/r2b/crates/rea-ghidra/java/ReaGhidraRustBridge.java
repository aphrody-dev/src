// SPDX-License-Identifier: Apache-2.0 OR MIT
/**
 * ReaGhidraRustBridge.java (Java 25 LTS Panama Foreign Function & Memory Bridge)
 *
 * Replaces legacy `ReaGhidraBridge.java` (5,488 lines of slow JVM/Swing/HeadlessScript socket glue)
 * by linking directly to `n2b_ffi.dll` (`crates/n2b-cli`) via Java 25 `java.lang.foreign.Linker`
 * with zero JNI C++ boilerplate and sub-millisecond native P-Code / Pseudo-C decompilation.
 */
import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.SymbolLookup;
import java.lang.foreign.ValueLayout;
import java.lang.invoke.MethodHandle;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ReaGhidraRustBridge {
    private static Path resolveNativeDll() {
        Path releaseDll = Path.of("C:/src/n2b/target/release/n2b_ffi.dll");
        if (Files.exists(releaseDll)) {
            return releaseDll;
        }
        Path debugDll = Path.of("C:/src/n2b/target/debug/n2b_ffi.dll");
        if (Files.exists(debugDll)) {
            return debugDll;
        }
        throw new IllegalStateException("n2b_ffi.dll not built yet; run `cargo build --release` in C:/src/n2b");
    }

    public static void main(String[] args) throws Throwable {
        String cmd = args.length > 0 ? args[0] : "abi";
        Path dllPath = resolveNativeDll();

        Linker linker = Linker.nativeLinker();
        try (Arena arena = Arena.ofConfined()) {
            SymbolLookup lookup = SymbolLookup.libraryLookup(dllPath, arena);

            MethodHandle abiVer = linker.downcallHandle(
                lookup.find("n2b_abi_version").orElseThrow(),
                FunctionDescriptor.of(ValueLayout.JAVA_INT)
            );
            MethodHandle decompileJson = linker.downcallHandle(
                lookup.find("n2b_ghidra_decompile_json").orElseThrow(),
                FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_LONG)
            );
            MethodHandle scanJson = linker.downcallHandle(
                lookup.find("n2b_scan_json").orElseThrow(),
                FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_LONG)
            );
            MethodHandle freeStr = linker.downcallHandle(
                lookup.find("n2b_free_string").orElseThrow(),
                FunctionDescriptor.ofVoid(ValueLayout.ADDRESS)
            );

            int version = (int) abiVer.invokeExact();
            if ("abi".equals(cmd)) {
                System.out.printf("{\"bridge\":\"java25-panama-ffm\",\"abiVersion\":\"0x%08x\",\"dll\":\"%s\"}%n",
                    version, dllPath.toString().replace('\\', '/'));
                return;
            }

            if ("decompile".equals(cmd) && args.length >= 2) {
                int maxFns = args.length >= 3 ? Integer.parseInt(args[2]) : 4;
                MemorySegment cPath = arena.allocateFrom(args[1]);
                MemorySegment rawPtr = (MemorySegment) decompileJson.invokeExact(cPath, (long) maxFns);
                if (rawPtr.equals(MemorySegment.NULL)) {
                    throw new RuntimeException("n2b_ghidra_decompile_json returned NULL");
                }
                try {
                    String json = rawPtr.reinterpret(64L * 1024 * 1024).getString(0);
                    System.out.println(json);
                } finally {
                    freeStr.invokeExact(rawPtr);
                }
                return;
            }

            if ("scan".equals(cmd) && args.length >= 2) {
                int maxFiles = args.length >= 3 ? Integer.parseInt(args[2]) : 5000;
                MemorySegment cPath = arena.allocateFrom(args[1]);
                MemorySegment rawPtr = (MemorySegment) scanJson.invokeExact(cPath, (long) maxFiles);
                if (rawPtr.equals(MemorySegment.NULL)) {
                    throw new RuntimeException("n2b_scan_json returned NULL");
                }
                try {
                    String json = rawPtr.reinterpret(64L * 1024 * 1024).getString(0);
                    System.out.println(json);
                } finally {
                    freeStr.invokeExact(rawPtr);
                }
                return;
            }

            System.err.println("Usage: java --enable-native-access=ALL-UNNAMED ReaGhidraRustBridge.java <abi|decompile|scan> [target] [limit]");
            System.exit(1);
        }
    }
}
