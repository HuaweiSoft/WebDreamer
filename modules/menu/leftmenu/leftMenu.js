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
 * Define the left menu function in this
 * When user click the start image on the left and top corner to show the left menu and user click one of items will close it
 */
define([ "css!modules/menu/leftmenu/leftMenu", "text!modules/menu/leftmenu/model.json",
        "text!modules/menu/leftmenu/left_menu_tmpl.xml" ], function(css, model, tmpl) {

    var init = function() {

        Arbiter.subscribe("layout/top/rendered", {
            async: true
        }, function() {

            /**
             * Instance one view and render the view
             */
            var view = new LeftMenuView({
                el: "body"
            });
            view.render();
        });
    };

    /**
     * Define the left menu view class in backbone model
     */
    var LeftMenuView = Backbone.View.extend({

        id: "",// HTML document node id as View container id

        /**
         * Render the view base model defined in the model.json and template defined in the lfet_menu_tmpl.xml
         * 1、Get HTML through backbone template
         * 2、Append the HTML to container 
         */
        render: function() {
            var data = JSON.parse(model);
            this.id = data.id;
            var html = _.template(tmpl, data);
            this.$el.append(html);
            this.subscribeMsg();

        },

        open: function() {

            $("#" + this.id).show();
        },
        close: function() {
            $("#" + this.id).hide();
        },

        /**
         * Subscribe message to receive notify from other modules to operate left menu
         */
        subscribeMsg: function() {

            var _this = this;
            Arbiter.subscribe(EVENT_LEFTMENU_SUBSCRIBE_OPEN, {
                async: true
            }, function() {
                _this.open();
            });
            Arbiter.subscribe(EVENT_LEFTMENU_SUBSCRIBE_CLOSE, {
                async: true
            }, function() {
                _this.close();
            });
            Arbiter.subscribe(EVENT_LEFTMENU_SUBSCRIBE_SWITCH, {
                async: true
            }, function() {
                if ($("#" + _this.id).css("display") == "none") {
                    _this.open();
                } else {
                    _this.close();
                }

            });
        },

        /**
         * When user click one of items to publish message and close left menu
         * @param {object} event,mouse click event
         */
        clickMenuItem: function(event) {
            var msg = $(event.target).attr("msg");
            this.close();
            Arbiter.publish(msg, null, {
                async: true
            });
        },
        events: {
            "click div[class='menu_leftmenu_close']": "close",
            "click div[class='menu_leftmenu_item_twolevel_container']": "clickMenuItem"

        }
    });

    return {
        init: init
    };

});