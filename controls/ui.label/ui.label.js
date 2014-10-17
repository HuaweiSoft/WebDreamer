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
    designerType: "UI.Label_Designer",

    _html: "<div style='font-size: 14px;'>Label text</div>"

});

UI.Div.prototype.__defineGetter__('text', function() {
	  return $.trim($(this._element).html());
});

UI.Div.prototype.__defineSetter__('text', function(text) {
	text = text || "";
	$(this._element).html(text);
});

UI.Div.prototype.__defineGetter__('textValue', function() {
    return this.text;
});

UI.Div.prototype.__defineSetter__('textValue', function(value) {
    this.text = value;
});
