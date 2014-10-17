/**
 *  @file implement the UI.TextBox control
 * @dependency  ui.control.js
 */

/**
 * TextBox control class, support html5 placeholder
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 */
UI.TextBox = function (container) {
     arguments.callee.superClass.constructor.apply(this, arguments);

    this._html = '<div> <input type="text" style="width:100%;height:100%;padding:0em;" class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-d"></div>';
    this._textbox = null;

    /**
     * @type {Function} callback(value)
     */
    this.onValueChanged = null;
	this.onfocus = null;
	this.onblur = null;
};

extend(UI.TextBox, UI.Control);
UI.TextBox.prototype.type = "UI.TextBox";
UI.TextBox.prototype.designerType = "UI.TextBox_Designer";

UI.TextBox.prototype._supportTypes = ["text", "password", "email", "tel", "url", "number", "color", "date", "time", "datetime"]
UI.TextBox.prototype._type = "text"; 
UI.TextBox.prototype._getValue = function () {
    return this._textbox != null ? this._textbox.value : "";
};

UI.TextBox.prototype._setValue = function (value) {
    if (!value)
        value = "";
    if (this._textbox) {
        this._textbox.value = value;
    }
};

UI.TextBox.prototype._getInputType = function () {
    return this._textbox != null ? this._type : "";
};

UI.TextBox.prototype._setInputType = function (value) {
    var founded = false;
    for (var i = 0; i < this._supportTypes.length; i++) {
        if (value == this._supportTypes[i]) {
            founded = true;
            break;
        }
    }
    if (!founded)
        return;
    if (this._textbox) {
        this._textbox.type = value;
        this._type = value;
    }
};

UI.TextBox.prototype._getPlaceholder = function () {
    return this._textbox != null && "placeholder" in this._textbox ? this._textbox.placeholder : "";
};

UI.TextBox.prototype._setPlaceholder = function (value) {
    if (!value)
        value = "";
    if (this._textbox && "placeholder" in this._textbox) {
        this._textbox.placeholder = value;
    }
};

UI.TextBox.prototype._getDisabled = function () {
    return this._textbox != null ? this._textbox.disabled : true;
};

UI.TextBox.prototype._setDisabled = function (value) {
    if (this._textbox) {
        if (typeof value == "string") {
            value = parseBoolean(value);
        }
        this._textbox.disabled = value;
    }
};


UI.TextBox.prototype._getReadOnly = function () {
    return this._textbox != null ? this._textbox.readOnly : true;
};

UI.TextBox.prototype._setReadOnly = function (value) {
    if (this._textbox) {
        if (typeof value == "string") {
            value = parseBoolean(value);
        }
        this._textbox.readOnly = value;
    }
};

UI.TextBox.prototype.__defineGetter__('value', UI.TextBox.prototype._getValue);
UI.TextBox.prototype.__defineSetter__('value', UI.TextBox.prototype._setValue);
UI.TextBox.prototype.__defineGetter__('placeholder', UI.TextBox.prototype._getPlaceholder);
UI.TextBox.prototype.__defineSetter__('placeholder', UI.TextBox.prototype._setPlaceholder);
UI.TextBox.prototype.__defineGetter__('inputType', UI.TextBox.prototype._getInputType);
UI.TextBox.prototype.__defineSetter__('inputType', UI.TextBox.prototype._setInputType);
UI.TextBox.prototype.__defineGetter__('disabled', UI.TextBox.prototype._getDisabled);
UI.TextBox.prototype.__defineSetter__('disabled', UI.TextBox.prototype._setDisabled);
UI.TextBox.prototype.__defineGetter__("readOnly", UI.TextBox.prototype._getReadOnly);
UI.TextBox.prototype.__defineSetter__("readOnly", UI.TextBox.prototype._setReadOnly);


UI.TextBox.prototype.render = function () {
    if (!this._renderBase())
        return false;
    this._textbox = this._element.children[0];
    var self = this;
    attachInputValueListener(this._textbox, function () {
        var txt = self._textbox.value;
        if (self.onValueChanged)
            self.onValueChanged(txt);
    });
	$(self._textbox).bind("focus",function () 
    {
		var txt = self._textbox.value;
    	if(self.onfocus)
    	{
    	  self.onfocus(txt);
    	}
    });
	$(self._textbox).bind("blur",function () 
    {
		var txt = self._textbox.value;
    	if(self.onblur)
    	{
    	  self.onblur(txt);
    	}
    });
	
    this._rendered = true;
    return true;
};
