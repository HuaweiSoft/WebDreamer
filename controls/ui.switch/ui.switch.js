/**
 *  UI.Switch  Class
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 */
UI.Switch = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.Switch, UI.Control, {
    type: "UI.Switch",
    valueRange: [ "a", "b", "c", "d", "e", "f", "g" ],

    _html: ' <div class="ui-btn-text " style="width:100%;">'
        + ' <label class="ui-input-text" style="float:left;margin-top:7px;width:55%;white-space:nowrap;text-align:left;overflow: hidden; text-overflow:ellipsis;height:20px">Input Text</label>'
        + '   		 <div role="" style="position: absolute;width:8em;margin:1px 0px;right:8px;top:0px;"'
        + '		 		class="ui-slider ui-slider-switch ui-btn-down-c ui-btn-corner-all ui-slider-inneroffset">'
        + '  			<span class="ui-slider-label ui-slider-label-a ui-btn-up-c ui-btn-corner-all" role="img" style="width:0%;text-align: left;padding-left:8px;color:black;" name="On">On</span>'
        + '  			<span class="ui-slider-label ui-slider-label-b  ui-btn-down-c ui-btn-corner-all" role="img" style="width: 100%;text-align: right;right:8px;" name="Off">Off</span>'
        + '  	<div class="ui-slider-inneroffset" style="height:99.5%;"> '
        + '  		<a class="ui-slider-handle ui-btn ui-shadow ui-btn-corner-all ui-slider-handle-snapping ui-btn-up-b"'
        + ' 				data-iconshadow="true"  role="slider"  title="Off"  style="left:0%;width: 4.3em;height:100%;"> '
        + '         <span class="ui-btn-inner ui-btn-corner-all">' + '  		</span></a></div></div> </div>',

    textId: null,
    _switch: null,

    /*
     * @type: function(value)
     */
    onClick: null,

    _getValue: function() {
        var _wid = $(this._switch).find('span.ui-slider-label-a').css('width'), val;
        if ("0%" != _wid && "0px" != _wid)
            val = $(this._switch).find('span.ui-slider-label-a').attr('name') || "";
        else
            val = $(this._switch).find('span.ui-slider-label-b').attr('name') || "";
        return val;
    },

    _setValue: function(value) {

        if (!value)
            return;
        if (this._switch) {

            this._switch.value = value;
            var val = $(this._switch).find('span.ui-slider-label-a').attr('name');
            val = val == value ? "a" : "b";
            bindSwitchEvent($(this._switch).find('.ui-slider-handle'), val);
        }
    },
    _getText: function() {
        var _wid = $(this._switch).find('span.ui-slider-label-a').css('width'), val;
        if ("0%" != _wid)
            val = $(this._switch).find('span.ui-slider-label-a').html() || "";
        else
            val = $(this._switch).find('span.ui-slider-label-b').html() || "";
        return val;
    },

    _setText: function(text) {

        if (!text)
            return;
        if (this._switch) {
            this._switch.text = text;
            var val = $.trim($(this._switch).find('span.ui-slider-label-a').html());
            val = val == value ? "a" : "b";
            bindSwitchEvent($(this._switch).find('.ui-slider-handle'), val);
        }
    },

    _getTitleText: function() {
        return $(this._switch).find('label').html();
    },

    _setTitleText: function(value) {

        if (!value)
            value = "";

        if (this._switch) {
            this._switch.titleText = value;
            $(this._switch).find('label').html(value);

            var _editObj = $(this._switch).find('label'), _width, _left;
            // _left = $(this._switch).css('left').slice(0,-2);

            _width = _editObj.next('div').width();
            if (!value) {
                _editObj.hide();
                // _left = (_left + 185 - _width) +"px";

            }
            else {
                _editObj.show();
                _width = "98%";
                // _left = (_left - 185 + _width) +"px";
            }

            // $(this._switch).css('left',_left);
            $(this._switch).css('width', _width).parent();
            this.trigger(UI.Event.Resized, {});
        }
    },

    _getDatas: function() {
        var lists = [], str;

        $(this._switch).find('span.ui-slider-label').each(function() {
            str = {};
            str.value = $(this).attr('name');
            str.text = $(this).html();
            lists.push(str);
        });
        if (lists.length != 0) {
            this._switch.datas = lists;
        }
        return lists.length != 0 ? lists : "";
    },

    _setDatas: function(value) {
        if (!value || value.length == 0)
            value = {};
        if (this._switch) {

            this._switch.datas = value;

            var jsonObj = value;
            if (!is(value, "Array")) {
                jsonObj = parseFromJsonText(value);
            }

            if (jsonObj[0] && jsonObj[0].text)
                $(this._switch).find('span.ui-slider-label-a').attr('name', jsonObj[0].value).html(jsonObj[0].text);

            if (jsonObj[1] && jsonObj[1].text)
                $(this._switch).find('span.ui-slider-label-b').attr('name', jsonObj[1].value).html(jsonObj[1].text);

        }
    },

    setData: function(data) {
        if (!data)
            return;
        if (data.titleText)
            this._setTitleText(data.titleText);
       /* if (data.theme) {
            this._setTheme(data.theme);
        }*/
        if (data.datas) {
            this._setDatas(data.datas);
        }
    },

    render: function() {
        if (!this._renderBase())
            return false;

        var self = this;
        this._switch = self._element;

        this.$('.ui-slider-handle').bind("click", function() {
            bindSwitchEvent(self._switch);
            if(self.onClick)
                self.onClick();
        });

        this._rendered = true;

        return true;
    }

});


