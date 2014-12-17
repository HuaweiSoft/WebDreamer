/**
 *  @file implement UI.Label control
 * @dependency  ui.div.js
 */

/**
 *  UI.Label control
 * @param container
 * @constructor
 * @superClass {@link UI.Div}
 */
UI.Label = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.Label,UI.Div, {
    type: "UI.Label",
    _html: "<div style='font-size: 14px;'>Label text</div>",

    getText: function(){
        return   $.trim($(this._element).html());;
    },

    setText: function(text){
        text = text || "";
        $(this._element).html(text);
    }
});

UI.Label.prototype.__defineGetter__('text', function() {
	  return this.getText();
});

UI.Label.prototype.__defineSetter__('text', function(text) {
    this.setText(text );
});

UI.Label.prototype.__defineGetter__('textValue', function() {
    return this.getText();
});

UI.Label.prototype.__defineSetter__('textValue', function(value) {
    this.setText(value);
});
