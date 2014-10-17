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
 * implementing some static utility functions for flow designer
 */
define(['jquery', 'util'], function ($, util) {
    var flowDesigner;
    var FLOW_SWITCH_LEFT = 382;  // width + left of form_designer_container

    var helper = {
        init: function (flowDesingerInstance) {
            flowDesigner = flowDesingerInstance;
        },

        initOpenSwitch: function () {
            var openDrag = new YAHOO.util.DD("flow_designer_open");
            openDrag.subscribe("dragEvent", this.flowOpenDragging);
            openDrag.subscribe("startDragEvent", this.flowOpenDragStart);
            openDrag.subscribe("endDragEvent", this.flowOpenDragEnd);

            var closeDrag = new YAHOO.util.DD("flow_designer_close");
            closeDrag.subscribe("dragEvent", this.flowCloseDragging);
            closeDrag.subscribe("startDragEvent", this.flowCloseDragStart);
            closeDrag.subscribe("endDragEvent", this.flowCloseDragEnd);
            $("#flow_designer_open").show();
            $("#flow_designer_close").hide();
        },

        calcCloseSwitchLeftPos: function(){
           return  $("#flow_designer_close").parent().width() - 20;
        },

        _hideFlowDesigner: function () {
            $("#flow_designer_open").css("left", FLOW_SWITCH_LEFT).show();
            $("#flow_designer_close").hide();
            $("#flow_designer_container").hide();
            flowDesigner.close();
        },

        flowOpenDragStart: function (event) {
            $("#flow_designer_container")
                .css("left", "-695px");
            flowDesigner.open();
        },

        flowOpenDragging: function (event) {
            $("#flow_designer_open").css("top", 316);

            if ($("#flow_designer_open").css("display") == "none")
                return;
            var left = util.parseIntPx($("#flow_designer_open").css("left"));

            if (left < FLOW_SWITCH_LEFT) {
                $("#flow_designer_open").css("left", FLOW_SWITCH_LEFT);
                //$("#flow_designer_container").css("left", "-1695px");
                $("#flow_designer_container").hide();

            } else {    // moving right
                var containerLeft = left - $("#flow_designer_container").width() - 30;
                $("#flow_designer_container").show();
                if (containerLeft < -83) {
                    $("#flow_designer_container").css("left", containerLeft);

                } else {
                    $("#flow_designer_container").css("left", 332);
                    $("#flow_designer_open").hide();
                    var clientWidth = $("#flow_designer_close").parent().width();
                    $("#flow_designer_close").css("left", clientWidth - 20).show();
                }
            }
        },

        flowOpenDragEnd: function (event) {
            if ($("#flow_designer_container").css("display") == "none") {
                flowDesigner.close();
            }
        },

        flowCloseDragStart: function (event) {

        },

        flowCloseDragging: function (event) {
            $("#flow_designer_close").css("top", 316);

            if ($("#flow_designer_close").css("display") == "none")
                return;
            var left = util.parseIntPx($("#flow_designer_close").css("left"));
            var containerLeft = left - $("#flow_designer_container").width() - 30;
            var clientWidth = $("#flow_designer_close").parent().width();;
            if (left > clientWidth - 40) {  // move out the right screen edge
                $("#flow_designer_container").show();
                $("#flow_designer_close").css("left", clientWidth - 40);
            } else if (containerLeft > -83) { //
                $("#flow_designer_container").show();
                $("#flow_designer_container").css("left", containerLeft);
            } else {
                $("#flow_designer_container").hide();
                $("#flow_designer_open").css("left", FLOW_SWITCH_LEFT).show();
                $("#flow_designer_close").hide();
            }
        },

        flowCloseDragEnd: function (event) {
            if ($("#flow_designer_container").css("display") == "none") {
                flowDesigner.close();
            }
        },

        showMessageBox: function(){

        },

        hideMessageBox: function(){

        },

        genJCheckbox: function (title, items, selected, formunit) {
            var html = "<table id='event_selector_table' class='ui-btn-corner-all ui-shadow' cellspacing='0' cellpadding='0' style='width:100%'>" +
                "<tr><td align='center' class='event-fun-selector-td'>" + title + "</td></tr>";

            var unitmap = '';
            var regexp = new RegExp('^userdrive\\d+' + flowDesigner.ID_SEPARATOR + 'object\\d+$');
            if (typeof formunit == 'string' && regexp.test(formunit)) {
                unitmap = flowDesigner.getSubUnitComponentName(formunit, true);
            }

            for (var i = 0; i < items.length; i++) {
                var value = items[i].name;
                var name = items[i].alias;
                var icon = items[i].icon ? items[i].icon : "";

                if (checkJsonArrayContainValue(selected.split(","), value)) {
                    if (!checkJsonArrayContainValue(unitmap.split(','), value)) {
                        html += String.format("<tr><td id='eventselectitem{0}td' axis='{1}' lang='{2}' class='eventdisable'>"
                            +"<img align='center' style='max-height:22px;margin-right:5px' src='{3}'>{4}</td></tr>",
                            i, name, value, icon, name);
                    } else {
                        if (icon) {
                            html +=  String.format("<tr><td id='eventselectitem{0}td' onclick='clickJCheckbox(this)' axis='{1}' lang='{2}' class='eventselected'>" +
                                "<img align='center' style='max-height:22px;margin-right:5px' src='{3}'>{4}</td></tr>"
                                , i, name, value, icon, name);
                        }
                        else {
                            html += String.format("<tr><td id='eventselectitem{0}td' onclick='clickJCheckbox(this)' axis='{1}' lang='{2}' class='eventselected'>{3}</td></tr>",
                                i, name, value, name);
                        }
                    }
                }
                else {
                    if (icon) {
                        html += String.format("<tr><td id='eventselectitem{0}td'  onclick='clickJCheckbox(this)' axis='{1}' lang='{2}' class='uneventselected'>" +
                            "<img align='center' style='max-height:22px;margin-right:5px' src='{3}'>{4}</td></tr>", i, name, value, icon, name);
                    }
                    else {
                        html += String.format("<tr><td id='eventselectitem{0}td'  onclick='clickJCheckbox(this)' axis='{1}' lang='{2}' class='uneventselected'>{3}</td></tr>",
                            i, name, value, name);
                    }
                }
            }

            html += "</table>";
            return html;
        },

        clickJCheckbox: function (obj) {
            if (obj.className == "eventselected") {
                obj.className = "uneventselected";
            }
            else if (obj.className == "uneventselected") {
                obj.className = "eventselected";
            }
        },

        getJCheckBoxValue: function () {
            var divControl = document.getElementById('event_selector_table');
            var eventItems = [];
            var tempvalue = "";
            var tds = $("#event_selector_table").find("tr td");
            if (tds.length > 1) {
                for (var i = 1; i < tds.length; i++) {
                    if (tds[i].className == "eventselected") {
                        if (tds[i].children[0] && tds[i].children[0].outerHTML && tds[i].children[0].outerHTML.indexOf("<img") == 0) {
                            eventItems.push({name: tds[i].lang, alias: tds[i].axis,
                                icon: tds[i].children[0].src.substring(tds[i].children[0].src.indexOf("/controls") + 1, tds[i].children[0].src.length)});
                        }
                        else {
                            eventItems.push({name: tds[i].lang, alias: tds[i].axis, icon: ""});
                        }
                    }
                }

            }
            return eventItems;
        },

    };

    //check json array contain special value{[a:A],[b:B]};
    function checkJsonArrayContainValue(jsonarray, value) {
        if (jsonarray != null && jsonarray.length > 0 && value != null) {
            for (var i = 0; i < jsonarray.length; i++) {

                if (jsonarray[i].split(":")[0] == value) {
                    return true;
                }
            }

        }
        return false;
    }

    window.clickJCheckbox = helper.clickJCheckbox;


    return helper;
});