/*
 * UI.Switch.prototype._getTheme = function () { var themeStyle = "c"; if (this._switch) { var
 * oldClass = $(this._switch).attr('class'); themeStyle = oldClass.split(" ")[1].slice(-1); } return
 * themeStyle; };
 * 
 * UI.Switch.prototype._setTheme = function (value) { if (!value) value = ""; if (this._switch) {
 * var len = this.valueRange.length; var oldClass = $(this._switch).attr('class'); var _oldtheme =
 * oldClass.split(" ")[1]; var newClass =
 * oldClass.replace(_oldtheme,"ui-btn-up-"+value.toLowerCase());
 * 
 * $(this._switch).removeClass(oldClass).addClass(newClass); this._switch.theme = value; } };
 */


/**
 * 定义滑动效果的事件
 */
var bindSwitchEvent = function(obj, swiOne) {

    swiOne = swiOne || "";
    var _div = $(obj).parent().parent();
    var _left = $(obj).css('left');
    var _Ashow = null;
    // swiOne = _left=="0%"?"a":"b";
    _Ashow = !swiOne ? _left == "0%" : swiOne == "a";

    if ((!_Ashow && _left == "0%") || (_Ashow && _left != "0%"))
        return;

    if (_Ashow) {
        $(_div).find('span.ui-slider-label-a').css('width', '100%').css('left', '-2%');
        $(_div).find('span.ui-slider-label-b').css('width', '0%');
        $(obj).css('left', '110%');
        $(obj).attr('title', $('span.ui-slider-label-a').html());

        $(_div).find('span.ui-slider-label-a').show();
        $(_div).find('span.ui-slider-label-b').hide();

    }
    else {

        $(_div).find('span.ui-slider-label-b').css('width', '100%');
        $(_div).find('span.ui-slider-label-a').css('width', '0%').css('left', '5%');
        $(obj).css('left', '0%');
        $(obj).attr('title', $('span.ui-slider-label-b').html());

        $(_div).find('span.ui-slider-label-b').show();
        $(_div).find('span.ui-slider-label-a').hide();
    }
};

UI.Switch.prototype.__defineGetter__('text', UI.Switch.prototype._getValue);
UI.Switch.prototype.__defineSetter__('text', UI.Switch.prototype._setValue);
UI.Switch.prototype.__defineGetter__('value', UI.Switch.prototype._getValue);
UI.Switch.prototype.__defineSetter__('value', UI.Switch.prototype._setValue);
UI.Switch.prototype.__defineGetter__('titleText', UI.Switch.prototype._getTitleText);
UI.Switch.prototype.__defineSetter__('titleText', UI.Switch.prototype._setTitleText);
// UI.Switch.prototype.__defineGetter__('theme', UI.Switch.prototype._getTheme);
// UI.Switch.prototype.__defineSetter__('theme', UI.Switch.prototype._setTheme);
UI.Switch.prototype.__defineGetter__('datas', UI.Switch.prototype._getDatas);
UI.Switch.prototype.__defineSetter__('datas', UI.Switch.prototype._setDatas);
