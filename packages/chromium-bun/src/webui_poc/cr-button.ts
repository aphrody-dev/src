import { Material3Tokens } from "./tokens.ts";

export class CrButton extends HTMLElement {
  static get observedAttributes() {
    return ["disabled", "action"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          user-select: none;
        }
        button {
          background-color: ${Material3Tokens.sysPrimary};
          color: ${Material3Tokens.sysOnPrimary};
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          cursor: inherit;
          transition: background-color 150ms ease;
        }
        button:hover {
          background-color: ${Material3Tokens.refPrimary40};
        }
        button[disabled] {
          opacity: 0.38;
          cursor: not-allowed;
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("cr-button")) {
  customElements.define("cr-button", CrButton);
}
