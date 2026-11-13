---
source_url: https://developer.chrome.com/blog/new-in-webgpu-123
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:57+00:00
sha256: 0fa2215ef278d4e58d351e3ed2a254db8cd332a74ddd17b9e1ce929ca676cf91
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

François Beaufort [GitHub](https://github.com/beaufortfrancois)

## DP4a built-in functions support in WGSL

DP4a (Dot Product of 4 Elements and Accumulate) refers to a set of GPU instructions commonly used in deep learning inference for quantization. It efficiently performs 8-bit integer [dot products](https://en.wikipedia.org/wiki/Dot_product) to accelerate the computation of such int8-quantized models. It can save (up to 75%) of the memory and network bandwidth and improve the performance of any machine learning models in inferencing compared with their f32 version. As a result, it's now heavily used within many popular AI frameworks.

When the `"packed_4x8_integer_dot_product"` WGSL [language extension](https://gpuweb.github.io/gpuweb/wgsl/#language-extension) is present in [`navigator.gpu.wgslLanguageFeatures`](https://developer.mozilla.org/docs/Web/API/WGSLLanguageFeatures), you can now use 32-bit integer scalars packing 4-component vectors of 8-bit integers as inputs to the dot product instructions in your WGSL shader code with the [`dot4U8Packed`](https://gpuweb.github.io/gpuweb/wgsl/#dot4U8Packed-builtin) and [`dot4I8Packed`](https://gpuweb.github.io/gpuweb/wgsl/#dot4I8Packed-builtin) built-in functions. You can also use packing and unpacking instructions with packed 4-component vectors of 8-bit integers with [`pack4xI8`](https://gpuweb.github.io/gpuweb/wgsl/#pack4xI8-builtin), [`pack4xU8`](https://gpuweb.github.io/gpuweb/wgsl/#pack4xU8-builtin), [`pack4xI8Clamp`](https://gpuweb.github.io/gpuweb/wgsl/#pack4xI8Clamp-builtin), [`pack4xU8Clamp`](https://gpuweb.github.io/gpuweb/wgsl/#pack4xU8Clamp-builtin), [`unpack4xI8`](https://gpuweb.github.io/gpuweb/wgsl/#unpack4xI8-builtin), and [`unpack4xU8`](https://gpuweb.github.io/gpuweb/wgsl/#unpack4xU8-builtin) WGSL built-in functions.

It's recommended to use a [requires-directive](https://gpuweb.github.io/gpuweb/wgsl/#requires-directive) to signal the potential for non-portability with `requires packed_4x8_integer_dot_product;` at the top of your WGSL shader code. See the following example and [issue tint:1497](https://bugs.chromium.org/p/dawn/issues/detail?id=1497).

```javascript
if (!navigator.gpu.wgslLanguageFeatures.has("packed_4x8_integer_dot_product")) {
  throw new Error(`DP4a built-in functions are not available`);
}

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const shaderModule = device.createShaderModule({
  code: `
  requires packed_4x8_integer_dot_product;

  fn main() {
    const result: u32 = dot4U8Packed(0x01020304u, 0x02040405u); // 42
  }`,
});
```

Special thanks to Intel's Web Graphics team in Shanghai for driving this specification and implementation to completion!

## Unrestricted pointer parameters in WGSL

The `"unrestricted_pointer_parameters"` WGSL [language extension](https://gpuweb.github.io/gpuweb/wgsl/#language-extension) loosens restrictions on which pointers can be passed to WGSL functions:

- Parameter pointers of `storage`, `uniform` and `workgroup` address spaces to user declared functions.

- Passing pointers to structure members and array elements to user declared functions.

Check out [Pointers As Function Parameters \| Tour of WGSL](https://google.github.io/tour-of-wgsl/types/pointers/passing_pointers/) to learn more about it.

This feature can be feature-detected using [`navigator.gpu.wgslLanguageFeatures`](https://developer.mozilla.org/docs/Web/API/WGSLLanguageFeatures). It's recommended to always use a [requires-directive](https://gpuweb.github.io/gpuweb/wgsl/#requires-directive) to signal the potential for non-portability with `requires unrestricted_pointer_parameters;` at the top of your WGSL shader code. See the following example, the [WGSL spec changes](https://github.com/gpuweb/gpuweb/commit/9298d2f06082ae61d03dcb31f44196a212e5c3a1), and [issue tint:2053](https://bugs.chromium.org/p/tint/issues/detail?id=2053).

```javascript
if (
  !navigator.gpu.wgslLanguageFeatures.has("unrestricted_pointer_parameters")
) {
  throw new Error(`Unrestricted pointer parameters are not available`);
}

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const shaderModule = device.createShaderModule({
  code: `
  requires unrestricted_pointer_parameters;

  @group(0) @binding(0) var<storage, read_write> S : i32;

  fn func(pointer : ptr<storage, i32, read_write>) {
    *pointer = 42;
  }

  @compute @workgroup_size(1)
  fn main() {
    func(&S);
  }`,
});
```

## Syntax sugar for dereferencing composites in WGSL

When the `"pointer_composite_access"` WGSL [language extension](https://gpuweb.github.io/gpuweb/wgsl/#language-extension) is present in [`navigator.gpu.wgslLanguageFeatures`](https://developer.mozilla.org/docs/Web/API/WGSLLanguageFeatures), your WGSL shader code now supports access to components of complex data types using the same dot (`.`) syntax whether you're working directly with the data or with a pointer to it. Here's how it works:

- If `foo` is a pointer: `foo.bar` is a more convenient way to write `(*foo).bar`. The asterisk (`*`) would normally be needed to turn the pointer into a "reference" that can be dereferenced, but now both pointers and references are much more similar and almost interchangeable.

- If `foo` is not a pointer: The dot (`.`) operator works exactly as you're used to for directly accessing members.

Similarly, if `pa` is a pointer that stores the starting address of an array, then using `pa[i]` gives you direct access to the memory location where the `'i`'th element of that array is stored.

It's recommended to use a [requires-directive](https://gpuweb.github.io/gpuweb/wgsl/#requires-directive) to signal the potential for non-portability with `requires pointer_composite_access;` at the top of your WGSL shader code. See the following example and [issue tint:2113](https://bugs.chromium.org/p/tint/issues/detail?id=2113).

```javascript
if (!navigator.gpu.wgslLanguageFeatures.has("pointer_composite_access")) {
  throw new Error(`Pointer composite access is not available`);
}

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const shaderModule = device.createShaderModule({
  code: `
  requires pointer_composite_access;

  fn main() {
    var a = vec3f();
    let p : ptr<function, vec3f> = &a;
    let r1 = (*p).x; // always valid.
    let r2 = p.x; // requires pointer composite access.
  }`,
});
```

## Separate read-only state for stencil and depth aspects

Previously, read-only depth-stencil attachments in render passes required both aspects (depth and stencil) to be read-only. This limitation has been lifted. Now, you can use the depth aspect in read-only fashion, for contact shadow tracing for instance, while the stencil buffer is written to identify pixels for further processing. See [issue dawn:2146](https://bugs.chromium.org/p/dawn/issues/detail?id=2146).

## Dawn updates

The uncaptured error callback set with `wgpuDeviceSetUncapturedErrorCallback()` is now called immediately when the error happens. This is what developers consistently expect and want for debugging. See [change dawn:173620](https://dawn-review.googlesource.com/c/dawn/+/173620).

The `wgpuSurfaceGetPreferredFormat()` method from the [webgpu.h API](https://github.com/webgpu-native/webgpu-headers) has been implemented. See [issue dawn:1362](https://bugs.chromium.org/p/dawn/issues/detail?id=1362).

This covers only some of the key highlights. Check out the exhaustive [list of commits](https://dawn.googlesource.com/dawn/+log/chromium/6261..chromium/6312?n=1000).

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
