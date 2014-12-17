define([ "modules/formDesigner/formCanvas/formCanvas", "modules/formDesigner/pageManager/pageManager" ], function(
        formDesigner, pageManager) {
    var init = function() {
        formDesigner.init();
        pageManager.init();
    };

    return {
        init: init,

        getOffsetWidth: function(){
            return formDesigner.getOffsetWidth();
        },

        getControlHtml: function(controlId){
            return formDesigner.getControlHtml(controlId);
        },

        getControlSize: function(controlId){
            return formDesigner.getControlSize(controlId);
        },

        getPageThumbHtml: function(pageNo){
            return formDesigner.getPageThumbHtml(pageNo);
        },

        highlightUiControl: function(controlId) {
            return formDesigner.highlightUiControl(controlId);
        },

        clearUiControlHighlight: function() {
            return formDesigner.clearUiControlHighlight();
        }

    };

});