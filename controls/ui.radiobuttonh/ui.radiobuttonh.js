/**
 * UI.RadioButton Horizontal Control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 */
UI.RadioButtonH = function(container) {

    arguments.callee.superClass.constructor.apply(this, arguments);

};

extend(UI.RadioButtonH, UI.Control, {
    type: "UI.RadioButtonH",

    _html: '<div style="">' +
        ' <div role="" class="ui-controlgroup-label"  >Choose a thing:</div>' +
        ' <ul data-role="controlgroup" data-type="horizontal"	class="localnav ui-corner-all ui-controlgroup ui-controlgroup-horizontal">' +
        ' 				 <li>' +
        ' 					<a  style="float: left;clear: none;margin: 0 -1px 0 0;width:24.5%;min-height:35px;e" data-role="button" class="ui-btn ui-btn-up-c  ui-btn-active ui-btn-active">' +
        ' 					 <span class="ui-btn-inner ui-corner-left"><span class="ui-btn-text"  name="A">Item1</span></span></a></li>' +
        ' 					<li><a style="float: left;clear: none;margin: 0 -1px 0 0;width:24.5%;min-height:35px;"  data-role="button"  class="ui-btn ui-btn-up-c">' +
        ' 					<span class="ui-btn-inner"><span class="ui-btn-text" name="B">Item2</span></span></a></li>' +

        ' 					<li><a style="float: left;clear: none;margin: 0 -1px 0 0;width:24.5%;min-height:35px;"  data-role="button"  class="ui-btn ui-btn-up-c">' +
        ' 					<span class="ui-btn-inner"><span class="ui-btn-text" name="C">Item3</span></span></a></li>' +

        ' 					<li><a style="float: left;clear: none;margin: 0 -1px 0 0;width:24.5%;min-height:35px;"  data-role="button" class="ui-btn ui-btn-up-c ui-corner-right ui-controlgroup-last" >' +
        ' 					<span class="ui-btn-inner  ui-corner-right ui-controlgroup-las"><span class="ui-btn-text" name="D">Item4</span></span></a></li>' +
        ' 				</ul>' +
        ' 	</div>',

    _radio: null,  // jquery type
    $ul: null,

    /*
     *  @type: function(value)
     */
    onClick: null,

    render: function() {
        if (!this._renderBase())
            return false;
        this._radio = this.find('ul');
        this.$ul = this.find("ul");
        this.bindEvent();
        this._rendered = true;
        return true;
    },

    bindEvent: function() {
        var isCheckBox = this.type.indexOf("CheckBox") >= 0;
        var _this = this;
        this.find('li').unbind("click").bind("click", function() //
        {
            var $el = $(this);
            if (!isCheckBox) {
                $el.parent().find('a').removeClass('ui-btn-active');
                $el.find('a').addClass('ui-btn-active');
            }
            else {
                var checked = ($el.find('a.ui-btn-active').size() > 0);
                if (checked)
                    $el.find('a').removeClass('ui-btn-active');
                else
                    $el.find('a').addClass('ui-btn-active');

            }
            if (_this.onClick)
                _this.onClick();
        });
    },


    /**
     *
     * @param data    [{"text": "显示信息", "data": "实际取值", "checked": true}]
     * @private
     */
    _setData: function(data) {
        if(typeof data == "string")
            data = parseFromJsonText(data);
        if (!data || data.length == 0 || !this.rendered)
            return;
        this._radio.datas = data;
        var rootEle = this.$ul;
        //水平Buttons
        var li = rootEle.find('li:first');
        $(li).find('a').removeClass('ui-corner-left');

        rootEle.html('');
        var _width = 98 / data.length;
        li.find('a').css('width', _width + "%");
        //动态设置
        $.each(data, function() {
            li = $(li).clone();
            $(li).find('span.ui-btn-text').attr('name', this.value);
            $(li).find('span.ui-btn-text').html(this.text);
            if (this.checked && this.checked != "false")
                $(li).find('a').addClass('ui-btn-active');
            else
                $(li).find('a').removeClass('ui-btn-active');

            rootEle.append(li);
        });

        $(rootEle).find('li:first').find('a').addClass('ui-corner-left');
        $(rootEle).find('li:last').find('a').addClass('ui-corner-right');
        this.bindEvent();
    },

    /**
     * 获取所有选项的数据
     * @return Array
     */
    _getData: function() {
        var lists = [];
        $.each(this.$ul.find('li'), function(ind, ele) {
            var str = {};
            str.text = $(ele).find('span.ui-btn-text').html();
            str.value = $(ele).find('span.ui-btn-text').attr('name');
            str.checked = $(ele).find('.ui-btn-active').size() > 0;
            lists.push(str);
        });

        if (lists.length != 0) {
            this._radio.datas = lists;
        }

        return  lists;
    },


    /**
     * 设置当前选中的value
     * @param value
     */
    _setValue: function(value) {
        if (!value || !this.rendered)
            return;
        var _radioType = this.type.indexOf('RadioButton') > 0 , once = 0;
        this._radio.text = value;
        var _objRadio = this.$ul.find('a');
        $(_objRadio).removeClass('ui-btn-active');
        var arr = value.split(',');
        //		value = ","+$.trim(value)+",";
        $.each(arr, function(ind, ele) {
            $.each(_objRadio, function(i, e) {
                var _text = $.trim($(e).find('span.ui-btn-text').attr('name'));
                if ($.trim(ele) == _text) {
                    once++;
                    $(e).addClass('ui-btn-active');
                }
            });

            if (_radioType && once > 0)
                return false;
        });
    },


    /**
     * 获取当前选中的value
     * @param value
     */
    _getValue: function() {
        var _tValue = "";
        if (this.$ul.find('a.ui-btn-active').size() == 1)
            _tValue = this.$ul.find('a.ui-btn-active').find('span.ui-btn-text').attr('name');
        else if (this.$ul.find('a.ui-btn-active').size() > 1)
            _tValue = this.$ul.find('a.ui-btn-active').map(function() {
                return $(this).find('span.ui-btn-text').attr('name');
            }).get().join(",");
        else
            _tValue = "";

        return _tValue;
    },


    /**
     * 设置当前选中的text
     * @param text
     */
    _setText: function(text) {
        if (!text || !this.rendered)
            return;
        var _radioType = this.type.indexOf('RadioButton') > 0 , once = 0;
        this._radio.text = text;
        var _objRadio = this.$ul.find('a');
        $(_objRadio).removeClass('ui-btn-active');
        var arr = text.split(',');
        //		value = ","+$.trim(value)+",";
        $.each(arr, function(ind, ele) {
            $.each(_objRadio, function(i, e) {
                var _text = $.trim($(e).find('span.ui-btn-text').html());
                if ($.trim(ele) == _text) {
                    once++;
                    $(e).addClass('ui-btn-active');
                }
            });

            if (_radioType && once > 0)
                return false;

        });


    },


    /**
     * 获取当前选中的text
     */
    _getText: function() {
        var _tText = "";
        if (this.$ul.find('a.ui-btn-active').size() == 1)
            _tText = this.$ul.find('a.ui-btn-active').find('span.ui-btn-text').html();
        else if (this.$ul.find('a.ui-btn-active').size() > 1)
            _tText = this.$ul.find('a.ui-btn-active').map(function() {
                return $(this).find('span.ui-btn-text').html();
            }).get().join(",");
        else
            _tText = "";
        return _tText;
    },


    /**
     * 设置radio的标题信息
     * @param value
     */
    _setTitleText: function(value) {
        if (!this.rendered)
            return;
        var _height = this.$ul.parent().height();

        if (!value || value.length == 0) {
            this._radio.titleText = "";
            if (this.$ul.parent().find('div.ui-controlgroup-label').css('display') != "none") {
                this.$ul.parent().find('div.ui-controlgroup-label').html("").hide();
                _height -= 25;
            }
        }
        else {
            this._radio.titleText = value;
            this.$ul.parent().find('div.ui-controlgroup-label').html(value);
            if (this.$ul.parent().find('div.ui-controlgroup-label').css('display') == "none") {
                this.$ul.parent().find('div.ui-controlgroup-label').show();
                _height += 25;
            }
        }

        this.$ul.parent().css('height', _height).parent().find('#objectSelection').css("height", _height);
    },

    /**
     * 获取radio的标题信息
     */
    _getTitleText: function() {
        var _tText = this._radio ? this._radio.titleText : "";
        if (!$.trim(_tText)) {
            if (this.$ul.parent().find('div.ui-controlgroup-label').size() > 0)
                _tText = this.$ul.parent().find('div.ui-controlgroup-label').html();
            else
                _tText = "";
        }
        return _tText;
    },

    /**
     * 设置radio的样式
     * @param value
     */
    _setTheme: function(value) {
        if (!value || !this.rendered)
            return;
        var _ver = this.$ul.find('a').size() == 0;
        var oldClass , newClass, _theme;
        if (!_ver) {
            this.$ul.find('a').each(function(ind, ele) {
                oldClass = $(ele).attr('class');
                _theme = oldClass.split(" ")[1];
                oldClass = oldClass.replace(_theme, 'ui-btn-up-' + value.toLowerCase());
                $(ele).attr('class', oldClass);
            });

        }
        else {
            this.$ul.find('label').each(function(ind, ele) {
                oldClass = $(ele).attr('class');
                _theme = oldClass.split(" ")[1];
                oldClass = oldClass.replace(_theme, 'ui-btn-up-' + value.toLowerCase());
                $(ele).attr('class', oldClass);
            });
        }
    },

    /**
     * 获取radio的样式
     */
    _getTheme: function() {
        if (!this.rendered)
            return "";
        var _ver = this.$ul.find('a').size() == 0;
        var oldClass , _theme;
        if (!_ver) {
            oldClass = this.$ul.find('a:first').attr('class');
            _theme = oldClass.split(" ")[1].slice(-1);
        }
        else {
            oldClass = this.$ul.find('label:first').attr('class');
            _theme = oldClass.split(" ")[1].slice(-1);
        }
        return (_theme || "").toUpperCase();
    }

});


// 弹出一个输入选项框
UI.RadioButtonH.prototype.__defineGetter__('data', UI.RadioButtonH.prototype._getData);
UI.RadioButtonH.prototype.__defineSetter__('data', UI.RadioButtonH.prototype._setData);
UI.RadioButtonH.prototype.__defineGetter__('value', UI.RadioButtonH.prototype._getValue);
UI.RadioButtonH.prototype.__defineSetter__('value', UI.RadioButtonH.prototype._setValue);
UI.RadioButtonH.prototype.__defineGetter__('text', UI.RadioButtonH.prototype._getText);
UI.RadioButtonH.prototype.__defineSetter__('text', UI.RadioButtonH.prototype._setText);
UI.RadioButtonH.prototype.__defineGetter__('titleText', UI.RadioButtonH.prototype._getTitleText);
UI.RadioButtonH.prototype.__defineSetter__('titleText', UI.RadioButtonH.prototype._setTitleText);
UI.RadioButtonH.prototype.__defineGetter__('theme', UI.RadioButtonH.prototype._getTheme);
UI.RadioButtonH.prototype.__defineSetter__('theme', UI.RadioButtonH.prototype._setTheme);
