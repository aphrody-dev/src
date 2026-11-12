import { Material3Tokens } from "./tokens.ts";
import "./cr-button.ts";
import "./cr-icon.ts";

export class CrToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          height: 64px;
          background: ${Material3Tokens.sysSurfaceVariant};
          padding: 0 16px;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .title {
          font-size: 20px;
          color: ${Material3Tokens.sysOnSurface};
          flex: 1;
        }
      </style>
      <cr-icon icon="menu"></cr-icon>
      <div class="title"><slot name="title">Chromium WebUI</slot></div>
      <cr-button>Action</cr-button>
    `;
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("cr-toolbar")
) {
  customElements.define("cr-toolbar", CrToolbar);
}
