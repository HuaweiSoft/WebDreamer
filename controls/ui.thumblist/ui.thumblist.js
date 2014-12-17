/**
 *  UI.ThumbList
 * @dependency  stdfunc.js、ui.control.js
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 */
UI.ThumbList = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    /************************************************************************/
    /* private property  取消圆弧 ui-btn-corner-top  ui-btn-corner-bottom
     * 带有图片、文字、二级标题文字的listView                           */
    /************************************************************************/
    var dir = "controls/ui.thumblist/resources/";
    var html = '<div>' +
        //    	'<div class="ui-input-search ui-shadow-inset ui-btn-corner-all ui-btn-shadow ui-icon-searchfield ui-body-c" style="display:none">'+
        //    	'<input placeholder="Filter items..." type="text" class="ui-input-text ui-body-c"></div>'+ style="height:100%;"style="height:100%;"style="height:100%;"
        '<ul data-role="" class="ui-listview"> ' +
        '<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" ' +
        '	data-icon="arrow-r" style="padding:0px;min-height:50px;" data-iconpos="right"  class="ui-btn-icon-right ui-btn-up-c">' +
        '		<div class="ui-btn-inner ui-li" >' +
        '			<div class="ui-btn-text" >' +
        ' 				<a  class="ui-link-inherit" style="padding:0px;">  ' +
        '					<img src="' + convertPath(dir + 'album-bb.jpg') + '"  style="border-top-left-radius: 7px; border-top-right-radius: 5px; border-bottom-right-radius: 5px; border-bottom-left-radius: 7px; height:45px;width:45px;padding-left:3px;margin-top:4px"> ' +
        '					<h3 class="ui-li-heading" style="margin-left:65px;margin-top:-44px;">Broken Bells</h3> ' +
        '					<p class="ui-li-desc" style="margin-left:65px;">Broken Bells</p><input type="hidden" name="temp1"><input type="hidden" name="temp2"><input type="hidden" name="temp3"><input type="hidden" name="temp4">' +
        '				</a> </div> ' +
        '				<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>' +
        '			</div>' +
        '</li>' +
        '<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" ' +
        '	data-icon="arrow-r" style="padding:0px;min-height:50px;" data-iconpos="right"  class="ui-btn-icon-right ui-btn-up-c">' +
        '		<div class="ui-btn-inner ui-li" >' +
        '			<div class="ui-btn-text">' +
        ' 				<a  class="ui-link-inherit" style="padding:0px;">  ' +
        '					<img src="' + convertPath(dir + 'album-af.jpg') + '"  style="border-top-left-radius: 7px; border-top-right-radius: 5px; border-bottom-right-radius: 5px; border-bottom-left-radius: 7px; height:45px;width:45px;padding-left:3px;margin-top:4px"> ' +
        '					<h3 class="ui-li-heading" style="margin-left:65px;margin-top:-44px;">Cars Benchi</h3> ' +
        '					<p class="ui-li-desc" style="margin-left:65px;">Fore Lunzi</p><input type="hidden" name="temp1"><input type="hidden" name="temp2"><input type="hidden" name="temp3"><input type="hidden" name="temp4">' +
        '				</a> </div> ' +
        '				<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>' +
        '			</div>' +
        '</li>' +
        '<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" ' +
        '	data-icon="arrow-r" style="padding:0px;min-height:50px;" data-iconpos="right"  class="ui-btn-icon-right ui-btn-up-c">' +
        '		<div class="ui-btn-inner ui-li" >' +
        '			<div class="ui-btn-text">' +
        ' 				<a  class="ui-link-inherit" style="padding:0px;">  ' +
        '					<img src="' + convertPath(dir + 'album-bk.jpg') + '"  style="border-top-left-radius: 7px; border-top-right-radius: 5px; border-bottom-right-radius: 5px; border-bottom-left-radius: 7px; height:45px;width:45px;padding-left:3px;margin-top:4px"> ' +
        '					<h3 class="ui-li-heading" style="margin-left:65px;margin-top:-44px;">Lines</h3> ' +
        '					<p class="ui-li-desc" style="margin-left:65px;">Line Pit</p><input type="hidden" name="temp1"><input type="hidden" name="temp2"><input type="hidden" name="temp3"><input type="hidden" name="temp4">' +
        '				</a> </div> ' +
        '				<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>' +
        '			</div>' +
        '</li>' +
        '</ul>' +

    '</div>';
    this._html = html;
};

