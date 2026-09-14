/**
 * Does the filtering of inputs, and applying its various fallbacks
 *
 * "fileContent" maps a data key -> payload file path (e.g.
 * { "wg0.conf": "wireguard.conf" }). Paths resolve relative to the
 * entry's "planDir" input (the absolute plan-folder path, forwarded by
 * plan entries as "planDir": "{{planDir}}" set by their input.configami.js
 * alias hook); absolute paths are used as-is; with no planDir the base is
 * the workspace root. Files are read as raw bytes — never handlebars —
 * then encoded like any other data value, so a missing file fails the
 * render with the resolved absolute path.
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

	// Data object, to rencode if needed
	let dataObj = Object.assign( {}, input.data );

	// fileContent payloads (raw bytes) join the data before encoding;
	// they win shared keys with inline "data"
	if ( input.fileContent ) {
		for (const key of Object.keys(input.fileContent)) {
			dataObj[key] = readFileContent(cg, input, key, input.fileContent[key]);
		}
	}

	// Re-encode?
	if ( input.encode_base64 == true ) {
		for (const key in dataObj) {
			dataObj[key] = Buffer.from(dataObj[key]).toString("base64");
		}
	}

	//
	// Custom handling of data wrapping
	//
	input._dataWrap = { data: dataObj }

	// Return the final input
	return input;
}