---
source_url: https://developer.chrome.com/blog/new-in-webgpu-131
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:36+00:00
sha256: c00cf4467375813a379a6892b32d6f39930fd6ffddb09e29942972621847678b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
François Beaufort [GitHub](https://github.com/beaufortfrancois)

## Clip distances in WGSL

Clip distances allow you to restrict [primitives' clip volume](https://gpuweb.github.io/gpuweb/#clip-volume) with user-defined half-spaces in the output of vertex stage. Defining your own clipping planes gives greater control over what's visible in your WebGPU scenes. This technique is particularly useful for applications like CAD software, where precise control over visualization is crucial.

When the `"clip-distances"` feature is available in a GPUAdapter, request a GPUDevice with this feature to get clip distances support in WGSL, and explicitly enable this extension in your WGSL code with `enable clip_distances;`. Once enabled, you can use the `clip_distances` built-in array in your vertex shader. This array holds distances to a user-defined clip plane:

- A clip distance of 0 means the vertex lies on the plane.
- A positive distance means the vertex is inside the clip half-space (the side you want to keep).
- A negative distance means the vertex is outside the clip half-space (the side you want to discard).

See the following snippet, the [chromestatus entry](https://chromestatus.com/feature/5141929256550400), and [issue 358408571](https://issues.chromium.org/issues/358408571).

```javascript
const adapter = await navigator.gpu.requestAdapter();
if (!adapter.features.has("clip-distances")) {
  throw new Error("Clip distances support is not available");
}
// Explicitly request clip distances support.
const device = await adapter.requestDevice({
  requiredFeatures: ["clip-distances"],
});

const vertexShaderModule = device.createShaderModule({ code: `
  enable clip_distances;

  struct VertexOut {
    @builtin(clip_distances) my_clip_distances : array<f32, 1>,
    @builtin(position) my_position : vec4f,
  }
  @vertex fn main() -> VertexOut {
    var output : VertexOut;
    output.my_clip_distances[0] = 1;
    output.my_position = vec4f(0, 0, 0, 1);
    return output;
  }
`,
});

// Send the appropriate commands to the GPU...
```

## GPUCanvasContext getConfiguration()

Once GPUCanvasContext `configure()` has been called with a configuration dictionary, the GPUCanvasContext [`getConfiguration()`](https://gpuweb.github.io/gpuweb/#dom-gpucanvascontext-getconfiguration) method lets you check the canvas context configuration. It includes `device`, `format`, `usage`, `viewFormats`, `colorSpace`, `toneMapping`, and `alphaMode` members. This is useful for tasks like checking if the browser supports HDR canvas, as shown in the [Particles (HDR) sample](https://webgpu.github.io/webgpu-samples/?sample=particles). See the following snippet, the [chromestatus entry](https://chromestatus.com/feature/6195110870777856), and [issue 370109829](https://issues.chromium.org/issues/370109829).

```javascript
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const canvas = document.querySelector("canvas");
const context = canvas.getContext("webgpu");

// Configure the canvas for HDR.
context.configure({
  device,
  format: "rgba16float",
  toneMapping: { mode: "extended" },
});

const configuration = context.getConfiguration();
if (configuration.toneMapping.mode === "extended") {
  // The browser supports HDR canvas.
  // Warning! The user still needs a HDR display to enjoy HDR content.
}
```

## Point and line primitives must not have depth bias

As announced [previously](https://developer.chrome.com/blog/new-in-webgpu-128.md.txt#deprecate_setting_depth_bias_for_lines_and_points), the WebGPU spec now makes it a validation error to set `depthBias`, `depthBiasSlopeScale`, and `depthBiasClamp` to a non-zero value when the topology for a render pipeline is a line or point type. See [issue 352567424](https://issues.chromium.org/issues/352567424).

## Inclusive scan built-in functions for subgroups

As part of the [subgroups experimentation](https://developer.chrome.com/blog/new-in-webgpu-128.md.txt#experimenting_with_subgroups), the following subgroup built-in functions have been added in [issue 361330160](https://g-issues.chromium.org/issues/361330160):

- `subgroupInclusiveAdd(value)`: Returns the inclusive scan summation of all active invocations `value`s across the subgroup.
- `subgroupInclusiveMul(value)`: Returns the inclusive scan multiplication of all active invocations `value`s across the subgroup.

## Experimental support for multi-draw indirect

The multi-draw indirect GPU feature lets you issue multiple draw calls with a single GPU command. This is particularly useful in situations where a large number of objects need to be rendered, such as particle systems, instancing, and large scenes. The `drawIndirect()` and `drawIndexedIndirect()` GPURenderPassEncoder methods can only issue a single draw call at a time from a certain region of a GPU buffer.

Until this experimental feature is [standardized](https://github.com/gpuweb/gpuweb/pull/2315), enable the "Unsafe WebGPU Support" flag at `chrome://flags/#enable-unsafe-webgpu` to make it available in Chrome.

With the `"chromium-experimental-multi-draw-indirect"` non-standard GPU feature available in a GPUAdapter, request a GPUDevice with this feature. Then create a GPUBuffer with the `GPUBufferUsage.INDIRECT` usage to store the draw calls. You can use it later in the new `multiDrawIndirect()` and `multiDrawIndexedIndirect()` GPURenderPassEncoder methods to issue draw calls inside a render pass. See the following snippet and [issue 356461286](https://issues.chromium.org/issues/356461286).

```javascript
const adapter = await navigator.gpu.requestAdapter();
if (!adapter.features.has("chromium-experimental-multi-draw-indirect")) {
  throw new Error("Experimental multi-draw indirect support is not available");
}
// Explicitly request experimental multi-draw indirect support.
const device = await adapter.requestDevice({
  requiredFeatures: ["chromium-experimental-multi-draw-indirect"],
});

// Draw call have vertexCount, instanceCount, firstVertex, and firstInstance parameters.
const drawData = new Uint32Array([
  3, 1, 0, 0, // First draw call
  3, 1, 3, 0, // Second draw call
]);
// Create a buffer to store the draw calls.
const drawBuffer = device.createBuffer({
  size: drawData.byteLength,
  usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(drawBuffer, 0, drawData);

// Create a render pipeline, a vertex buffer, and a render pass encoder...

// Inside a render pass, issue the draw calls.
myPassEncoder.setPipeline(myPipeline);
myPassEncoder.setVertexBuffer(0, myVertexBuffer);
myPassEncoder.multiDrawIndirect(drawBuffer, /*offset=*/ 0, /*maxDrawCount=*/ 2);
myPassEncoder.end();
```

## Shader module compilation option strict math

A boolean `strictMath` developer option has been added to GPUShaderModuleDescriptor to let you enable or disable strict math during shader module compilation. It is available behind the "WebGPU Developer Features" flag at `chrome://flags/#enable-webgpu-developer-features`, which means it is a feature intended only for use during development. See [issue 42241455](https://issues.chromium.org/issues/42241455).

This option is currently supported on Metal and Direct3D. When strict math is disabled, the compiler may optimize your shaders by:

- Ignoring the possibility of NaN and Infinity values.
- Treating -0 as +0.
- Replacing division with faster multiplication by the reciprocal.
- Rearranging operations based on associative and distributive properties.

```javascript
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const code = `
  // Examines the bit pattern of the floating-point number to
  // determine if it represents a NaN according to the IEEE 754 standard.
  fn isNan(x : f32) -> bool {
    bool ones_exp = (bitcast<u32>(x) & 0x7f8) == 0x7f8;
    bool non_zero_sig = (bitcast<u32>(x) & 0x7ffff) != 0;
    return ones_exp && non_zero_sig;
  }
  // ...
`;

// Enable strict math during shader compilation.
const shaderModule = device.createShaderModule({ code, strictMath: true });
```

## Remove GPUAdapter requestAdapterInfo()

The GPUAdapter `requestAdapterInfo()` asynchronous method is redundant as you can already get GPUAdapterInfo synchronously using the GPUAdapter `info` attribute. Hence, the non-standard GPUAdapter `requestAdapterInfo()` method is now removed. See the [intent to remove](https://groups.google.com/a/chromium.org/g/blink-dev/c/HxOgGf4NzQ4).

## Dawn updates

The `tint_benchmark` executable measures the cost of translating shaders from WGSL to each backend language. Check out the new [documentation](https://dawn.googlesource.com/dawn/+/main/docs/tint/benchmark.md) to learn more about it.

This covers only some of the key highlights. Check out the exhaustive [list of commits](https://dawn.googlesource.com/dawn/+log/chromium/6723..chromium/6778?n=1000).

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
