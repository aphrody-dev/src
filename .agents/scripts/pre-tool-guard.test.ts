import { describe, expect, test } from "bun:test";
import { evaluate, guardMode } from "./pre-tool-guard.ts";

const claude = (name: string, input: { path?: string; command?: string }) =>
  evaluate({
    shape: "claude",
    name: name.toLowerCase(),
    path: input.path ?? "",
    command: input.command ?? "",
  });

describe("pre-tool-guard", () => {
  test("blocks printing the raw .env vault", () => {
    expect(claude("Bash", { command: "cat .env" })).toContain(".env");
    expect(
      claude("PowerShell", { command: "Get-Content C:\\src\\.env" }),
    ).toContain(".env");
    expect(
      claude("PowerShell", {
        command: "gc -Raw 'C:/src/.env' | Select-Object -First 3",
      }),
    ).toContain(".env");
    expect(claude("Read", { path: "C:\\src\\.env" })).toContain(".env");
  });

  test("allows .env.example and similar files", () => {
    expect(claude("Bash", { command: "cat .env.example" })).toBeNull();
    expect(claude("Read", { path: "C:\\src\\.env.example" })).toBeNull();
    expect(claude("Bash", { command: "cat .envrc" })).toBeNull();
  });

  test("blocks staging .env", () => {
    expect(claude("Bash", { command: "git add -f .env" })).toContain("staging");
    expect(
      evaluate({
        shape: "agy",
        name: "run_command",
        path: "",
        command: "git add .env",
      }),
    ).toContain("staging");
    expect(claude("Bash", { command: "git add .env.example" })).toBeNull();
  });

  test("blocks System32 mutation, allows reads", () => {
    expect(claude("Write", { path: "C:\\Windows\\System32\\x.dll" })).toContain(
      "System32",
    );
    expect(
      evaluate({
        shape: "agy",
        name: "write_file",
        path: "C:/Windows/System32/x",
        command: "",
      }),
    ).toContain("System32");
    expect(
      claude("PowerShell", {
        command: "Copy-Item a.exe C:\\Windows\\System32\\",
      }),
    ).toContain("System32");
    expect(claude("Bash", { command: "ls C:/Windows/System32" })).toBeNull();
    expect(
      claude("Read", { path: "C:\\Windows\\System32\\drivers\\etc\\hosts" }),
    ).toBeNull();
  });

  test("guard mode defaults to off and accepts warn/enforce", () => {
    expect(guardMode(undefined)).toBe("off");
    expect(guardMode("")).toBe("off");
    expect(guardMode("bogus")).toBe("off");
    expect(guardMode("WARN")).toBe("warn");
    expect(guardMode(" enforce ")).toBe("enforce");
  });

  test("allows ordinary work", () => {
    expect(claude("Bash", { command: "bun test packages/env-kit" })).toBeNull();
    expect(
      claude("Edit", { path: "C:\\src\\packages\\ai-os\\src\\cli.ts" }),
    ).toBeNull();
  });
});