extend(UI.ThumbList, UI.Control, {
    type: "UI.ThumbList",

    themeStyle: ["a", "b", "c", "d", "e", "f"],
    imageUrlDIr: "", // 获取服务器的加载图片地址

    myindex: null,// 声明用于传递参数的变量
    mytext: null, // 声明用于传递参数的变量
    context: null,// 声明用于传递filter参数的内容
    defaulHtml: null,

    _thumlist: null,

    //保存初始化参数集
    _dataStore: {},

    _showDatas: {},

    //当前页
    _currentPage: 1,

    //当前模式 1： 启动模式/0：设计模式
    _currentState: 1,

    //每页显示记录数
    _pageSize: 5,


    /************************************************************************/
    /* event handler -- function object                                 */
    /************************************************************************/
    /*
     *  @type: function(value)
     */
    onClick: null,


    /**
     *  根据传入的数据生成list
     *  */
    _setDataspanel: function(value, sift) {
        if (!value || value.length == 0)
            value = {};
        if (!this._thumlist)
            return;
        this._thumlist.datas = value;
        var jsonObj = value;
        this._pageSize = this._pageSize || this._thumlist.pageSize;
        var _count = parseInt(this._pageSize) * parseInt(this._currentPage);  		// 总共要显示的条数
        var isFilter = this._thumlist.search;

        if (!is(value, "Array")) {
            jsonObj = parseFromJsonText(value);
        }

        if (!sift)// 非处理后的数据，才给_datastore赋值
            this._dataStore = jsonObj;

        var ul = this._thumlist;
        var oldli = ul.find('li:first');

        if (oldli.length == 0) oldli = this.defaulHtml;

        var _height = $(oldli).height();
        oldli.removeClass('ui-btn-corner-top').removeClass('ui-btn-corner-bottom');

        ul.html('');
        if (jsonObj && jsonObj.length > 0) {
            var _imgUrl;
            var self = this;
            //动态设置
            $.each(jsonObj, function(ind, ele) {

                if (self._currentState == 1 && ind >= _count) return false;

                var $li = $(oldli).clone();
                if ($li.find('img').size() > 0 && ele.imgUrl) {
                    _imgUrl = ele.imgUrl;
                    $li.find('img').attr('src', convertPath(_imgUrl));
                }
                if (ele.tmp1)

                    $($li.find('input')[0]).val(ele.tmp1);

                if (ele.tmp2)

                    $($li.find('input')[1]).val(ele.tmp2);

                if (ele.tmp3)

                    $($li.find('input')[2]).val(ele.tmp3);

                if (ele.tmp4)

                    $($li.find('input')[3]).val(ele.tmp4);


                if (ele.title)
                    $li.find('h3').html(ele.title);
                if (ele.name)
                    $li.find('h3').html(ele.name);
                if (ele.url)
                    $li.find('a').attr('href', ele.url);

                if (ele.subtitle && $li.find('p').size() > 0)
                    $li.find('p').html(ele.subtitle);

                if (ele.count && $li.find('span.ui-li-count').size() > 0)
                    $li.find('span.ui-li-count').html(ele.count);

                if (ele.detail && $li.find('span.ui-text').size() > 0)
                    $li.find('span.ui-text').html(ele.detail);

                ul.append($li);
            });

            /*取消圆弧设置*/
            //ul.find('li:first').addClass('ui-btn-corner-top');
            //ul.find('li:last').addClass('ui-btn-corner-bottom');
        }
        // 启动模式
        if (this._currentState == 1 && jsonObj && jsonObj.length > _count) {
            this._thumlist.parent().find('#moreRecords').show();
        }
        else {
            this._thumlist.parent().find('#moreRecords').hide();
        }

        if (this._currentState == 0) {
            _height = this._thumlist.height(); //_height * (jsonObj?jsonObj.length:0);
            if (isFilter)_height += 35;			// 是否加文本框
            // 调整高度适应
            this._thumlist.parent().css("height", _height).parent().find('#objectSelection').css("height", _height + 2);
        }
        else {

            _height = this._thumlist.parent().height(); //_height * (jsonObj?jsonObj.length:0);
            //if(isFilter)_height += 35;
            this._thumlist.parent().css('height', 'auto');
            if (jsonObj && jsonObj.length > _count) {
                this._thumlist.parent().css('padding', "0px 0px 30px");
            }
            else {
                this._thumlist.parent().css('padding', "0px");
            }

        }
        this._showDatas = jsonObj;			// 记录当前保存信息
        this.bindEvent();
    },

    /**
     *  获取list表的数据
     *  @return Array
     **/
    _getDataspanel: function() {

        //	  $(selectULObj).parent().append('<span style="display:none" id="handle"></span>');
        if (this._thumlist.parent().find('#handleListPic_save').size() == 0) {
            return this._dataStore || {};
        }

        if (this._currentState == 1 && this._dataStore.length > 0) {
            return this._dataStore;
        }

        this._thumlist.parent().find('#handleListPic_save').remove();
        //this._currentPage = 1;

        var lists = [], str;
        $.each(this._thumlist.find('li'), function(ind, ele) {
            str = {};
            var $el = $(ele);
            if ($el.find('img').attr('src'))
                str.imgUrl = reversePath($el.find('img').attr('src'));
            if ($el.find('p').size() > 0)
                str.subtitle = $el.find('p').html();

            if ($el.find('span.ui-li-count').size() > 0)
                str.count = $el.find('span.ui-li-count').html();

            if ($el.find('span.ui-text').size() > 0)
                str.detail = $el.find('span.ui-text').html();

            str.title = $el.find('h3').html();
            str.url = $el.find('a').attr('href') || "#";

            lists.push(str);
        });
        if (lists.length != 0) {
            this._dataStore = lists;
        }

        return lists.length != 0 ? lists : "";
    },

    /**
     *  根据传入单个的数据修改信息
     *    如果传入数据中有 number (从 1 开始)指定的数字 就修改list中的第（number）个；
     *    否 默认修改当前选中。
     *@param jsonValue :'{"imgUrl":"","name":"","displayName":"","url":"","number":"是否有指定某一个的数字"}'
     */
    _setOnceData: function(jsonValue) {
        this.myindex = null;
        if (!jsonValue || !this._thumlist)
            return false;

        var jsonObj = jsonValue;
        if (!is(jsonValue, "Array")) {
            jsonObj = parseFromJsonText(jsonValue);
        }
        if (jsonObj.length == 0)
            return false;


        var $editLi = "" , nth , $editUl = this._thumlist;

        if ($editUl.find('li.ui-btn-active').size() > 0) {
            $editLi = $editUl.find('li.ui-btn-active');
        }

        nth = jsonObj.number || "";
        if (nth && !isNaN(nth)) {
            // 根据数字获取数据
            nth = parseInt(nth);
            if (nth > 0)
                $editLi = $editUl.find('li:nth-child(' + nth + ')');
        }

        // 数据修改 . 定位到要修改的list中某一列
        if ($editLi) {
            if ($editLi.find('img').size() > 0 && jsonObj.imgUrl) {
                var _imgUrl = jsonObj.imgUrl;

                $editLi.find('img').attr('src', convertPath(_imgUrl));
            }
            if (jsonObj.title)
                $editLi.find('h3').html(jsonObj.title);
            if (jsonObj.url)
                $editLi.find('a').attr('href', jsonObj.url);
            //
            if (jsonObj.subtitle && $editLi.find('p').size() > 0)
                $editLi.find('p').html(jsonObj.subtitle);

            if (jsonObj.count && $editLi.find('span.ui-li-count').size() > 0)
                $editLi.find('span.ui-li-count').html(jsonObj.count);

            if ($editLi.find('span.ui-text').size() > 0) {
                var detail = jsonObj.detail || "";
                $editLi.find('span.ui-text').html(detail);

            }
        }
    },

    /**
     *  获取list 表当前被选中的数据
     *
     *return Object
     */
    _getOnceData: function() {
        var str;
        if (this._thumlist) {
            var $editUl = this._thumlist, $editLi = "";
            if ($editUl.find('li.ui-btn-active').size() > 0)
                $editLi = $editUl.find('li.ui-btn-active');

            if ($editLi) {
                str = {};

                str.title = $editLi.find('h3').html();

                if ($editLi.find('span.ui-text').size() > 0)
                    str.detail = $editLi.find('span.ui-text').html();
                if ($editLi.find('p').size() > 0)
                    str.subtitle = $editLi.find('p').html();

                if ($editLi.find('span.ui-li-count').size() > 0)
                    str.count = $editLi.find('span.ui-li-count').html();

                str.url = $editLi.find('a').attr('href') || "#";

                if ($editLi.find('img').attr('src'))
                    str.imgUrl = reversePath($editLi.find('img').attr('src'));
            }
        }

        if (str)
            str = stringifyToJsonText(str);
        return str ? str : "";
    },

    /** 绑定数据*/
    setData: function(jsonData) {
        if (!jsonData) jsonData = "";
        this._setDataspanel(jsonData);
    },


    /**
     * 获取当前选中项text文本方法
     * @return
     */
    _getText: function() {
        var o = this._thumlist.find('.ui-btn-active a');
        return o.length != 0 ? o.find('h3').html() : "";
    },

    _getTextTmp1: function() {
        var o = this._thumlist.find('.ui-btn-active a');
        return o.length != 0 ? $(o.find('input')[0]).val() : "";
    },

    _getTextTmp2: function() {
        var o = this._thumlist.find('.ui-btn-active a');
        return o.length != 0 ? $(o.find('input')[1]).val() : "";
    },

    _getTextTmp3: function() {
        var o = this._thumlist.find('.ui-btn-active a');
        return o.length != 0 ? $(o.find('input')[2]).val() : "";
    },

    _getTextTmp4: function() {
        var o = this._thumlist.find('.ui-btn-active a');
        return o.length != 0 ? $(o.find('input')[3]).val() : "";
    },

    /**
     * 根据传入的文本，设置存在相等文本的li为当前选中状态
     * @param text
     */
    _setText: function(text) {
        if (!text) return;

        var txt = this.$('.ui-btn-active a').find('h3').html().trim();
        if (text == txt) return;

        var colle = this._thumlist.find('li');
        //移除所有的选中样式
        colle.removeClass('ui-btn-active');
        if (!text) return;
        $.each(colle, function() {
            if (text == $.trim($(this).find('h3').html())) {
                $(this).addClass('ui-btn-active');
                return false;
            }
        });
    },

    /**
     * 获取选中项链接地址方法
     * @return
     */
    _getUrl: function() {
        var o = this._thumlist.find('.ui-btn-active a');
        return o.length != 0 ? o.attr('href') : "";
    },

    /**
     * 根据传入的连接，设置存在相等连接属性的li为当前选中状态
     * @param url
     */
    _setUrl: function(url) {
        if (!url) return;
        var txt = $.trim(this.$('.ui-btn-active a').attr('href'));
        if (url == txt) return;

        var colle = this._thumlist.find('li');
        //移除所有的选中样式
        colle.removeClass('ui-btn-active');
        $.each(colle, function() {
            if (url == $.trim($(this).find('a').attr('href'))) {
                $(this).addClass('ui-btn-active');
                return false;
            }
        });
    },

    /**
     * 获取当前选中项图片地址方法
     * @return
     */
    _getPicUrl: function() {
        var o = this._thumlist.find('.ui-btn-active a');
        return o.length != 0 ? reversePath(o.find('img').attr('src')) : "";
    },

    /**
     * 根据传入的图片地址，设置存在相等图片地址属性的li为当前选中状态
     * @param picUrl
     */
    _setPicUrl: function(picUrl) {
        if (!picUrl)
            return;
        picUrl = convertPath(picUrl);
        var txt = $.trim(this._thumlist.find('.ui-btn-active a').find('img').attr('src'));
        if (picUrl == txt)
            return;

        var colle = this._thumlist.find('li');
        //移除所有的选中样式
        colle.removeClass('ui-btn-active');
        $.each(colle, function() {
            if (picUrl == $.trim($(this).find('img').attr('src'))) {
                $(this).addClass('ui-btn-active');
                return false;
            }
        });
    },

    /**
     * 获取当前选中项副标题text文本方法
     * @return
     */
    _getSubText: function() {
        var o = this._thumlist.find('.ui-btn-active a');
        return o.length != 0 ? o.find('p').html() : "";
    },

    /**
     * 根据传入的副标题文本，设置存在相等副标题文本的li为当前选中状态
     * @param text
     */
    _setSubText: function(text) {
        if (!text) return;
        var txt = $.trim(this.$('.ui-btn-active a').find('p').html());
        if (text == txt) return;

        var colle = this._thumlist.find('li');
        //移除所有的选中样式
        colle.removeClass('ui-btn-active');
        $.each(colle, function() {
            if (text == $.trim($(this).find('p').html())) {
                $(this).addClass('ui-btn-active');
                return false;
            }
        });
    },

    /**
     * 运行后更新标题入口
     **/
    _updateText: function(index, text) {
        text = text || "";
        index = index || "";
        var obj = {};
        obj.number = index;
        obj.title = text;

        this._setOnceData(stringifyToJsonText(obj));
    },

    /**
     *  运行后更新指向地址值入口
     **/
    _updateUrl: function(index, text) {
        text = text || "";
        index = index || "";
        var obj = {};
        obj.number = index;
        obj.url = text;

        this._setOnceData(stringifyToJsonText(obj));
    },

    /** 运行后更新副标题文本值*/
    _updateSubText: function(index, text) {
        text = text || "";
        index = index || "";
        var obj = {};
        obj.number = index;
        obj.subtitle = text;

        this._setOnceData(stringifyToJsonText(obj));
    },

    /**
     *  运行后更新图片地址值入口
     *
     */
    _updatePicUrl: function(index, text) {
        text = text || "";
        index = index || "";
        var obj = {};
        obj.number = index;
        obj.imgUrl = text;

        this._setOnceData(stringifyToJsonText(obj));
    },

    /**
     * 增加过滤函数
     * */

    /**
     * @return
     */
    _getSearch: function() {
        return this._thumlist.search != null ? this._thumlist.search : false;
    },


    /**
     * 控制搜索框隐藏还是显示
     * @param text
     */
    _setSearch: function(text) {
        if (this._thumlist) {
            if (typeof text == "string") {
                text = parseBoolean(text);
            }
            this._thumlist.search = text;
            this._currentPage = 1;

            if (text) {
                this._thumlist.parent().find('div.ui-input-search').show();
            }
            else {
                this._thumlist.parent().find('div.ui-input-search').hide();
            }
        }
    },

    /**
     * 显示条数
     * @return
     */
    _getPageSize: function() {
        return this._pageSize;
    },


    /**
     * 设置显示条数
     * @param text
     */
    _setPageSize: function(text) {
        if (!text) return;

        if (this._thumlist && !isNaN(text)) {
            this._pageSize = parseInt(text);
        }
    },

    /**
     * 当输入时监听事件
     *
     */
    _search: function(key) {

        var arr = [];
        if (key) {
            //filter key
            $.each(this._dataStore, function(ind, ele) {						// 获取模糊查询的数据
                if ((ele.title && ele.title.toLowerCase().indexOf(key.toLowerCase()) >= 0)
                    || (ele.subtitle && ele.subtitle.toLowerCase().indexOf(key.toLowerCase()) >= 0)
                    || (ele.count && ele.count.toLowerCase().indexOf(key.toLowerCase()) >= 0)
                    || (ele.detail && ele.detail.toLowerCase().indexOf(key.toLowerCase()) >= 0)
                    ) {

                    arr.push(ele);
                }
            });

            /*		$.each(otherArr,function(ind,ele){								// 获取模糊查询的数据
             if(ele.subtitle){
             if(ele.subtitle.toLowerCase()
             .indexOf(key.toLowerCase())>=0){
             arr.push(ele);
             }else{
             otherArr.push(ele);
             }
             }
             });*/

            if (0 != arr.length) {
                this._showDatas = arr;
            }
        }
        else {																// 没有输入任何

            arr = this._dataStore;
        }

        this._setDataspanel(arr, true);
    },


    /**
     *     渲染
     *    @return {Boolean} 是否渲染成功，渲染失败或者已经渲染会返回false
     */
    render: function() {

        if (!this._renderBase())
            return false;
        var self = this;
        this._thumlist = this.$('ul');

        if (!this.defaulHtml)
            this.defaulHtml = this._thumlist.find('li:first');

        // 加上搜索输入框
        var searcInput = $('<div class="ui-input-search ui-shadow-inset ui-btn-corner-all ui-btn-shadow ui-icon-searchfield ui-body-c" style="display:none"><input placeholder="keyword" type="text" class="ui-input-text ui-body-c"></div>');
        $(searcInput).insertBefore(this._thumlist);
        // 增加<<更多>>按钮栏
        this.$el.append('<span class="ui-btn-up-c" id="moreRecords" style="width:100%;float:right;text-align:right;border:0px;height:25px;line-height:25px;font-size: 12px;font-weight: normal;cursor:pointer;color:#2F3E46;display:none;">&gt;&gt;更多</span>');
        // 控制编辑datas数据时是面板增加模式还是使用模式
        this.$el.append('<span style="display:none" id="handleListPic_save"></span>');
        // 更多栏设置监听事件
        this._thumlist.parent().find('#moreRecords').bind('click', function() {
            self._currentPage++;
            self._setDataspanel(self._showDatas, true);
        });

        if (checkRuntime() == RUNTIME_DESIGN) {
            // 设计模式
            self._currentState = 0;
        }
        else {
            // 启动模式
            self._currentState = 1;
        }

        //搜索框绑定事件
        this.$('input.ui-input-text').bind('keyup', function(event) {
            self._currentPage = 1;
            self._search(this.value);
        });

        this.bindEvent();

        this._rendered = true;
        return true;
    },

    bindEvent: function() {
        this.$('li').unbind("click").bind("click", function() {
            $(this).parent().find('li').removeClass('ui-btn-active');
            $(this).addClass('ui-btn-active');
            if (self.onClick)
                self.onClick();
        });
    }


});


