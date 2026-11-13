---
source_url: https://developer.chrome.com/blog/new-in-webgpu-128
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: ba64fc408adad2e70758eb87d34afab132885ff82deed5ead3235f8803534c0a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

François Beaufort [GitHub](https://github.com/beaufortfrancois)

## Experimenting with subgroups

The subgroups feature enables SIMD-level parallelism, allowing threads within a group to communicate and perform collective math operations (for example, calculating the sum of 16 numbers). This provides a highly efficient form of cross-thread data sharing.

A minimal implementation of the [subgroups proposal](https://github.com/gpuweb/gpuweb/blob/main/proposals/subgroups.md) is available for local testing behind the "Unsafe WebGPU Support" flag at `chrome://flags/#enable-unsafe-webgpu`.

You can also try subgroups on your site with real users by [signing up for the origin trial](https://developer.chrome.com/origintrials#/view_trial/4130363808252166145). Read [Get started with origin trials](https://developer.chrome.com/docs/web-platform/origin-trials.md.txt) for instructions on how to prepare your site to use origin trials. The origin trial will run from Chrome 128 to 131 (ending February 19, 2025). See [Intent to Experiment](https://groups.google.com/a/chromium.org/g/blink-dev/c/9SPlKwQRxxc/).

When the `"subgroups"` feature is available in a `GPUAdapter`, request a `GPUDevice` with this feature to get subgroups support in WGSL and check its `minSubgroupSize` and `maxSubgroupSize` limits.

You also need to explicitly enable this extension in your WGSL code with `enable subgroups;`. When enabled, you get access to the following additions:

- `subgroup_invocation_id`: A built-in value for the index of the thread within the subgroup.
- `subgroup_size`: A built-in value for subgroup size access.
- `subgroupBallot(value)`: Returns a set of bit fields where the bit corresponding to `subgroup_invocation_id` is 1 if `value` is true for that active invocation and 0 otherwise.
- `subgroupBroadcast(value, id)`: Broadcasts the `value` from the invocation with `subgroup_invocation_id` matching `id` to all invocations within the subgroup. Note: `id` must be a compile-time constant.

More built-in functions such as `subgroupAdd`, `subgroupAll`, `subgroupElect`, `subgroupShuffle` will be added in the future. See [issue 354738715](https://issues.chromium.org/issues/354738715).

To allow f16 in subgroups operations, request a `GPUDevice` with the `"subgroups"`, `"subgroups-f16"`, and `"shader-f16"` features, then enable it in your WGSL code with `enable f16, subgroups, subgroups_f16;`.

The following code snippet provides a base to tinker with and discover the potential of subgroups.

```javascript
const adapter = await navigator.gpu.requestAdapter();
if (!adapter.features.has("subgroups")) {
  throw new Error("Subgroups support is not available");
}
// Explicitly request subgroups support.
const device = await adapter.requestDevice({
  requiredFeatures: ["subgroups"],
});

const shaderModule = device.createShaderModule({
  code: `
  enable subgroups;

  var<workgroup> wgmem : u32;

  @group(0) @binding(0)
  var<storage, read> inputs : array<u32>;

  @group(0) @binding(1)
  var<storage, read_write> output : array<u32>;

  @compute @workgroup_size(64)
  fn main(@builtin(subgroup_size) subgroupSize : u32,
          @builtin(subgroup_invocation_id) id : u32,
          @builtin(local_invocation_index) lid : u32) {
    // One thread per workgroup writes the value to workgroup memory.
    if (lid == 0) {
      wgmem = inputs[lid];
    }
    workgroupBarrier();
    var v = 0u;

    // One thread per subgroup reads the value from workgroup memory
    // and shares that value with every other thread in the subgroup
    // to reduce local memory bandwidth.
    if (id == 0) {
      v = wgmem;
    }
    v = subgroupBroadcast(v, 0);
    output[lid] = v;
  }`,
});

// Send the appropriate commands to the GPU...
```

## Deprecate setting depth bias for lines and points

A [WebGPU spec change](https://github.com/gpuweb/gpuweb/pull/4743) makes it a validation error to set `depthBias`, `depthBiasSlopeScale`, and `depthBiasClamp` to a non-zero value when the topology for a render pipeline is a line or point type. To give developers enough time to update their code, a warning in the DevTools Console is shown about this upcoming validation while also forcing the values to 0 in these circumstances. See [issue 352567424](https://issues.chromium.org/issues/352567424).

## Hide uncaptured error DevTools warning if preventDefault

In the DevTools Console, warnings for [`uncapturederror` events](https://gpuweb.github.io/gpuweb/#eventdef-gpudevice-uncapturederror) are no longer displayed if an event listener for `uncapturederror` has been registered and the Event [`preventDefault()`](https://developer.mozilla.org/docs/Web/API/Event/preventDefault) method has been called within the event listener callback. This behaviour matches event handling in JavaScript. See the following example and [issue 40263619](https://issues.chromium.org/issues/40263619).

```javascript
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

device.addEventListener("uncapturederror", (event) => {
  // Prevents browser warning to show up in the DevTools Console.
  event.preventDefault();

  // TODO: Handle event.error
});
```

## WGSL interpolate sampling first and either

WGSL `interpolate` attribute lets you manage user-defined IO data interpolation. Now, new interpolate sampling parameters `first` (default) and `either` give you additional control: `first` uses the value from the primitive's first vertex, while `either` allows either the first or last vertex. See [issue 340278447](https://issues.chromium.org/issues/340278447).

## Dawn updates

The implementation of Dawn's WGPUFuture to handle asynchronous operations is now complete. Key concepts include [wgpuInstanceProcessEvents](https://webgpu-native.github.io/webgpu-headers/Asynchronous-Operations.html#Process-Events) for opportunistic event processing and [WGPUCallbackMode](https://webgpu-native.github.io/webgpu-headers/group__Enumerations.html#gaf6f2496c9c727391ba83e928a8d4e63e) for defining callback locations. WGPUFuture signifies one-time events with an infinite lifetime, and [wgpuInstanceWaitAny](https://webgpu-native.github.io/webgpu-headers/Asynchronous-Operations.html#Wait-Any) awaits completion of any future or a timeout. See [issue 42240932](https://issues.chromium.org/issues/42240932).

The `CompositeAlphaMode::Auto` value is now not reported by `Surface::GetCapabilities()`. It's still valid, and equivalent to `Surface::GetCapabilities().alphaMode[0]`. See [issue 292](https://github.com/webgpu-native/webgpu-headers/issues/292).

The OpenGL backend now supports `Surface` with a y-flip blit for each `Present()` call. See [issue 344814083](https://issues.chromium.org/issues/344814083).

The `Adapter::GetProperties()` method is deprecated in favor of using `Adapter::GetInfo()`.

Jaswant, an external contributor, has rewritten all the CMake files, making them easier to update and allowing for pre-builds. Check out the [quickstart guide](https://dawn.googlesource.com/dawn/+/main/docs/quickstart-cmake.md) for using Dawn in CMake projects.

This covers only some of the key highlights. Check out the exhaustive [list of commits](https://dawn.googlesource.com/dawn/+log/chromium/6533..chromium/6613?n=1000).

## What's New in WebGPU

A list of everything that has been covered in the [What's New in WebGPU](https://developer.chrome.com/docs/web-platform/webgpu/news.md.txt) series.

### Chrome 155-156

- [WGSL fragment_depth extension](https://developer.chrome.com/blog/new-in-webgpu-155-156.md.txt#wgsl-fragment_depth)
- [Texture compression unaligned](https://developer.chrome.com/blog/new-in-webgpu-155-156.md.txt#texture-compression)
- [srgb-linear and display-p3-linear color spaces](https://developer.chrome.com/blog/new-in-webgpu-155-156.md.txt#srgb-linear-and)
- [Additional snorm10-10-10-2 vertex format](https://developer.chrome.com/blog/new-in-webgpu-155-156.md.txt#additional-snorm10-10-10-2)
- [f16 support on Linux for NVIDIA](https://developer.chrome.com/blog/new-in-webgpu-155-156.md.txt#f16-support)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-155-156.md.txt#dawn-updates)

### Chrome 153-154

- [WGSL buffer_view extension](https://developer.chrome.com/blog/new-in-webgpu-153-154.md.txt#wgsl-buffer_view)
- [WGSL swizzle_assignment extension](https://developer.chrome.com/blog/new-in-webgpu-153-154.md.txt#wgsl-swizzle_assignment)
- [WGSL extension updates](https://developer.chrome.com/blog/new-in-webgpu-153-154.md.txt#wgsl-extension)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-153-154.md.txt#dawn-updates)

### Chrome 151-152

- [Subgroup size control](https://developer.chrome.com/blog/new-in-webgpu-151-152.md.txt#subgroup-size)
- [OperationError for setImmediates validation failures](https://developer.chrome.com/blog/new-in-webgpu-151-152.md.txt#operationerror-setimmediates)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-151-152.md.txt#dawn-updates)

### Chrome 149-150

- [Immediates](https://developer.chrome.com/blog/new-in-webgpu-149-150.md.txt#immediates)
- [Stricter validation for transient attachments](https://developer.chrome.com/blog/new-in-webgpu-149-150.md.txt#stricter_validation_for_transient_attachments)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-149-150.md.txt#dawn_updates)

### Chrome 147-148

- [WGSL linear_indexing extension](https://developer.chrome.com/blog/new-in-webgpu-147-148.md.txt#wgsl_linear_indexing_extension)
- [WebGPU on Linux NVIDIA](https://developer.chrome.com/blog/new-in-webgpu-147-148.md.txt#webgpu_on_linux_nvidia)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-147-148.md.txt#dawn_updates)

### Chrome 146

- [Support WebGPU compatibility mode on OpenGL ES 3.1](https://developer.chrome.com/blog/new-in-webgpu-146.md.txt#support_webgpu_compatibility_mode_on_opengl_es_31)
- [Transient attachments](https://developer.chrome.com/blog/new-in-webgpu-146.md.txt#transient_attachments)
- [WGSL texture_and_sampler_let extension](https://developer.chrome.com/blog/new-in-webgpu-146.md.txt#wgsl_texture_and_sampler_let_extension)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-146.md.txt#dawn_updates)

### Chrome 145

- [WGSL subgroup_uniformity extension](https://developer.chrome.com/blog/new-in-webgpu-145.md.txt#wgsl_subgroup_uniformity_extension)
- [Experimental synchronous buffer mapping in workers](https://developer.chrome.com/blog/new-in-webgpu-145.md.txt#experimental_synchronous_buffer_mapping_in_workers)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-145.md.txt#dawn_updates)

### Chrome 144

- [WGSL subgroup_id extension](https://developer.chrome.com/blog/new-in-webgpu-144.md.txt#wgsl_subgroup_id_extension)
- [WGSL uniform_buffer_standard_layout extension](https://developer.chrome.com/blog/new-in-webgpu-144.md.txt#wgsl_uniform_buffer_standard_layout_extension)
- [WebGPU on Linux](https://developer.chrome.com/blog/new-in-webgpu-144.md.txt#webgpu_on_linux)
- [Faster writeBuffer and writeTexture](https://developer.chrome.com/blog/new-in-webgpu144#faster_writebuffer_and_writetexture)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-144.md.txt#dawn_updates)

### Chrome 143

- [Texture component swizzle](https://developer.chrome.com/blog/new-in-webgpu-143.md.txt#texture_component_swizzle)
- [Remove bgra8unorm read-only storage texture usage](https://developer.chrome.com/blog/new-in-webgpu-143.md.txt#remove_bgra8unorm_read-only_storage_texture_usage)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-143.md.txt#dawn_updates)

### Chrome 142

- [Texture format support capabilities extended](https://developer.chrome.com/blog/new-in-webgpu-142.md.txt#texture_format_support_capabilities_extended)
- [Primitive index in WGSL](https://developer.chrome.com/blog/new-in-webgpu-142.md.txt#primitive_index_in_wgsl)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-142.md.txt#dawn_updates)

### Chrome 141

- [Tint IR completed](https://developer.chrome.com/blog/new-in-webgpu-141.md.txt#tint_ir_completed)
- [Integer range analysis in WGSL compiler](https://developer.chrome.com/blog/new-in-webgpu-141.md.txt#integer_range_analysis_in_wgsl_compiler)
- [SPIR-V 1.4 update for Vulkan backend](https://developer.chrome.com/blog/new-in-webgpu-141.md.txt#spir-v_14_update_for_vulkan_backend)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-141.md.txt#dawn_updates)

### Chrome 140

- [Device requests consume adapter](https://developer.chrome.com/blog/new-in-webgpu-140.md.txt#device_requests_consume_adapter)
- [Shorthand for using texture where texture view is used](https://developer.chrome.com/blog/new-in-webgpu-140.md.txt#shorthand_for_using_texture_where_texture_view_is_used)
- [WGSL textureSampleLevel supports 1D textures](https://developer.chrome.com/blog/new-in-webgpu-140.md.txt#wgsl_texturesamplelevel_supports_1d_textures)
- [Deprecate bgra8unorm read-only storage texture usage](https://developer.chrome.com/blog/new-in-webgpu-140.md.txt#deprecate_bgra8unorm_read-only_storage_texture_usage)
- [Remove GPUAdapter isFallbackAdapter attribute](https://developer.chrome.com/blog/new-in-webgpu-140.md.txt#remove_gpuadapter_isfallbackadapter_attribute)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-140.md.txt#dawn_updates)

### Chrome 139

- [3D texture support for BC and ASTC compressed formats](https://developer.chrome.com/blog/new-in-webgpu-139.md.txt#3d_texture_support_for_bc_and_astc_compressed_formats)
- [New "core-features-and-limits" feature](https://developer.chrome.com/blog/new-in-webgpu-139.md.txt#new_core-features-and-limits_feature)
- [Origin trial for WebGPU compatibility mode](https://developer.chrome.com/blog/new-in-webgpu-139.md.txt#origin_trial_for_webgpu_compatibility_mode)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-139.md.txt#dawn_updates)

### Chrome 138

- [Shorthand for using buffer as a binding resource](https://developer.chrome.com/blog/new-in-webgpu-138.md.txt#shorthand_for_using_buffer_as_a_binding_resource)
- [Size requirement changes for buffers mapped at creation](https://developer.chrome.com/blog/new-in-webgpu-138.md.txt#size_requirement_changes_for_buffers_mapped_at_creation)
- [Architecture report for recent GPUs](https://developer.chrome.com/blog/new-in-webgpu-138.md.txt#architecture_report_for_recent_gpus)
- [Deprecate GPUAdapter isFallbackAdapter attribute](https://developer.chrome.com/blog/new-in-webgpu-138.md.txt#deprecate_gpuadapter_isfallbackadapter_attribute)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-138.md.txt#dawn_updates)

### Chrome 137

- [Use texture view for externalTexture binding](https://developer.chrome.com/blog/new-in-webgpu-137.md.txt#use_texture_view_for_externaltexture_binding)
- [Buffers copy without specifying offsets and size](https://developer.chrome.com/blog/new-in-webgpu-137.md.txt#buffers_copy_without_specifying_offsets_and_size)
- [WGSL workgroupUniformLoad using pointer to atomic](https://developer.chrome.com/blog/new-in-webgpu-137.md.txt#wgsl_workgroupuniformload_using_pointer_to_atomic)
- [GPUAdapterInfo powerPreference attribute](https://developer.chrome.com/blog/new-in-webgpu-137.md.txt#gpuadapterinfo_powerpreference_attribute)
- [Remove GPURequestAdapterOptions compatibilityMode attribute](https://developer.chrome.com/blog/new-in-webgpu-137.md.txt#remove_gpurequestadapteroptions_compatibilitymode_attribute)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-137.md.txt#dawn_updates)

### Chrome 136

- [GPUAdapterInfo isFallbackAdapter attribute](https://developer.chrome.com/blog/new-in-webgpu-136.md.txt#gpuadapterinfo_isfallbackadapter_attribute)
- [Shader compilation time improvements on D3D12](https://developer.chrome.com/blog/new-in-webgpu-136.md.txt#shader_compilation_time_improvements_on_d3d12)
- [Save and copy canvas images](https://developer.chrome.com/blog/new-in-webgpu-136.md.txt#save_and_copy_canvas_images)
- [Lift compatibility mode restrictions](https://developer.chrome.com/blog/new-in-webgpu-136.md.txt#lift_compatibility_mode_restrictions)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-136.md.txt#dawn_updates)

### Chrome 135

- [Allow creating pipeline layout with null bind group layout](https://developer.chrome.com/blog/new-in-webgpu-135.md.txt#allow_creating_pipeline_layout_with_null_bind_group_layout)
- [Allow viewports to extend past the render targets bounds](https://developer.chrome.com/blog/new-in-webgpu-135.md.txt#allow_viewports_to_extend_past_the_render_targets_bounds)
- [Easier access to the experimental compatibility mode on Android](https://developer.chrome.com/blog/new-in-webgpu-135.md.txt#easier_access_to_the_experimental_compatibility_mode_on_android)
- [Remove maxInterStageShaderComponents limit](https://developer.chrome.com/blog/new-in-webgpu-135.md.txt#remove_maxinterstageshadercomponents_limit)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-135.md.txt#dawn_updates)

### Chrome 134

- [Improve machine-learning workloads with subgroups](https://developer.chrome.com/blog/new-in-webgpu-134.md.txt#improve_machine-learning_workloads_with_subgroups)
- [Remove float filterable texture types support as blendable](https://developer.chrome.com/blog/new-in-webgpu-134.md.txt#remove_float_filterable_texture_types_support_as_blendable)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-134.md.txt#dawn_updates)

### Chrome 133

- [Additional unorm8x4-bgra and 1-component vertex formats](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#additional_unorm8x4-bgra_and_1-component_vertex_formats)
- [Allow unknown limits to be requested with undefined value](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#allow_unknown_limits_to_be_requested_with_undefined_value)
- [WGSL alignment rules changes](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#wgsl_alignment_rules_changes)
- [WGSL performance gains with discard](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#wgsl_performance_gains_with_discard)
- [Use VideoFrame displaySize for external textures](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#use_videoframe_displaysize_for_external_textures)
- [Handle images with non-default orientations using copyExternalImageToTexture](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#handle_images_with_non-default_orientations_using_copyexternalimagetotexture)
- [Improving developer experience](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#improving_developer_experience)
- [Enable compatibility mode with featureLevel](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#enable_compatibility_mode_with_featurelevel)
- [Experimental subgroup features cleanup](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#experimental_subgroup_features_cleanup)
- [Deprecate maxInterStageShaderComponents limit](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#deprecate_maxinterstageshadercomponents_limit)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-133.md.txt#dawn_updates)

### Chrome 132

- [Texture view usage](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#texture_view_usage)
- [32-bit float textures blending](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#32-bit_float_textures_blending)
- [GPUDevice adapterInfo attribute](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#gpudevice_adapterinfo_attribute)
- [Configuring canvas context with invalid format throw JavaScript error](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#configuring_canvas_context_with_invalid_format_throw_javascript_error)
- [Filtering sampler restrictions on textures](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#filtering_sampler_restrictions_on_textures)
- [Extended subgroups experimentation](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#extended_subgroups_experimentation)
- [Improving developer experience](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#improving_developer_experience)
- [Experimental support for 16-bit normalized texture formats](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#experimental_support_for_16-bit_normalized_texture_formats)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-132.md.txt#dawn_updates)

### Chrome 131

- [Clip distances in WGSL](https://developer.chrome.com/blog/new-in-webgpu-131.md.txt#clip_distances_in_wgsl)
- [GPUCanvasContext getConfiguration()](https://developer.chrome.com/blog/new-in-webgpu-131.md.txt#gpucanvascontext_getconfiguration)
- [Point and line primitives must not have depth bias](https://developer.chrome.com/blog/new-in-webgpu-131.md.txt#point_and_line_primitives_must_not_have_depth_bias)
- [Inclusive scan built-in functions for subgroups](https://developer.chrome.com/blog/new-in-webgpu-131.md.txt#inclusive_scan_built-in_functions_for_subgroups)
- [Experimental support for multi-draw indirect](https://developer.chrome.com/blog/new-in-webgpu-131.md.txt#experimental_support_for_multi-draw_indirect)
- [Shader module compilation option strict math](https://developer.chrome.com/blog/new-in-webgpu-131.md.txt#shader_module_compilation_option_strict_math)
- [Remove GPUAdapter requestAdapterInfo()](https://developer.chrome.com/blog/new-in-webgpu-131.md.txt#remove_gpuadapter_requestadapterinfo)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-131.md.txt#dawn_updates)

### Chrome 130

- [Dual source blending](https://developer.chrome.com/blog/new-in-webgpu-130.md.txt#dual_source_blending)
- [Shader compilation time improvements on Metal](https://developer.chrome.com/blog/new-in-webgpu-130.md.txt#shader_compilation_time_improvements_on_metal)
- [Deprecation of GPUAdapter requestAdapterInfo()](https://developer.chrome.com/blog/new-in-webgpu-130.md.txt#deprecation_of_gpuadapter_requestadapterinfo)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-130.md.txt#dawn_updates)

### Chrome 129

- [HDR support with canvas tone mapping mode](https://developer.chrome.com/blog/new-in-webgpu-129.md.txt#hdr_support_with_canvas_tone_mapping_mode)
- [Expanded subgroups support](https://developer.chrome.com/blog/new-in-webgpu-129.md.txt#expanded_subgroups_support)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-129.md.txt#dawn_updates)

### Chrome 128

- [Experimenting with subgroups](https://developer.chrome.com/blog/new-in-webgpu-128.md.txt#experimenting_with_subgroups)
- [Deprecate setting depth bias for lines and points](https://developer.chrome.com/blog/new-in-webgpu-128.md.txt#deprecate_setting_depth_bias_for_lines_and_points)
- [Hide uncaptured error DevTools warning if preventDefault](https://developer.chrome.com/blog/new-in-webgpu-128.md.txt#hide_uncaptured_error_devtools_warning_if_preventdefault)
- [WGSL interpolate sampling first and either](https://developer.chrome.com/blog/new-in-webgpu-128.md.txt#wgsl_interpolate_sampling_first_and_either)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-128.md.txt#dawn_updates)

### Chrome 127

- [Experimental support for OpenGL ES on Android](https://developer.chrome.com/blog/new-in-webgpu-127.md.txt#experimental_support_for_opengl_es_on_android)
- [GPUAdapter info attribute](https://developer.chrome.com/blog/new-in-webgpu-127.md.txt#gpuadapter_info_attribute)
- [WebAssembly interop improvements](https://developer.chrome.com/blog/new-in-webgpu-127.md.txt#webassembly_interop_improvements)
- [Improved command encoder errors](https://developer.chrome.com/blog/new-in-webgpu-127.md.txt#improved_command_encoder_errors)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-127.md.txt#dawn_updates)

### Chrome 126

- [Increase maxTextureArrayLayers limit](https://developer.chrome.com/blog/new-in-webgpu-126.md.txt#increase_maxtexturearraylayers_limit)
- [Buffer upload optimization for Vulkan backend](https://developer.chrome.com/blog/new-in-webgpu-126.md.txt#buffer_upload_optimization_for_vulkan_backend)
- [Shader compilation time improvements](https://developer.chrome.com/blog/new-in-webgpu-126.md.txt#shader_compilation_time_improvements)
- [Submitted command buffers must be unique](https://developer.chrome.com/blog/new-in-webgpu-126.md.txt#submitted_command_buffers_must_be_unique)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-126.md.txt#dawn_updates)

### Chrome 125

- [Subgroups (feature in development)](https://developer.chrome.com/blog/new-in-webgpu-125.md.txt#subgroups_feature_in_development)
- [Render to slice of 3D texture](https://developer.chrome.com/blog/new-in-webgpu-125.md.txt#render_to_slice_of_3d_texture)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-125.md.txt#dawn_updates)

### Chrome 124

- [Read-only and read-write storage textures](https://developer.chrome.com/blog/new-in-webgpu-124.md.txt#read-only_and_read-write_storage_textures)
- [Service workers and shared workers support](https://developer.chrome.com/blog/new-in-webgpu-124.md.txt#service_workers_and_shared_workers_support)
- [New adapter information attributes](https://developer.chrome.com/blog/new-in-webgpu-124.md.txt#new_adapter_information_attributes)
- [Bug fixes](https://developer.chrome.com/blog/new-in-webgpu-124.md.txt#bug_fixes)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-124.md.txt#dawn_updates)

### Chrome 123

- [DP4a built-in functions support in WGSL](https://developer.chrome.com/blog/new-in-webgpu-123.md.txt#dp4a_built-in_functions_support_in_wgsl)
- [Unrestricted pointer parameters in WGSL](https://developer.chrome.com/blog/new-in-webgpu-123.md.txt#unrestricted_pointer_parameters_in_wgsl)
- [Syntax sugar for dereferencing composites in WGSL](https://developer.chrome.com/blog/new-in-webgpu-123.md.txt#syntax_sugar_for_dereferencing_composites_in_wgsl)
- [Separate read-only state for stencil and depth aspects](https://developer.chrome.com/blog/new-in-webgpu-123.md.txt#separate_read-only_state_for_stencil_and_depth_aspects)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-123.md.txt#dawn_updates)

### Chrome 122

- [Expand reach with compatibility mode (feature in development)](https://developer.chrome.com/blog/new-in-webgpu-122.md.txt#expand_reach_with_compatibility_mode_feature_in_development)
- [Increase maxVertexAttributes limit](https://developer.chrome.com/blog/new-in-webgpu-122.md.txt#increase_maxvertexattributes_limit)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-122.md.txt#dawn_updates)

### Chrome 121

- [Support WebGPU on Android](https://developer.chrome.com/blog/new-in-webgpu-121.md.txt#support-webgpu-on-android)
- [Use DXC instead of FXC for shader compilation on Windows](https://developer.chrome.com/blog/new-in-webgpu-121.md.txt#use_dxc_instead_of_fxc_for_shader_compilation_on_windows)
- [Timestamp queries in compute and render passes](https://developer.chrome.com/blog/new-in-webgpu-121.md.txt#timestamp_queries_in_compute_and_render_passes)
- [Default entry points to shader modules](https://developer.chrome.com/blog/new-in-webgpu-121.md.txt#default_entry_points_to_shader_modules)
- [Support display-p3 as GPUExternalTexture color space](https://developer.chrome.com/blog/new-in-webgpu-121.md.txt#support_display-p3_as_gpuexternaltexture_color_space)
- [Memory heaps info](https://developer.chrome.com/blog/new-in-webgpu-121.md.txt#memory_heaps_info)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-121.md.txt#dawn_updates)

### Chrome 120

- [Support for 16-bit floating-point values in WGSL](https://developer.chrome.com/blog/new-in-webgpu-120.md.txt#support_for_16-bit_floating-point_values_in_wgsl)
- [Push the limits](https://developer.chrome.com/blog/new-in-webgpu-120.md.txt#push_the_limits)
- [Changes to depth-stencil state](https://developer.chrome.com/blog/new-in-webgpu-120.md.txt#changes_to_depth-stencil_state)
- [Adapter information updates](https://developer.chrome.com/blog/new-in-webgpu-120.md.txt#adapter_information_updates)
- [Timestamp queries quantization](https://developer.chrome.com/blog/new-in-webgpu-120.md.txt#timestamp_queries_quantization)
- [Spring-cleaning features](https://developer.chrome.com/blog/new-in-webgpu-120.md.txt#spring-cleaning_features)

### Chrome 119

- [Filterable 32-bit float textures](https://developer.chrome.com/blog/new-in-webgpu-119.md.txt#filterable_32-bit_float_textures)
- [unorm10-10-10-2 vertex format](https://developer.chrome.com/blog/new-in-webgpu-119.md.txt#unorm10-10-10-2_vertex_format)
- [rgb10a2uint texture format](https://developer.chrome.com/blog/new-in-webgpu-119.md.txt#rgb10a2uint_texture_format)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-119.md.txt#dawn_updates)

### Chrome 118

- [HTMLImageElement and ImageData support in `copyExternalImageToTexture()`](https://developer.chrome.com/blog/new-in-webgpu-118.md.txt#htmlimageelement_and_imagedata_support_in_copyexternalimagetotexture)
- [Experimental support for read-write and read-only storage texture](https://developer.chrome.com/blog/new-in-webgpu-118.md.txt#experimental_support_for_read-write_and_read-only_storage_texture)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-118.md.txt#dawn_updates)

### Chrome 117

- [Unset vertex buffer](https://developer.chrome.com/blog/new-in-webgpu-117.md.txt#unset_vertex_buffer)
- [Unset bind group](https://developer.chrome.com/blog/new-in-webgpu-117.md.txt#unset_bind_group)
- [Silence errors from async pipeline creation when device is lost](https://developer.chrome.com/blog/new-in-webgpu-117.md.txt#silence_errors_from_async_pipeline_creation_when_device_is_lost)
- [SPIR-V shader module creation updates](https://developer.chrome.com/blog/new-in-webgpu-117.md.txt#spir-v_shader_module_creation_updates)
- [Improving developer experience](https://developer.chrome.com/blog/new-in-webgpu-117.md.txt#improving_developer_experience)
- [Caching pipelines with automatically generated layout](https://developer.chrome.com/blog/new-in-webgpu-117.md.txt#caching_pipelines_with_automatically_generated_layout)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-117.md.txt#dawn_updates)

### Chrome 116

- [WebCodecs integration](https://developer.chrome.com/blog/new-in-webgpu-116.md.txt#webcodecs_integration)
- [Lost device returned by GPUAdapter `requestDevice()`](https://developer.chrome.com/blog/new-in-webgpu-116.md.txt#lost_device_returned_by_gpuadapter_requestdevice)
- [Keep video playback smooth if `importExternalTexture()` is called](https://developer.chrome.com/blog/new-in-webgpu-116.md.txt#keep_video_playback_smooth_if_importexternaltexture_is_called)
- [Spec conformance](https://developer.chrome.com/blog/new-in-webgpu-116.md.txt#spec_conformance)
- [Improving developer experience](https://developer.chrome.com/blog/new-in-webgpu-116.md.txt#improving_developer_experience)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-116.md.txt#dawn_updates)

### Chrome 115

- [Supported WGSL language extensions](https://developer.chrome.com/blog/new-in-webgpu-115.md.txt#supported_wgsl_language_extensions)
- [Experimental support for Direct3D 11](https://developer.chrome.com/blog/new-in-webgpu-115.md.txt#experimental_support_for_direct3d_11)
- [Get discrete GPU by default on AC power](https://developer.chrome.com/blog/new-in-webgpu-115.md.txt#get_discrete_gpu_by_default_on_ac_power)
- [Improving developer experience](https://developer.chrome.com/blog/new-in-webgpu-115.md.txt#improving_developer_experience)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-115.md.txt#dawn_updates)

### Chrome 114

- [Optimize JavaScript](https://developer.chrome.com/blog/new-in-webgpu-114.md.txt#optimize_javascript)
- [getCurrentTexture() on unconfigured canvas throws InvalidStateError](https://developer.chrome.com/blog/new-in-webgpu-114.md.txt#getcurrenttexture_on_unconfigured_canvas_throws_invalidstateerror)
- [WGSL updates](https://developer.chrome.com/blog/new-in-webgpu-114.md.txt#wgsl_updates)
- [Dawn updates](https://developer.chrome.com/blog/new-in-webgpu-114.md.txt#dawn_updates)

### Chrome 113

- [Use WebCodecs VideoFrame source in `importExternalTexture()`](https://developer.chrome.com/blog/new-in-webgpu-113.md.txt#use_webcodecs_videoframe_source_in_importexternaltexture)
