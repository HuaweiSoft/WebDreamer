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
 *Initialize the layout in YUI layout model of index.html 
 */
define([ "text!modules/layout/model.json", "css!jslibs/yui/2.8.1/resize/assets/skins/sam/resize",
        "css!jslibs/yui/2.8.1/layout/assets/skins/sam/layout", "css!modules/layout/layout",
        "!text!modules/layout/layout_tmpl.xml" ], function(model, yrscss, ylocss, layoutcss, tmpl) {

    var init = function() {
        /**When receive the notify all resources have bean ready to render layout*/
        Arbiter.subscribe(EVENT_INITIATION_PUBLISH_PAGE_LOADED, {
            async: true
        }, function() {

            /**Instance a layout view and initialize it*/
            var view = new LayoutView({
                el: 'body'
            });
            view.render();
            myLayoutView = view;
        });
    };

    /**Define the class of layout view */
    var LayoutView = Backbone.View.extend({
        layout: null,
        layoutData: null,
        top: null,
        render: function() {
            try {
                this.layoutData = JSON.parse(model);
                var itemHTML = _.template(tmpl, {
                    "datas": this.layoutData
                });
                this.$el.append(itemHTML);

                this.layout = new YAHOO.widget.Layout({
                    units: this.layoutData
                });

                this.layout.render();
                this.setBackGround();
                this.closeAll();
                this.publishRenderedMsg();
                this.subscripeOperateMsg();
                this.bindCenterResize();

            } catch (e) {
                Logger.error("Layout", "render layout with model error." + e);
            }
        },
        closeAll: function() {
            this.closeCenter();
            this.closeTop();
            this.closeLeft();
            this.closeRight();
        },
        setBackGround: function() {

            $("#" + this.layoutData[0].body).css("background", this.layoutData[0].background);
            $("#" + this.layoutData[1].body).css("background", this.layoutData[1].background);
            $("#" + this.layoutData[2].body).css("background", this.layoutData[2].background);
            $("#" + this.layoutData[3].body).css("background", this.layoutData[3].background);
        },
        setLeftResizeStyle: function() {
            var elements = $("div[class='yui-resize-handle yui-resize-handle-r']");

            for ( var i = 0; i < elements.length; i++) {
                $(elements[i]).css("background", "#FFFFFF").css("border", "1px solid #A7A39B");
            }
            $("div[class='yui-layout-resize-knob']").attr("class", "mysprite_resize");
        },
        setRightResizeStyle: function() {
            var elements = $("div[class='yui-resize-handle yui-resize-handle-l']");

            for ( var i = 0; i < elements.length; i++) {
                $(elements[i]).css("background", "#FFFFFF").css("border", "1px solid #A7A39B");
            }
            $("div[class='yui-layout-resize-knob']").attr("class", "mysprite_resize");
        },
        openTop: function() {
            this.layout.addUnit(this.layout.get("units")[0]);
        },
        closeTop: function() {
            this.layout.getUnitByPosition('top').close();
        },
        openLeft: function() {
            this.layout.addUnit(this.layout.get("units")[1]);
            this.setLeftResizeStyle();
        },
        closeLeft: function() {
            this.layout.getUnitByPosition('left').close();
        },
        openCenter: function() {
            $("#" + this.layoutData[2].body).show();
        },
        closeCenter: function() {
            $("#" + this.layoutData[2].body).hide();
        },
        openRight: function() {
            this.layout.addUnit(this.layout.get("units")[3]);
            this.setRightResizeStyle();
        },
        closeRight: function() {
            this.layout.getUnitByPosition('right').close();
        },

        bindCenterResize: function() {
            // var _thisObj = this;
            this.layout.getUnitByPosition('center').on('resize', function() {
                var centerWidth = this.getSizes().header.w;
                Arbiter.publish('layout/center/resized', {
                    width: centerWidth
                }, {
                    async: true
                });
            });
        },
        /**Notify other modules top,left,center,right of layout have been rendered*/
        publishRenderedMsg: function() {
            Arbiter.publish('layout/top/rendered', {
                "body": this.layoutData[0].containerId
            }, {
                persist: true,
                async: true
            });
            Arbiter.publish('layout/left/rendered', {
                "body": this.layoutData[1].containerId
            }, {
                persist: true,
                async: true
            });
            Arbiter.publish('layout/center/rendered', {
                "body": this.layoutData[2].containerId
            }, {
                persist: true,
                async: true
            });
            Arbiter.publish('layout/right/rendered', {
                "body": this.layoutData[3].containerId
            }, {
                persist: true,
                async: true
            });
        },

        /**Subscribe the notify for operating the layout from other modules*/
        subscripeOperateMsg: function() {

            var _this = this;
            Arbiter.subscribe("layout/top/open", {
                async: true
            }, function() {
                _this.openTop();
            });
            Arbiter.subscribe("layout/top/close", {
                async: true
            }, function() {
                _this.closeTop();
            });
            Arbiter.subscribe("layout/left/open", {
                async: true
            }, function() {
                _this.openLeft();
            });
            Arbiter.subscribe("layout/left/close", {
                async: true
            }, function() {
                _this.closeLeft();
            });

            Arbiter.subscribe("layout/center/open", {
                async: true
            }, function() {
                _this.openCenter();
            });
            Arbiter.subscribe("layout/center/close", {
                async: true
            }, function() {
                _this.closeCenter();
            });

            Arbiter.subscribe("layout/right/open", {
                async: true
            }, function() {
                _this.openRight();
            });
            Arbiter.subscribe("layout/right/close", {
                async: true
            }, function(data) {
                _this.closeRight();
            });
        }

    });

    var myLayoutView = null;

    return {
        init: init
    };

});