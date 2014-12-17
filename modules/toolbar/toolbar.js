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
 * Define the top toolbar function 
 */
define([ "css!modules/toolbar/toolbar", "text!modules/toolbar/model.json", "text!modules/toolbar/toolbar_tmpl.xml" ],
        function(css, model, tmpl) {

            var init = function() {

                Arbiter.subscribe("layout/top/rendered", {
                    async: true
                }, function(data) {

                    /**
                     * Instance one ToolBarView and render it
                     */
                    var view = new ToolBarView({
                        el: $("#" + data.body)
                    });
                    // view.$con
                    view.render();

                });

            };

            /**
             * Define the toolbar view class
             */
            var ToolBarView = Backbone.View.extend({

                toolBarData: null,

                /**
                 * Render the toolbar view base on the template defined in the toobar_tmpl.xml and  model defined in the model.json
                 */
                render: function() {

                    this.toolBarData = JSON.parse(model);
                    var itemHTML = _.template(tmpl, this.toolBarData);
                    this.$el.append(itemHTML);
                    if (INGORE_PROXY_SETTING) {
                        var $proxy = this.$el.find("#toolbar_proxy_setting");
                        if ($proxy.length > 0) {
                            var $parent = $proxy.parent();
                            $proxy.hide();
                            $parent.children().each(function() {
                                if (this != $proxy[0])
                                    $(this).css("left", parseInt($(this).css("left")) - 90);
                            })
                        }
                    }
                    this.subscribeMsg();
                    this.publishMsg();
                },

                /**
                 * show the tab whose subMsg attribute value is same as the data
                 * @param {String} data
                 */
                tabSwitch: function(data) {
                    var $tabs = $("div[class='toolbar_tab']");
                    for ( var i = 0; i < $tabs.length; i++) {

                        var $tab = $($tabs[i]);
                        var tabSubMsg = $tab.attr("subMsg");
                        if (tabSubMsg == data) {
                            $tab.show();
                        } else {
                            $tab.hide();
                        }
                    }

                },

                /**
                 * Subscribe message from other modules to operate toolbar view
                 */
                subscribeMsg: function() {

                    var _this = this;
                    Arbiter.subscribe("menu/tab/designer", {
                        async: true
                    }, function() {
                        _this.tabSwitch("menu/tab/designer");
                    });
                    Arbiter.subscribe("menu/tab/service", {
                        async: true
                    }, function() {
                        _this.tabSwitch("menu/tab/service");
                    });
                    Arbiter.subscribe("menu/tab/deploy", {
                        async: true
                    }, function() {
                        _this.tabSwitch("menu/tab/deploy");
                    });
                    Arbiter.subscribe("menu/tab/setting", {
                        async: true
                    }, function() {
                        _this.tabSwitch("menu/tab/setting");
                    });
                    Arbiter.subscribe(EVENT_OUTLINE_SUBSCRIBE_OPEN, {
                        async: true
                    }, function() {
                        $items = $("div[class^='toolbar_event']");
                        for ( var i = 0; i < $items.length; i++) {
                            var $item = $($items[i]);
                            if ($item.attr("msg") == EVENT_OUTLINE_SUBSCRIBE_OPEN) {
                                $item.hide();
                            } else if ($item.attr("msg") == EVENT_OUTLINE_SUBSCRIBE_CLOSE) {
                                $item.show();
                            }
                        }
                    });
                    Arbiter.subscribe(EVENT_OUTLINE_SUBSCRIBE_CLOSE, {
                        async: true
                    }, function() {
                        $items = $("div[class^='toolbar_event']");
                        for ( var i = 0; i < $items.length; i++) {
                            var $item = $($items[i]);
                            if ($item.attr("msg") == EVENT_OUTLINE_SUBSCRIBE_CLOSE) {
                                $item.hide();
                            } else if ($item.attr("msg") == EVENT_OUTLINE_SUBSCRIBE_OPEN) {
                                $item.show();
                            }
                        }
                    });
                    Arbiter.subscribe(EVENT_PROPERTTY_EDITOR_OPEN, {
                        async: true
                    }, function() {
                        $items = $("div[class^='toolbar_event']");
                        for ( var i = 0; i < $items.length; i++) {
                            var $item = $($items[i]);
                            if ($item.attr("msg") == EVENT_PROPERTTY_EDITOR_OPEN) {
                                $item.hide();
                            } else if ($item.attr("msg") == EVENT_PROPERTTY_EDITOR_CLOSE) {
                                $item.show();
                            }
                        }
                    });
                    Arbiter.subscribe(EVENT_PROPERTTY_EDITOR_CLOSE, {
                        async: true
                    }, function() {
                        $items = $("div[class^='toolbar_event']");
                        for ( var i = 0; i < $items.length; i++) {
                            var $item = $($items[i]);
                            if ($item.attr("msg") == EVENT_PROPERTTY_EDITOR_OPEN) {
                                $item.show();
                            } else if ($item.attr("msg") == EVENT_PROPERTTY_EDITOR_CLOSE) {
                                $item.hide();
                            }
                        }
                    });
                },
                publishMsg: function() {
                    Arbiter.publish(EVENT_TOOLBAR_PUBLISH_RENDERED, {
                        controlsBoardId: this.toolBarData.designer.controlsBoardId,
                        servicesBoardId: this.toolBarData.service.servicesBoardId
                    }, {
                        persist: true,
                        async: true
                    });
                    Arbiter.publish("layout/top/open", null, {
                        async: true
                    });
                },
                events: {
                    "click div[class^='toolbar_event']": "clickItem"

                },
                clickItem: function(event) {
                    var msg = $(event.target).attr("msg");
                    Arbiter.publish(msg, null, {
                        async: true
                    });

                }
            });
            return {
                init: init
            };

        });