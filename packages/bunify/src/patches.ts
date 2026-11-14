// Known `bun patch` fixes keyed by name@version, applied when the dependency is present and unpatched.
export const KNOWN_PATCHES: Record<string, string> = {
  // taskr's esnext plugin: require-like breaks under Bun, use module.createRequire.
  "@taskr/esnext@1.1.0": "diff --git a/index.js b/index.js\nindex 4a6cd2ca5dc60bfda28f8f1cc7a9b36b7b1bbfa3..3ef6afad36d1d120ed4607ddf0bdf00ea2e90456 100644\n--- a/index.js\n+++ b/index.js\n@@ -3,7 +3,7 @@\n const Script = require('vm').Script;\n const dirname = require('path').dirname;\n const rImports = require('rewrite-imports');\n-const req = require('require-like');\n+const { createRequire } = require('module');\n \n const fn = 'function*';\n const box = {};\n@@ -13,7 +13,7 @@ module.exports = function (file, data) {\n \tObject.assign(box, global);\n \tbox.module = { exports };\n \tbox.exports = exports;\n-\tbox.require = req(file);\n+\tbox.require = createRequire(file);\n \n \tbox.__dirname = dirname(file);\n \tbox.__filename = file;\n",
};
