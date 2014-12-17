/*******************************************************************************
 *     Web Dreamer
 *     Copyright (c) Huawei Technologies Co., Ltd. 1998-2014. All Rights Reserved.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *          http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *******************************************************************************/
/**
 *  mange the tab labels on the bottom of flow designer
 * @module tabManager
 */
define([ 'util', "jqueryCommon", "backbone"], function (util, $, Backbone) {

    var FLOW_TAB_BAR_ID = "flow_scroll_tabs";
    var TAB_CONTAINER_WIDTH = 480;
    var TAB_ITEM_WIDTH = 120;
    var TAB_ID_PREFIX = "tabLabel";

    var _leftHidedNum = 0;
    var _currentTabId = "";

    var tabManager = {};
    _.extend(tabManager, Backbone.Events, {
        //events triggered by user
        EVENT_CREATE: "create",         //params: {}
        EVENT_DELETE: "delete",         //params: {pageNo}
        EVENT_SWITCH: "switch",        //params: {pageNo}
        EVENT_RENAME: "rename",   //params: {pageNo, name}

        $el: null,
        $container: null,
        $btnMoveLeftTab: null,
        $btnCreateNewTab: null,
        $btnMoveRightTab: null,

        init: function (pages) {
            this.$el = $("#" + FLOW_TAB_BAR_ID);
            this.$container = this.$el.find('.tab-container');
            this.$btnCreateNewTab = this.$el.find("#btnCreateNewTab");
            this.$btnMoveLeftTab = this.$el.find("#btnMoveLeftTab");
            this.$btnMoveRightTab = this.$el.find("#btnMoveRightTab");

            var _this = this;
            this.$btnCreateNewTab.unbind("click").xbind("click", function () {
                _this.trigger(_this.EVENT_CREATE, {});
            }, this);
            this.$btnMoveLeftTab.unbind("click").xbind("click", this.moveToLeftTab, this);
            this.$btnMoveRightTab.unbind("click").xbind("click", this.moveToRightTab, this);
            this.reset(pages);
        },

        clear: function () {
            this.$container.empty();
            this.$container.width(TAB_CONTAINER_WIDTH);
            this.$container.css("left", "0px");
            _leftHidedNum = 0;
            _currentTabId = "";
            this.updateButtonStatus();
        },

        reset: function (pages) {
            pages = pages || [];
            this.clear();

            for (var i = 0; i < pages.length; i++) {
                var page = pages[i];
                this._addNewTab(page.no, page.name);
            }
            this.resetWidth();
            if (pages.length > 0)
                this.setCurrentTab(this.$container.children().first().attr("id"));
        },

        getTabSize: function () {
            return this.$container[0].children.length;
        },

        _addNewTab: function (pageNo, pageName) {
            var id = TAB_ID_PREFIX + pageNo;
            var html = '<li id="{0}" class="tab-item" data-page="{1}">' +
                '<span class="tab-name">{2}</span><input type="text" class="tab-input"/> ' +
                '<a href="javascript:void(0)" title="delete" class="tab-delete"></a></li>';
            html = util.format(html, id, pageNo, pageName);
            this.$container.append(html);
            var $tab = this.$container.children().last();
            var _this = this;

            $tab.find(".tab-name").click(function () {
                _this.setCurrentTab($(this).parent().attr("id"));
            });
            $tab.find(".tab-name").dblclick(function () {
                var $el = $(this);
                var $input = $el.parent().find(".tab-input");
                $input.val($el.text());
                $el.hide();
                $el.parent().find(".tab-delete").hide();
                $input.show().focus();
            });
            $tab.find(".tab-delete").click(function () {
                var pageNo = $(this).parent().attr("data-page");
                _this.deleteTab(pageNo);
            });
            var handleInput = function () {
                var pageNo = $(this).parent().attr("data-page");

                var $p = $(this).parent();
                var value = $.trim(this.value);
                var pageName, changed;
                if (!value) {
                    pageName = $p.find(".tab-name").text();
                    changed = false;
                } else {
                    var valid = true;
                    var brothers = $p.parent().children();
                    for (var i = 0; i < brothers.length; i++) {
                        var obj = brothers[i];
                        if (obj == $p[0] || obj.id == $p.attr("id"))
                            continue;
                        if ($(obj).find(".tab-name").text() == value) {
                            valid = false;
                            break;
                        }
                    }
                    if (!valid) {
                        alert("Page name '" + value + "' has been used!");
                        this.focus();
                        return;
                    }
                    pageName = value;
                    changed = true;
                }
                $(this).hide();
                $p.find(".tab-name").text(pageName).show();
                $p.find(".tab-delete").show();
                if (changed) {
                    _this.trigger(_this.EVENT_RENAME, {pageNo: pageNo, name: pageName})
                }
            };

            $tab.find(".tab-input").enter(handleInput);
            $tab.find(".tab-input").blur(handleInput);
            return id;
        },

        /**
         * add a new tab label
         */
        addTab: function (pageNo, pageName) {
            var id = this._addNewTab(pageNo, pageName);
            this.resetWidth();
            this.setCurrentTab(id);
        },

        _getIndex: function (tabId) {
            var children = this.$container.children();
            for (var i = 0; i < children.length; i++) {
                if (children[i].id == tabId)
                    return i;
            }
            return -1;
        },

        _getIndexByPageNo: function (pageNo) {
            var children = this.$container.children();
            for (var i = 0; i < children.length; i++) {
                if ($(children[i]).attr("data-page") == pageNo)
                    return i;
            }
            return -1;
        },

        deleteTab: function (pageNo) {
            var id = TAB_ID_PREFIX + pageNo;
            var length = this.getTabSize();
            var index = this._getIndex(id);
            if (index < 0)
                return false;
            /*else if(length<1){
                alert("This flow page can't be deleted!");
                return false;
            }*/
            if( ! confirm("Confirm to delete this flow page?"))
            return false;

            var newCurrentTabId = _currentTabId;
            if(length>1){
            if (_currentTabId == id) {
                if (index == 0)
                    newCurrentTabId = this.$container.children().eq(index + 1).attr("id");
                else
                    newCurrentTabId = this.$container.children().eq(index - 1).attr("id");
            }}

            this.$container.children().eq(index).remove();
            this.resetWidth();
            this.trigger(this.EVENT_DELETE, {pageNo: pageNo});
            if(length>1)
                this.setCurrentTab(newCurrentTabId);
            else
                this.trigger(this.EVENT_CREATE, {}); //create a new empty flow page

            return true;
        },

        resetWidth: function () {
            this.$container.css('width', TAB_ITEM_WIDTH * this.getTabSize() + 'px');
        },

        movePosition: function () {
            this.$container.animate({
                left: '-' + (_leftHidedNum * TAB_ITEM_WIDTH) + 'px'
            }, 100);
        },

        setCurrentTab: function (tabId) {
            if (typeof  tabId == "number")
                tabId = TAB_ID_PREFIX + tabId;
            var index = this._getIndex(tabId);
            if (index < 0)
                return false;
            var $tab = this.$container.find('#' + tabId);
            var pageNo = parseInt($tab.attr("data-page"));
            this.$container.children().removeClass('selected');
            $tab.addClass('selected');

            var changed = _currentTabId != tabId;
            _currentTabId = tabId;

            var size = this.getTabSize();
            var toMove = false;
            if (size <= 4) {
                if (_leftHidedNum != 0) {
                    _leftHidedNum = 0;
                    toMove = true;
                }
            } else if (_leftHidedNum >= size) {
                if (index + 4 <= size)
                    _leftHidedNum = index;
                else
                    _leftHidedNum = size - 4;
                toMove = true;
            } else {//size>4 &&  _leftHidedNum < size
                //is current visible or not
                var beginIndex = _leftHidedNum;
                var endIndex = beginIndex + 4 < size ? beginIndex + 4 : size - 1;
                if (index >= beginIndex && index <= endIndex) {
                    //visible
                    if (_leftHidedNum + 4 < size) { //right margin is empty
                        _leftHidedNum = size - 4;
                        toMove = true;
                    }
                } else if (index < beginIndex) {
                    //in the left
                    if (index + 4 <= size)
                        _leftHidedNum = index;
                    else
                        _leftHidedNum = size - 4;
                    toMove = true;
                } else if (index > endIndex) {
                    //in the right
                    if (index - 3 >= 0)
                        _leftHidedNum = index - 3;
                    else // index <3
                        _leftHidedNum = 0;
                    toMove = true;
                }
            }
            if (_leftHidedNum < 0) {
                _leftHidedNum = 0;
                toMove = true;
            }

            if (toMove)
                this.movePosition();
            this.updateButtonStatus();

            if (changed) {
                this.trigger(this.EVENT_SWITCH, {
                    pageNo: pageNo
                })
            }
            return true;
        },

        getCurrentTabId: function () {
            return _currentTabId;
        },

        getCurrentTabPageNo: function () {
            if (!_currentTabId)
                return 0;
            var pageNo = parseInt(this.$container.find("#" + _currentTabId).attr("data-page"));
            return isNaN(pageNo) ? 0 : pageNo;
        },

        /**
         * move to the previous flow view of current flow view
         * @returns {boolean}
         */
        moveToLeftTab: function () {
            var currentIndex = this._getIndex(_currentTabId);
            if (currentIndex <= 0)
                return false;
            var newCurrentTab = this.$container.children().eq(currentIndex - 1).attr("id");
            this.setCurrentTab(newCurrentTab);
            return true;
        },

        moveToRightTab: function () {
            var size = this.getTabSize();
            var currentIndex = this._getIndex(_currentTabId);
            if (size == 0 || currentIndex < 0 || currentIndex >= size - 1)
                return false;
            var newCurrentTab = this.$container.children().eq(currentIndex + 1).attr("id");
            this.setCurrentTab(newCurrentTab);
            return true;
        },

        updateButtonStatus: function () {
            var $left = this.$el.find("#btnMoveLeftTab");
            var $right = this.$el.find("#btnMoveRightTab");
            var size = this.getTabSize();
            var currentIndex = this._getIndex(_currentTabId);
            if (size == 0 || currentIndex<0) {
                $left.removeClass("enable");
                $right.removeClass("enable");
                return;
            }
            if(currentIndex>0)
                $left.addClass("enable");
            else
                $left.removeClass("enable");
            if(currentIndex<size-1)
                $right.addClass("enable");
            else
                $right.removeClass("enable");
        }


    });

    return tabManager;

});
