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
define(['jquery', 'util', "HashMap","yahoo_dragdrop"], function($, util, HashMap, YAHOO) {
    var flowDesigner;
    var FLOW_SWITCH_LEFT = 382;  // width + left of form_designer_container
    var $openSwitch = null;
    var $closeSwitch = null;
    var $flowContainer = null;


    var helper = {
        wires: new HashMap(),


        init: function(_flowDesigner) {
            flowDesigner = _flowDesigner;
        },

        initOpenSwitch: function() {
            var openDrag = new YAHOO.util.DD("flow_designer_open");
            openDrag.subscribe("dragEvent", this.flowOpenDragging);
            openDrag.subscribe("startDragEvent", this.flowOpenDragStart);
            openDrag.subscribe("endDragEvent", this.flowOpenDragEnd);

            var closeDrag = new YAHOO.util.DD("flow_designer_close");
            closeDrag.subscribe("dragEvent", this.flowCloseDragging);
            closeDrag.subscribe("startDragEvent", this.flowCloseDragStart);
            closeDrag.subscribe("endDragEvent", this.flowCloseDragEnd);
            $openSwitch = $("#flow_designer_open");
            $closeSwitch = $("#flow_designer_close");
            $flowContainer =  $("#flow_designer_container");
            $openSwitch.show();
            $closeSwitch.hide();
        },

        calcCloseSwitchLeftPos: function() {
            return  $closeSwitch.parent().width() - 20;
        },

        _hideFlowDesigner: function() {
            $openSwitch.css("left", FLOW_SWITCH_LEFT).show();
            $closeSwitch.hide();
            flowDesigner.close();
        },

        flowOpenDragStart: function(event) {
            $flowContainer.css("left", "-695px");
            flowDesigner.open(false);
        },

        flowOpenDragging: function(event) {
            $openSwitch.css("top", 316);

            if ($openSwitch.css("display") == "none")
                return;
            var left = util.parseIntPx($openSwitch.css("left"));

            if (left < FLOW_SWITCH_LEFT) {
                $openSwitch.css("left", FLOW_SWITCH_LEFT);
                //$flowContainer.css("left", "-1695px");
                $flowContainer.hide();
            }
            else {    // moving right
                var containerLeft = left - $flowContainer.width() - 30;
                $flowContainer.show();
                if (containerLeft < -83) {
                    $flowContainer.css("left", containerLeft);
                }
                else {
                    $flowContainer.css("left", 332);
                    $openSwitch.hide();
                    var clientWidth = $closeSwitch.parent().width();
                    $closeSwitch.css("left", clientWidth - 20).show();
                }
            }
        },

        flowOpenDragEnd: function(event) {
            if ($flowContainer.css("display") == "none") {
                flowDesigner.close();
            }
        },

        flowCloseDragStart: function(event) {

        },

        flowCloseDragging: function(event) {
            $closeSwitch.css("top", 316);

            if ($closeSwitch.css("display") == "none")
                return;
            var left = util.parseIntPx($closeSwitch.css("left"));
            var containerLeft = left - $flowContainer.width() - 30;
            var clientWidth = $closeSwitch.parent().width();
            if (left > clientWidth - 40) {  // move out the right screen edge
                $flowContainer.show();
                $closeSwitch.css("left", clientWidth - 40);
            }
            else if (containerLeft > -83) { //
                $flowContainer.show();
                $flowContainer.css("left", containerLeft);
            }
            else {
                $flowContainer.hide();
                $openSwitch.css("left", FLOW_SWITCH_LEFT).show();
                $closeSwitch.hide();
            }
        },

        flowCloseDragEnd: function(event) {
            if ($flowContainer.css("display") == "none") {
                flowDesigner.close();
            }
        },

        addWire: function (unitId, wire) {
            return this.wires.put(unitId, wire);
        },

        removeWire: function (unitId) {
            var wire = this.wires.get(unitId);
            if (wire) {
                if (wire.terminal1 && wire.terminal1.el)
                    $(wire.terminal1.el).remove();
                if (wire.terminal2 && wire.terminal2.el)
                    $(wire.terminal2.el).remove();
                wire.remove();
                this.wires.remove(unitId);
            }
            return true;
        },

        getWire: function (unitId) {
            return this.wires.get(unitId);
        },

        getChildrenWires: function (unitId) {
            var units = flowDesigner.model.getChildUnits(unitId);
            if (units.length == 0)
                return [];
            var wires = [];
            for (var i = 0; i < units.length; i++) {
                var wire = this.wires.get(units[i].id);
                if (wire != null)
                    wires.push(wire);
            }
            return wires;
        },

        clearWires: function(){
            this.wires.clear();
        }

    };


    return helper;
});
