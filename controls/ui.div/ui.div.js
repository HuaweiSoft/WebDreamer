/**
 *  @file implement the UI.Div control
 * @dependency  ui.container.js
 */


UI.Div = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.Div, UI.Container, {
    type: "UI.Div",
    designerType: "UI.Div_Designer",

    _html: "<div/>",

    _getStyle: function(name) {
        return this._element ? (this._element.style[name] || "") : "";
    },
    
    _setStyle: function(name, value) {
        if(this._element)
            this._element.style[name] = value;
    }
});


UI.Div.prototype.__defineGetter__('backgroundColor', function() {
   return this._getStyle("backgroundColor");
});

UI.Div.prototype.__defineSetter__('backgroundColor', function(value) {
	
    this._setStyle("backgroundColor", value);
});

UI.Div.prototype.__defineGetter__('backgroundImage', function() {
	var imgUrl = this._getStyle("backgroundImage").match(/url\((.*)\)/);
    return  imgUrl && imgUrl.length > 0 ? imgUrl[1] : "";
});

UI.Div.prototype.__defineSetter__('backgroundImage', function(value) {
	if(value)
		value = "url("+value+")";
    this._setStyle("backgroundImage", value);
});


UI.Div.prototype.__defineGetter__('borderWidth', function() {
    return this._getStyle("borderWidth");
});

UI.Div.prototype.__defineSetter__('borderWidth', function(value) {
    this._setStyle("borderWidth", value);
});

UI.Div.prototype.__defineGetter__('borderStyle', function() {
    return this._getStyle("borderStyle");
});

UI.Div.prototype.__defineSetter__('borderStyle', function(value) {
    this._setStyle("borderStyle", value);
});

UI.Div.prototype.__defineGetter__('borderColor', function() {
    return this._getStyle("borderColor");
});

UI.Div.prototype.__defineSetter__('borderColor', function(value) {
	
	if(!value)
		value = this._getStyle("borderColor");
	
    this._setStyle("borderColor", value);
});

UI.Div.prototype.__defineGetter__('onClick', function() {
    return this._element?  this._element.onclick :null;
});

UI.Div.prototype.__defineSetter__('onClick', function(value) {
   if(this._element){
       this._element.onclick = value;
   }
});