/**
 * Extended CompressionStream & DecompressionStream with 'br' and 'zstd' parity
 */

export type ParityCompressionFormat =
  "gzip" | "deflate" | "deflate-raw" | "zstd" | "br" | "brotli";

const NativeCompressionStream = globalThis.CompressionStream;
const NativeDecompressionStream = globalThis.DecompressionStream;

function normalizeFormat(format: string): string {
  const lower = String(format).toLowerCase();
  if (lower === "br") return "brotli";
  return lower;
}

export class ParityCompressionStream {
  readonly readable: ReadableStream<any>;
  readonly writable: WritableStream<any>;
  readonly format: string;

  constructor(format: ParityCompressionFormat | string) {
    this.format = String(format);
    const normalized = normalizeFormat(format);
    const nativeStream = new NativeCompressionStream(normalized as any);
    this.readable = nativeStream.readable;
    this.writable = nativeStream.writable;
  }
}

export class ParityDecompressionStream {
  readonly readable: ReadableStream<any>;
  readonly writable: WritableStream<any>;
  readonly format: string;

  constructor(format: ParityCompressionFormat | string) {
    this.format = String(format);
    const normalized = normalizeFormat(format);
    const nativeStream = new NativeDecompressionStream(normalized as any);
    this.readable = nativeStream.readable;
    this.writable = nativeStream.writable;
  }
}

export function installCompression(target: any = globalThis): void {
  // Wrap CompressionStream to support 'br'
  const OrigCS = target.CompressionStream;
  if (OrigCS) {
    const WrappedCS = function (this: any, format: string) {
      const normalized = normalizeFormat(format);
      return new OrigCS(normalized as any);
    } as any;
    WrappedCS.prototype = OrigCS.prototype;
    Object.defineProperty(target, "CompressionStream", {
      value: WrappedCS,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(target, "CompressionStream", {
      value: ParityCompressionStream,
      writable: true,
      configurable: true,
    });
  }

  // Wrap DecompressionStream to support 'br'
  const OrigDS = target.DecompressionStream;
  if (OrigDS) {
    const WrappedDS = function (this: any, format: string) {
      const normalized = normalizeFormat(format);
      return new OrigDS(normalized as any);
    } as any;
    WrappedDS.prototype = OrigDS.prototype;
    Object.defineProperty(target, "DecompressionStream", {
      value: WrappedDS,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(target, "DecompressionStream", {
      value: ParityDecompressionStream,
      writable: true,
      configurable: true,
    });
  }
}
