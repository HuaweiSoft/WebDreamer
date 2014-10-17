define([ "modules/formDesigner/formCanvas/formCanvas",
		"modules/formDesigner/pageManager/pageManager" ], function(formDesigner,
		pageManager) {

	var init = function() {
		formDesigner.init();
		pageManager.init();
	};

	return {
		init : init,
	};

});