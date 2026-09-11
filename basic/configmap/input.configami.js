/**
 * Does the filtering of inputs, and applying its various fallbacks
 */
module.exports = function(cg, input) {
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
	if (input.dataBlock && Object.keys(input.dataBlock).length > 0) {
		const data = input.data || {};
		const block = input.dataBlock;
		const out = ["data:"];
		const emitBlock = function (key, value) {
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
	input._dataWrap = { data:input.data }

	// Return the final input
	return input;
}
