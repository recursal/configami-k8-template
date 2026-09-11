/**
 * Does the filtering of inputs, and applying its various fallbacks
 */
module.exports = function(cg, input) {
	//
	// Normalize clusterIP = none -> None
	//
	if( input.clusterIP == "none" ) {
        input.clusterIP = "None"
    }

	//
	// Workloadselector label value: deploymentType-namespace-name
	// (deploymentName overrides name, matching the service's own logic).
	// Label VALUES are capped at 63 chars; `shortNamespace` substitutes a
	// shorter token for the namespace segment of this label only - the
	// real `namespace` field and targetWorkloadIds stay full.
	//
	if( input.namespace && ( input.deploymentName || input.name ) ) {
		input._workloadSelector = ( input.deploymentType || "deployment" ) + "-" + ( input.shortNamespace || input.namespace ) + "-" + ( input.deploymentName || input.name );
	}
    
	// Return the final input
	return input;
}