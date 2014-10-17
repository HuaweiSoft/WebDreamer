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
 *  @module  viwer multiple flow pages manager for flow designer
 */
define(['jquery', 'util'], function ($, util) {
    var flowDesigner = null;


    return {

        /**
         * current flow page index
         */
        currentIndex: 0,

        init: function (_flowDesigner) {
            flowDesigner = _flowDesigner;
        },

        $: function (selector) {
            return flowDesigner.$(selector);
        },

        /**
         * create new flow page
         */
        newPage: function (Index) {
            var html = '<div id="mylogic' + Index + '" class="logic_view"></div>';
            $("#flow_designer_container").find("#flow_view_container").append(html);
            var $page = $("#flow_designer_container").find("#mylogic" + Index);

            /*var html = '<div id="event_selector_container'+ Index +'" style="display:none;"><div id="event_selector'+ Index +'"></div><img src ="images/newstyle/delete.png" style="width:26px;position:absolute;left:150px;top:2px" onclick="flowDesigner.eventAndFunSelectCallback();"></div>';
             $("#mylogic"+Index).append(html);*/

            var html = '<div id="maintopic' + Index + '" class="maintopic ui-btn   ui-btn-corner-all ui-shadow ui-btn-up-a">';
            html += '<table cellpadding="0" cellspacing="0"><tr><td align="center">' +
                '<img src="modules/flowDesigner/images/logic_topic.png" style="width:60px" class="unit-left-icon"></td></tr><tr>' +
                '<td align="center"><div style="width:130px"  class="unit-text"> FunctionDesigner </div></td><td>' +
                '<div class="designer-terminal designer-terminal-open" onclick=""  style="margin-top:-39px;"></div></td></tr></table></div>';
            $page.append(html);

            var html = '<div id="userdrive' + Index + '" belongtotopic="userdrive" onmouseover="flowDesigner.mouseOverUnit(this)" onmouseout="flowDesigner.mouseOutUnit(this)" class="userdrivetopic ui-btn  ui-btn-corner-all ui-shadow ui-btn-up-b">';
            html += '<table style="margin-top:0px"><tr><td align="left"><img src="modules/flowDesigner/images/user.png" style="margin:3px 2px 0px 0px;width:32px"  class="unit-left-icon"></td>' +
                '<td align="left"><div style="width:70px" class="unit-text"> Controls </div></td><td><div id="userdriveterminal' + Index + '" class="designer-terminal designer-terminal-open" onclick="return;flowDesigner.closeAndOpen(this,\'userdrive\')"></div></td></tr></table></div>';
            $page.append(html);

            var html = '<div id="systeminitization' + Index + '" belongtotopic="systeminitization" onmouseover="flowDesigner.mouseOverUnit(this)" onmouseout="flowDesigner.mouseOutUnit(this)" class="systemtopic ui-btn  ui-btn-corner-all ui-shadow ui-btn-up-f">';
            html += '<table style="margin-top:0px"><tr><td align="left"><img src="modules/flowDesigner/images/system-run.png" style="margin:3px 2px 0px 0px;width:32px"  class="unit-left-icon"></td>' +
                '<td align="left"><div style="width:70px"  class="unit-text"> SysEvents </div></td><td><div id="systemeventterminal' + Index + '" class="designer-terminal designer-terminal-open " onclick="return;flowDesigner.closeAndOpen(this,\'systeminitization\')"></div></td></tr></table>' +
                '<img title="Configure Events" onclick="flowDesigner.configureFunAndEvent(\'systeminitization' + Index + '\');" src="modules/flowDesigner/images/configure.png" style="width: 30px; position: absolute; left: 89px; top: -28px; z-index: 1100; display: none; "></div>';
            $page.append(html);

            $page.height(8000);

            this.enablePageDrag(Index);
            this.initRootUnits(Index);
            this.drawRootLines(Index);
            this.switchPage(Index);
        },

        /**
         *  initiate the three root of  the specified page
         */
        initRootUnits: function (Index) {

            var unit = {};
            unit.componentname = "maintopic";
            unit.componenttype = "maintopic";
            unit.componentid = "maintopic";
            unit.unitinstanceid = "maintopic" + Index;
            unit.belongregion = "userdrive";
            unit.parentunitid = "";
            unit.width = "130px";
            unit.height = "82px";
            unit.level = 1;
            unit.subUnitMap = $.Map();
            unit.viwer = Index;
            flowDesigner.units.put(unit.unitinstanceid, unit);

            var unit = {};
            unit.componentname = "useroprate";
            unit.componenttype = "useroprate";
            unit.componentid = "userdrive";
            unit.unitinstanceid = "userdrive" + Index;
            unit.belongregion = "userdrive";
            unit.parentunitid = "maintopic" + Index;
            unit.width = "100px";
            unit.height = "40px";
            unit.level = 2;
            unit.subUnitMap = $.Map();
            unit.viwer = Index;
            flowDesigner.units.put(unit.unitinstanceid, unit);
            flowDesigner.units.get(unit.parentunitid).subUnitMap.put(unit.unitinstanceid, "");

            var unit = {};
            unit.componentname = "systeminitization";
            unit.componenttype = "systeminitization";
            unit.componentid = "systeminitization";
            unit.unitinstanceid = "systeminitization" + Index;
            unit.belongregion = "systeminitization";
            unit.parentunitid = "maintopic" + Index;
            unit.width = "100px";
            unit.height = "40px";
            unit.level = 2;
            unit.subUnitMap = $.Map();
            unit.viwer = Index;
            flowDesigner.units.put(unit.unitinstanceid, unit);
            flowDesigner.units.get(unit.parentunitid).subUnitMap.put(unit.unitinstanceid, "");
        },

        /**
         * bind flow page drag event
         */
        enablePageDrag: function (Index) {
            var $page = this.$("#mylogic" + Index);
            var drag = new YAHOO.util.DD($page[0]);
            var _this = this;
            drag.subscribe("dragEvent", function (event) {
                var logicleft = util.parseIntPx($page.css("left"));
                var scaledLeft = _this.calcDisplayLeft(Index);
                if (logicleft > scaledLeft)
                    $page.css("left", scaledLeft);
            });
        },

        calcDisplayLeft: function (Index) {
            var $page = this.$("#mylogic" + Index);
            var scale = parseFloat(($page.css("-webkit-transform") || $page.css("-moz-transform")).replace("matrix(", "").split(",")[0]);
            var root_terminal_offset_left = 380 - 69;
            var container_left = util.parseIntPx(flowDesigner.$el.css("left"));
            var page_with = $page.width();
            var root_terminal_left = util.parseIntPx(this.$("#maintopic" + Index).css("left")) + this.$("#maintopic" + Index).width();
            var display_left = root_terminal_offset_left - container_left - page_with * (1 - scale) / 2 - root_terminal_left * scale;
            return parseInt(display_left);
        },

        /**
         * calc the top postion of flow view page, which center  the root unit horizontally
         */
        calcDisplayTop: function (Index) {
            var $page = this.$("#mylogic" + Index);
            var scale = parseFloat(($page.css("-webkit-transform") || $page.css("-moz-transform")).replace("matrix(", "").split(",")[0]);
            var root_terminal_offset_top = 376;
            var container_top = util.parseIntPx(flowDesigner.$el.css("top"));
            var page_height = $page.height();
            var root_terminal_top = util.parseIntPx(this.$("#maintopic" + Index).css("top")) + this.$("#maintopic" + Index).height();
            var display_top = root_terminal_offset_top - container_top - page_height * (1 - scale) / 2 - root_terminal_top * scale;
            return parseInt(display_top);
        },

        /**
         * reset page position
         * @param Index
         */
        resetPosition: function (Index) {
            this.$("#mylogic" + Index)
                .css("left", this.calcDisplayLeft(Index))
                .css("top", this.calcDisplayTop(Index));
        },

        /**
         * switch the specified page to current page
         */
        switchPage: function (Index) {
            if (typeof  Index == "string")
                Index = parseInt(Index);
            var pages = this.getAllPage();
            if (!util.inArray(pages, Index))
                return;
            for (var i = 0; i < pages.length; i++) {
                this.$("#mylogic" + pages[i]).hide();
            }

            var $page = this.$("#mylogic" + Index);
            $page.prepend($("#event_selector_container"));
            this.currentIndex = Index;
            $page.show();
            //var obj=flowDesigner.units.get("maintopic"+Index);
            if ($page.find("canvas").length == 0 || $page.find("canvas")[0].width <= 8) {
                flowDesigner.recnnUnitToSubunitsByModel(flowDesigner.units.get("maintopic" + Index));
            }

        },

        /**
         * Return all flow pages' number
         * @returns {Array} Int array
         */
        getAllPage: function () {
            var $viwers = this.$("#flow_view_container").children();
            var pages = [];
            for (var i = 0; i < $viwers.length; i++) {
                var objid = $viwers[i].id;
                if (objid.indexOf("mylogic") == 0) {
                    pages.push(parseInt(objid.replace("mylogic", "")));
                }
            }
            return pages;
        },


        /**
         * delete the specified flow page
         */
        deletePage: function (Index) {

            var userdrive = flowDesigner.units.get('userdrive' + Index);
            for (var i = 0; i < userdrive.subUnitMap.datas.length; i++) {
                flowDesigner.deleteUnitBefore(userdrive.subUnitMap.datas[i].key);
            }

            var sysevent = flowDesigner.units.get('systeminitization' + Index);
            for (var i = 0; i < sysevent.subUnitMap.datas.length; i++) {
                flowDesigner.deleteUnitBefore(sysevent.subUnitMap.datas[i].key);
            }

            if ($("#event_selector_container").parent().attr('id') == "#mylogic" + Index) {
                if (this.currentIndex == Index) {
                    $("#flow_designer_container").append($("#event_selector_container"));
                }
            }

            this.$("#mylogic" + Index).remove();
            //flowDesigner.deleteUnitBefore('userdrive'+Index);
            //flowDesigner.deleteUnitBefore('systeminitization'+Index);
        },

        /**
         * draw the lines between the three root units in the specified page
         */
        drawRootLines: function (Index) {
            var a = this.$('#maintopic' + Index)[0];
            var b = this.$('#userdrive' + Index)[0];
            var c = this.$('#systeminitization' + Index)[0];

            var container = this.$('#mylogic' + Index)[0];
            var wmaintouser = new WireIt.BezierWire
            (
                new WireIt.Terminal(a, {direction: [0.5, 0], offsetPosition: [138, 41], editable: false }),
                new WireIt.Terminal(b, {direction: [-0.3, 0], offsetPosition: [0, 20], editable: false}),
                container,
                {width: 1, borderwidth: 0.5, bordercolor: flowDesigner.USER_WIRE_COLOR, color: flowDesigner.USER_WIRE_COLOR}
            );
            wmaintouser.redraw();
            wmaintouser.element.style.left = "332px";
            wmaintouser.element.style.top = util.parseIntPx(this.$("#userdrive" + Index).css("top")) + parseInt(this.$("#userdrive" + Index).height() / 2) + "px";
            flowDesigner.units.get("maintopic" + Index).subUnitMap.datas[0].value = wmaintouser;


            var wmaintouser2 = new WireIt.BezierWire
            (
                new WireIt.Terminal(a, {direction: [0.5, 0], offsetPosition: [138, 41], editable: false }),
                new WireIt.Terminal(c, {direction: [-0.3, 0], offsetPosition: [0, 20], editable: false}),
                container,
                {width: 1, borderwidth: 0.5, bordercolor: flowDesigner.SYSTEM_WIRE_COLOR, color: flowDesigner.SYSTEM_WIRE_COLOR}
            );
            wmaintouser2.redraw();
            wmaintouser2.element.style.left = "332px";
            wmaintouser2.element.style.top = util.parseIntPx(this.$("#maintopic" + Index).css("top")) + parseInt(this.$("#maintopic" + Index).height() / 2) + "px";
            flowDesigner.units.get("maintopic" + Index).subUnitMap.datas[1].value = wmaintouser2;

            this.$("#userdrive" + Index).html(this.$("#userdrive" + Index).html().replace("designer-terminal-close", "designer-terminal-open"));
            this.$("#systeminitization" + Index).html(this.$("#systeminitization" + Index).html().replace("designer-terminal-close", "designer-terminal-open"));
        },

        check: function (str1, str2) {
            return new RegExp('^' + str2 + '[\\d]+$').test(str1);
        },

        rs: function (str1, str2) {
            if (typeof str2 == 'undefined' || str2 == null || str2 == false) {
                var str2 = 'systeminitization';
            }
            if (this.check(str1, str2)) {
                return str2;
            }
            return str1;
        },

        /**
         * remove all flow pages
         */
        clean: function () {
            var $pages = this.getAllPage();
            for (var i = 0; i < $pages.length; i++) {
                flowDesigner.tabManager.$container.find('li[id="tabLabel' + $pages[i] + '"]').remove();
                this.deletePage($pages[i]);
            }
            this.currentIndex = 0;
        },

        /**
         * zoom in and zoom out flow page view by mouse scroll
         * @param e onmousewheel event
         */
        scrollFunc: function (e) {
            if (!flowDesigner.isOpened()) {
                return;
            }
            var viwer = flowDesigner.viwer;
            if (!viwer.currentIndex || viwer.currentIndex == 0 || viwer.currentIndex == null) {
                return;
            }
            e = e || window.event;
            e.preventDefault();
            var $page = flowDesigner.$("#mylogic" + viwer.currentIndex);
            var scale, zoomOut, transformCssName;

            if (e.wheelDelta) {//IE/Opera/Chrome
                transformCssName = '-webkit-transform';
                zoomOut = e.wheelDelta > 0;
            } else if (e.detail) {//Firefox
                transformCssName = '-moz-transform';
                zoomOut = e.detail < 0;
            }
            scale = parseFloat($page.css(transformCssName).replace("matrix(", "").split(",")[0]);
            var zoomed = false;
            if (zoomOut) {
                if (scale > 0.38) {
                    scale = scale - 0.01;
                    $page.css(transformCssName, "scale(" + scale + ")");
                    zoomed = true;
                }
            } else {
                if (scale < 1.3) {
                    scale = scale + 0.01;
                    $page.css(transformCssName, "scale(" + scale + ")");
                    zoomed = true;
                }
            }
            if (zoomed) {
                $page.css("left", viwer.calcDisplayLeft(viwer.currentIndex));
                var terminalTop = parseInt($page.find("#maintopic" + viwer.currentIndex).css("top"))
                    +( $page.find("#maintopic" + viwer.currentIndex).height()
                    - $page.find("#maintopic" + viwer.currentIndex + " .designer-terminal").height()) / 2;
                var topOffset = ($page.height() / 2 - terminalTop) * 0.01;
                $page.css("top", parseFloat($page.css("top")) + (zoomOut ? -topOffset : topOffset));
            }

        }


    };
});
