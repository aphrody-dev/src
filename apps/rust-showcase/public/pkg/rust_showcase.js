/* @ts-self-types="./rust_showcase.d.ts" */

/**
 * Shared stateful showcase controller exposed to Material 3 HTML/TS Web host.
 */
export class RustShowcaseWeb {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    RustShowcaseWebFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_rustshowcaseweb_free(ptr, 0);
  }
  constructor() {
    const ret = wasm.rustshowcaseweb_new();
    this.__wbg_ptr = ret;
    RustShowcaseWebFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
   * @returns {number}
   */
  quad_count() {
    const ret = wasm.rustshowcaseweb_quad_count(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} idx
   * @returns {string}
   */
  select_abi(idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_select_abi(retptr, this.__wbg_ptr, idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} idx
   * @returns {string}
   */
  select_brick(idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_select_brick(retptr, this.__wbg_ptr, idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} idx
   * @returns {string}
   */
  select_crate(idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_select_crate(retptr, this.__wbg_ptr, idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} domain_idx
   * @returns {string}
   */
  set_domain(domain_idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_set_domain(retptr, this.__wbg_ptr, domain_idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} idx
   * @returns {string}
   */
  set_page(idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_set_page(retptr, this.__wbg_ptr, idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} idx
   * @returns {string}
   */
  set_preset(idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_set_preset(retptr, this.__wbg_ptr, idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {string} query
   * @returns {string}
   */
  set_search(query) {
    let deferred2_0;
    let deferred2_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      const ptr0 = passStringToWasm0(
        query,
        wasm.__wbindgen_export,
        wasm.__wbindgen_export2,
      );
      const len0 = WASM_VECTOR_LEN;
      wasm.rustshowcaseweb_set_search(retptr, this.__wbg_ptr, ptr0, len0);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred2_0 = r0;
      deferred2_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {number} idx
   * @returns {string}
   */
  set_tab(idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_set_tab(retptr, this.__wbg_ptr, idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} idx
   * @returns {string}
   */
  set_target(idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_set_target(retptr, this.__wbg_ptr, idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} count
   * @returns {string}
   */
  set_tile_count(count) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_set_tile_count(retptr, this.__wbg_ptr, count);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} idx
   * @returns {string}
   */
  set_tiling(idx) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_set_tiling(retptr, this.__wbg_ptr, idx);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} width
   * @param {number} height
   * @returns {string}
   */
  set_viewport(width, height) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_set_viewport(retptr, this.__wbg_ptr, width, height);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @returns {string}
   */
  snapshot_json() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_snapshot_json(retptr, this.__wbg_ptr);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @returns {string}
   */
  toggle_dark() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcaseweb_toggle_dark(retptr, this.__wbg_ptr);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
}
if (Symbol.dispose)
  RustShowcaseWeb.prototype[Symbol.dispose] = RustShowcaseWeb.prototype.free;

/**
 * Shared WebGPU canvas renderer running the identical `showcase.wgsl` + `GpuShowcaseRenderer`
 * as the Windows/Linux Desktop executable.
 */
export class RustShowcaseWebGpu {
  static __wrap(ptr) {
    const obj = Object.create(RustShowcaseWebGpu.prototype);
    obj.__wbg_ptr = ptr;
    RustShowcaseWebGpuFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    RustShowcaseWebGpuFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_rustshowcasewebgpu_free(ptr, 0);
  }
  /**
   * @returns {string}
   */
  adapter_name() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcasewebgpu_adapter_name(retptr, this.__wbg_ptr);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {number} px
   * @param {number} py
   * @returns {string}
   */
  click(px, py) {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
      wasm.rustshowcasewebgpu_click(retptr, this.__wbg_ptr, px, py);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @param {HTMLCanvasElement} canvas
   * @returns {Promise<RustShowcaseWebGpu>}
   */
  static create(canvas) {
    const ret = wasm.rustshowcasewebgpu_create(canvas);
    return ret;
  }
  render() {
    wasm.rustshowcasewebgpu_render(this.__wbg_ptr);
  }
  /**
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    wasm.rustshowcasewebgpu_resize(this.__wbg_ptr, width, height);
  }
  /**
   * @param {number} tab
   * @param {number} preset
   * @param {boolean} dark
   * @param {number} page
   * @param {number} target
   * @param {number} tiling
   * @param {number} tile_count
   * @param {number} domain
   * @param {number} selected_crate
   * @param {number} selected_brick
   * @param {number} selected_abi
   */
  sync_from_state(
    tab,
    preset,
    dark,
    page,
    target,
    tiling,
    tile_count,
    domain,
    selected_crate,
    selected_brick,
    selected_abi,
  ) {
    wasm.rustshowcasewebgpu_sync_from_state(
      this.__wbg_ptr,
      tab,
      preset,
      dark,
      page,
      target,
      tiling,
      tile_count,
      domain,
      selected_crate,
      selected_brick,
      selected_abi,
    );
  }
}
if (Symbol.dispose)
  RustShowcaseWebGpu.prototype[Symbol.dispose] =
    RustShowcaseWebGpu.prototype.free;
function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbg_Error_208446807d0d1e30: function (arg0, arg1) {
      const ret = Error(getStringFromWasm0(arg0, arg1));
      return ret;
    },
    __wbg_Window_41838cbcc08822b5: function (arg0) {
      const ret = arg0.Window;
      return ret;
    },
    __wbg_WorkerGlobalScope_448e3830f27a30fd: function (arg0) {
      const ret = arg0.WorkerGlobalScope;
      return ret;
    },
    __wbg___wbindgen_debug_string_f249a2a76caa9a55: function (arg0, arg1) {
      const ret = debugString(arg1);
      const ptr1 = passStringToWasm0(
        ret,
        wasm.__wbindgen_export,
        wasm.__wbindgen_export2,
      );
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
    },
    __wbg___wbindgen_is_function_741ff2bb612836f5: function (arg0) {
      const ret = typeof arg0 === "function";
      return ret;
    },
    __wbg___wbindgen_is_null_c22311b1cc228e3a: function (arg0) {
      const ret = arg0 === null;
      return ret;
    },
    __wbg___wbindgen_is_string_fc456fee5d3317de: function (arg0) {
      const ret = typeof arg0 === "string";
      return ret;
    },
    __wbg___wbindgen_is_undefined_be5b34249ff1fc15: function (arg0) {
      const ret = arg0 === undefined;
      return ret;
    },
    __wbg___wbindgen_throw_4c88d8bf264fd984: function (arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    },
    __wbg__wbg_cb_unref_09736879a3f67559: function (arg0) {
      arg0._wbg_cb_unref();
    },
    __wbg_beginRenderPass_ac30593a03c9a74e: function () {
      return handleError(function (arg0, arg1) {
        const ret = arg0.beginRenderPass(arg1);
        return ret;
      }, arguments);
    },
    __wbg_call_a410eb4b59ed5965: function () {
      return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
      }, arguments);
    },
    __wbg_configure_2f4cbe7746e5aa81: function () {
      return handleError(function (arg0, arg1) {
        arg0.configure(arg1);
      }, arguments);
    },
    __wbg_createBindGroupLayout_03a20e72b41b406e: function () {
      return handleError(function (arg0, arg1) {
        const ret = arg0.createBindGroupLayout(arg1);
        return ret;
      }, arguments);
    },
    __wbg_createBindGroup_ec4dc4d9e46e1104: function (arg0, arg1) {
      const ret = arg0.createBindGroup(arg1);
      return ret;
    },
    __wbg_createBuffer_baa81dab839b6c5c: function () {
      return handleError(function (arg0, arg1) {
        const ret = arg0.createBuffer(arg1);
        return ret;
      }, arguments);
    },
    __wbg_createCommandEncoder_a5136f45baaba888: function (arg0, arg1) {
      const ret = arg0.createCommandEncoder(arg1);
      return ret;
    },
    __wbg_createPipelineLayout_a955ff1e35a63634: function (arg0, arg1) {
      const ret = arg0.createPipelineLayout(arg1);
      return ret;
    },
    __wbg_createRenderPipeline_f31fc336274aaab2: function () {
      return handleError(function (arg0, arg1) {
        const ret = arg0.createRenderPipeline(arg1);
        return ret;
      }, arguments);
    },
    __wbg_createSampler_2fe8901be471a83a: function (arg0, arg1) {
      const ret = arg0.createSampler(arg1);
      return ret;
    },
    __wbg_createShaderModule_f540847678b68e08: function (arg0, arg1) {
      const ret = arg0.createShaderModule(arg1);
      return ret;
    },
    __wbg_createTexture_5e2361f396945928: function () {
      return handleError(function (arg0, arg1) {
        const ret = arg0.createTexture(arg1);
        return ret;
      }, arguments);
    },
    __wbg_createView_e495f88700d28104: function () {
      return handleError(function (arg0, arg1) {
        const ret = arg0.createView(arg1);
        return ret;
      }, arguments);
    },
    __wbg_description_359d32310adf317e: function (arg0, arg1) {
      const ret = arg1.description;
      const ptr1 = passStringToWasm0(
        ret,
        wasm.__wbindgen_export,
        wasm.__wbindgen_export2,
      );
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
    },
    __wbg_document_3b5c3071b43e97ee: function (arg0) {
      const ret = arg0.document;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_draw_977efcdcd4b12838: function (arg0, arg1, arg2, arg3, arg4) {
      arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    },
    __wbg_end_3bbedaa037606029: function (arg0) {
      arg0.end();
    },
    __wbg_error_757e9472f8410341: function (arg0, arg1) {
      let deferred0_0;
      let deferred0_1;
      try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
      } finally {
        wasm.__wbindgen_export3(deferred0_0, deferred0_1, 1);
      }
    },
    __wbg_finish_49529a046631ad9a: function (arg0) {
      const ret = arg0.finish();
      return ret;
    },
    __wbg_finish_678df663961386ff: function (arg0, arg1) {
      const ret = arg0.finish(arg1);
      return ret;
    },
    __wbg_getContext_1938edb9a972f63d: function () {
      return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, arguments);
    },
    __wbg_getContext_d93f904b714852ae: function () {
      return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
      }, arguments);
    },
    __wbg_getCurrentTexture_e9d52aabce56f3fb: function () {
      return handleError(function (arg0) {
        const ret = arg0.getCurrentTexture();
        return ret;
      }, arguments);
    },
    __wbg_getPreferredCanvasFormat_f775f4ebe1768892: function (arg0) {
      const ret = arg0.getPreferredCanvasFormat();
      return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 102) - 1;
    },
    __wbg_get_0c55869fe53c7d14: function (arg0, arg1) {
      const ret = arg0[arg1 >>> 0];
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_gpu_aa311a9494720027: function (arg0) {
      const ret = arg0.gpu;
      return ret;
    },
    __wbg_height_ac6f1c3f49c13fe2: function (arg0) {
      const ret = arg0.height;
      return ret;
    },
    __wbg_info_84c3d8389e807255: function (arg0) {
      const ret = arg0.info;
      return ret;
    },
    __wbg_instanceof_Window_5cf453f5639aa1a2: function (arg0) {
      let result;
      try {
        result = arg0 instanceof Window;
      } catch (_) {
        result = false;
      }
      const ret = result;
      return ret;
    },
    __wbg_isFallbackAdapter_b70ad418e985d5d4: function (arg0) {
      const ret = arg0.isFallbackAdapter;
      return ret;
    },
    __wbg_label_b4e9fa173fb30ad5: function (arg0, arg1) {
      const ret = arg1.label;
      const ptr1 = passStringToWasm0(
        ret,
        wasm.__wbindgen_export,
        wasm.__wbindgen_export2,
      );
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
    },
    __wbg_mapAsync_84aeaa5780c9b8c7: function (arg0, arg1, arg2, arg3) {
      const ret = arg0.mapAsync(arg1 >>> 0, arg2, arg3);
      return ret;
    },
    __wbg_navigator_9641ab32fa612dd1: function (arg0) {
      const ret = arg0.navigator;
      return ret;
    },
    __wbg_navigator_c17f443a6fe5d38d: function (arg0) {
      const ret = arg0.navigator;
      return ret;
    },
    __wbg_new_2bfd0f45e60518b1: function () {
      return handleError(function (arg0, arg1) {
        const ret = new OffscreenCanvas(arg0 >>> 0, arg1 >>> 0);
        return ret;
      }, arguments);
    },
    __wbg_new_bb74001155cb8ca8: function () {
      const ret = new Error();
      return ret;
    },
    __wbg_new_cd4348290afae586: function () {
      const ret = new Object();
      return ret;
    },
    __wbg_new_typed_6b60b99917da27d6: function () {
      const ret = new Object();
      return ret;
    },
    __wbg_new_typed_e09da9dae6ee5935: function (arg0, arg1) {
      try {
        var state0 = { a: arg0, b: arg1 };
        var cb0 = (arg0, arg1) => {
          const a = state0.a;
          state0.a = 0;
          try {
            return __wasm_bindgen_func_elem_3352(a, state0.b, arg0, arg1);
          } finally {
            state0.a = a;
          }
        };
        const ret = new Promise(cb0);
        return ret;
      } finally {
        state0.a = 0;
      }
    },
    __wbg_onSubmittedWorkDone_f62945abb48d8a84: function (arg0) {
      const ret = arg0.onSubmittedWorkDone();
      return ret;
    },
    __wbg_querySelectorAll_6c1bd81d448fb480: function () {
      return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
        return ret;
      }, arguments);
    },
    __wbg_queueMicrotask_1e8503a8a690f0a3: function (arg0) {
      const ret = arg0.queueMicrotask;
      return ret;
    },
    __wbg_queueMicrotask_4a1a4d8dd332373b: function (arg0) {
      queueMicrotask(arg0);
    },
    __wbg_queue_41b76331de876d9d: function (arg0) {
      const ret = arg0.queue;
      return ret;
    },
    __wbg_requestAdapter_b725cba92e32c4ce: function (arg0, arg1) {
      const ret = arg0.requestAdapter(arg1);
      return ret;
    },
    __wbg_requestDevice_45bc1149c3b98eaf: function (arg0, arg1) {
      const ret = arg0.requestDevice(arg1);
      return ret;
    },
    __wbg_resolve_dbf78ab4942478b0: function (arg0) {
      const ret = Promise.resolve(arg0);
      return ret;
    },
    __wbg_rustshowcasewebgpu_new: function (arg0) {
      const ret = RustShowcaseWebGpu.__wrap(arg0);
      return ret;
    },
    __wbg_setBindGroup_1a145239764ea257: function () {
      return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(
          arg1 >>> 0,
          arg2,
          getArrayU32FromWasm0(arg3, arg4),
          arg5,
          arg6 >>> 0,
        );
      }, arguments);
    },
    __wbg_setBindGroup_c3a39fd8d0149600: function (arg0, arg1, arg2) {
      arg0.setBindGroup(arg1 >>> 0, arg2);
    },
    __wbg_setPipeline_823fe7d48236b840: function (arg0, arg1) {
      arg0.setPipeline(arg1);
    },
    __wbg_setVertexBuffer_6cb9f5432f1462e2: function (
      arg0,
      arg1,
      arg2,
      arg3,
      arg4,
    ) {
      arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4);
    },
    __wbg_setVertexBuffer_ff00b7e9bfd9257d: function (arg0, arg1, arg2, arg3) {
      arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3);
    },
    __wbg_setViewport_1144d8635e7e792d: function (
      arg0,
      arg1,
      arg2,
      arg3,
      arg4,
      arg5,
      arg6,
    ) {
      arg0.setViewport(arg1, arg2, arg3, arg4, arg5, arg6);
    },
    __wbg_set_2793479888329cb6: function () {
      return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1, arg2);
        return ret;
      }, arguments);
    },
    __wbg_set_a_b8a7f56fa358e664: function (arg0, arg1) {
      arg0.a = arg1;
    },
    __wbg_set_access_46b3e62b6a30d608: function (arg0, arg1) {
      arg0.access = __wbindgen_enum_GpuStorageTextureAccess[arg1];
    },
    __wbg_set_address_mode_u_f67593eba8917d58: function (arg0, arg1) {
      arg0.addressModeU = __wbindgen_enum_GpuAddressMode[arg1];
    },
    __wbg_set_address_mode_v_8366e992c3ec2680: function (arg0, arg1) {
      arg0.addressModeV = __wbindgen_enum_GpuAddressMode[arg1];
    },
    __wbg_set_address_mode_w_53ae7ff9fc27d31b: function (arg0, arg1) {
      arg0.addressModeW = __wbindgen_enum_GpuAddressMode[arg1];
    },
    __wbg_set_alpha_041ea339c691473c: function (arg0, arg1) {
      arg0.alpha = arg1;
    },
    __wbg_set_alpha_mode_edf7c742eee7ac74: function (arg0, arg1) {
      arg0.alphaMode = __wbindgen_enum_GpuCanvasAlphaMode[arg1];
    },
    __wbg_set_alpha_to_coverage_enabled_66b16e2395f2145a: function (
      arg0,
      arg1,
    ) {
      arg0.alphaToCoverageEnabled = arg1 !== 0;
    },
    __wbg_set_array_layer_count_f652f75c2d85d00b: function (arg0, arg1) {
      arg0.arrayLayerCount = arg1 >>> 0;
    },
    __wbg_set_array_stride_f64_d4a555ef4287a90a: function (arg0, arg1) {
      arg0.arrayStride = arg1;
    },
    __wbg_set_aspect_0820f36ab69e69c7: function (arg0, arg1) {
      arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
    },
    __wbg_set_aspect_4eaf6e4f871485aa: function (arg0, arg1) {
      arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
    },
    __wbg_set_attributes_6753fa3eefb33349: function (arg0, arg1, arg2) {
      arg0.attributes = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_b_1f0c9c5f62003b93: function (arg0, arg1) {
      arg0.b = arg1;
    },
    __wbg_set_base_array_layer_766baefe617e7450: function (arg0, arg1) {
      arg0.baseArrayLayer = arg1 >>> 0;
    },
    __wbg_set_base_mip_level_6c4e57453fe07edf: function (arg0, arg1) {
      arg0.baseMipLevel = arg1 >>> 0;
    },
    __wbg_set_beginning_of_pass_write_index_ce26d46a975d94e3: function (
      arg0,
      arg1,
    ) {
      arg0.beginningOfPassWriteIndex = arg1 >>> 0;
    },
    __wbg_set_bind_group_layouts_78efad321b8db306: function (arg0, arg1, arg2) {
      arg0.bindGroupLayouts = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_binding_49121810d92bb656: function (arg0, arg1) {
      arg0.binding = arg1 >>> 0;
    },
    __wbg_set_binding_921af47b178839b7: function (arg0, arg1) {
      arg0.binding = arg1 >>> 0;
    },
    __wbg_set_blend_9b68fe4192551c11: function (arg0, arg1) {
      arg0.blend = arg1;
    },
    __wbg_set_buffer_e254d16772ccdf1f: function (arg0, arg1) {
      arg0.buffer = arg1;
    },
    __wbg_set_buffer_f0412de54dad59a0: function (arg0, arg1) {
      arg0.buffer = arg1;
    },
    __wbg_set_buffers_4bae4e561a9fa5bc: function (arg0, arg1, arg2) {
      arg0.buffers = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_bytes_per_row_2edc74cba6ac1b69: function (arg0, arg1) {
      arg0.bytesPerRow = arg1 >>> 0;
    },
    __wbg_set_clear_value_gpu_color_dict_b12131c44b7f5a0b: function (
      arg0,
      arg1,
    ) {
      arg0.clearValue = arg1;
    },
    __wbg_set_code_71b4a924b594417d: function (arg0, arg1, arg2) {
      arg0.code = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_color_173beb3f62e0fe38: function (arg0, arg1) {
      arg0.color = arg1;
    },
    __wbg_set_color_attachments_bb683d934e2d6222: function (arg0, arg1, arg2) {
      arg0.colorAttachments = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_compare_1f37d6bc9b4479b5: function (arg0, arg1) {
      arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
    },
    __wbg_set_compare_9f209c2a21e5f8cc: function (arg0, arg1) {
      arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
    },
    __wbg_set_count_02820c919f8591db: function (arg0, arg1) {
      arg0.count = arg1 >>> 0;
    },
    __wbg_set_cull_mode_2571e6256445d311: function (arg0, arg1) {
      arg0.cullMode = __wbindgen_enum_GpuCullMode[arg1];
    },
    __wbg_set_depth_bias_9ff79c074fab3395: function (arg0, arg1) {
      arg0.depthBias = arg1;
    },
    __wbg_set_depth_bias_clamp_b9dfc0449214a137: function (arg0, arg1) {
      arg0.depthBiasClamp = arg1;
    },
    __wbg_set_depth_bias_slope_scale_bacfbadca941fcf5: function (arg0, arg1) {
      arg0.depthBiasSlopeScale = arg1;
    },
    __wbg_set_depth_clear_value_bbfc087b5b4b6d06: function (arg0, arg1) {
      arg0.depthClearValue = arg1;
    },
    __wbg_set_depth_compare_706f99d5a7658960: function (arg0, arg1) {
      arg0.depthCompare = __wbindgen_enum_GpuCompareFunction[arg1];
    },
    __wbg_set_depth_fail_op_8cc03f38206b087f: function (arg0, arg1) {
      arg0.depthFailOp = __wbindgen_enum_GpuStencilOperation[arg1];
    },
    __wbg_set_depth_load_op_96d40a8e26164544: function (arg0, arg1) {
      arg0.depthLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
    },
    __wbg_set_depth_or_array_layers_41d9bf5003084813: function (arg0, arg1) {
      arg0.depthOrArrayLayers = arg1 >>> 0;
    },
    __wbg_set_depth_read_only_8be6458323119975: function (arg0, arg1) {
      arg0.depthReadOnly = arg1 !== 0;
    },
    __wbg_set_depth_stencil_attachment_7a083fe21730d473: function (arg0, arg1) {
      arg0.depthStencilAttachment = arg1;
    },
    __wbg_set_depth_stencil_f138ba545e6cc4d4: function (arg0, arg1) {
      arg0.depthStencil = arg1;
    },
    __wbg_set_depth_store_op_3e7ee4bf89cda835: function (arg0, arg1) {
      arg0.depthStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
    },
    __wbg_set_depth_write_enabled_c1ad58fe7207ef11: function (arg0, arg1) {
      arg0.depthWriteEnabled = arg1 !== 0;
    },
    __wbg_set_device_2b7e0e4f69784351: function (arg0, arg1) {
      arg0.device = arg1;
    },
    __wbg_set_dimension_536f245d466cca10: function (arg0, arg1) {
      arg0.dimension = __wbindgen_enum_GpuTextureDimension[arg1];
    },
    __wbg_set_dimension_91e724d498a35c9a: function (arg0, arg1) {
      arg0.dimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    },
    __wbg_set_dst_factor_9789f02ad2a0c61e: function (arg0, arg1) {
      arg0.dstFactor = __wbindgen_enum_GpuBlendFactor[arg1];
    },
    __wbg_set_end_of_pass_write_index_bd996c6cc50b794b: function (arg0, arg1) {
      arg0.endOfPassWriteIndex = arg1 >>> 0;
    },
    __wbg_set_entries_02ae66da25c9ddae: function (arg0, arg1, arg2) {
      arg0.entries = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_entries_8036374af27741dc: function (arg0, arg1, arg2) {
      arg0.entries = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_entry_point_89ecd5ddd9c56d5c: function (arg0, arg1, arg2) {
      arg0.entryPoint = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_entry_point_b4eb7d2dd59b5c76: function (arg0, arg1, arg2) {
      arg0.entryPoint = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_external_texture_34c43368e77cc844: function (arg0, arg1) {
      arg0.externalTexture = arg1;
    },
    __wbg_set_fail_op_e901d7b520ae0e15: function (arg0, arg1) {
      arg0.failOp = __wbindgen_enum_GpuStencilOperation[arg1];
    },
    __wbg_set_format_1d70746424721ed1: function (arg0, arg1) {
      arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    },
    __wbg_set_format_594ffafc6477f59d: function (arg0, arg1) {
      arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    },
    __wbg_set_format_781ab1cf2f8f2465: function (arg0, arg1) {
      arg0.format = __wbindgen_enum_GpuVertexFormat[arg1];
    },
    __wbg_set_format_8003fc2174c14359: function (arg0, arg1) {
      arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    },
    __wbg_set_format_c1603ca98ab9cb13: function (arg0, arg1) {
      arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    },
    __wbg_set_format_cdccd8422de3c885: function (arg0, arg1) {
      arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    },
    __wbg_set_format_df8baca64e04f5ef: function (arg0, arg1) {
      arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    },
    __wbg_set_fragment_3635fd557dbd99bc: function (arg0, arg1) {
      arg0.fragment = arg1;
    },
    __wbg_set_front_face_13105806890daab7: function (arg0, arg1) {
      arg0.frontFace = __wbindgen_enum_GpuFrontFace[arg1];
    },
    __wbg_set_g_9d2890d6fb93dba4: function (arg0, arg1) {
      arg0.g = arg1;
    },
    __wbg_set_has_dynamic_offset_0086bc7faede16d1: function (arg0, arg1) {
      arg0.hasDynamicOffset = arg1 !== 0;
    },
    __wbg_set_height_546367a98b9ab695: function (arg0, arg1) {
      arg0.height = arg1 >>> 0;
    },
    __wbg_set_height_ae0610d318c3428c: function (arg0, arg1) {
      arg0.height = arg1 >>> 0;
    },
    __wbg_set_height_ae24c2f7d580ae0a: function (arg0, arg1) {
      arg0.height = arg1 >>> 0;
    },
    __wbg_set_label_16858d210dffe9ff: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_1d7c053bc726e08f: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_1e431973068c0ea4: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_2d3e4456ff9a120a: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_39038ba992db5f45: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_5e1a79b630ee9fa3: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_89172d31c03b3375: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_a71d5f5c41bed969: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_dcaa5d479cbb5311: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_dcb16ec336a5420d: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_ea59541fa72ee985: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_ef8bfd8864e594a4: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_label_f9171cd5c971dbf2: function (arg0, arg1, arg2) {
      arg0.label = getStringFromWasm0(arg1, arg2);
    },
    __wbg_set_layout_905339a584186697: function (arg0, arg1) {
      arg0.layout = arg1;
    },
    __wbg_set_layout_bfddc4788acb0736: function (arg0, arg1) {
      arg0.layout = arg1;
    },
    __wbg_set_layout_gpu_auto_layout_mode_0e86cf27fd7c9e0c: function (
      arg0,
      arg1,
    ) {
      arg0.layout = __wbindgen_enum_GpuAutoLayoutMode[arg1];
    },
    __wbg_set_load_op_9a24b40a8df7115b: function (arg0, arg1) {
      arg0.loadOp = __wbindgen_enum_GpuLoadOp[arg1];
    },
    __wbg_set_lod_max_clamp_c1935a38a79d7f3b: function (arg0, arg1) {
      arg0.lodMaxClamp = arg1;
    },
    __wbg_set_lod_min_clamp_27d01e7c2938fe09: function (arg0, arg1) {
      arg0.lodMinClamp = arg1;
    },
    __wbg_set_mag_filter_657599d734cdc0d9: function (arg0, arg1) {
      arg0.magFilter = __wbindgen_enum_GpuFilterMode[arg1];
    },
    __wbg_set_mapped_at_creation_a4cd55019116b792: function (arg0, arg1) {
      arg0.mappedAtCreation = arg1 !== 0;
    },
    __wbg_set_mask_7a39674fcbc00286: function (arg0, arg1) {
      arg0.mask = arg1 >>> 0;
    },
    __wbg_set_max_anisotropy_b05f95dcdfdae8bb: function (arg0, arg1) {
      arg0.maxAnisotropy = arg1;
    },
    __wbg_set_min_binding_size_f64_2458ad9bffad7ea7: function (arg0, arg1) {
      arg0.minBindingSize = arg1;
    },
    __wbg_set_min_filter_93e33f778b66ecb0: function (arg0, arg1) {
      arg0.minFilter = __wbindgen_enum_GpuFilterMode[arg1];
    },
    __wbg_set_mip_level_count_19560e4f63320832: function (arg0, arg1) {
      arg0.mipLevelCount = arg1 >>> 0;
    },
    __wbg_set_mip_level_count_ef313d3a441aa51e: function (arg0, arg1) {
      arg0.mipLevelCount = arg1 >>> 0;
    },
    __wbg_set_mip_level_dbdf4ee3ba07c689: function (arg0, arg1) {
      arg0.mipLevel = arg1 >>> 0;
    },
    __wbg_set_mipmap_filter_aacb60d49a794ef5: function (arg0, arg1) {
      arg0.mipmapFilter = __wbindgen_enum_GpuMipmapFilterMode[arg1];
    },
    __wbg_set_mode_73d9eb9243253108: function (arg0, arg1) {
      arg0.mode = __wbindgen_enum_GpuCanvasToneMappingMode[arg1];
    },
    __wbg_set_module_85e1d5368a2b9422: function (arg0, arg1) {
      arg0.module = arg1;
    },
    __wbg_set_module_c746beebaa6ede01: function (arg0, arg1) {
      arg0.module = arg1;
    },
    __wbg_set_multisample_7471ab77b8e5a567: function (arg0, arg1) {
      arg0.multisample = arg1;
    },
    __wbg_set_multisampled_d385dcc24cbcdac9: function (arg0, arg1) {
      arg0.multisampled = arg1 !== 0;
    },
    __wbg_set_offset_f64_106ac70d42ed0b22: function (arg0, arg1) {
      arg0.offset = arg1;
    },
    __wbg_set_offset_f64_b1157147188cb175: function (arg0, arg1) {
      arg0.offset = arg1;
    },
    __wbg_set_offset_f64_f65aa794a52b87dc: function (arg0, arg1) {
      arg0.offset = arg1;
    },
    __wbg_set_operation_b82c9485304b393c: function (arg0, arg1) {
      arg0.operation = __wbindgen_enum_GpuBlendOperation[arg1];
    },
    __wbg_set_origin_gpu_origin_3d_dict_c2b5dc3bd3763139: function (
      arg0,
      arg1,
    ) {
      arg0.origin = arg1;
    },
    __wbg_set_pass_op_3b1d192c54b1a827: function (arg0, arg1) {
      arg0.passOp = __wbindgen_enum_GpuStencilOperation[arg1];
    },
    __wbg_set_power_preference_06107ba643e66249: function (arg0, arg1) {
      arg0.powerPreference = __wbindgen_enum_GpuPowerPreference[arg1];
    },
    __wbg_set_primitive_14377cb8cbd23584: function (arg0, arg1) {
      arg0.primitive = arg1;
    },
    __wbg_set_query_set_da20f7d5b37c78e1: function (arg0, arg1) {
      arg0.querySet = arg1;
    },
    __wbg_set_r_473d4bd5f6ddbe44: function (arg0, arg1) {
      arg0.r = arg1;
    },
    __wbg_set_required_features_ef8aeb4d5f909e03: function (arg0, arg1, arg2) {
      arg0.requiredFeatures = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_required_limits_a80a53fd4744ccb2: function (arg0, arg1) {
      arg0.requiredLimits = arg1;
    },
    __wbg_set_resolve_target_gpu_texture_view_6c8f66cd96330a45: function (
      arg0,
      arg1,
    ) {
      arg0.resolveTarget = arg1;
    },
    __wbg_set_resource_d37005b6a3d3375f: function (arg0, arg1) {
      arg0.resource = arg1;
    },
    __wbg_set_resource_gpu_buffer_binding_8e9be21bc9a45330: function (
      arg0,
      arg1,
    ) {
      arg0.resource = arg1;
    },
    __wbg_set_resource_gpu_texture_view_e3bf3810e7168d2b: function (
      arg0,
      arg1,
    ) {
      arg0.resource = arg1;
    },
    __wbg_set_rows_per_image_e9f4da51b05f4ee1: function (arg0, arg1) {
      arg0.rowsPerImage = arg1 >>> 0;
    },
    __wbg_set_sample_count_a4d54cf5bcf23914: function (arg0, arg1) {
      arg0.sampleCount = arg1 >>> 0;
    },
    __wbg_set_sample_type_660a4d77497517e2: function (arg0, arg1) {
      arg0.sampleType = __wbindgen_enum_GpuTextureSampleType[arg1];
    },
    __wbg_set_sampler_35b5b2e68532815b: function (arg0, arg1) {
      arg0.sampler = arg1;
    },
    __wbg_set_shader_location_e0fdb186c91ac5df: function (arg0, arg1) {
      arg0.shaderLocation = arg1 >>> 0;
    },
    __wbg_set_size_f64_04b949f2af8176ba: function (arg0, arg1) {
      arg0.size = arg1;
    },
    __wbg_set_size_f64_2418f77508fb05d7: function (arg0, arg1) {
      arg0.size = arg1;
    },
    __wbg_set_size_gpu_extent_3d_dict_7180918365da46d5: function (arg0, arg1) {
      arg0.size = arg1;
    },
    __wbg_set_src_factor_e72cbac8c7084adc: function (arg0, arg1) {
      arg0.srcFactor = __wbindgen_enum_GpuBlendFactor[arg1];
    },
    __wbg_set_stencil_back_4df76dba55137aa9: function (arg0, arg1) {
      arg0.stencilBack = arg1;
    },
    __wbg_set_stencil_clear_value_686c18ee265a672c: function (arg0, arg1) {
      arg0.stencilClearValue = arg1 >>> 0;
    },
    __wbg_set_stencil_front_ec8c0eedf46d4973: function (arg0, arg1) {
      arg0.stencilFront = arg1;
    },
    __wbg_set_stencil_load_op_1bce6d97f680eda7: function (arg0, arg1) {
      arg0.stencilLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
    },
    __wbg_set_stencil_read_mask_1f242f58d95e02e1: function (arg0, arg1) {
      arg0.stencilReadMask = arg1 >>> 0;
    },
    __wbg_set_stencil_read_only_50c3a3b3cbdc83c1: function (arg0, arg1) {
      arg0.stencilReadOnly = arg1 !== 0;
    },
    __wbg_set_stencil_store_op_9703f525bc5e8e0c: function (arg0, arg1) {
      arg0.stencilStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
    },
    __wbg_set_stencil_write_mask_463f4b6208354e15: function (arg0, arg1) {
      arg0.stencilWriteMask = arg1 >>> 0;
    },
    __wbg_set_step_mode_c10a50b921560088: function (arg0, arg1) {
      arg0.stepMode = __wbindgen_enum_GpuVertexStepMode[arg1];
    },
    __wbg_set_storage_texture_c2ed1f3eb327112e: function (arg0, arg1) {
      arg0.storageTexture = arg1;
    },
    __wbg_set_store_op_e3edba4d13e36cbf: function (arg0, arg1) {
      arg0.storeOp = __wbindgen_enum_GpuStoreOp[arg1];
    },
    __wbg_set_strip_index_format_a7cb0b950f8653f8: function (arg0, arg1) {
      arg0.stripIndexFormat = __wbindgen_enum_GpuIndexFormat[arg1];
    },
    __wbg_set_targets_b24b23a20f1c7f7f: function (arg0, arg1, arg2) {
      arg0.targets = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_texture_39ac35f54ef4c3ba: function (arg0, arg1) {
      arg0.texture = arg1;
    },
    __wbg_set_texture_c89ca659682f2fd6: function (arg0, arg1) {
      arg0.texture = arg1;
    },
    __wbg_set_timestamp_writes_9fd1c7b5cb0a6a5c: function (arg0, arg1) {
      arg0.timestampWrites = arg1;
    },
    __wbg_set_tone_mapping_92c0666fef742c68: function (arg0, arg1) {
      arg0.toneMapping = arg1;
    },
    __wbg_set_topology_ed2942658d3771ab: function (arg0, arg1) {
      arg0.topology = __wbindgen_enum_GpuPrimitiveTopology[arg1];
    },
    __wbg_set_type_6cc967b44400577b: function (arg0, arg1) {
      arg0.type = __wbindgen_enum_GpuSamplerBindingType[arg1];
    },
    __wbg_set_type_dd6c71bc279b420e: function (arg0, arg1) {
      arg0.type = __wbindgen_enum_GpuBufferBindingType[arg1];
    },
    __wbg_set_unclipped_depth_f24953dc0eb8c84c: function (arg0, arg1) {
      arg0.unclippedDepth = arg1 !== 0;
    },
    __wbg_set_usage_1d663151adcb7f1a: function (arg0, arg1) {
      arg0.usage = arg1 >>> 0;
    },
    __wbg_set_usage_63cd5e88050b26e8: function (arg0, arg1) {
      arg0.usage = arg1 >>> 0;
    },
    __wbg_set_usage_6c4bd5f209a0579c: function (arg0, arg1) {
      arg0.usage = arg1 >>> 0;
    },
    __wbg_set_usage_a65753b69e218ec9: function (arg0, arg1) {
      arg0.usage = arg1 >>> 0;
    },
    __wbg_set_vertex_b8cfd3671e5edfbb: function (arg0, arg1) {
      arg0.vertex = arg1;
    },
    __wbg_set_view_dimension_ce6e77a9eb67aa53: function (arg0, arg1) {
      arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    },
    __wbg_set_view_dimension_d5c87d8c6f1266b5: function (arg0, arg1) {
      arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    },
    __wbg_set_view_formats_8b40d61be4d5be29: function (arg0, arg1, arg2) {
      arg0.viewFormats = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_view_formats_ea87e3d240842107: function (arg0, arg1, arg2) {
      arg0.viewFormats = getArrayJsValueViewFromWasm0(arg1, arg2);
    },
    __wbg_set_view_gpu_texture_view_bf636cc659953b65: function (arg0, arg1) {
      arg0.view = arg1;
    },
    __wbg_set_view_gpu_texture_view_d53664457085e78b: function (arg0, arg1) {
      arg0.view = arg1;
    },
    __wbg_set_visibility_f68d6576737b8b45: function (arg0, arg1) {
      arg0.visibility = arg1 >>> 0;
    },
    __wbg_set_width_5f89a551b5472887: function (arg0, arg1) {
      arg0.width = arg1 >>> 0;
    },
    __wbg_set_width_eb3001e1dcabb909: function (arg0, arg1) {
      arg0.width = arg1 >>> 0;
    },
    __wbg_set_width_fc76d04c0309b403: function (arg0, arg1) {
      arg0.width = arg1 >>> 0;
    },
    __wbg_set_write_mask_51378295d978a0f8: function (arg0, arg1) {
      arg0.writeMask = arg1 >>> 0;
    },
    __wbg_set_x_aa58610e8a2b3347: function (arg0, arg1) {
      arg0.x = arg1 >>> 0;
    },
    __wbg_set_y_6a3e943d5ad07e0d: function (arg0, arg1) {
      arg0.y = arg1 >>> 0;
    },
    __wbg_set_z_dc1a88e5f0e1508d: function (arg0, arg1) {
      arg0.z = arg1 >>> 0;
    },
    __wbg_stack_575c4e0918581b9c: function (arg0, arg1) {
      const ret = arg1.stack;
      const ptr1 = passStringToWasm0(
        ret,
        wasm.__wbindgen_export,
        wasm.__wbindgen_export2,
      );
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
    },
    __wbg_static_accessor_GLOBAL_THIS_003ee833af9699fc: function () {
      const ret = typeof globalThis === "undefined" ? undefined : globalThis;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_GLOBAL_e4293fb22cbe77da: function () {
      const ret = typeof global === "undefined" ? undefined : global;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_SELF_53bb20457401453d: function () {
      const ret = typeof self === "undefined" ? undefined : self;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_WINDOW_b5e0810bfecb7feb: function () {
      const ret = typeof window === "undefined" ? undefined : window;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_subgroupMaxSize_b33b2d37e3f1f5f5: function (arg0) {
      const ret = arg0.subgroupMaxSize;
      return ret;
    },
    __wbg_subgroupMinSize_ff381626432f1cbc: function (arg0) {
      const ret = arg0.subgroupMinSize;
      return ret;
    },
    __wbg_submit_c4379e221512d3fa: function (arg0, arg1, arg2) {
      arg0.submit(getArrayJsValueViewFromWasm0(arg1, arg2));
    },
    __wbg_then_656f253a5dd7d8ea: function (arg0, arg1, arg2) {
      const ret = arg0.then(arg1, arg2);
      return ret;
    },
    __wbg_then_e3f7f2d365708be8: function (arg0, arg1) {
      const ret = arg0.then(arg1);
      return ret;
    },
    __wbg_unconfigure_7ca436ff70c0bcc3: function (arg0) {
      arg0.unconfigure();
    },
    __wbg_width_babc5dc7654771b1: function (arg0) {
      const ret = arg0.width;
      return ret;
    },
    __wbg_writeBuffer_dbc00ede89a23b5e: function () {
      return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(
          arg1,
          arg2,
          getArrayU8FromWasm0(arg3, arg4),
          arg5,
          arg6,
        );
      }, arguments);
    },
    __wbg_writeTexture_ddcddb10ef4a4155: function () {
      return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeTexture(arg1, getArrayU8FromWasm0(arg2, arg3), arg4, arg5);
      }, arguments);
    },
    __wbindgen_generic_0000000000000001: function (arg0, arg1) {
      // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 486, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
      const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_3336);
      return ret;
    },
    __wbindgen_generic_0000000000000002: function (arg0, arg1) {
      // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUDevice")], shim_idx: 36, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
      const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_433);
      return ret;
    },
    __wbindgen_generic_0000000000000003: function (arg0, arg1) {
      // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("any")], shim_idx: 36, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
      const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_433_25);
      return ret;
    },
    __wbindgen_generic_0000000000000004: function (arg0, arg1) {
      // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("undefined")], shim_idx: 36, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
      const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_433_26);
      return ret;
    },
    __wbindgen_generic_0000000000000005: function (arg0) {
      // Cast intrinsic for `F64 -> Externref`.
      const ret = arg0;
      return ret;
    },
    __wbindgen_generic_0000000000000006: function (arg0, arg1) {
      // Cast intrinsic for `Ref(String) -> Externref`.
      const ret = getStringFromWasm0(arg0, arg1);
      return ret;
    },
    __wbindgen_init_externref_table: function () {
      const table = wasm.__wbindgen_externrefs;
      table.set(0, undefined);
      table.set(1024, undefined);
      table.set(1025, null);
      table.set(1026, true);
      table.set(1027, false);
    },
  };
  return {
    __proto__: null,
    "./rust_showcase_bg.js": import0,
  };
}

function __wasm_bindgen_func_elem_3352(arg0, arg1, arg2, arg3) {
  wasm.__wasm_bindgen_func_elem_3352(arg0, arg1, arg2, arg3);
}

function __wasm_bindgen_func_elem_3336(arg0, arg1, arg2) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
    wasm.__wasm_bindgen_func_elem_3336(retptr, arg0, arg1, arg2);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    if (r1) {
      throw takeFromExternrefTable0(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

function __wasm_bindgen_func_elem_433(arg0, arg1, arg2) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
    wasm.__wasm_bindgen_func_elem_433(retptr, arg0, arg1, arg2);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    if (r1) {
      throw takeFromExternrefTable0(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

function __wasm_bindgen_func_elem_433_25(arg0, arg1, arg2) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
    wasm.__wasm_bindgen_func_elem_433_25(retptr, arg0, arg1, arg2);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    if (r1) {
      throw takeFromExternrefTable0(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

function __wasm_bindgen_func_elem_433_26(arg0, arg1, arg2) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
    wasm.__wasm_bindgen_func_elem_433_26(retptr, arg0, arg1, arg2);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    if (r1) {
      throw takeFromExternrefTable0(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

const __wbindgen_enum_GpuAddressMode = [
  "clamp-to-edge",
  "repeat",
  "mirror-repeat",
];

const __wbindgen_enum_GpuAutoLayoutMode = ["auto"];

const __wbindgen_enum_GpuBlendFactor = [
  "zero",
  "one",
  "src",
  "one-minus-src",
  "src-alpha",
  "one-minus-src-alpha",
  "dst",
  "one-minus-dst",
  "dst-alpha",
  "one-minus-dst-alpha",
  "src-alpha-saturated",
  "constant",
  "one-minus-constant",
  "src1",
  "one-minus-src1",
  "src1-alpha",
  "one-minus-src1-alpha",
];

const __wbindgen_enum_GpuBlendOperation = [
  "add",
  "subtract",
  "reverse-subtract",
  "min",
  "max",
];

const __wbindgen_enum_GpuBufferBindingType = [
  "uniform",
  "storage",
  "read-only-storage",
];

const __wbindgen_enum_GpuCanvasAlphaMode = ["opaque", "premultiplied"];

const __wbindgen_enum_GpuCanvasToneMappingMode = ["standard", "extended"];

const __wbindgen_enum_GpuCompareFunction = [
  "never",
  "less",
  "equal",
  "less-equal",
  "greater",
  "not-equal",
  "greater-equal",
  "always",
];

const __wbindgen_enum_GpuCullMode = ["none", "front", "back"];

const __wbindgen_enum_GpuFilterMode = ["nearest", "linear"];

const __wbindgen_enum_GpuFrontFace = ["ccw", "cw"];

const __wbindgen_enum_GpuIndexFormat = ["uint16", "uint32"];

const __wbindgen_enum_GpuLoadOp = ["load", "clear"];

const __wbindgen_enum_GpuMipmapFilterMode = ["nearest", "linear"];

const __wbindgen_enum_GpuPowerPreference = ["low-power", "high-performance"];

const __wbindgen_enum_GpuPrimitiveTopology = [
  "point-list",
  "line-list",
  "line-strip",
  "triangle-list",
  "triangle-strip",
];

const __wbindgen_enum_GpuSamplerBindingType = [
  "filtering",
  "non-filtering",
  "comparison",
];

const __wbindgen_enum_GpuStencilOperation = [
  "keep",
  "zero",
  "replace",
  "invert",
  "increment-clamp",
  "decrement-clamp",
  "increment-wrap",
  "decrement-wrap",
];

const __wbindgen_enum_GpuStorageTextureAccess = [
  "write-only",
  "read-only",
  "read-write",
];

const __wbindgen_enum_GpuStoreOp = ["store", "discard"];

const __wbindgen_enum_GpuTextureAspect = ["all", "stencil-only", "depth-only"];

const __wbindgen_enum_GpuTextureDimension = ["1d", "2d", "3d"];

const __wbindgen_enum_GpuTextureFormat = [
  "r8unorm",
  "r8snorm",
  "r8uint",
  "r8sint",
  "r16unorm",
  "r16snorm",
  "r16uint",
  "r16sint",
  "r16float",
  "rg8unorm",
  "rg8snorm",
  "rg8uint",
  "rg8sint",
  "r32uint",
  "r32sint",
  "r32float",
  "rg16unorm",
  "rg16snorm",
  "rg16uint",
  "rg16sint",
  "rg16float",
  "rgba8unorm",
  "rgba8unorm-srgb",
  "rgba8snorm",
  "rgba8uint",
  "rgba8sint",
  "bgra8unorm",
  "bgra8unorm-srgb",
  "rgb9e5ufloat",
  "rgb10a2uint",
  "rgb10a2unorm",
  "rg11b10ufloat",
  "rg32uint",
  "rg32sint",
  "rg32float",
  "rgba16unorm",
  "rgba16snorm",
  "rgba16uint",
  "rgba16sint",
  "rgba16float",
  "rgba32uint",
  "rgba32sint",
  "rgba32float",
  "stencil8",
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "depth32float-stencil8",
  "bc1-rgba-unorm",
  "bc1-rgba-unorm-srgb",
  "bc2-rgba-unorm",
  "bc2-rgba-unorm-srgb",
  "bc3-rgba-unorm",
  "bc3-rgba-unorm-srgb",
  "bc4-r-unorm",
  "bc4-r-snorm",
  "bc5-rg-unorm",
  "bc5-rg-snorm",
  "bc6h-rgb-ufloat",
  "bc6h-rgb-float",
  "bc7-rgba-unorm",
  "bc7-rgba-unorm-srgb",
  "etc2-rgb8unorm",
  "etc2-rgb8unorm-srgb",
  "etc2-rgb8a1unorm",
  "etc2-rgb8a1unorm-srgb",
  "etc2-rgba8unorm",
  "etc2-rgba8unorm-srgb",
  "eac-r11unorm",
  "eac-r11snorm",
  "eac-rg11unorm",
  "eac-rg11snorm",
  "astc-4x4-unorm",
  "astc-4x4-unorm-srgb",
  "astc-5x4-unorm",
  "astc-5x4-unorm-srgb",
  "astc-5x5-unorm",
  "astc-5x5-unorm-srgb",
  "astc-6x5-unorm",
  "astc-6x5-unorm-srgb",
  "astc-6x6-unorm",
  "astc-6x6-unorm-srgb",
  "astc-8x5-unorm",
  "astc-8x5-unorm-srgb",
  "astc-8x6-unorm",
  "astc-8x6-unorm-srgb",
  "astc-8x8-unorm",
  "astc-8x8-unorm-srgb",
  "astc-10x5-unorm",
  "astc-10x5-unorm-srgb",
  "astc-10x6-unorm",
  "astc-10x6-unorm-srgb",
  "astc-10x8-unorm",
  "astc-10x8-unorm-srgb",
  "astc-10x10-unorm",
  "astc-10x10-unorm-srgb",
  "astc-12x10-unorm",
  "astc-12x10-unorm-srgb",
  "astc-12x12-unorm",
  "astc-12x12-unorm-srgb",
];

const __wbindgen_enum_GpuTextureSampleType = [
  "float",
  "unfilterable-float",
  "depth",
  "sint",
  "uint",
];

const __wbindgen_enum_GpuTextureViewDimension = [
  "1d",
  "2d",
  "2d-array",
  "cube",
  "cube-array",
  "3d",
];

const __wbindgen_enum_GpuVertexFormat = [
  "uint8",
  "uint8x2",
  "uint8x4",
  "sint8",
  "sint8x2",
  "sint8x4",
  "unorm8",
  "unorm8x2",
  "unorm8x4",
  "snorm8",
  "snorm8x2",
  "snorm8x4",
  "uint16",
  "uint16x2",
  "uint16x4",
  "sint16",
  "sint16x2",
  "sint16x4",
  "unorm16",
  "unorm16x2",
  "unorm16x4",
  "snorm16",
  "snorm16x2",
  "snorm16x4",
  "float16",
  "float16x2",
  "float16x4",
  "float32",
  "float32x2",
  "float32x3",
  "float32x4",
  "uint32",
  "uint32x2",
  "uint32x3",
  "uint32x4",
  "sint32",
  "sint32x2",
  "sint32x3",
  "sint32x4",
  "unorm10-10-10-2",
  "unorm8x4-bgra",
];

const __wbindgen_enum_GpuVertexStepMode = ["vertex", "instance"];
const RustShowcaseWebFinalization =
  typeof FinalizationRegistry === "undefined"
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
        wasm.__wbg_rustshowcaseweb_free(ptr, 1),
      );
const RustShowcaseWebGpuFinalization =
  typeof FinalizationRegistry === "undefined"
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
        wasm.__wbg_rustshowcasewebgpu_free(ptr, 1),
      );

function addToExternrefTable0(obj) {
  const idx = wasm.__wbindgen_export5();
  wasm.__wbindgen_externrefs.set(idx, obj);
  return idx;
}

const CLOSURE_DTORS =
  typeof FinalizationRegistry === "undefined"
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((state) =>
        wasm.__wbindgen_export6(state.a, state.b),
      );

function debugString(val) {
  switch (typeof val) {
    // primitive types
    case "number":
    case "boolean":
    case "undefined":
      return `${val}`;
    case "string":
      return JSON.stringify(val);
    case "bigint":
      return `${val}n`;
    case "symbol":
      return val.description !== undefined
        ? `Symbol(${val.description})`
        : "Symbol";
    case "function":
      return typeof val.name === "string" && val.name !== ""
        ? `Function(${val.name})`
        : "Function";
    case "object": {
      if (val === null) {
        return "null";
      }
      // objects
      if (Array.isArray(val)) {
        return "[" + Array.from(val, debugString).join(", ") + "]";
      }
      // errors
      if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
      }

      const toStringOutput = toString.call(val);
      // Test for built-in
      const className = /\[object ([^\]]+)\]/.exec(toStringOutput)?.[1];

      // Failed to match the standard '[object ClassName]'
      if (className === undefined) {
        return toStringOutput;
      }
      if (className === "Object") {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
          return "Object(" + JSON.stringify(val) + ")";
        } catch (_) {
          return "Object";
        }
      }
      // TODO we could test for more things here, like `Set`s and `Map`s.
      return className;
    }
    // Per MDN: 'This list of values is exhaustive.'
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#description
  }
}

function getArrayJsValueViewFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  const mem = getDataViewMemory0();
  const result = [];
  for (let i = ptr; i < ptr + 4 * len; i += 4) {
    result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
  }
  return result;
}

function getArrayU32FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (
    cachedDataViewMemory0 === null ||
    cachedDataViewMemory0.buffer.detached === true ||
    (cachedDataViewMemory0.buffer.detached === undefined &&
      cachedDataViewMemory0.buffer !== wasm.memory.buffer)
  ) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return decodeText(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
  if (
    cachedUint32ArrayMemory0 === null ||
    cachedUint32ArrayMemory0.byteLength === 0
  ) {
    cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
  }
  return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null ||
    cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_export4(idx);
  }
}

function isLikeNone(x) {
  return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
  const state = { a: arg0, b: arg1, cnt: 1 };
  const real = (...args) => {
    // First up with a closure we increment the internal reference
    // count. This ensures that the Rust closure environment won't
    // be deallocated while we're invoking it.
    state.cnt++;
    const a = state.a;
    state.a = 0;
    try {
      return f(a, state.b, ...args);
    } finally {
      state.a = a;
      real._wbg_cb_unref();
    }
  };
  real._wbg_cb_unref = () => {
    if (--state.cnt === 0) {
      wasm.__wbindgen_export6(state.a, state.b);
      state.a = 0;
      CLOSURE_DTORS.unregister(state);
    }
  };
  CLOSURE_DTORS.register(real, state, state);
  return real;
}

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;

  const mem = getUint8ArrayMemory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view);

    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx);
  wasm.__wbindgen_export7(idx);
  return value;
}

let cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(bytes) {
  numBytesDecoded += bytes.length;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
    cachedTextDecoder.decode();
    numBytesDecoded = bytes.length;
  }
  return cachedTextDecoder.decode(bytes);
}

const cachedTextEncoder = new TextEncoder();

if (!("encodeInto" in cachedTextEncoder)) {
  cachedTextEncoder.encodeInto = function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length,
    };
  };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
  wasmInstance = instance;
  wasm = instance.exports;
  wasmModule = module;
  cachedDataViewMemory0 = null;
  cachedUint32ArrayMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}

async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (!module.ok) {
      throw new Error(
        `failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`,
      );
    }

    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse = expectedResponseType(module.type);

        if (
          validResponse &&
          module.headers.get("Content-Type") !== "application/wasm"
        ) {
          console.warn(
            "`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",
            e,
          );
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }

  function expectedResponseType(type) {
    switch (type) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
}

function initSync(module) {
  if (wasm !== undefined) return wasm;

  if (module !== undefined) {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module } = module);
    } else {
      console.warn(
        "using deprecated parameters for `initSync()`; pass a single object instead",
      );
    }
  }

  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}

let __wbg_init_promise;
async function __wbg_init(module_or_path) {
  if (wasm !== undefined) return wasm;
  if (__wbg_init_promise === undefined) {
    __wbg_init_promise = __wbg_init_once(module_or_path);
    __wbg_init_promise.catch(() => {
      __wbg_init_promise = undefined;
    });
  }
  return __wbg_init_promise;
}

async function __wbg_init_once(module_or_path) {
  if (module_or_path !== undefined) {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn(
        "using deprecated parameters for the initialization function; pass a single object instead",
      );
    }
  }

  if (module_or_path === undefined) {
    module_or_path = new URL("rust_showcase_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();

  if (
    typeof module_or_path === "string" ||
    (typeof Request === "function" && module_or_path instanceof Request) ||
    (typeof URL === "function" && module_or_path instanceof URL)
  ) {
    module_or_path = fetch(module_or_path);
  }

  const { instance, module } = await __wbg_load(await module_or_path, imports);

  return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
