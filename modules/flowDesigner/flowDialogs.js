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
 * implement dialogs used by flow designer
 * @module Dialogs
 */
define(["css!modules/flowDesigner/flowDesigner", "jqueryCommon", "util", "yahoo_dragdrop",
    "modules/flowDesigner/dialogs/mappingEditor", "modules/flowDesigner/dialogs/valueEditor"],
    function(css, $, util, YAHOO, MappingEditor, ValueEditor) {


        /**
         *
         * @param options   {Object}
         * @param options.title   {String}
         * @param options.data   {Array}  [{name, displayName, icon, description, selected, disabled}]
         * @param options.callback   {Function}
         * @param options.container   {String|Object}
         * @param options.left   {Number}
         * @param options.top   {Number}
         * @param [options.emptyTip]   {String}
         * @param [options.closeCallback]   {Function}
         * @constructor
         */
        var MultiSelectDialog = function(options) {
            this.options = options;

            this.id = "msd_" + util.uuid(8);
            this.rendered = false;
            this.callback = options.callback;
            this.data = options.data;

            if (typeof options.container == "String")
                this.container = document.getElementById(options.container);
            else
                this.container = options.container;

            this.el = null;
            this.$el = null;
            this.dragHandle = null;
            this._render();
        };


        MultiSelectDialog.prototype = {
            _render: function() {
                var html = "<div class='fdialog multi ' id='" + this.id + "'>";
                html += "<div class='fdialog-header'><div class='title'>" + this.options.title + "</div><div class='close'></div></div>";
                if (this.data.length == 0) {
                    var tip = this.options.emptyTip || "Nothing to select.";
                    html += "<div class='empty-tip'>" + tip + "</div>	";
                }
                else {
                    html += "<div class='multi-select-list'>";
                    for (var i = 0; i < this.data.length; i++) {
                        var item = this.data[i];
                        html += "<div  class='item ";
                        if (item.selected)
                            html += " selected";
                        if (item.disabled)
                            html += " disabled";
                        html += "' data-index='" + i + "'>";
                        if (item.icon)
                            html += "<img class='item-icon' src='" + item.icon + "' /> ";
                        html += "<div class='item-text'>" + ( item.displayName || item.name) + "</div> ";
                        html += "</div>";
                    }
                    html += "</div>";
                }

                html += "</div>";
                var $el = $(html);
                $(this.container).append($el);
                this.el = $el[0];
                this.$el = $(this.el);
                this.$el.css("left", (this.options.left + 28) + "px").css("top", this.options.top + "px");

                //bind event
                var _this = this;

                this.$el.find(".fdialog-header .close").xbind("click", function() {
                    if (typeof _this.callback == "function")
                        _this.callback(_this.data);
                    _this.destroy();
                    if (typeof  _this.options.closeCallback == "function")
                        _this.options.closeCallback();
                });

                var $items = this.$el.find(".multi-select-list > .item");
                for (var i = 0; i < $items.length; i++) {
                    var $item = $items.eq(i);
                    if (!$item.hasClass("disabled")) {
                        $item.bind("click", function() {
                            var el = this;
                            var $el = $(el);
                            var selected = $el.hasClass("selected");
                            var item = _this.data[parseInt($el.attr("data-index"))];
                            if (selected) {
                                $el.removeClass("selected");
                                item.selected = false;
                            }
                            else {
                                $el.addClass("selected");
                                item.selected = true;
                            }
                        });
                    }
                    var title = this.data[i].description || this.data[i].displayName || this.data[i].name;
                    $item.attr("title", title);
                }
                //enable drag
                var drag = new YAHOO.util.DD(this.el);
                drag.subscribe("dragEvent", function(event) {
                    var left = util.parseIntPx(_this.$el.css("left"));
                    var rootUnitId = _this.$el.parent().attr("id").replace("flowpage", "flowroot");
                    var $root = _this.$el.parent().find("#" + rootUnitId);
                    if ($root.length == 0)
                        return;
                    var rootRight = util.parseIntPx($root.css("left")) + $root.width();
                    if (left < rootRight)
                        _this.$el.css("left", rootRight);
                });
                this.dragHandle = drag;
                this.rendered = true;
            },

            getEl: function() {
                return this.el;
            },

            destroy: function() {
                if (this.rendered) {
                    if (this.dragHandle)
                        this.dragHandle.unreg();
                    this.dragHandle = null;

                    this.$el.remove();
                    this.rendered = false;
                }
            },

            getSelectedList: function() {
                var selected = [];
                if (!this.data)
                    return selected;
                for (var i = 0; i < this.data.length; i++) {
                    var item = this.data[i];
                    if (!item.disabled && item.selected)
                        selected.push(item);
                }
                return selected;
            }
        };

        /**
         *
         * @param options   {Object}
         * @param options.title   {String}
         * @param options.data   {Array}  [{name, displayName, description}]
         * @param options.selected  {Number | String}  selected index or selected name
         * @param options.callback   {Function}
         * @param options.container   {String|Object}
         * @param options.left   {Number}
         * @param options.top   {Number}
         * @param [options.closeCallback]   {Function}
         * @param [options.autoClose==true]  {Boolean}   Automatically close dialog when a item is selected
         *  @param [options.emptyTip]   {String}
         * @constructor
         */
        var SingleSelectDialog = function(options) {
            this.options = options;

            this.id = "ssd_" + util.uuid(8);
            this.rendered = false;
            this.callback = options.callback;
            this.data = options.data;
            if (typeof options.selected == "number") {
                if (options.selected >= 0 && options.selected < options.data.length)
                    this.selectedIndex = parseInt(options.selected);
                else
                    this.selectedIndex = -1;
            }
            else if (typeof options.selected == "string") {
                var index = -1;
                for (var i = 0; i < options.data.length; i++) {
                    if (options.data[i].name == options.selected) {
                        index = i;
                        break;
                    }
                }
                this.selectedIndex = index;
            }
            else
                this.selectedIndex = -1;


            if (typeof options.container == "String")
                this.container = document.getElementById(options.container);
            else
                this.container = options.container;
            this.autoClose = options.autoClose != false;

            this.el = null;
            this.$el = null;
            this.dragHandle = null;

            this._render();
        };


        SingleSelectDialog.prototype = {
            _render: function() {
                var html = "<div class='fdialog single' id='" + this.id + "'>";
                html += "<div class='fdialog-header'><div class='title'>" + this.options.title + "</div><div class='close'></div></div>";
                if (this.data.length == 0) {
                    var tip = this.options.emptyTip || "Nothing to select.";
                    html += "<div class='empty-tip'>" + tip + "</div>	";
                }
                else {
                    html += "<div class='select-list'>";
                    for (var i = 0; i < this.data.length; i++) {
                        var item = this.data[i];
                        if (i == this.selectedIndex)
                            html += "<div  class='item selected' data-index='" + i + "'>";
                        else
                            html += "<div  class='item' data-index='" + i + "'>";
                        html += "<div class='selected-icon'/> ";
                        html += "<div class='item-text'>" + ( item.displayName || item.name) + "</div> ";
                        html += "</div>";
                    }
                    html += "</div>";
                }

                html += "</div>";
                var $el = $(html);
                $(this.container).append($el);
                this.el = $el[0];
                this.$el = $(this.el);
                this.$el.css("left", this.options.left + 28 + "px").css("top", this.options.top + "px");

                //bind event
                var _this = this;

                this.$el.find(".fdialog-header .close").bind("click", function() {
                    if (typeof _this.callback == "function" && !_this.autoClose)
                        _this.callback(_this.data[_this.selectedIndex] || null);
                    _this.destroy();
                    if (typeof  _this.options.closeCallback == "function")
                        _this.options.closeCallback();
                });

                var $items = this.$el.find(".select-list > .item");
                for (var i = 0; i < $items.length; i++) {
                    var $item = $items.eq(i);
                    $item.bind("click", function() {
                        var el = this;
                        var $el = $(el);
                        var index = parseInt($el.attr("data-index"));
                        _this.selectedIndex = index;
                        var selected = $el.hasClass("selected");
                        if (!selected) {
                            $items.removeClass("selected");
                            $el.addClass("selected");
                        }
                        if (_this.autoClose) {
                            if (typeof _this.callback == "function")
                                _this.callback(_this.data[index] || null);
                            _this.destroy();
                            if (typeof  _this.options.closeCallback == "function")
                                _this.options.closeCallback();
                        }
                    });
                    var title = this.data[i].description || this.data[i].displayName || this.data[i].name;
                    $item.attr("title", title);
                }
                //enable drag
                var drag = new YAHOO.util.DD(this.el);
                drag.subscribe("dragEvent", function(event) {
                    var left = util.parseIntPx(_this.$el.css("left"));
                    var rootUnitId = _this.$el.parent().attr("id").replace("flowpage", "flowroot");
                    var $root = _this.$el.parent().find("#" + rootUnitId);
                    if ($root.length == 0)
                        return;
                    var rootRight = util.parseIntPx($root.css("left")) + $root.width();
                    if (left < rootRight)
                        _this.$el.css("left", rootRight);
                });
                this.dragHandle = drag;
                this.rendered = true;
            },

            getEl: function() {
                return this.el;
            },

            destroy: function() {
                if (this.rendered) {
                    if (this.dragHandle)
                        this.dragHandle.unreg();
                    this.dragHandle = null;

                    this.$el.remove();
                    this.rendered = false;
                }
            },


            getSelectedIndex: function() {
                return this.selectedIndex;
            },

            getSelectedItem: function() {
                if (this.selectedIndex >= 0 && this.selectedIndex < this.data.length)
                    return this.data[this.selectedIndex];
                else
                    return null;
            }
        };

        SingleSelectDialog.prototype.close = SingleSelectDialog.prototype.destroy;
        MultiSelectDialog.prototype.close = MultiSelectDialog.prototype.destroy;

        return {
            MultiSelectDialog: MultiSelectDialog,
            SingleSelectDialog: SingleSelectDialog,
            MappingEditor: MappingEditor,
            ValueEditor: ValueEditor
        };

    });
