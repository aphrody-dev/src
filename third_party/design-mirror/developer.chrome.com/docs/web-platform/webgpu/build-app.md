---
source_url: https://developer.chrome.com/docs/web-platform/webgpu/build-app
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:33+00:00
sha256: e857359f73ddd43a8750673a8ffb58914ddf585951ccfd3642bfbb3a2c06685b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
François Beaufort [GitHub](https://github.com/beaufortfrancois)

Published: Jul 20, 2023, Last updated: Oct 22, 2025

For web developers, WebGPU is a web graphics API that provides unified and fast
access to GPUs. WebGPU exposes modern hardware capabilities and allows rendering
and computation operations on a GPU, similar to Direct3D 12, Metal, and Vulkan.

While true, that story is incomplete. WebGPU is the result of a collaborative
effort, including major companies, such as Apple, Google, Intel, Mozilla, and
Microsoft. Among them, some [realized](https://kvark.github.io/web/gpu/native/2020/05/03/point-of-webgpu-native.html)
that WebGPU could be more than a Javascript API, but a cross-platform graphics
API for developers across ecosystems, other than the web.

To fulfill the primary use case, a JavaScript API was
[introduced](https://developer.chrome.com/blog/webgpu-release.md.txt) in Chrome 113. However, another significant
project has been developed alongside it: the
[webgpu.h](https://github.com/webgpu-native/webgpu-headers/blob/main/webgpu.h) C
API. This C header file lists all the available procedures and data structures
of WebGPU. It serves as a platform-agnostic hardware abstraction layer, allowing
you to build platform-specific applications by providing a consistent interface
across different platforms.

In this document, you'll learn how to write a small C++ app using WebGPU that runs both on the web and specific platforms. Spoiler alert, you'll get the same red triangle that appears in a browser window and a desktop window with minimal adjustments to your codebase.
 The same triangle powered by WebGPU in a browser window and a desktop window.

## How does it work?

To see the completed application check out the [WebGPU cross-platform app](https://github.com/beaufortfrancois/webgpu-cross-platform-app/) repository.

The app is a minimalistic C++ example that shows how to use [WebGPU](https://gpuweb.github.io/gpuweb/) to build desktop and web apps from a single codebase. Under the hood, it uses WebGPU's [webgpu.h](https://github.com/webgpu-native/webgpu-headers/blob/main/webgpu.h) as a platform-agnostic hardware abstraction layer through a C++ wrapper called [webgpu_cpp.h](https://source.chromium.org/chromium/chromium/src/+/main:third_party/dawn/include/webgpu/webgpu_cpp.h).

On the web, the app is built against [emdawnwebgpu](https://dawn.googlesource.com/dawn/+/refs/heads/main/src/emdawnwebgpu/) (Emscripten Dawn WebGPU), which has bindings implementing webgpu.h on top of the JavaScript API. On specific platforms such as macOS or Windows, this project can be built against [Dawn](https://dawn.googlesource.com/dawn/), Chromium's cross-platform WebGPU implementation. It's worth mentioning [wgpu-native](https://github.com/gfx-rs/wgpu-native), a Rust implementation of webgpu.h, also exists but is not used in this document.

## Get started

To start, you need a C++ compiler and [CMake](https://cmake.org/) to handle cross-platform builds in a standard way. Inside a dedicated folder, create a
`main.cpp` source file and a `CMakeLists.txt` build file.

The `main.cpp` file should contain an empty `main()` function for now.

```c++
int main() {}
```

The `CMakeLists.txt` file contains basic information about the project. The last line specifies the executable name is "app" and its source code is `main.cpp`.

```cmake
cmake_minimum_required(VERSION 3.22) # CMake version check
project(app)                         # Create project "app"
set(CMAKE_CXX_STANDARD 20)           # Enable C++20 standard

add_executable(app "main.cpp")
```

Run `cmake -B build` to create build files in a "build/" sub folder and `cmake --build build` to actually build the app and generate the executable file.

```bash
# Build the app with CMake.
$ cmake -B build && cmake --build build

# Run the app.
$ ./build/app
```

The app runs but there's no output yet, as you need a way to draw things on the screen.

### Get Dawn

To draw your triangle, you can take advantage of [Dawn](https://dawn.googlesource.com/dawn/), Chromium's cross-platform WebGPU implementation. This includes [GLFW](https://www.glfw.org/) C++ library for drawing to the screen. One way to download Dawn is to add it as a [git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) to your repository. The following commands fetch it in a "dawn/" sub folder.

```bash
$ git init
$ git submodule add https://github.com/google/dawn.git
```

Then, append to the `CMakeLists.txt` file as follows:

- The CMake `DAWN_FETCH_DEPENDENCIES` option fetches all Dawn dependencies.
- The `dawn/` sub folder is included in the target.
- Your app will depend on `webgpu_dawn`, `webgpu_glfw`, and `glfw` targets so that you can use them in the `main.cpp` file later.

```cmake
...
set(DAWN_FETCH_DEPENDENCIES ON)
add_subdirectory("dawn" EXCLUDE_FROM_ALL)

target_link_libraries(app PRIVATE webgpu_dawn webgpu_glfw glfw)
```

### Open a window

Now that Dawn is available, use GLFW to draw things on the screen. This library included in `webgpu_glfw` for convenience, allows you to write code that is platform-agnostic for window management.

To open a window named "WebGPU window" with a resolution of 512x512, update the `main.cpp` file as below. Note that `glfwWindowHint()` is used here to request no particular graphics API initialization.

```c++
#include <GLFW/glfw3.h>

const uint32_t kWidth = 512;
const uint32_t kHeight = 512;

void Start() {
  if (!glfwInit()) {
    return;
  }

  glfwWindowHint(GLFW_CLIENT_API, GLFW_NO_API);
  GLFWwindow* window =
      glfwCreateWindow(kWidth, kHeight, "WebGPU window", nullptr, nullptr);

  while (!glfwWindowShouldClose(window)) {
    glfwPollEvents();
    // TODO: Render a triangle using WebGPU.
  }
}

int main() {
  Start();
}
```

Rebuilding the app and running it as before now results in an empty window. You're making progress!
 An empty window.

### Get GPU device

In JavaScript, [`navigator.gpu`](https://developer.mozilla.org/docs/Web/API/Navigator/gpu) is your entrypoint for accessing the GPU. In C++, you need to manually create a `wgpu::Instance` variable that's used for the same purpose. For convenience, declare `instance` at the top of the `main.cpp` file and call `wgpu::CreateInstance()` inside `Init()`.

```c++
#include <webgpu/webgpu_cpp.h>
...

wgpu::Instance instance;
...

void Init() {
  static const auto kTimedWaitAny = wgpu::InstanceFeatureName::TimedWaitAny;
  wgpu::InstanceDescriptor instanceDesc{.requiredFeatureCount = 1,
                                        .requiredFeatures = &kTimedWaitAny};
  instance = wgpu::CreateInstance(&instanceDesc);
}

int main() {
  Init();
  Start();
}
```

Declare two variables `wgpu::Adapter` and `wgpu::Device` at the top of the `main.cpp` file. Update the `Init()` function to call `instance.RequestAdapter()` and assign its result callback to `adapter` then call `adapter.RequestDevice()` and assign its result callback to `device`.

```c++
#include <iostream>

#include <dawn/webgpu_cpp_print.h>
...

wgpu::Adapter adapter;
wgpu::Device device;

void Init() {
  ...

  wgpu::Future f1 = instance.RequestAdapter(
      nullptr, wgpu::CallbackMode::WaitAnyOnly,
      [](wgpu::RequestAdapterStatus status, wgpu::Adapter a,
         wgpu::StringView message) {
        if (status != wgpu::RequestAdapterStatus::Success) {
          std::cout << "RequestAdapter: " << message << "\n";
          exit(0);
        }
        adapter = std::move(a);
      });
  instance.WaitAny(f1, UINT64_MAX);

  wgpu::DeviceDescriptor desc{};
  desc.SetUncapturedErrorCallback([](const wgpu::Device&,
                                     wgpu::ErrorType errorType,
                                     wgpu::StringView message) {
    std::cout << "Error: " << errorType << " - message: " << message << "\n";
  });

  wgpu::Future f2 = adapter.RequestDevice(
      &desc, wgpu::CallbackMode::WaitAnyOnly,
      [](wgpu::RequestDeviceStatus status, wgpu::Device d,
         wgpu::StringView message) {
        if (status != wgpu::RequestDeviceStatus::Success) {
          std::cout << "RequestDevice: " << message << "\n";
          exit(0);
        }
        device = std::move(d);
      });
  instance.WaitAny(f2, UINT64_MAX);
}
```

### Draw a triangle

The [swap chain](https://en.wikipedia.org/wiki/Swap_chain) is not exposed in the JavaScript API as the browser takes care of it. In C++, you need to create it manually. Once again, for convenience, declare a `wgpu::Surface` variable at the top of the `main.cpp` file. Just after creating the GLFW window in `Start()`, call the handy `wgpu::glfw::CreateSurfaceForWindow()` function to create a `wgpu::Surface` (similar to an HTML canvas) and configure it by calling the new helper `ConfigureSurface()` function in `InitGraphics()`. You also need to call `surface.Present()` to present the next texture in the while loop. This has no visible effect as there is no rendering happening yet.

```c++
#include <webgpu/webgpu_glfw.h>
...

wgpu::Surface surface;
wgpu::TextureFormat format;

void ConfigureSurface() {
  wgpu::SurfaceCapabilities capabilities;
  surface.GetCapabilities(adapter, &capabilities);
  format = capabilities.formats[0];

  wgpu::SurfaceConfiguration config{.device = device,
                                    .format = format,
                                    .width = kWidth,
                                    .height = kHeight};
  surface.Configure(&config);
}

void InitGraphics() {
  ConfigureSurface();
}

void Render() {
  // TODO: Render a triangle using WebGPU.
}

void Start() {
  ...
  surface = wgpu::glfw::CreateSurfaceForWindow(instance, window);

  InitGraphics();

  while (!glfwWindowShouldClose(window)) {
    glfwPollEvents();
    Render();
    surface.Present();
    instance.ProcessEvents();
  }
}
```

Now is a good time to create the render pipeline with the code below. For easier access, declare a `wgpu::RenderPipeline` variable at the top of the `main.cpp` file and call the helper function `CreateRenderPipeline()` in `InitGraphics()`.

```c++
wgpu::RenderPipeline pipeline;
...

const char shaderCode[] = R"(
    @vertex fn vertexMain(@builtin(vertex_index) i : u32) ->
      @builtin(position) vec4f {
        const pos = array(vec2f(0, 1), vec2f(-1, -1), vec2f(1, -1));
        return vec4f(pos[i], 0, 1);
    }
    @fragment fn fragmentMain() -> @location(0) vec4f {
        return vec4f(1, 0, 0, 1);
    }
)";

void CreateRenderPipeline() {
  wgpu::ShaderSourceWGSL wgsl{{.code = shaderCode}};

  wgpu::ShaderModuleDescriptor shaderModuleDescriptor{.nextInChain = &wgsl};
  wgpu::ShaderModule shaderModule =
      device.CreateShaderModule(&shaderModuleDescriptor);

  wgpu::ColorTargetState colorTargetState{.format = format};

  wgpu::FragmentState fragmentState{
      .module = shaderModule, .targetCount = 1, .targets = &colorTargetState};

  wgpu::RenderPipelineDescriptor descriptor{.vertex = {.module = shaderModule},
                                            .fragment = &fragmentState};
  pipeline = device.CreateRenderPipeline(&descriptor);
}

void InitGraphics() {
  ...
  CreateRenderPipeline();
}
```

Finally, send rendering commands to the GPU in the `Render()` function called each frame.

```c++
void Render() {
  wgpu::SurfaceTexture surfaceTexture;
  surface.GetCurrentTexture(&surfaceTexture);

  wgpu::RenderPassColorAttachment attachment{
      .view = surfaceTexture.texture.CreateView(),
      .loadOp = wgpu::LoadOp::Clear,
      .storeOp = wgpu::StoreOp::Store};

  wgpu::RenderPassDescriptor renderpass{.colorAttachmentCount = 1,
                                        .colorAttachments = &attachment};

  wgpu::CommandEncoder encoder = device.CreateCommandEncoder();
  wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&renderpass);
  pass.SetPipeline(pipeline);
  pass.Draw(3);
  pass.End();
  wgpu::CommandBuffer commands = encoder.Finish();
  device.GetQueue().Submit(1, &commands);
}
```

Rebuilding the app with CMake and running it now results in the long-awaited red triangle in a window! Take a break---you deserve it.
 A red triangle in a desktop window.

## Compile to WebAssembly

Let's have a look now at the minimal changes required to adjust your existing codebase to draw this red triangle in a browser window. Again, the app is built against [emdawnwebgpu](https://dawn.googlesource.com/dawn/+/refs/heads/main/src/emdawnwebgpu/) (Emscripten Dawn WebGPU), which has bindings implementing webgpu.h on top of the JavaScript API. It uses [Emscripten](https://emscripten.org/), a tool for compiling C/C++ programs to WebAssembly.

### Update CMake settings

Once Emscripten is installed, update the `CMakeLists.txt` build file as follows.
The highlighted code is the only thing you need to change.

- `set_target_properties` is used to automatically add the "html" file extension to the target file. In other words, you'll generate an "app.html" file.
- The `emdawnwebgpu_cpp` target link library enables WebGPU support in Emscripten. Without it, your `main.cpp` file can't access the `webgpu/webgpu_cpp.h` file.
- The `ASYNCIFY=1` app link option lets synchronous C++ code interact with asynchronous JavaScript.
- The `USE_GLFW=3` app link option tells Emscripten to use its built-in JavaScript implementation of the GLFW 3 API.

```cmake
cmake_minimum_required(VERSION 3.22) # CMake version check
project(app)                         # Create project "app"
set(CMAKE_CXX_STANDARD 20)           # Enable C++20 standard

add_executable(app "main.cpp")

set(DAWN_FETCH_DEPENDENCIES ON)
add_subdirectory("dawn" EXCLUDE_FROM_ALL)

if(EMSCRIPTEN)
set_target_properties(app PROPERTIES SUFFIX ".html")
target_link_libraries(app PRIVATE emdawnwebgpu_cpp webgpu_glfw)
target_link_options(app PRIVATE "-sASYNCIFY=1" "-sUSE_GLFW=3")
else()
  target_link_libraries(app PRIVATE webgpu_dawn webgpu_glfw glfw)
endif()
```

### Update the code

Instead of using a while loop, call [`emscripten_set_main_loop(Render)`](https://emscripten.org/docs/api_reference/emscripten.h.html#c.emscripten_set_main_loop) to make sure the `Render()` function is called at a proper smooth rate that lines up properly with the browser and monitor.

```c++
#include <iostream>

#include <GLFW/glfw3.h>
#if defined(__EMSCRIPTEN__)
#include \<emscripten/emscripten.h\>
#endif
#include <dawn/webgpu_cpp_print.h>
#include <webgpu/webgpu_cpp.h>
#include <webgpu/webgpu_glfw.h>
```

```c++
void Start() {
  ...
#if defined(__EMSCRIPTEN__)
emscripten_set_main_loop(Render, 0, false);
#else
  while (!glfwWindowShouldClose(window)) {
    glfwPollEvents();
    Render();
    surface.Present();
    instance.ProcessEvents();
  }
#endif
}
```

### Build the app with Emscripten

The only change needed to build the app with Emscripten is to prepend the `cmake` commands with the [magical](https://blog.ngzhian.com/emscripten-cmake.html) `emcmake` shell script. This time, generate the app in a `build-web` sub folder and start a HTTP server. Finally, open your browser and visit `build-web/app.html`.

```bash
# Build the app with Emscripten.
$ emcmake cmake -B build-web && cmake --build build-web

# Start a HTTP server.
$ npx http-server
```
 A red triangle in a browser window.

## What's next

Looking ahead, you can expect initial support for Dawn on Android and iOS.

In the meantime, file [WebGPU issues for Emscripten](https://issues.chromium.org/issues?q=componentid:1570785) and [Dawn issues](https://bugs.chromium.org/p/dawn/issues/list) with suggestions and questions.

## Resources

Feel free to explore the [source code](https://github.com/beaufortfrancois/webgpu-cross-platform-app) of this app.

If you want to dive more in creating native 3D applications in C++ from scratch with WebGPU, check out [Learn WebGPU for C++ documentation](https://eliemichel.github.io/LearnWebGPU/index.html) and [Dawn Native WebGPU Examples](https://dj2.github.io/Dusk/).

If you're interested in Rust, you can also explore the [wgpu](https://wgpu.rs) graphics library based on WebGPU. Take a look at their [hello-triangle](https://wgpu.rs/examples/?backend=webgpu&example=hello_triangle) demo.

## Acknowledgments

This article was reviewed by [Corentin Wallez](https://developer.chrome.com/authors/cwallez), [Kai Ninomiya](https://github.com/kainino0x), and [Rachel Andrew](https://developer.chrome.com/authors/rachelandrew).
