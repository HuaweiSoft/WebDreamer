/**
 * Slider Control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 */
UI.Slider = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.Slider, UI.Control, {
    type: "UI.Slider",


    _html: '<div><div class="ui-slider  ui-btn-down-c ui-btn-corner-all ui-slider-mini" style="width:98%;margin-top:5px;margin-left:1px" max="100" min="0" value="50">'
        + '<div class="ui-slider-bg ui-btn-active ui-btn-corner-all" style="width: 0%; height:100%;margin:-1px 0 0 -1px;">'
        + '</div><a class="ui-slider-handle ui-btn ui-shadow ui-btn-corner-all ui-btn-up-c" style="left: 0%;" title="50">'
        + '<span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text"></span></span></a></div>'
        + '<div>',

    _slider: null,

    /*
     *  @type: function(value)
     */
    onChange: null,

    render: function() {
        if (!this._renderBase())
            return false;
        this._slider = this._element.children[0];
        var self = this;
        $($("#" + self.id).find("a")).bind("mousedown", function() {
            $(document).bind("mousemove", function(e) {
                self.glide(e, self._slider, self);
            });
        });

        $(document).bind("mouseup", function() {
            $(document).unbind("mousemove");
        });

        this._rendered = true;
        return true;
    },

    glide: function(index, _html, self) {
        var percent = Math.round((index.pageX - $(_html).offset().left) / $(_html).width() * 100);
        if (percent > 100) {
            percent = 100;
        }
        if (percent < 0) {
            percent = 0;
        }
        $(_html).find(".ui-slider-bg").css("width", percent + "%");
        $(_html).find("a").css("left", percent + "%");
        var max = parseInt($(_html).attr("max"));
        var min = parseInt($(_html).attr("min"));
        var newval = Math.round(( percent / 100 ) * ( max - min ) + min);
        self.value = newval;
        $(_html).attr("value", newval);
        $(_html).find("a").attr("title", newval);
    },


    _getTheme: function() {
        return this._slider.theme != null ? this._slider.theme : "C";
    },

    _setTheme: function(value) {
        if (!value)
            return;
        if (this._slider) {
            this._slider.theme = value;
            if (value == "D") {
                value = "C";
            }
            else if (value == "C") {
                value = "D";
            }
            $(this._slider).attr("class", "ui-slider ui-btn-corner-all ui-slider-mini ui-btn-down-" + value.toLowerCase());
            $(this._slider).find(".ui-slider-handle").attr("class", "ui-slider-handle ui-btn ui-shadow ui-btn-corner-all ui-btn-up-" + value.toLowerCase());
        }
    },

    _getMin: function() {
        return this._slider != null ? ( this._slider.min || 0) : 0;
    },

    _setMin: function(min) {
        min = parseInt(min);
        if (isNaN(min) || min < 0)
            return;
        if (this._slider) {
            this._slider.min = min;
            $(this._slider).attr("min", min);
        }
    },

    _getMax: function() {
        return this._slider != null ? (this._slider.max || 100 ) : 100;
    },

    _setMax: function(max) {
        max = parseInt(max);
        if (isNaN(max) || max < this._getMin())
            return;
        if (this._slider) {
            this._slider.max = max;
            $(this._slider).attr("max", max);
        }
    },

    _getValue: function() {
        return this._slider != null ? (this._slider.value || 0) : 0;
    },

    _setValue: function(value) {
        value = parseFloat(value);
        if (isNaN(value))
            return;
        if (this._slider) {
            var max = this._getMax();
            var min = this._getMin();
            if (value < min) {
                value = min;
            }
            if (value > max) {
                value = max;
            }
            this._slider.value = value;
            var percent = Math.round((value - min) / (max - min) * 100);
            $(this._slider).attr("value", value);
            $(this._slider).find(".ui-slider-bg").css("width", percent + "%");
            $(this._slider).find("a").css("left", percent + "%");
            $(this._slider).find("a").attr("title", value);
            if (this.onChange)
                this.onChange(value);
        }
    }

});


UI.Slider.prototype.__defineGetter__('theme', UI.Slider.prototype._getTheme);
UI.Slider.prototype.__defineSetter__('theme', UI.Slider.prototype._setTheme);
UI.Slider.prototype.__defineGetter__('min', UI.Slider.prototype._getMin);
UI.Slider.prototype.__defineSetter__('min', UI.Slider.prototype._setMin);
UI.Slider.prototype.__defineGetter__('max', UI.Slider.prototype._getMax);
UI.Slider.prototype.__defineSetter__('max', UI.Slider.prototype._setMax);
UI.Slider.prototype.__defineGetter__('value', UI.Slider.prototype._getValue);
UI.Slider.prototype.__defineSetter__('value', UI.Slider.prototype._setValue);
