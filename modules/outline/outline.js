/*******************************************************************************
 * Web Dreamer Copyright (c) Huawei Technologies Co., Ltd. 1998-2014. All Rights
 * Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
/**
 * Define the outline container show the controls project used on the left in this
 */
define([ "css!modules/outline/outline", "text!modules/outline/outline_tmpl.xml", "modules/outline/treeview" ],
        function(css, tmpl, treeview) {
            var init = function() {

                Arbiter.subscribe("layout/left/rendered", {
                    async: true
                }, function(data) {
                    var id = data.body;

                    /**
                     * Instance one outline view and render it
                     */
                    var containerView = new OutlineContainerView({
                        el: $("#" + id)
                    });
                    containerView.render();
                    treeview.init();
                });
            };

            /**
             * Define the backbone view class of outline container
             */
            var OutlineContainerView = Backbone.View.extend({
                render: function() {
                    this.$el.append(tmpl);
                    this.subscribeMsg();
                    this.publishMsg();
                },
                open: function() {
                    Arbiter.publish("layout/left/open", null, {
                        async: true
                    });

                },
                close: function() {
                    Arbiter.publish("layout/left/close", null, {
                        async: true
                    });
                },

                /**
                 * Subscribe message from other modules to operate outline container
                 */
                subscribeMsg: function() {
                    var _this = this;
                    Arbiter.subscribe(EVENT_OUTLINE_SUBSCRIBE_CLOSE, {
                        async: true
                    }, function() {

                        _this.close();
                    });
                    Arbiter.subscribe(EVENT_OUTLINE_SUBSCRIBE_OPEN, {
                        async: true
                    }, function() {

                        _this.open();
                    });
                },
                publishMsg: function() {
                    Arbiter.publish(EVENT_OUTLINE_PUBLISH_RENDERED, {
                        id: "outline_body"
                    }, {
                        async: true,
                        persist: true
                    });
                },
                events: {}
            });

            return {
                init: init
            };

        });