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
 *Load the controls meta data defined in /controls/metadata.json
 *Display all controls on the controls board of the top toolbar base on  meta data loaded of controls
 *Dynamically load all javascript files of all controls depend on to runtime base on meta data loaded of controls 
 */
define([ "text!controls/metadata.json", "css!modules/controlManager/control", "text!modules/controlManager/model.json",
        "text!modules/controlManager/control_board_tmpl.xml", "modules/controlManager/loadControlJS",
        "css!jslibs/jquerymobile/1.0rc03/jquery.mobile.css", "text!modules/controlManager/control_show_all_tmpl.xml",
        "text!modules/controlManager/control_item_show_all_tmpl.xml" ], function(controlMetaData, css, model,
        boradTmpl, loadControlJS, jqueryMobileCss, showAllTmpl, itemControlOfShowAll) {

    var init = function() {
        Arbiter.subscribe(EVENT_TOOLBAR_PUBLISH_RENDERED, {
            async: true
        }, function(data) {
            loadControlJS.init();
            var boardId = data.controlsBoardId;
            var boardView = new ControlsBoardView({
                el: $("#" + boardId)
            });
            boardView.render();
            var showControlsView = new ShowAllControlsView({
                el: "body"
            });
            showControlsView.setBoradView(boardView);
            showControlsView.render();

        });
    };

    /**
     * Define the view class to display all controls on the controls board of toolbar
     */
    var ControlsBoardView = Backbone.View.extend({

        id: "",
        controlBase: {},
        controls: [], // controls those can be displayed in designer
        allControls: [], // controls included those not displayed, such as some base controls
        // just providing common features for subclass controls
        currentPageNO: 1,
        numsPerPage: 10,
        controlsCategories: null,

        /**
         * Get all controls through parsing the controls meta data and display them on the controls board 
         */
        render: function() {

            var metaDataJsonObject = JSON.parse(controlMetaData);
            this.controlBase = metaDataJsonObject.controlBase;
            var categories = metaDataJsonObject.categories;
            this.controlsCategories = categories;

            for ( var i = 0; i < categories.length; i++) {
                var subControls = categories[i].controls;
                for ( var p = 0; p < subControls.length; p++) {
                    var control = subControls[p];
                    this.allControls.push(control);
                    control.group = categories[i];
                    // if the displayed property value of control metadata is false,
                    // we still load it's js files, but not to display in toolbar.
                    if (control.displayed != false) {
                        control.outlineIcon = "controls/" + control.dir + "/icon/" + control.outlineIcon;
                        control.toolbarIcon = "controls/" + control.dir + "/icon/" + control.toolbarIcon;
                        control.effectIcon = "controls/" + control.dir + "/icon/" + control.effectIcon;
                        this.controls.push(control);
                    }
                }
            }

            this.showPage(1);
            this.bindEventHandler("control_item");
            this.notifyLoadControlsJS();
            this.notifyControlMetaData();
            this.subscribeMsg();
        },

        /**
         * Display all controls the specified page contains on the controls board
         * 
         * @param {Number} pageNo
         */
        showPage: function(pageNo) {

            var pageControls = [];
            if (!pageNo) {
                pageNo = 1;
            }
           
            var startIndex = (pageNo - 1) * this.numsPerPage;
            if (startIndex < 0 ) {
                return;
            }
            var endIndex = startIndex + this.numsPerPage;
            for ( var i = startIndex; i < endIndex; i++) {
                if (i < this.controls.length) {
                    pageControls.push(this.controls[i]);
                } else {
                    break;
                }
            }
            if (pageControls.length > 0) {
                var controls = {
                    "controls": pageControls
                };
                var itemHTML = _.template(boradTmpl, controls);
                this.$el.html("");
                this.$el.append(itemHTML);
                this.currentPageNO = pageNo;
            }

        },
        nextPage: function() {
            this.showPage(this.currentPageNO + 1);
        },
        upPage: function() {
            this.showPage(this.currentPageNO - 1);
        },
        /**
         * Notify LoadControlJS module to load javascript files 
         */
        notifyLoadControlsJS: function() {

            Arbiter.publish(EVENT_CONTROLS_LOAD_METADATA, {
                "controls": this.allControls,
                "controlBase": this.controlBase
            }, {
                async: true,
                persist: true
            });

        },

        notifyControlMetaData: function() {

            Arbiter.publish("control_publish_parsed_metadata", {
                "group": this.controlsCategories
            }, {
                async: true,
                persist: true
            });

        },
        subscribeMsg: function() {
            var _this = this;
            Arbiter.subscribe("toolbar/designer/container/up", {
                async: true
            }, function() {
                _this.upPage();
            });
            var _this = this;
            Arbiter.subscribe("toolbar/designer/container/down", {
                async: true
            }, function() {
                _this.nextPage();
            });
        },
        clickMenuItem: function(event) {

        },

        bindEventHandler: function(className) {
            var _this = this;
            $("." + className).on('mousedown', function(event) {
                _this.selectControl(this, event);
                _this.canvasHighlightToggle(true);
            });

        },

        selectControl: function($control, event) {
            var _this = this;
            if ($("#mask_maskpanel_container").css("diplay") != "none"
                    && $("#control_show_all_panel").css("display") != "none") {
                Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE, null, {
                    asyn: true
                });
                $("#control_show_all_panel").hide();

            }
            var isDraging = true;

            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnvalue = false;
            }

            var img = $control.getAttribute('effectIcon');
            var $mouseMoving = $("#mouseMoving");
            $mouseMoving.empty();
            $mouseMoving.append("<img src='" + img + "' >");
            $mouseMoving.css("visibility", "visible");

            // bind mouse move to body
            $(document).mousemove(function(e) {
                if (isDraging == false) {
                    return true;
                }

                var x = e.clientX;
                var y = e.clientY;
                $mouseMoving.css("left", x + 5 + "px");
                $mouseMoving.css("top", y + 5 + "px");

                return false;
            });

            $(document).mouseup(function(e) {
                if (isDraging == false) {
                    return;
                }

                isDraing = false;
                $mouseMoving.css("visibility", "hidden");

                var x = e.clientX + 5;
                var y = e.clientY + 5;

                $(document).unbind('mouseover');
                $(document).unbind('mouseup');

                // publish
                Arbiter.publish(EVENT_TOOLBAR_DRAG_DROP, {
                    'x': x,
                    'y': y,
                    'controlType': $control.getAttribute('name')
                }, {
                    async: true
                });

                _this.canvasHighlightToggle(false);

            });
        },

        canvasHighlightToggle: function(on) {
            on = on || false;
            var color = on ? "#FFF8DC" : "#FFF";
            $("#canvasDesign").css('background', color);

        },

        events: {}
    });

    /**
     * Define display all controls by category on one panel
     * TO DO
     */
    var ShowAllControlsView = Backbone.View.extend({

        id: "control_show_all_panel",
        jsonGroup: [],
        selectedGroup: "",
        boardView: null,

        render: function() {

            this.$el.append(showAllTmpl);
            $view = $("#" + this.id);
            var $document = $(window);
            var width = $view.outerWidth();
            var height = $view.outerHeight();
            var left = $document.width() / 2 - width / 2;
            var top = $document.height() / 2 - height / 2;
            $view.css("top", top + "px");
            $view.css("left", left + "px");
            this.subscribeMsg();
        },
        setBoradView: function(boardView) {
            this.boardView = boardView;
        },
        open: function() {
            Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, null, {
                asyn: true
            });
            this.renderGroupTabs();
            $("#" + this.id).show();
        },
        close: function() {
            Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE, null, {
                asyn: true
            });
            $("#" + this.id).hide();
        },
        subscribeMsg: function() {
            var _this = this;
            Arbiter.subscribe("toolbar/designer/container/all", {
                async: true
            }, function() {
                _this.open();
            });

            Arbiter.subscribe("control_publish_parsed_metadata", {
                async: true
            }, function(data) {

                _this.jsonGroup = data.group;

            });

        },

        renderGroupTabs: function() {
            var jsonGroup = this.jsonGroup;
            var tabsHTML = "";
            for ( var i = 0; i < jsonGroup.length; i++) {
                tabsHTML += "<div class='control_group_tab' group='" + jsonGroup[i].category + "'>"
                        + jsonGroup[i].category + "</div>";
            }
            $("#control_group_tab_container").html(tabsHTML);
            this.switchGroupTab(jsonGroup[0].category);
            var _this = this;
            $("#control_group_tab_container").find(".control_group_tab").bind("click", function() {
                _this.switchGroupTab($(this).attr("group"));
            })
        },

        switchGroupTab: function(name) {
            this.selectedGroup = name;
            var $tabs = $("#control_group_tab_container").children();
            for ( var i = 0; i < $tabs.length; i++) {
                var $tab = $($tabs[i]);
                if ($tab.attr("group") == name) {
                    $tab.addClass("selected");
                } else {
                    $tab.removeClass("selected");
                }
            }
            this.renderControlsByGroup();
        },
        renderControlsByGroup: function() {
            var controlsOfGroup = [];
            for ( var i = 0; i < this.jsonGroup.length; i++) {
                var groupName = this.jsonGroup[i].category;
                if (groupName == this.selectedGroup) {
                    var controls = this.jsonGroup[i].controls;
                    for ( var j = 0; j < controls.length; j++) {
                        if (controls[j].displayed != false) {
                            controlsOfGroup.push(controls[j]);
                        }
                    }
                    break;
                }
            }
            if (controlsOfGroup.length == 0) {
                $("#control_list_container").html("");
            } else {

                var html = _.template(itemControlOfShowAll, {
                    controls: controlsOfGroup
                });
                $("#control_list_container").html(html);
            }
            this.boardView.bindEventHandler("control_item_all");
        },
        clickGroupTabEvent: function(event) {
            var $tab = $(event.target);
            this.switchGroupTab($tab.attr("group"));
        },

        events: {
            "click #control_show_all_panel_close_btn": "close"
        }
    });

    return {
        init: init
    };

});