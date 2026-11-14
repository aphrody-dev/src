/* tslint:disable */
/* eslint-disable */

/**
 * Shared stateful showcase controller exposed to Material 3 HTML/TS Web host.
 */
export class RustShowcaseWeb {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  quad_count(): number;
  select_abi(idx: number): string;
  select_brick(idx: number): string;
  select_crate(idx: number): string;
  set_domain(domain_idx: number): string;
  set_page(idx: number): string;
  set_preset(idx: number): string;
  set_search(query: string): string;
  set_tab(idx: number): string;
  set_target(idx: number): string;
  set_tile_count(count: number): string;
  set_tiling(idx: number): string;
  set_viewport(width: number, height: number): string;
  snapshot_json(): string;
  toggle_dark(): string;
}

/**
 * Shared WebGPU canvas renderer running the identical `showcase.wgsl` + `GpuShowcaseRenderer`
 * as the Windows/Linux Desktop executable.
 */
export class RustShowcaseWebGpu {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  adapter_name(): string;
  click(px: number, py: number): string;
  static create(canvas: HTMLCanvasElement): Promise<RustShowcaseWebGpu>;
  render(): void;
  resize(width: number, height: number): void;
  sync_from_state(
    tab: number,
    preset: number,
    dark: boolean,
    page: number,
    target: number,
    tiling: number,
    tile_count: number,
    domain: number,
    selected_crate: number,
    selected_brick: number,
    selected_abi: number,
  ): void;
}

export type InitInput =
  RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_rustshowcaseweb_free: (a: number, b: number) => void;
  readonly __wbg_rustshowcasewebgpu_free: (a: number, b: number) => void;
  readonly rustshowcaseweb_new: () => number;
  readonly rustshowcaseweb_quad_count: (a: number) => number;
  readonly rustshowcaseweb_select_abi: (
    a: number,
    b: number,
    c: number,
  ) => void;
  readonly rustshowcaseweb_select_brick: (
    a: number,
    b: number,
    c: number,
  ) => void;
  readonly rustshowcaseweb_select_crate: (
    a: number,
    b: number,
    c: number,
  ) => void;
  readonly rustshowcaseweb_set_domain: (
    a: number,
    b: number,
    c: number,
  ) => void;
  readonly rustshowcaseweb_set_page: (a: number, b: number, c: number) => void;
  readonly rustshowcaseweb_set_preset: (
    a: number,
    b: number,
    c: number,
  ) => void;
  readonly rustshowcaseweb_set_search: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly rustshowcaseweb_set_tab: (a: number, b: number, c: number) => void;
  readonly rustshowcaseweb_set_target: (
    a: number,
    b: number,
    c: number,
  ) => void;
  readonly rustshowcaseweb_set_tile_count: (
    a: number,
    b: number,
    c: number,
  ) => void;
  readonly rustshowcaseweb_set_tiling: (
    a: number,
    b: number,
    c: number,
  ) => void;
  readonly rustshowcaseweb_set_viewport: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly rustshowcaseweb_snapshot_json: (a: number, b: number) => void;
  readonly rustshowcaseweb_toggle_dark: (a: number, b: number) => void;
  readonly rustshowcasewebgpu_adapter_name: (a: number, b: number) => void;
  readonly rustshowcasewebgpu_click: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly rustshowcasewebgpu_create: (a: any) => any;
  readonly rustshowcasewebgpu_render: (a: number) => void;
  readonly rustshowcasewebgpu_resize: (a: number, b: number, c: number) => void;
  readonly rustshowcasewebgpu_sync_from_state: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: number,
    l: number,
  ) => void;
  readonly __wasm_bindgen_func_elem_3336: (
    a: number,
    b: number,
    c: number,
    d: any,
  ) => void;
  readonly __wasm_bindgen_func_elem_3352: (
    a: number,
    b: number,
    c: any,
    d: any,
  ) => void;
  readonly __wasm_bindgen_func_elem_433: (
    a: number,
    b: number,
    c: number,
    d: any,
  ) => void;
  readonly __wasm_bindgen_func_elem_433_25: (
    a: number,
    b: number,
    c: number,
    d: any,
  ) => void;
  readonly __wasm_bindgen_func_elem_433_26: (
    a: number,
    b: number,
    c: number,
    d: any,
  ) => void;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => number;
  readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export4: (a: number) => void;
  readonly __wbindgen_export5: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_export6: (a: number, b: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export7: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
  module: { module: SyncInitInput } | SyncInitInput,
): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<InitOutput>;
