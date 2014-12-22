/**
 * UI.SelectBox control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 */
UI.SelectBox = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);

};

extend(UI.SelectBox, UI.Control, {
    type: "UI.SelectBox",

    _html: '<div><div class="ui-select" style="height:100%;width:100%;"><div style="height:100%;width:100%;margin:0;"'
        + 'class="ui-btn ui-btn-icon-right ui-btn-corner-all ui-shadow ui-btn-up-c">'
        + '<span class="ui-btn-inner ui-btn-corner-all" style="margin-top: 0px;height: 30px;line-height: 25px;">'
        + '<span class="ui-btn-text" id="selectBoxValue">DisplayName1</span>'
        + '<span class="ui-icon ui-icon-arrow-d ui-icon-shadow"></span> '
        + '</span><select><option value="value1">DisplayName1</option>'
        + '<option value="value2">DisplayName2</option><option value="value3">DisplayName3</option>'
        + '</select></div></div></div>',

    /*
     *  @type: function(value)  event listeners
     */
    onChange: null,

    $select: null,

    _theme: "C",

    /*
     *	 渲染
     *	@return {Boolean} 是否渲染成功，渲染失败或者已经渲染会返回false
     */
    render: function() {
        if (!this._renderBase())
            return false;
        this.$select = this.$("select");
        var _this = this;
        this.$select.bind("change", function() {
            _this._onValueChanged();
        });
        this._rendered = true;
        return true;
    },

    _onValueChanged: function(){
        var selectEl = this.$select[0];
        if(selectEl.selectedIndex == -1)
            this.$("#selectBoxValue").text("");
        else
            this.$("#selectBoxValue").text(selectEl.options[selectEl.selectedIndex].text);
        if(this.onChange)
            this.onChange();
    },

    getTheme: function() {
        return this._theme;
    },

    setTheme: function(theme) {
        if (!theme || !inArray(UI.THEMES, theme.toUpperCase()))
            return;
        if (this._rendered) {
            this._theme = theme.toUpperCase();
            this.$(".ui-btn-icon-right").attr("class", "ui-btn ui-btn-icon-right ui-btn-corner-all ui-shadow ui-btn-up-" + theme.toLowerCase());
        }
    },

    getValue: function() {
        if(!this.rendered)
            return "";
        return this.$select.val() || "";
    },

    setValue: function(value) {
        if (!value)
            value = "";
        var oldValue =  this.$select.val();
        this.$select.val(value);
        if(oldValue != this.$select.val()){
            this._onValueChanged();
        }
    },

    getText: function() {
        return this.$('#selectBoxValue').text();
    },

    getSelectedIndex: function(){
        return this.rendered ? this.$select[0].selectedIndex : -1;
    },

    setSelectedIndex: function(index){
        if(!this.rendered)
          return;
        this.$select[0].selectedIndex = index;
        this._onValueChanged();
    },

    getData: function() {
        var array = [];
        $.each(this.$select.find('option'), function() {
            var obj = {};
            obj.name = this.text;
            obj.value = this.value;
            array.push(obj);
        });
        return array;
    },

    setData: function(data) {
        if(!this.rendered)
            return;
        if(typeof data == "string")
            data = parseFromJsonText(data);
        if(!is(data, "Array"))
            return;
        this.$select.empty();
        var $select = this.$select;
        $.each(data, function() {
            $select.append(new Option(this.name, this.value));
        });
        if(data.length> 0)
            $select[0].selectedIndex = 0;
        this._onValueChanged();
    }

});


UI.SelectBox.prototype.__defineGetter__('theme', UI.SelectBox.prototype.getTheme);
UI.SelectBox.prototype.__defineSetter__('theme', UI.SelectBox.prototype.setTheme);
UI.SelectBox.prototype.__defineGetter__('value', UI.SelectBox.prototype.getValue);
UI.SelectBox.prototype.__defineSetter__('value', UI.SelectBox.prototype.setValue);
UI.SelectBox.prototype.__defineGetter__('selectedIndex', UI.SelectBox.prototype.getSelectedIndex);
UI.SelectBox.prototype.__defineSetter__('selectedIndex', UI.SelectBox.prototype.setSelectedIndex);
UI.SelectBox.prototype.__defineGetter__('text', UI.SelectBox.prototype.getText);
UI.SelectBox.prototype.__defineGetter__('data', UI.SelectBox.prototype.getData);
UI.SelectBox.prototype.__defineSetter__('data', UI.SelectBox.prototype.setData);