UI.ThumbList.prototype.__defineGetter__('dataspanel', UI.ThumbList.prototype._getDataspanel);
UI.ThumbList.prototype.__defineSetter__('dataspanel', UI.ThumbList.prototype._setDataspanel);

UI.ThumbList.prototype.__defineGetter__('onceData', UI.ThumbList.prototype._getOnceData);
UI.ThumbList.prototype.__defineSetter__('onceData', UI.ThumbList.prototype._setOnceData);

UI.ThumbList.prototype.__defineGetter__('text', UI.ThumbList.prototype._getText);
UI.ThumbList.prototype.__defineSetter__('text', UI.ThumbList.prototype._setText);

UI.ThumbList.prototype.__defineGetter__('url', UI.ThumbList.prototype._getUrl);
UI.ThumbList.prototype.__defineSetter__('url', UI.ThumbList.prototype._setUrl);
UI.ThumbList.prototype.__defineGetter__('picUrl', UI.ThumbList.prototype._getPicUrl);
UI.ThumbList.prototype.__defineSetter__('picUrl', UI.ThumbList.prototype._setPicUrl);

UI.ThumbList.prototype.__defineGetter__('subText', UI.ThumbList.prototype._getSubText);
UI.ThumbList.prototype.__defineSetter__('subText', UI.ThumbList.prototype._setSubText);

// 是否支持过滤
UI.ThumbList.prototype.__defineGetter__('search', UI.ThumbList.prototype._getSearch);
UI.ThumbList.prototype.__defineSetter__('search', UI.ThumbList.prototype._setSearch);
// 每页显示个数
UI.ThumbList.prototype.__defineGetter__('pageSize', UI.ThumbList.prototype._getPageSize);
UI.ThumbList.prototype.__defineSetter__('pageSize', UI.ThumbList.prototype._setPageSize);