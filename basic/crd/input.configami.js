/**
 * Derives crdName from crdSpec when not given explicitly.
 * Kubernetes requires metadata.name == "<plural>.<group>".
 */
module.exports = function(cg, input) {
	if( input.crdName == null ) {
		if( input.crdSpec == null || input.crdSpec.names == null || input.crdSpec.group == null ) {
			throw "crd template: provide crdName, or a crdSpec with names.plural and group";
		}
		input.crdName = input.crdSpec.names.plural + "." + input.crdSpec.group;
	}
	return input;
}
