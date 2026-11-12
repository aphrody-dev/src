/**
 * W3C Trusted Types API implementation for Bun
 * Spec: https://w3c.github.io/trusted-types/dist/spec/
 */

const SECRET_TOKEN = Symbol("TrustedTypeToken");

export class TrustedHTML {
  private readonly _value: string;

  constructor(token: any, value: string) {
    if (token !== SECRET_TOKEN) {
      throw new TypeError("Illegal constructor invocation for TrustedHTML");
    }
    this._value = String(value);
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}

export class TrustedScript {
  private readonly _value: string;

  constructor(token: any, value: string) {
    if (token !== SECRET_TOKEN) {
      throw new TypeError("Illegal constructor invocation for TrustedScript");
    }
    this._value = String(value);
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}

export class TrustedScriptURL {
  private readonly _value: string;

  constructor(token: any, value: string) {
    if (token !== SECRET_TOKEN) {
      throw new TypeError(
        "Illegal constructor invocation for TrustedScriptURL",
      );
    }
    this._value = String(value);
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}

export interface TrustedTypePolicyOptions {
  createHTML?: (input: string, ...args: any[]) => string | null | undefined;
  createScript?: (input: string, ...args: any[]) => string | null | undefined;
  createScriptURL?: (
    input: string,
    ...args: any[]
  ) => string | null | undefined;
}

export class TrustedTypePolicy {
  readonly name: string;
  private readonly _options: TrustedTypePolicyOptions;

  constructor(token: any, name: string, options: TrustedTypePolicyOptions) {
    if (token !== SECRET_TOKEN) {
      throw new TypeError(
        "Illegal constructor invocation for TrustedTypePolicy",
      );
    }
    this.name = name;
    this._options = options;
  }

  createHTML(input: string, ...args: any[]): TrustedHTML {
    if (!this._options.createHTML) {
      throw new TypeError(
        `Policy '${this.name}' does not implement createHTML`,
      );
    }
    const result = this._options.createHTML(String(input), ...args);
    if (typeof result !== "string") {
      throw new TypeError(
        `Policy '${this.name}' createHTML returned non-string`,
      );
    }
    return new TrustedHTML(SECRET_TOKEN, result);
  }

  createScript(input: string, ...args: any[]): TrustedScript {
    if (!this._options.createScript) {
      throw new TypeError(
        `Policy '${this.name}' does not implement createScript`,
      );
    }
    const result = this._options.createScript(String(input), ...args);
    if (typeof result !== "string") {
      throw new TypeError(
        `Policy '${this.name}' createScript returned non-string`,
      );
    }
    return new TrustedScript(SECRET_TOKEN, result);
  }

  createScriptURL(input: string, ...args: any[]): TrustedScriptURL {
    if (!this._options.createScriptURL) {
      throw new TypeError(
        `Policy '${this.name}' does not implement createScriptURL`,
      );
    }
    const result = this._options.createScriptURL(String(input), ...args);
    if (typeof result !== "string") {
      throw new TypeError(
        `Policy '${this.name}' createScriptURL returned non-string`,
      );
    }
    return new TrustedScriptURL(SECRET_TOKEN, result);
  }
}

export class TrustedTypePolicyFactory {
  private _policies = new Map<string, TrustedTypePolicy>();
  private _defaultPolicy: TrustedTypePolicy | null = null;

  readonly emptyHTML: TrustedHTML = new TrustedHTML(SECRET_TOKEN, "");
  readonly emptyScript: TrustedScript = new TrustedScript(SECRET_TOKEN, "");

  get defaultPolicy(): TrustedTypePolicy | null {
    return this._defaultPolicy;
  }

  createPolicy(
    name: string,
    policyOptions: TrustedTypePolicyOptions,
  ): TrustedTypePolicy {
    if (typeof name !== "string" || name.length === 0) {
      throw new TypeError("Policy name must be a non-empty string");
    }
    if (this._policies.has(name)) {
      throw new DOMException(
        `Policy with name '${name}' already exists`,
        "TypeError",
      );
    }

    const policy = new TrustedTypePolicy(SECRET_TOKEN, name, policyOptions);
    this._policies.set(name, policy);
    if (name === "default") {
      this._defaultPolicy = policy;
    }
    return policy;
  }

  isHTML(value: any): value is TrustedHTML {
    return value instanceof TrustedHTML;
  }

  isScript(value: any): value is TrustedScript {
    return value instanceof TrustedScript;
  }

  isScriptURL(value: any): value is TrustedScriptURL {
    return value instanceof TrustedScriptURL;
  }

  getAttributeType(
    tagName: string,
    attribute: string,
    _elementNs?: string,
    _attrNs?: string,
  ): string | null {
    const tag = tagName.toLowerCase();
    const attr = attribute.toLowerCase();

    if (
      (tag === "script" && attr === "src") ||
      (tag === "source" && attr === "src") ||
      (tag === "iframe" && attr === "src")
    ) {
      return "TrustedScriptURL";
    }

    if (attr.startsWith("on")) {
      return "TrustedScript";
    }

    if (attr === "srcdoc") {
      return "TrustedHTML";
    }

    return null;
  }

  getPropertyType(
    tagName: string,
    property: string,
    _elementNs?: string,
  ): string | null {
    const tag = tagName.toLowerCase();
    const prop = property.toLowerCase();

    if (prop === "innerhtml" || prop === "outerhtml") {
      return "TrustedHTML";
    }
    if (tag === "script" && (prop === "text" || prop === "innertext")) {
      return "TrustedScript";
    }
    if (tag === "script" && prop === "src") {
      return "TrustedScriptURL";
    }

    return null;
  }
}

export function installTrustedTypes(
  target: any = globalThis,
): TrustedTypePolicyFactory {
  if (!target.TrustedHTML) {
    Object.defineProperty(target, "TrustedHTML", {
      value: TrustedHTML,
      writable: true,
      configurable: true,
    });
  }
  if (!target.TrustedScript) {
    Object.defineProperty(target, "TrustedScript", {
      value: TrustedScript,
      writable: true,
      configurable: true,
    });
  }
  if (!target.TrustedScriptURL) {
    Object.defineProperty(target, "TrustedScriptURL", {
      value: TrustedScriptURL,
      writable: true,
      configurable: true,
    });
  }
  if (!target.TrustedTypePolicy) {
    Object.defineProperty(target, "TrustedTypePolicy", {
      value: TrustedTypePolicy,
      writable: true,
      configurable: true,
    });
  }
  if (!target.TrustedTypePolicyFactory) {
    Object.defineProperty(target, "TrustedTypePolicyFactory", {
      value: TrustedTypePolicyFactory,
      writable: true,
      configurable: true,
    });
  }

  if (!target.trustedTypes) {
    const factory = new TrustedTypePolicyFactory();
    Object.defineProperty(target, "trustedTypes", {
      value: factory,
      writable: true,
      configurable: true,
    });
    return factory;
  }

  return target.trustedTypes;
}
