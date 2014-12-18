/**
 * UI.RadioButton Vertical Control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.RadioButtonH
 */
UI.RadioButtonV = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);

};

extend(UI.RadioButtonV, UI.RadioButtonH, {
    type: "UI.RadioButtonV",

    _html: '<div> <fieldset data-role="controlgroup" class="ui-corner-all ui-controlgroup ui-controlgroup-vertical">' +
        ' <div role="heading" class="ui-controlgroup-label" >Choose a thing:</div>' +
        ' <div class="ui-controlgroup-controls">' +
        ' <div class="ui-radio">' +
        ' 	<input type="radio" style="margin-top:7px;" name="radio-choice-1" id="" value="Radio tea">' +
        ' 	<label  class="ui-btn ui-btn-up-d ui-btn-icon-left ui-corner-top ui-radio-off">' +
        ' 		<span class="ui-btn-inner" style="min-height:28px">' +
        '			<span class="ui-btn-text">Radio tea</span>' +
        ' 			<span class="ui-icon ui-icon-shadow ui-icon-radio-off" style="width: 16px;height:16px;">&nbsp;</span>' +
        ' 		</span>' +
        '	</label>' +
        ' </div>' +
        ' <div class="ui-radio">' +
        ' 	<input type="radio" style="margin-top:7px;" name="radio-choice-1" id="" value="Radio cofee">' +
        ' 	<label  class="ui-btn ui-btn-up-d ui-btn-icon-left ui-corner-bottom ui-controlgroup-last ui-radio-off">' +
        ' 		<span class="ui-btn-inner">' +
        ' 			<span class="ui-btn-text">Radio coffee</span>' +
        ' 			<span class="ui-icon ui-icon-shadow ui-icon-radio-off" style="width: 16px;height:16px;">&nbsp;</span>' +
        ' 		</span>' +
        '	 </label>' +
        ' </div>' +
        ' </div>' +
        ' </fieldset> </div>',

    _radio: null,


    /**
     * 生成选项属性
     * @param data
     */
    _setData: function(data) {
        if (typeof  data == "string")
            data = parseFromJsonText(data);
        if (!data || data.length == 0 || !this.rendered)
            return;
        this._radio.datas = data;
        var rootEle = $(this._radio);
        var isCheckBox = $(rootEle).find('div.ui-radio').size() == 0;

        rootEle = rootEle.find('div.ui-controlgroup-controls');

        var div = rootEle.find('div:first');

        $(div).find('label').removeClass('ui-corner-top');

        rootEle.html('');
        var _width = $(rootEle).parent().width() - 4;

        //动态设置
        $.each(data, function() {
            div = $(div).clone();
            $(div).find('input').val(this.value);
            $(div).find('span.ui-btn-text').html(this.text);

            if (this.checked && this.checked != "false") {

                if (!isCheckBox) {
                    $(div).find('label').removeClass('ui-radio-off').addClass('ui-radio-on');
                    $(div).find('span.ui-icon').removeClass('ui-icon-radio-off').addClass('ui-icon-radio-on');
                }
                else {
                    $(div).find('span.ui-icon').removeClass('ui-icon-checkbox-off').addClass('ui-icon-checkbox-on');
                    $(div).find('label').removeClass('ui-checkbox-off').addClass('ui-checkbox-on');
                }

            }
            else {
                if (!isCheckBox) {
                    $(div).find('label').removeClass('ui-radio-on').addClass('ui-radio-off');
                    $(div).find('span.ui-icon').removeClass('ui-icon-radio-on').addClass('ui-icon-radio-off');
                }
                else {
                    $(div).find('span.ui-icon').removeClass('ui-icon-checkbox-on').addClass('ui-icon-checkbox-off');
                    $(div).find('label').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
                }
            }

            rootEle.append(div);
        });

        $(rootEle).find('div:first').find('label').addClass('ui-corner-top');
        $(rootEle).find('div:last').find('label').addClass('ui-corner-bottom ui-controlgroup-last');
        $(this._radio).parent().css('height', 'auto');
        this.bindEvent();
    },

    /**
     * 获取所有选项属性
     * @param value
     */
    _getData: function() {
        var lists = [], divClass;
        //divClass = $(this._radio).find('div.ui-radio').size()>0?'div.ui-radio':'div.ui-checkbox';
        $.each($(this._radio).find('div.ui-controlgroup-controls').find('div'), function(ind, ele) {
            var str = {};
            str.text = $(ele).find('span.ui-btn-text').html();
            str.value = $(ele).find('input').val();
            str.checked = $(ele).find('.ui-radio-on').size() > 0 || $(ele).find('.ui-checkbox-on').size() > 0;
            lists.push(str);
        });

        if (lists.length != 0) {
            this._radio.datas = lists;
        }

        return lists.length != 0 ? lists : "";
    },

    /**
     * 保存被选中项的真实值
     * @param value
     */
    _setValue: function(value) {
        if (!value || !this.rendered)
            return;

        var _radioType = this.type.indexOf('RadioButton') > 0 , once = 0;
        var rootEle = $(this._radio);
        this._radio.value = value;

        if (_radioType) {
            rootEle.find('label').removeClass('ui-radio-on').addClass('ui-radio-off');
            rootEle.find('span.ui-icon').removeClass('ui-icon-radio-on').addClass('ui-icon-radio-off');
        }
        else {
            rootEle.find('span.ui-icon').removeClass('ui-icon-checkbox-on').addClass('ui-icon-checkbox-off');
            rootEle.find('label').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
        }


        var _objRadio = rootEle.find('.ui-controlgroup-controls div');
        var arr = value.split(',');
        $.each(arr, function(ind, ele) {
            $.each(_objRadio, function(i, e) {
                var _text = $.trim($(e).find('input').val());
                if ($.trim(ele) == _text) {
                    once++;

                    if (_radioType) {
                        $(e).find('label').removeClass('ui-radio-off').addClass('ui-radio-on');
                        $(e).find('span.ui-icon').removeClass('ui-icon-radio-off').addClass('ui-icon-radio-on');
                    }
                    else {
                        $(e).find('span.ui-icon').removeClass('ui-icon-checkbox-off').addClass('ui-icon-checkbox-on');
                        $(e).find('label').removeClass('ui-checkbox-off').addClass('ui-checkbox-on');
                    }
                }
            });

            if (_radioType && once > 0)
                return false;

        });


    },

    /**
     * 获取被选中项的真实值
     * @param value
     */
    _getValue: function() {
        var _tValue = "";
        if ($(this._radio).find('label.ui-radio-on').size() > 0)
            _tValue = $(this._radio).find('label.ui-radio-on').parent().find('input').val();
        else if ($(this._radio).find('label.ui-checkbox-on').size() > 0)
            _tValue = $(this._radio).find('label.ui-checkbox-on').map(function() {
                return $(this).parent().find('input').val();
            }).get().join(",");
        else
            _tValue = "";
        return _tValue;

    },

    /**
     * 保存被选中项的text
     * @param value
     */
    _setText: function(value) {
        if (!value || !this.rendered)
            return;
        this._radio.text = value;
        var _radioType = this.type.indexOf('RadioButton') > 0 , once = 0;
        var rootEle = $(this._radio);
        if (_radioType) {
            rootEle.find('label').removeClass('ui-radio-on').addClass('ui-radio-off');
            rootEle.find('span.ui-icon').removeClass('ui-icon-radio-on').addClass('ui-icon-radio-off');
        }
        else {
            rootEle.find('span.ui-icon').removeClass('ui-icon-checkbox-on').addClass('ui-icon-checkbox-off');
            rootEle.find('label').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
        }


        var _objRadio = rootEle.find('.ui-controlgroup-controls div');
        var arr = value.split(',');
        $.each(arr, function(ind, ele) {
            $.each(_objRadio, function(i, e) {
                var _text = $.trim($(e).find('span.ui-btn-text').html());
                if ($.trim(ele) == _text) {
                    once++;

                    if (_radioType) {
                        $(e).find('label').removeClass('ui-radio-off').addClass('ui-radio-on');
                        $(e).find('span.ui-icon').removeClass('ui-icon-radio-off').addClass('ui-icon-radio-on');
                    }
                    else {
                        $(e).find('span.ui-icon').removeClass('ui-icon-checkbox-off').addClass('ui-icon-checkbox-on');
                        $(e).find('label').removeClass('ui-checkbox-off').addClass('ui-checkbox-on');
                    }
                }
            });

            if (_radioType && once > 0)
                return false;

        });

    },


    /**
     * 获取被选中项的文本信息
     * @param value
     */
    _getText: function() {
        var _tText = "";
        if ($(this._radio).find('label.ui-radio-on').size() > 0)
            _tText = $(this._radio).find('label.ui-radio-on').find('span.ui-btn-text').html();
        else if ($(this._radio).find('label.ui-checkbox-on').size() > 0)
            _tText = $(this._radio).find('label.ui-checkbox-on').map(function() {
                return $(this).find('span.ui-btn-text').html();
            }).get().join(',');
        else
            _tText = "";
        return _tText;

    },


    /**
     *     渲染
     *    @return {Boolean} 是否渲染成功，渲染失败或者已经渲染会返回false
     */
    render: function() {

        if (!this._renderBase())
            return false;
        this._radio = $(this._element.children[0]);
        this.$ul = this._radio;
        this.bindEvent();

        this._rendered = true;
        return true;
    },

    bindEvent: function() {
        var self = this;
        var isCheckBox = $(this._radio).find('div.ui-radio').size() == 0;
        this.find('div.ui-controlgroup-controls').find('div').unbind("click").bind("click", function() {
            if (!isCheckBox) {				// 是否多选框
                // 选中样式处理
                $(this).parent().find('label').removeClass('ui-radio-on').addClass('ui-radio-off');
                $(this).parent().find('span.ui-icon').removeClass('ui-icon-radio-on').addClass('ui-icon-radio-off');
                $(this).find('label').removeClass('ui-radio-off').addClass('ui-radio-on');
                $(this).find('span.ui-icon').removeClass('ui-icon-radio-off').addClass('ui-icon-radio-on');
            }
            else {

                var checked = ($(this).find('span.ui-icon-checkbox-on').size() > 0);
                if (checked) {
                    $(this).find('span.ui-icon').removeClass('ui-icon-checkbox-on').addClass('ui-icon-checkbox-off');
                    $(this).find('label').removeClass('ui-checkbox-on').addClass('ui-checkbox-off');
                }
                else {
                    $(this).find('span.ui-icon').removeClass('ui-icon-checkbox-off').addClass('ui-icon-checkbox-on');
                    $(this).find('label').removeClass('ui-checkbox-off').addClass('ui-checkbox-on');
                }
                //values = "";
                //texts = "";
                ///	$(this).parent().find('label.ui-checkbox-on').each(function(ind,ele){
                //if(ind>0){
                //	values += ",";
                //	texts +=",";
                //}

                //values +=  $(ele).parent().find(':checkbox').val();
                //texts +=$(ele).find('span.ui-btn-text').html();
                //});
                //self.value =values;// .attr('name');
                //self.text = texts;
            }
            self.onClick();
        });
    }

});


UI.RadioButtonV.prototype.__defineGetter__('data', UI.RadioButtonV.prototype._getData);
UI.RadioButtonV.prototype.__defineSetter__('data', UI.RadioButtonV.prototype._setData);
UI.RadioButtonV.prototype.__defineGetter__('value', UI.RadioButtonV.prototype._getValue);
UI.RadioButtonV.prototype.__defineSetter__('value', UI.RadioButtonV.prototype._setValue);
UI.RadioButtonV.prototype.__defineGetter__('text', UI.RadioButtonV.prototype._getText);
UI.RadioButtonV.prototype.__defineSetter__('text', UI.RadioButtonV.prototype._setText);
