---
source_url: https://developer.chrome.com/docs/web-platform/webgpu/colab-headless
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: 4ff433f18371b15088f47954efa903b13f5706459d60f0ee9ff237e429789def
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Jason Mayes [X](https://twitter.com/jason_mayes) [GitHub](https://github.com/jasonmayes) [LinkedIn](https://www.linkedin.com/in/webai) François Beaufort [GitHub](https://github.com/beaufortfrancois)

> [!TIP]
> **Tip** : If you aren't ready to create a Colab, read [Supercharge Web AI model testing:
> WebGPU, WebGL and Chrome Headless](https://developer.chrome.com/blog/supercharge-web-ai-testing) to follow along as we use Headless Chrome and Puppeteer to test high-GPU workloads in a replicable environment.

Setting up a consistent testing environment with GPUs can be harder than
expected. Here are the steps to test client-side, browser-based AI models in
true browser environments, while also being scalable, automatable, and within a
known standardized hardware setup.

In this instance, the browser is a real Chrome browser with hardware support,
as opposed to software emulation.

Whether you're a Web AI, web gaming, or graphics developer, or you find yourself
interested in Web AI model testing, this guide is for you.

## Step 1: Create a new Google Colab notebook

1. Go to [colab.new](https://colab.new/) to create a new Colab notebook. It should look similar to figure 1. 2. Follow the prompt to sign into your Google Account. **Figure 1**: A new Colab notebook.

## Step 2: Connect to a T4 GPU-enabled server

1. Click **Connect** near the top right of the notebook.
2. Select **Change runtime type** : **Figure 2**. Change the runtime in the Colab interface.
3. In the modal window, select **T4 GPU** as your hardware accelerator. When you connect, Colab will use a Linux instance with an NVIDIA T4 GPU attached. More powerful GPU options are available (we have confirmed V100 GPU also works), however those options must be purchased. **Figure 3** : Under Hardware accelerator, select **T4 GPU**.
4. Click **Save**.
5. Click the **Connect** button to connect to your runtime. After some time, the button will present a green checkmark, along with RAM and disk usage graphs. This indicates that a server has successfully been created with your required hardware.

Nice work, you just created a server with a GPU attached.

## Step 3: Install correct drivers and dependencies

1. Copy and paste the following two lines of code into the first code cell of
   the notebook. In a Colab environment, command line execution is prepended with
   an exclamation mark.

   ```console
   !git clone https://github.com/jasonmayes/headless-chrome-nvidia-t4-gpu-support.git
   !cd headless-chrome-nvidia-t4-gpu-support && chmod +x scriptyMcScriptFace.sh && ./scriptyMcScriptFace.sh
   ```
   - You can [inspect the script on GitHub](https://github.com/jasonmayes/headless-chrome-nvidia-t4-gpu-support/blob/main/scriptyMcScriptFace.sh) to see the raw command line code this script executes.

   ```console
   # Update, install correct drivers, and remove the old ones.
   apt-get install -y vulkan-tools libnvidia-gl-525

   # Verify NVIDIA drivers can see the T4 GPU and that vulkan is working correctly.
   nvidia-smi
   vulkaninfo --summary

   # Now install latest version of Node.js
   npm install -g n
   n lts
   node --version
   npm --version

   # Next install Chrome stable
   curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/googlechrom-keyring.gpg
   echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrom-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
   sudo apt update
   sudo apt install -y google-chrome-stable

   # Start dbus to avoid warnings by Chrome later.
   export DBUS_SESSION_BUS_ADDRESS="unix:path=/var/run/dbus/system_bus_socket"
   /etc/init.d/dbus start
   ```

2. Click next to the cell to
   execute the code.

   **Figure 4**.

3. Once the code finishes executing, verify `nvidia-smi` printed out something
   similar to the following screenshot to confirm you do indeed have a GPU
   attached and it's recognized on your server. You may need to scroll to earlier
   in the logs to view this output.

   **Figure 5**: Look for the output which begins with "NVIDIA-SMI".

## Step 4: Use and automate headless Chrome

1. Click **Code** button to add a new code cell.
2. You can then write your custom code to call a Node.js project with your preferred parameters (or just call `google-chrome-stable` directly in the command line). We have examples for both following.

### Part A: Use Headless Chrome directly in the command line

```console
# Directly call Chrome to dump a PDF of WebGPU testing page
# and store it in /content/gpu.pdf
!google-chrome-stable \
--no-sandbox \
--headless=new \
--use-angle=vulkan \
--enable-features=Vulkan \
--disable-vulkan-surface \
--enable-unsafe-webgpu \
--print-to-pdf=/content/gpu.pdf https://webgpureport.org
```

In the example, we stored the resulting PDF capture in `/content/gpu.pdf`. To
view that file, expand the **content** .
Then click to download the PDF
file to your local machine.
**Figure 6**: Watch the steps to download the PDF in this screen capture of the Colab interface.

### Part B: Command Chrome with Puppeteer

We've provided a minimalist example [using Puppeteer to control Headless Chrome](https://github.com/jasonmayes/headless-chrome-nvidia-t4-gpu-support/blob/main/examples/puppeteer/jPuppet.js)
that can be run as follows:

```console
# Call example node.js project to perform any task you want by passing
# a URL as a parameter
!node headless-chrome-nvidia-t4-gpu-support/examples/puppeteer/jPuppet.js chrome://gpu
```

In the jPuppet example, we can call a Node.js script to create a
screenshot. But how does this work? Check out this walk through of the Node.js
code in
[jPuppet.js](https://github.com/jasonmayes/headless-chrome-nvidia-t4-gpu-support/blob/main/examples/puppeteer/jPuppet.js).

#### jPuppet.js Node code breakdown

First, import [Puppeteer](https://pptr.dev/). This lets
you remotely control Chrome with Node.js:

```javascript
import puppeteer from "puppeteer";
```

Next, check what command line arguments were passed to the Node application.
Ensure the third argument is set---which represents a URL to navigate to. You
need to inspect the third argument here because the first two arguments call Node
itself and the script we are running. The 3rd element actually contains the 1st
parameter passed to the Node program:

```javascript
const url = process.argv[2];
if (!url) {
  throw "Please provide a URL as the first argument";
}
```

Now define an asynchronous function named `runWebpage()`. This creates a browser
object that's configured with the command line arguments to run the Chrome
binary in the manner we need to get WebGL and WebGPU working as described in
[Enable WebGPU and WebGL support](https://developer.chrome.com/blog/supercharge-web-ai-testing.md.txt#enable-webgpu).

```javascript
async function runWebpage() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args:  [
        '--no-sandbox',
        '--headless=new',
        '--use-angle=vulkan',
        '--enable-features=Vulkan',
        '--disable-vulkan-surface',
        '--enable-unsafe-webgpu'
      ]
  });
```

Create a new browser page object which you can later use to visit any URL:

```javascript
const page = await browser.newPage();
```

Then, add an event listener to listen for `console.log` events when the web page
executes JavaScript. This lets you log messages on the Node command line
and also inspect the console text for a special phrase (in this case,
`captureAndEnd`) that triggers a screenshot and then ends the browser process in
Node. This is useful for web pages that need to do some amount of work _before_
a screenshot can be taken, and has a non-deterministic amount of time of
execution.

```javascript
page.on("console", async function (msg) {
  console.log(msg.text());
  if (msg.text() === "captureAndEnd") {
    await page.screenshot({ path: "/content/screenshotEnd.png" });
    await browser.close();
  }
});
```

Finally, command the page to visit the URL specified and grab an
initial screenshot when the page has loaded.

If you choose to grab a screenshot of `chrome://gpu`, you can close the browser
session immediately instead of waiting for any console output, as this page is
not controlled by your own code.

```javascript
  await page.goto(url,  { waitUntil: 'networkidle2' });
  await page.screenshot({path: '/content/screenshot.png'});
  if (url === 'chrome://gpu') {
    await browser.close();
  }
}
runWebpage();
```

#### Modify package.json

You may have noticed that we used an import statement at the start of the
`jPuppet.js` file. Your `package.json` must set the type values as `module`, or
you'll receive an error that the module is invalid.

```json
{
  "dependencies": {
    "puppeteer": "*"
  },
  "name": "content",
  "version": "1.0.0",
  "main": "jPuppet.js",
  "devDependencies": {},
  "keywords": [],
  "type": "module",
  "description": "Node.js Puppeteer application to interface with headless Chrome with GPU support to capture screenshots and get console output from target webpage"
}
```

That's all there is to it. Using Puppeteer makes it easier to interface
with Chrome programmatically.
We have a Python example of this script saved in the [ipynb format](https://colab.research.google.com/gist/beaufortfrancois/bd9752460d59a7d8ed54e444665c8ab9/headless-chrome-webgpu.ipynb) if you prefer to use that ecosystem.

## Success

We can now verify that the
[TensorFlow.js Fashion MNIST classifier](https://tensorflowjs-fashion-mnist-classifier.glitch.me/)
can correctly recognize a pair of trousers in an image, with client-side
processing in the browser using the GPU.

You can use this for any client-side GPU-based workloads, from machine learning
models to graphics and games testing.
**Figure 7**: A successful capture of a GPU accelerated TensorFlow.js model capable of recognizing clothing client side in the browser in real time

## Resources

[Add a star on the GitHub repo](https://github.com/jasonmayes/headless-chrome-nvidia-t4-gpu-support)
to receive future updates.
