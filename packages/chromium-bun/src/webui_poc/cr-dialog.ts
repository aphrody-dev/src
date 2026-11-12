import { Material3Tokens } from "./tokens.ts";
import "./cr-button.ts";

export class CrDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1000;
        }
        .container {
          background: ${Material3Tokens.sysSurface};
          color: ${Material3Tokens.sysOnSurface};
          border-radius: 28px;
          padding: 24px;
          max-width: 560px;
          margin: 100px auto;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .header {
          font-size: 24px;
          font-weight: 400;
          margin-bottom: 16px;
        }
        .footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 24px;
        }
      </style>
      <div class="container">
        <div class="header"><slot name="title">Dialog Title</slot></div>
        <div class="body"><slot name="body">Dialog content goes here.</slot></div>
        <div class="footer"><slot name="buttons"></slot></div>
      </div>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("cr-dialog")) {
  customElements.define("cr-dialog", CrDialog);
}
