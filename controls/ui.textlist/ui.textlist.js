/**
 * UI.TextList control
 * @param container
 * @constructor
 * @superClass UI.Control
 */
UI.TextList = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.TextList, UI.Control, {
    type: "UI.TextList",

    _html: '<div><ul id="objListUl_" class="ui-listview">'
        + '<li class="ui-btn-icon-right ui-btn-up-c" style="padding-top:3px;min-height:36px;"><div class="ui-btn-inner"><div class="ui-btn-text"><a href="javascript:void(0);" class="ui-link-inherit">Acura</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>'
        + '<li class="ui-btn-icon-right ui-btn-up-c" style="padding-top:3px;min-height:36px;"><div class="ui-btn-inner"><div class="ui-btn-text"><a href="javascript:void(0);" class="ui-link-inherit">Buffer</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>'
        + '<li class="ui-btn-icon-right ui-btn-up-c" style="padding-top:3px;min-height:36px;"><div class="ui-btn-inner"><div class="ui-btn-text"><a href="javascript:void(0);" class="ui-link-inherit">Coffee</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>'
        + '</ul></div>',

    //定义列表项的默认格式
    _defaultContent: '<li class="ui-btn-icon-right ui-btn-up-c" style="padding-top:3px;min-height:36px;">' +
        '<div class="ui-btn-inner"><div class="ui-btn-text"><a href="javascript:void(0);" class="ui-link-inherit">Acura</a></div>' +
        '<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>',

    _textlist: null,

    /*
     *  @type: function(value)
     */
    onClick: null,

    _dataStore: [], //保存初始化参数集


    _currentPage: 1, //当前页

    _records: 20,    //每页显示记录数

    /**
     *     渲染
     *    @return {Boolean} 是否渲染成功，渲染失败或者已经渲染会返回false
     */
    render: function() {
        if (!this._renderBase())
            return false;
        this._textlist = this._element.children[0];
        var self = this;
        this.bindEvent();
        this._rendered = true;
        return true;
    },

    bindEvent: function(){
        $(this._textlist).find('li').unbind('click').bind('click', function() {
            $(this).parent().find('li').removeClass('ui-btn-active');
            $(this).addClass('ui-btn-active');
            if(self.onClick)
                self.onClick();
        });
    },

    /**
     * 提供初始化数据绑定接口
     */
    setData: function(jsonData) {
        if (!jsonData) return "";
        this._setLstText(jsonData);
    },

    /**
     * 获取所有列表数据项
     * json数据格式：
     * [{"title":"Acura","url":"#"},{"title":"Buffer","url":"#"}]
     */
    _getLstText: function() {
        var lists = [], str;
        $.each($(this._textlist).find('a'), function() {
            str = {};
            str.title = $(this).text();
            str.url = $(this).attr('href');
            lists.push(str);
        });
        return lists.length != 0 ? lists : "";
    },

    /**
     * 传入json数据格式列表项数据来设置列表项
     * @param value json数据 格式：[{"title":"Acura","url":"#"},{"title":"Buffer","url":"#"}]
     * @param flag    搜索组件使用标志
     */
    _setLstText: function(value, flag) {
        if (!value || !this._textlist) return;
            //json格式文本解析捕获异常处理
            if (!is(value, "Array")) {
                try {
                    value = parseFromJsonText(value);
                } catch (e) {
                    if (console)
                        console.warn("failed to parse json text '%s'.\nError: %o", value, e);
                    return null;
                }
            }
            //处理带搜索的ui组件
            if (value.length == 0) {
                if (!flag)
                    return "";
                else
                    $(this._textlist).html('');
            }
            //搜索组件保存初始化数据
            if (!flag && this._dataStore) {
                this._dataStore = value;
            }
            var ul = $(this._textlist);
            var li = ul.find('li:last');
            //移除选中样式
            li.removeClass('ui-btn-active');
            //如果所有的li被删除
            if (li.length == 0) li = $(this._defaultContent);
            var height = 40 * value.length;
            //处理不同子类不同处理
            if (ul.find('li:first[id=title]').length != 0) {
                ul.find('li:gt(0)').remove();
                height += 31;
            }
            else {
                ul.html('');
            }
            //处理带标题组件
            if (li.attr('id') == 'title') return null;
            //动态设置
            $.each(value, function() {
                li = li.clone();
                li.find('a').attr('href', this.url ? this.url : "").text(this.title ? this.title : " ");
                ul.append(li);
            });
            //带搜索框
            if (this._getFilterable()) {
                height += 53;
            }
            //带更多底部条
            if (this.$('#moreRecords').css('display') == 'block') {
                height += 33;
            }
            $(this._textlist).parent().height(height);
            this.bindEvent();
            this.trigger(UI.Event.Resized, {});
    },

    /**
     * 是否带搜索框实现过滤功能
     * @return Boolean
     */
    _getFilterable: function() {
        return this.$('.ui-listview-filter').length > 0 ? true : false;
    },

    /**
     * 设置是否带搜索框实现过滤功能
     */
    _setFilterable: function(flag) {
        if (!this._textlist) return;
        if (flag) {
            this._addSearch();
        }
        else {
            this._removeSearch();
        }
    },

    /**
     * 获取当前设置每页所显示记录数
     */
    _getPageSize: function() {
        return this._records;
    },

    /**
     *    设置每页所显示记录数
     */
    _setPageSize: function(num) {
        if (!num) return;
        this._records = parseInt(num);
        //此处区分运行时与设计时的不同处理
        if (checkRuntime() != RUNTIME_DESIGN) {
            var arr = this._getLstText(), num = this._records * this._currentPage;
            //如果总记录数大于设置数据则需显示更多操作栏
            this._toggleMore(arr);
            this._setLstText(arr.slice(0, num), true);
        }
    },


    /**
     * 创建搜索框元素
     */
    _addSearch: function() {
        if (!this._textlist || this._getFilterable()
            || $(this._textlist).find('li:first[id=title]').length != 0) return;
        $('<form class="ui-listview-filter ui-bar-c" style="margin:0px;"><div class="ui-input-search ui-shadow-inset ui-btn-corner-all ui-btn-shadow ui-icon-searchfield ui-body-c"><input placeholder="keyword" type="text" class="ui-input-text ui-body-c"></div></form>').insertBefore(this._textlist);
        //搜索框绑定事件
        var self = this;
        this.$('form input[type=text]').bind('keyup', function(event) {
            self._currentPage = 1;
            self.filter(this.value);
        });
    },

    /**
     * 移除搜索框元素
     */
    _removeSearch: function() {
        if (!this._textlist || !this._getFilterable()
            || $(this._textlist).find('li:first[id=title]').length != 0) return;
        $(this._textlist).parent().find('.ui-listview-filter').remove();
    },

    /**
     * 创建 >>更多 底部条
     */
    _addMore: function() {
        if (!this._textlist || this.$('#moreRecords').length > 0) return false;
        $('<span class="ui-btn-up-c" id="moreRecords" style="width:100%;float:right;text-align:right;border:0px;height:25px;line-height:25px;font-size: 12px;font-weight: normal;cursor:pointer;color:#2F3E46;">&gt;&gt;更多</span>').insertAfter(this._textlist);
        //更多记录绑定事件
        var self = this;
        this.$('#moreRecords').bind('click', function() {
            self._currentPage++;
            self.filter($(self._element).find('form input[type=text]').val());
        });
        return true;
    },

    /**
     * 移除 >>更多 底部条
     * @return
     */
    _removeMore: function() {
        if (this._textlist && $(this._textlist).find('#moreRecords').length > 0) {
            $(this._textlist).find('#moreRecords').remove();
        }
    },

    /**
     * 控制 >>更多 底部条 显示/隐藏
     * @param arr
     * @return
     */
    _toggleMore: function(arr) {
        var num = this._records * (this._currentPage - 1);
        //过滤总记录小于当前所需取的数据则停留在当前页
        if (arr.length > num) {
            num += this._records;
            if (arr.length > num) {
                this._addMore();
                this.$('#moreRecords').show();
            }
            else {
                this.$('#moreRecords').hide();
            }
        }
        else {
            0 == this._currentPage ? --this._currentPage : 1;
        }
        return num;
    },

    /**
     * 条件输入框内容改变时结果过滤
     */
    filter: function(key) {
        var arr = [], num = this._records * (this._currentPage - 1);
        if (key) {
            //过滤集合
            $.each(this._dataStore, function() {
                if (this.title) {
                    if (this.title.toLowerCase()
                        .indexOf(key.toLowerCase()) >= 0) {
                        arr.push(this);
                    }
                }
            });
        }
        else {//key为null 则使用原集合数据
            arr = this._dataStore;
        }
        //显示总的数据记录数
        var num = this._toggleMore(arr);
        //处理过滤结果显示
        this._setLstText(arr.slice(0, num), true);
    },

    /**
     * 返回列表数据项 格式：
     * [{"title":"Acura","url":"#"},{"title":"Buffer","url":"#"}]
     */
    _getItems: function() {
        if (!this._textlist) null;
        //将数据转换成json数组字符串
        return stringifyToJsonText(this._getLstText());
    },

    /**
     * 设置列表数据项
     * @param items 格式：
     * [{"title":"Acura","url":"#"},{"title":"Buffer","url":"#"}]
     */
    _setItems: function(items) {
        this._setLstText(items);
    },

    /**
     * 返回选中项text文本方法
     */
    _getText: function() {
        var o = $(this._textlist).find('.ui-btn-active a');
        return o.length != 0 ? o.text() : "";
    },

    /**
     *    通过text文本来选中与之匹配的文本项
     */
    _setText: function(text) {
        //去左右空格
        var txt = $.trim($('.ui-btn-active a').text());
        //如果传入值与当前选中值相等则直接返回
        if (text == txt) return;
        var colle = $(this._textlist).find('li');
        //移除所有的选中样式
        colle.removeClass('ui-btn-active');
        if (!text) return;
        //设置新选中项
        $.each(colle, function() {
            if (text == $.trim($(this).find('a').text())) {
                $(this).addClass('ui-btn-active');
                return false;
            }
        });
    },

    /**
     * 根据参数序号index更新index项的文本内容
     * 如果index为undefined则更新选中项
     */
    _updateText: function(text, index) {
        if (index) {//传入序列号
            if (!isNaN(index)) {//index是否为数字
                if ($(this._textlist).find('li:first[id=title]').length != 0)
                    index++;
                var li = $(this._textlist).find(String.format('li:eq({0})', (parseInt(index) - 1)));
                li.find('a').text(text);
            }
        }
        else {//无序列号则更改选中项
            var activeItem = $(this._textlist).find('.ui-btn-active');
            if (0 != activeItem.length) {
                activeItem.find('a').text(text);
            }
        }
    },

    /**
     *  返回选中项链接地址方法
     */
    _getUrl: function() {
        var o = $(this._textlist).find('.ui-btn-active a');
        return o.length != 0 ? o.attr('href') : "";
    },

    /**
     * 通过传入的url来选中与之匹配的列表项
     */
    _setUrl: function(url) {
        //获取当前选中项url
        var uri = $('.ui-btn-active a').attr('href');
        if (url == uri) return;
        var colle = $(this._textlist).find('li');
        //移除所有的选中样式
        colle.removeClass('ui-btn-active');
        if (!url) return;
        $.each(colle, function() {
            if (url == $(this).find('a').attr('href')) {
                $(this).addClass('ui-btn-active');
                return false;
            }
        });
    },
});


UI.TextList.prototype.__defineGetter__('lstText', UI.TextList.prototype._getLstText);
UI.TextList.prototype.__defineSetter__('lstText', UI.TextList.prototype._setLstText);
UI.TextList.prototype.__defineGetter__('filterable', UI.TextList.prototype._getFilterable);
UI.TextList.prototype.__defineSetter__('filterable', UI.TextList.prototype._setFilterable);
UI.TextList.prototype.__defineGetter__('pageSize', UI.TextList.prototype._getPageSize);
UI.TextList.prototype.__defineSetter__('pageSize', UI.TextList.prototype._setPageSize);


