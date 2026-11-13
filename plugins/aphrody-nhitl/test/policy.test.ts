import { expect, test } from "bun:test";
import { decide, normPath, segments } from "../src/policy.ts";

const cwd = "C:/src";
const bash = (command: string, at = cwd) => decide("Bash", { command }, at);
const denied = (command: string, at = cwd) => expect(bash(command, at)).not.toBeNull();
const allowed = (command: string, at = cwd) => expect(bash(command, at)).toBeNull();

test("tokenizer", () => {
  expect(segments(`a "b c" && d 'e;f' | g $(h i)`)).toEqual([["a", "b c"], ["d", "e;f"], ["g"], ["h", "i"]]);
});

test("paths", () => {
  expect(normPath("/c/src/x/../y", "C:/")).toBe("c:/src/y");
  expect(normPath("foo/*.txt", "C:\\src")).toBe("c:/src/foo");
  expect(normPath("$UNKNOWN/x", cwd)).toBeNull();
});

test("git force push and history rewrite", () => {
  denied("git push --force origin main");
  denied("git push -f");
  denied("git -C C:/src push --force-with-lease");
  denied("git push origin +main");
  denied("git push --mirror");
  denied("git filter-repo --path x");
  denied("git filter-branch --tree-filter x");
  denied("git rebase -i --root");
  allowed("git status && git log --oneline -3");
  allowed("git commit -m 'fix -f flag'");
});

test("deletion roots", () => {
  allowed("rm -rf C:/src/target");
  allowed("rm -rf node_modules");
  allowed("rm -rf /tmp/x");
  allowed('rm -rf "$TEMP/foo"');
  allowed("Remove-Item -Recurse -Force C:\\msys\\tmp\\x");
  denied("rm -rf C:/Users/aphro/Documents/notes", cwd);
  denied("rm -rf ~/.ssh");
  denied("Remove-Item -Recurse C:\\Windows\\System32\\x");
  denied("del /s /q C:\\Users\\aphro\\Desktop\\x");
  denied("find C:/Users/aphro/Pictures -name '*.png' -delete");
  denied("cd x; rm -rf ../../Users/aphro/x", "C:/src/a");
});

test("secrets", () => {
  denied("cat /etc/aphrody/secrets.env");
  denied("ssh prd 'sudo cat /etc/aphrody/secrets.env'".replace(/'/g, "")); // unquoted remote command
  denied("cat .env");
  denied("Get-Content C:\\src\\.env");
  denied("head -5 apps/x/.env.local");
  denied("type %APPDATA%\\Microsoft\\Protect\\S-1-5\\abc".replace("%APPDATA%", "C:\\Users\\a\\AppData\\Roaming"));
  denied("cat ~/.claude/.credentials.json");
  denied("pwsh -c [Security.Cryptography.ProtectedData]::Unprotect($b,$null,'CurrentUser')");
  allowed("cat .env.example");
  allowed("echo FOO=1 >> .env");
  allowed("bun --env-file=.env run x.ts");
  allowed("cat ~/.ssh/id_ed25519.pub");
  expect(decide("Read", { file_path: "C:/src/.env" }, cwd)).not.toBeNull();
  expect(decide("Read", { file_path: "C:/src/.env.example" }, cwd)).toBeNull();
});

test("restricted publishing", () => {
  denied("gh release create v1 dist/vcruntime140.dll");
  denied("rclone copy C:/UnrealEngine/Engine r2-lore:bucket");
  denied("scp 'C:/Program Files (x86)/Windows Kits/10/Lib/ucrt.lib' prd:/srv");
  allowed("gh release create v1 dist/app.zip");
  allowed("rclone copy out/chrome.zip r2-chromium:builds");
});

test("questions are refused, other tools pass", () => {
  expect(decide("AskUserQuestion", { questions: [] }, cwd)).not.toBeNull();
  expect(decide("Write", { file_path: "C:/src/x.ts" }, cwd)).toBeNull();
  expect(decide("WebFetch", { url: "https://code.claude.com" }, cwd)).toBeNull();
});

test("review 2026-11-13: sub-shells and encodings", () => {
  denied(`pwsh -Command "git push --force"`);
  denied(`cmd /c "rd /s /q C:\\Users\\moi\\Documents"`);
  denied(`bash -c "gh release upload v1 Engine.uasset"`);
  denied(`bash -xc "cat .env"`);
  denied(`node --eval="require('fs').readFileSync('.env')"`);
  const enc = Buffer.from("Get-Content .env", "utf16le").toString("base64");
  denied(`pwsh -enc ${enc}`);
  expect(decide("PowerShell", { command: "Remove-`Item C:\\Users\\moi\\x" }, cwd)).not.toBeNull();
  expect(decide("PowerShell", { command: "Get-`Content .env" }, cwd)).not.toBeNull();
});

test("review 2026-11-13: windows paths and quoting", () => {
  denied(`cat "C:\\app\\.env"`);
  denied(`rm "C:\\src\\tmp\\" && git push --force`);
  denied("rm -rf c:/src/*/../../Users/moi/Documents");
  denied("rm -rf c:/src/../../tmp");
  denied("D=/c/Users; rm -rf $D", cwd);
  denied("rm -rf $SOMETHING_UNKNOWN_X/y");
  denied("rm D:important.txt");
  allowed("T=$(mktemp -d); rm -rf $T");
  allowed("rm -rf $TEMP/x ${HOME}/../../src/x".replace(" ${HOME}/../../src/x", ""));
  denied("Remove-Item -Path:C:\\Users\\moi\\doc.pdf");
  denied("Get-ChildItem C:\\Users\\moi\\doc.pdf | Remove-Item");
  denied("echo C:/Users/moi/doc.pdf | xargs rm");
  denied("find C:/src C:/Users/moi -delete");
  denied("find C:/Users/moi -name x -exec rm {} +");
  denied("git -C C:/Users/moi/proj clean -fdx");
});

test("review 2026-11-13: git", () => {
  denied("git --git-dir .git push --force");
  denied("git push origin :main");
  denied("git push --delete origin main");
  denied("git push --mirr");
  denied("git update-ref refs/heads/main abc123");
  denied("git show HEAD:.env");
});

test("review 2026-11-13: secret names", () => {
  denied("cat prod.env");
  denied("cat .env.production.local");
  denied("cat .env*");
  denied("grep KEY < .env");
  denied("cat <.env");
  expect(decide("Read", { file_path: ".env." }, cwd)).not.toBeNull();
  expect(decide("Read", { file_path: ".env::$DATA" }, cwd)).not.toBeNull();
  expect(decide("Grep", { pattern: ".", path: "/etc/aphrody" }, cwd)).not.toBeNull();
  expect(decide("NotebookRead", { notebook_path: "x/.env" }, cwd)).not.toBeNull();
});

test("review 2026-11-13: false positives", () => {
  allowed(`cat > notes.ts <<'EOF'\ntype X = 1; // reads .env\ngit push --force\nrm -rf C:/Users/x\nEOF`);
  allowed(`echo ".env" >> .gitignore`);
  allowed("del /ah /f/q C:\\src\\foo");
  allowed("Remove-Item C:\\src\\foo -Filter *.tmp", "C:/Users/aphro");
  allowed(`gh issue create --title "UE5 push crash"`);
  allowed("curl -s https://example.com/UE5/push");
  denied(`bash <<'EOF'\ngit push --force\nEOF`);
});
