import { Material3Tokens } from "./tokens.ts";

export class CrIcon extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const iconName = this.getAttribute("icon") || "default";
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 24px;
          height: 24px;
          fill: ${Material3Tokens.sysOnSurface};
        }
        svg {
          width: 100%;
          height: 100%;
        }
      </style>
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="${Material3Tokens.sysOutline}" stroke-width="2" fill="none" />
      </svg>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("cr-icon")) {
  customElements.define("cr-icon", CrIcon);
}
