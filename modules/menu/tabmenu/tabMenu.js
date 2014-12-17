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
 * Define the tab menu bar function in this,when user click the tab to switch the defined function
 */
define([ "css!modules/menu/tabmenu/tabMenu", "text!modules/menu/tabmenu/model.json",
        "text!modules/menu/tabmenu/tab_menu_tmpl.xml" ], function(css, model, tmpl) {

    var init = function() {

        Arbiter.subscribe("layout/top/rendered", {
            async: true
        }, function(data) {

            /**
             * Instance one view and render the view
             */
            var view = new TabMenuView({
                el: $("#" + data.body)
            });
            view.render();
        });
    };
    /**
     * Define the tab menu view class in backbone model
     */
    var TabMenuView = Backbone.View.extend({

        /**
         * Render the view base model defined in the model.json and template defined in the tab_menu_tmpl.xml
         * 1、Get HTML through backbone template
         * 2、Append the HTML to container 
         */
        render: function() {
            var datas = {
                "datas": JSON.parse(model)
            };
            var itemHTML = _.template(tmpl, datas);
            this.$el.append(itemHTML);
        },

        /**
         * When user click the tab item to switch to it defined function
         * @param {event} event,mouse click event
         */
        tab: function(event) {
            var msg = $(event.target).attr("msg");
            var tabs = $("div[class^='menu_tabmenu_container_item']");
            for ( var i = 0; i < tabs.length; i++) {

                var $tab = $(tabs[i]);
                if ($tab.attr("msg") == msg && $tab.attr("class") == "menu_tabmenu_container_item") {

                } else {

                    if ($tab.attr("msg") == msg) {
                        $tab.attr("class", "menu_tabmenu_container_item");
                        Arbiter.publish(msg, null, {
                            async: true
                        });
                    } else {
                        $tab.attr("class", "menu_tabmenu_container_item_unselect");
                    }

                }
            }
        },

        events: {
            "click div[class^='menu_tabmenu_container_item']": "tab"
        }
    });

    return {
        init: init
    };

});