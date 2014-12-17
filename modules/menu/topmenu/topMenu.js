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
 * Define the top shortcut menu bar on the left and top corner function in this
 */
define([ "css!modules/menu/topmenu/topMenu", "text!modules/menu/topmenu/model.json",
        "text!modules/menu/topmenu/top_menu_tmpl.xml" ], function(css, model, tmpl) {

    var init = function() {

        Arbiter.subscribe("layout/top/rendered", {
            async: true
        }, function(data) {
            var view = new TopMenuView({
                el: $("#" + data.body)
            });
            // view.$con
            view.render();
        });

    };
    var TopMenuView = Backbone.View.extend({

        render: function() {

            var data = JSON.parse(model);
            var itemHTML = _.template(tmpl, data);
            this.$el.append(itemHTML);
        },
        events: {
            "click div[class='item_container']": "clickItem",
            "click div[class='top_menu_toolbar_start']": "clickStart"
        },
        clickItem: function(event) {
            var msg = $(event.target).attr("msg");
            Arbiter.publish(msg);
        },
        clickStart: function(event) {
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