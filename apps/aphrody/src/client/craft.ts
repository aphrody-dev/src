// Boot of /craft/<id>: real WebGPU check (adapter, not only navigator.gpu), then a lazy iframe to the app build.
// window.__craft exposes the state for scripts/proof-craft.ts.
interface CraftState {
  gpu: boolean;
  adapter?: string;
  launched: boolean;
  error?: string;
}
const state: CraftState = { gpu: false, launched: false };
(window as unknown as { __craft: CraftState }).__craft = state;

const main = document.querySelector<HTMLElement>("main[data-app]");
if (main) {
  const launch = document.getElementById("launch") as HTMLButtonElement;
  const msg = document.getElementById("msg")!;
  const frame = document.getElementById("frame") as HTMLIFrameElement;
  const panel = document.getElementById("panel")!;

  const start = () => {
    state.launched = true;
    frame.src = main.dataset.src! + "index.html";
    frame.hidden = false;
    panel.hidden = true;
    frame.focus();
  };

  const gpu = (
    navigator as unknown as {
      gpu?: {
        requestAdapter(): Promise<{ info?: { vendor?: string; architecture?: string; description?: string } } | null>;
      };
    }
  ).gpu;
  if (!gpu) {
    state.error = "navigator.gpu is undefined";
    msg.textContent =
      "This browser has no WebGPU (navigator.gpu is undefined). Use a recent Chrome, Edge or Safari with a supported GPU, over HTTPS.";
  } else {
    try {
      const adapter = await gpu.requestAdapter();
      if (!adapter) {
        state.error = "requestAdapter() returned null";
        msg.textContent =
          "WebGPU is present but the browser found no GPU adapter (requestAdapter returned null). Check the GPU driver and chrome://gpu.";
      } else {
        state.gpu = true;
        const i = adapter.info;
        state.adapter = [i?.vendor, i?.architecture, i?.description].filter(Boolean).join(" ");
        msg.textContent = "";
        launch.disabled = false;
        launch.addEventListener("click", start);
        if (new URLSearchParams(location.search).has("autostart")) start();
      }
    } catch (e) {
      state.error = String(e);
      msg.textContent = `WebGPU failed to initialise: ${String(e)}`;
    }
  }
}

export {};
