/**
 * Does the filtering of inputs, and applying its various fallbacks
 *
 * "fileContent" maps a data key -> payload file path (e.g.
 * { "ceph.conf": "config/ceph.conf" }). Paths resolve relative to the
 * entry's "planDir" input (the absolute plan-folder path, forwarded by
 * plan entries as "planDir": "{{planDir}}" set by their input.configami.js
 * alias hook); absolute paths are used as-is; with no planDir the base is
 * the workspace root. Files are read as raw bytes — never handlebars —
 * and merged into the dataBlock pipeline below (so they render |2). A
 * missing file fails the render with the resolved absolute path.
 */

// Read one fileContent payload, resolving rel against the entry's planDir.
function readFileContent(cg, input, key, rel) {
  const path = require("path");
  const base = (typeof input.planDir === "string" && input.planDir !== "")
    ? input.planDir
    : (cg.workspaceRootDir || process.cwd());
  const abs = path.isAbsolute(rel) ? rel : path.resolve(base, rel);
  if (!cg.util.fsh.isFile(abs)) {
    throw "Missing " + key + " payload file: " + abs;
  }
  return cg.util.fsh.readFileSync(abs).toString("utf8");
}

module.exports = function(cg, input) {
  console.log('CONFIGMAP?? ', { input })

  //
  // Custom handling of data wrapping
  //
  // "data" renders as double-quoted JSON strings (one line per value,
  // \n escapes). "dataBlock" renders the same mapping shape but with
  // YAML literal block scalars, so multi-line payloads (config files)
  // stay readable in the rendered manifest. Keys present in both: the
  // dataBlock value wins; plain "data" keys render first. The whole
  // section is built verbatim here (json2yaml cannot emit blocks).
  //
  // Indentation indicator "2" is explicit (content = key indent 2 + 2)
  // so values starting with whitespace round-trip safely; chomping
  // follows the value's own trailing newline (| none, |- stripped).
  //
  // "fileContent" entries are loaded first and win shared keys.
  //
  const block = Object.assign({}, input.dataBlock);
  if (input.fileContent) {
    for (const key of Object.keys(input.fileContent)) {
      block[key] = readFileContent(cg, input, key, input.fileContent[key]);
    }
  }
  if (Object.keys(block).length > 0) {
    const data = input.data || {};
    const out = ["data:"];
    const emitBlock = function(key, value) {
      const text = String(value);
      const clipped = text.endsWith("\n");
      const body = clipped ? text.slice(0, -1) : text;
      out.push("  " + JSON.stringify(key) + ": |2" + (clipped ? "" : "-"));
      for (const line of body.split("\n")) {
        out.push(line.length > 0 ? "    " + line : "");
      }
    };
    for (const key of Object.keys(data)) {
      if (key in block) { continue; }
      out.push("  " + JSON.stringify(key) + ": " + JSON.stringify(String(data[key])));
    }
    for (const key of Object.keys(block)) {
      emitBlock(key, block[key]);
    }
    input._dataRaw = out.join("\n");
  }

  //
  // Default data wrapping (unchanged for every existing consumer)
  //
  input._dataWrap = { data: input.data }

  // Return the final input
  return input;
}
