---
source_url: https://developer.chrome.com/blog/next-for-webgpu
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:04+00:00
sha256: fef9c11716e109a746b98cdedcda851c85fedc6bfca42032123370fe0a7727f2
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

François Beaufort [GitHub](https://github.com/beaufortfrancois) Corentin Wallez [X](https://twitter.com/DaKangz) [GitHub](https://github.com/Kangz) [Mastodon](https://mastodon.gamedev.place/@DaKangz)

Published: November 21, 2024

The [WebGPU specification](https://gpuweb.github.io/gpuweb/) is always evolving, with major companies like Google, Mozilla, Apple, Intel, and Microsoft meeting weekly to discuss its development. The most recent GPU for the Web working group meeting offered a glimpse into the main objectives and features planned for the next iteration of WebGPU. This blog post explores some of the key takeaways from the meeting.

## Reaching candidate recommendation status

A major focus of the meeting was to discuss the progress of [Milestone 0](https://github.com/gpuweb/gpuweb/milestone/2) and to finalize the issues that need to be addressed before it can reach candidate recommendation status for the W3C. This is the next step in the standardization process, and it comes with stronger guarantees of stability and intellectual property protection.

There was general agreement among the meeting participants that there are no blockers and that these issues can be resolved in a timely manner, paving the way for the W3C candidate recommendation of WebGPU.

## Prioritizing new features

Participants at the meeting also prioritized new features. They started with a list of feature requests compiled from feedback from developers, implementers, and stakeholders.

After discussion, the following key WebGPU features for AI were identified:

- **Subgroups and subgroup matrices** : Let application use fast local communication between GPU threads, and take advantage of fixed-size matrix multiplication hardware next to shader cores. See [the subgroups proposal](https://github.com/gpuweb/gpuweb/blob/main/proposals/subgroups.md).

- **Texel buffers** : Provide a more efficient way to store and access small data types, like 16-bit or 8-bit values, in a portable way. This is important for some ML image processing algorithms. See [the texel buffer slides](https://docs.google.com/presentation/d/1XR6TbSuJpZ04UA6Q7cwllJNabSagpUE7lZC3dJAkx-0/edit#slide=id.g30fa23859c2_0_0).

- **UMA buffer mapping** : Improve data upload performance by reducing or eliminating copies and synchronization overhead. See [the spec issue 2388](https://github.com/gpuweb/gpuweb/issues/2388).

Also under consideration and prioritization are the following WebGPU features to unlock new kinds of rendering algorithms:

- **Bindless** : This highly anticipated [feature proposal](https://hackmd.io/PCwnjLyVSqmLfTRSqH0viA?view) is a prerequisite for most leading-edge rendering algorithms because they need scene-wide information. Bindless lets shaders use an unlimited number of resources, including textures, when compared to the relatively strict limits currently.

- **Multi-draw indirect** : Lets previous computations on the GPU created multiple draws instead of just one with `drawIndirect` previously. It is an important capability for GPU-driven rendering like for GPU culling of objects. See [the pull request 2315](https://github.com/gpuweb/gpuweb/pull/2315).

- **64-bit atomics** : Either in buffers or textures, it is necessary for doing "software rasterization" on the GPU, by bundling the depth-test and writing of a 32-bit payload in a single `atomicMax` operation. See [the issue 4329](https://github.com/gpuweb/gpuweb/issues/4329).

To enhance WebGPU's capabilities and integration with the broader web platform, the following WebGPU features have been discussed:

- **Compatibility mode** : This mode aims to enable WebGPU to run on a wider range of devices, including those that only support OpenGL ES 3.1. See [the compatibility mode proposal](https://github.com/gpuweb/gpuweb/blob/main/proposals/compatibility-mode.md).

- **WebXR** : Allows the existing WebXR Layers module to interface with WebGPU by providing WebGPU swapchains for each layer type. See [the WebGPU/WebXR Integration slides](https://docs.google.com/presentation/d/1XEzrBrxJ_p9XTEUojibG2Ct2Ft1f7ul4ggzulCu-jpg/edit#slide=id.g30fae2e5bd8_0_0).

- **Canvas2D** : Creates better interoperability between Canvas 2D and WebGPU, addressing both performance and ergonomics problems. This [WebGPU Transfer proposal](https://github.com/fserb/canvas2D/blob/master/spec/webgpu.md) would allow having access to text and path drawing in WebGPU, and being able to apply WebGPU rendering to Canvas 2D.

The meeting also featured presentations and discussions on efforts to improve WGSL tooling and libraries. One notable initiative is the development of [WESL](https://docs.google.com/presentation/d/1rBSSPT6X67IJQogS_GNd6niQEt65dytN49Punv3p8RQ/edit#slide=id.p) (WGSL Extended Shading Language) which aims to provide a community-driven set of extensions to WGSL.

You can find more information in the [raw meeting notes](https://docs.google.com/document/d/1FlVeiqRzx5t-9z03Ocx7_gw-lPpysUaw_83xofJyxQQ/edit?tab=t.0).

## Thoughts

This meeting highlighted the importance of collaboration between the WebGPU working group, developers, and the broader graphics community in shaping the future of WebGPU. The working group is actively seeking feedback on the proposed features and is committed to working with developers to ensure that WebGPU meets their needs.

The next evolutions of WebGPU promise to be a significant step forward, unlocking new possibilities for web graphics and empowering developers to create even more immersive and engaging web experiences for AI.
