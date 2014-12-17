/**
 *  @file implement the UI.Text control
 * @dependency  ui.control.js
 */

/**
 * Text control class, support html5 placeholder
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 */
UI.Text = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.Text, UI.Control, {
    type: "UI.Text",
    _html: '<div> <input type="text" placeholder="input" style="width:100%;height:100%;padding:0em;" ' +
        'class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-d"></div>',
    _Text: null,

    //EVENT
    onValueChanged: null,
    onfocus: null,
    onblur: null,

    _supportTypes: ["text", "password", "email", "tel", "url", "number", "color", "date", "time", "datetime"],
    _type: "text",

    _getValue: function() {
        return this._Text != null ? this._Text.value : "";
    },

    _setValue: function(value) {
        if (!value)
            value = "";
        if (this._Text) {
            this._Text.value = value;
        }
    },

    _getInputType: function() {
        return this._Text != null ? this._type : "";
    },

    _setInputType: function(value) {
        var founded = false;
        for (var i = 0; i < this._supportTypes.length; i++) {
            if (value == this._supportTypes[i]) {
                founded = true;
                break;
            }
        }
        if (!founded)
            return;
        if (this._Text) {
            this._Text.type = value;
            this._type = value;
        }
    },

    _getPlaceholder: function() {
        return this._Text != null && "placeholder" in this._Text ? this._Text.placeholder : "";
    },

    _setPlaceholder: function(value) {
        if (!value)
            value = "";
        if (this._Text && "placeholder" in this._Text) {
            this._Text.placeholder = value;
        }
    },
    _getDisabled: function() {
        return this._Text != null ? this._Text.disabled : true;
    },
    _setDisabled: function(value) {
        if (this._Text) {
            if (typeof value == "string") {
                value = parseBoolean(value);
            }
            this._Text.disabled = value;
        }
    },
    _getReadOnly: function() {
        return this._Text != null ? this._Text.readOnly : true;
    },

    _setReadOnly: function(value) {
        if (this._Text) {
            if (typeof value == "string") {
                value = parseBoolean(value);
            }
            this._Text.readOnly = value;
        }
    },

    render: function() {
        if (!this._renderBase())
            return false;
        this._Text = this._element.children[0];
        var self = this;
        attachInputValueListener(this._Text, function() {
            var txt = self._Text.value;
            if (self.onValueChanged)
                self.onValueChanged(txt);
        });
        $(self._Text).bind("focus", function() {
            var txt = self._Text.value;
            if (self.onfocus) {
                self.onfocus(txt);
            }
        });
        $(self._Text).bind("blur", function() {
            var txt = self._Text.value;
            if (self.onblur) {
                self.onblur(txt);
            }
        });

        this._rendered = true;
        return true;
    }
});


UI.Text.prototype.__defineGetter__('value', UI.Text.prototype._getValue);
UI.Text.prototype.__defineSetter__('value', UI.Text.prototype._setValue);
UI.Text.prototype.__defineGetter__('placeholder', UI.Text.prototype._getPlaceholder);
UI.Text.prototype.__defineSetter__('placeholder', UI.Text.prototype._setPlaceholder);
UI.Text.prototype.__defineGetter__('inputType', UI.Text.prototype._getInputType);
UI.Text.prototype.__defineSetter__('inputType', UI.Text.prototype._setInputType);
UI.Text.prototype.__defineGetter__('disabled', UI.Text.prototype._getDisabled);
UI.Text.prototype.__defineSetter__('disabled', UI.Text.prototype._setDisabled);
UI.Text.prototype.__defineGetter__("readOnly", UI.Text.prototype._getReadOnly);
UI.Text.prototype.__defineSetter__("readOnly", UI.Text.prototype._setReadOnly);
