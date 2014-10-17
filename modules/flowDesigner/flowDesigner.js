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
 * @module flowDesigner  core implement for the flow designer
 */
define(
    [ "css!modules/flowDesigner/flowDesigner", "text!modules/flowDesigner/model.json",
        "text!modules/flowDesigner/flowDesigner_tmpl.html",
        "modules/flowDesigner/flowDesignerPager", "modules/flowDesigner/flowDesignerHelper",
        "modules/flowDesigner/tabManager", "modules/flowDesigner/apiModel",
        "jqueryCommon", "modelManager", "metaHub", "util" ],
    function (css, model, tmpl, viwer, helper, tabManager, apiModel, $, modelManager, metaHub, util) {

        var _initNumber = 0;
        var _uiDragEndTime = 0;
        var _apiDragEndTime = 0;
        var _uiToolbarDragEndTime = 0;

        var _isMoving = false;
        var _highLightUnits = [];

        var flowDesigner = {
            ID_SEPARATOR: "_logic_",
            USER_WIRE_COLOR: "#39C1EB",
            SYSTEM_WIRE_COLOR: "#44B033",
            UNIT_TOP_OFFSET: 40,
            UNIT_USER_TOP: 4270,
            UNIT_USER_HEIGHT: 40,
            SYSTEM_TOP: 4470,
            REGION_USER: "userdrive",
            REGION_SYSTEM: "systeminitization",
            UNIT_DISTANCE: 60,

            $el: null,          //flow_designer_container element
            units: $.Map(),
            displayed: false,

            relatedParentId: "",
            deletedUnitArray: [],
            currentHighlightedCids: [],
            currentHighlightControlId: "",

            viwer: null,
            tabManager: null,
            centerWidth: 0,

            init: function () {
                var _this = this;
                Arbiter.subscribe("layout/center/rendered", {
                    async: true
                }, function (data) {
                    _this._init(data.body);
                });

                Arbiter.subscribe(EVENT_FORMDESIGNER_CONTROL_DRAG_BEGIN, function (data) {
                    _uiDragEndTime = 0;
                    var controlId = data.cid;
                    if (_this.displayed) {
                        _this.highLightUnits("UI", controlId);
                    }
                });
                Arbiter.subscribe(EVENT_FORMDESIGNER_CONTROL_DRAG_END, function (data) {
                    _uiDragEndTime = data.time;
                    var controlId = data.cid;
                    if (_this.displayed) {
                        _this.cancelHighListUnits();
                    }
                });
                Arbiter.subscribe(EVENT_TOOLBAR_SERVICE_DRAG_BEGIN, function (data) {
                    _apiDragEndTime = 0;
                    var apiName = data.apiName;
                    if (_this.displayed) {
                        var apiMeta = metaHub.getApiMeta(apiName);
                        var apiType = apiMeta != null ? apiMeta.type : "SERVICE";
                        if (apiType == "XLT")
                            _this.highLightUnits("XLT", apiName);
                        else if (apiType == "SPAPI")
                            _this.highLightUnits("SPAPI", apiName);
                        else
                            _this.highLightUnits("API", apiName);
                    }
                });
                Arbiter.subscribe(EVENT_TOOLBAR_SERVICE_DRAG_END, function (data) {
                    _apiDragEndTime = data.time;
                    var apiName = data.apiName;
                    if (_this.displayed) {
                        _this.cancelHighListUnits();
                    }
                });
                Arbiter.subscribe(EVENT_CONTROL_CLEAR, function () {
                    _this.clear();
                });
                Arbiter.subscribe(EVENT_CONTROL_REMOVE, function (data) {
                    _this.handleControlDeleteEvent(data.id);
                });
                Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE, function (data) {
                    _this.handlePageDeleteEvent(data.pageNo, data.removedBeans);
                });
                Arbiter.subscribe("layout/center/resized", function (data) {
                    _this.centerWidth = data.width;
                    setTimeout(function () {
                        _this.resetWidth();
                    }, 100);
                });
                Arbiter.subscribe(EVENT_CONTROL_UPDATE, {async: true},function(data){
                    _this.handleControlPropetyUpdateEvent(data.id);
                });
            },

            _init: function (parentId) {
                var $parentEl = $("#" + parentId);
                var $tmpl = $(tmpl);
                $parentEl.append($tmpl.find("#flow_designer_container"));
                $parentEl.append($tmpl.find("#flow_designer_open"));
                $parentEl.append($tmpl.find("#flow_designer_close"));
                $parentEl.append($tmpl.find("#event_selector_container"));
                $parentEl.append($tmpl.find("#flow_ui_moving"));
                $(document.body).append('<div id="flow_service_moving" style="width:100px"></div>');
                this.$el = $parentEl.find("#flow_designer_container");
                this.$el.width(document.body.clientWidth - 340);
                this.$el.height(703);

                //flowModel.init(this);
                helper.init(this);
                viwer.init(this);
                tabManager.init(viwer);
                this.viwer = viwer;
                this.tabManager = tabManager;

                helper.initOpenSwitch();

                //enable  mouse scroll event
                if (document.addEventListener) {
                    document.addEventListener('DOMMouseScroll', viwer.scrollFunc, false);
                }//W3C
                window.onmousewheel = document.onmousewheel = viwer.scrollFunc;//IE/Opera/Chrome、firefox
            },

            /**
             * return  jquery elements by the specified selector in the flow designer container.
             * Use this method to avoid getting wrong elements in the whole dom tree,
             *  because there may be two elements have same dom id but in different modules.
             * @param {String} selector
             * @returns {$}
             */
            $: function (selector) {
                return this.$el.find(selector);
            },

            getEl: function (domId) {
                return this.$("#" + domId)[0] || null;
            },

            open: function () {
                if (this.displayed)
                    return;
                this.displayed = true;
                if (this.$el.css("opacity") < 0.5) {
                    this.$el.css("opacity", 1);
                }
                this.$el.show();
                this.resetWidth();

                this.connectMainTopic();

                Arbiter.publish(EVENT_FLOW_OPEN, {});
            },

            close: function () {
                this.hideDragMoving();
                this.displayed = false;
                Arbiter.publish(EVENT_FLOW_CLOSE, {});
            },

            save: function () {
                //TODO

            },

            clear: function () {
                _initNumber = 0;
                _uiDragEndTime = 0;
                _apiDragEndTime = 0;
                _uiToolbarDragEndTime = 0;
                _isMoving = false;
                _highLightUnits = [];
                this.relatedParentId = "";
                this.units = $.Map();
                this.deletedUnitArray = [];
                this.currentHighlightedCids = [];
                this.currentHighlightControlId = "";
                //flowModel.resetBizModel();
                this.$('.logic_view').remove();
                viwer.currentIndex = 0;
                tabManager.cleanAll();
                tabManager.addLabel();
            },

            resetWidth: function () {
                if (!this.displayed) {
                    return;
                }
                var width = this.centerWidth
                    - $("#form_designer_container")[0].offsetWidth + 15;
                this.$el.width(width);

                var titleLeft = ( width - this.$("#flow_designer_title").width()) / 2;
                this.$("#flow_designer_title").css("left", titleLeft);
                var tabLeft = ( width - this.$("#flow_scroll_tabs").width()) / 2;
                this.$("#flow_scroll_tabs").css("left", tabLeft);
                $("#flow_designer_close").css("left", helper.calcCloseSwitchLeftPos());

            },

            isOpened: function () {
                return this.displayed;
            },

            resetLocation: function () {
                return;
                var pages = viwer.getAllPage();
                for (var i = 0; i < pages.length; i++) {
                    viwer.resetPosition(pages[i]);
                }
            },

            connectMainTopic: function () {
                // only the first time
                if (_initNumber >= 1) {
                    return;
                }
                _initNumber++;
                //flowModel.resetBizModel(); // reset biz model
                this.resetUnits(); // reset designer model
                this.resetUnitsHTML();// reset designer units html;
            },

            /**
             * Hide flow_ui_moving and flow_service_moving div
             */
            hideDragMoving: function () {
                $("#flow_ui_moving").hide();
                $("#flow_service_moving").hide();
            },

            /**
             * handle mouse over event on the displayed unit element
             * @param el
             */
            mouseOverUnit: function (el) {
                this.relatedUnit(el);
                _uiDragEndTime = 0;
                _apiDragEndTime = 0;
                _uiToolbarDragEndTime = 0;
            },

            /**
             * handle mouse out event on the displayed unit element
             * @param el
             */
            mouseOutUnit: function (el) {
                var belongtotopic = $("#" + el.id).attr("belongtotopic");

                if (belongtotopic == "userdrive") {
                    el.className = el.className.replace("ui-btn-up-e", "ui-btn-up-f");
                } else {
                    el.className = el.className.replace("ui-btn-up-e", "ui-btn-up-g");
                }
                this.switchDelete(el.id, "out");
                this.cancelHighlightRelatableControls();
            },

            /**
             * 1 When drag and drop a component to the unit node of designer tree.
             *  2 mouse over the node of designer tree
             * @param parentUnitEl
             */
            relatedUnit: function (parentUnitEl) {
                this.relatedParentId = parentUnitEl.id;
                var $parentUnitEl = this.$("#" + parentUnitEl.id);
                if ($parentUnitEl.css("opacity") != "1") {
                    return;
                }
                var parentUnitId = parentUnitEl.id;
                var parentUnit = this.units.get(parentUnitId);
                if (parentUnit == null) {
                    console.warn("Error parent unit id: %s", parentUnitId);
                    return;
                }
                var _this = this;

                var currentTime = (new Date()).getTime();
                var apiTimeReduce = currentTime - _apiDragEndTime;
                var uiTimeReduce = currentTime - _uiDragEndTime;

                var componentname = "";
                var componenttype = "";
                var componentid = "";
                var unitinstanceid = "";
                var belongregion = $parentUnitEl.attr("belongtotopic");

                var level = 0;
                var unitwidth = "";
                var unitheight = "";
                var unittype = "";

                var uiToolbarTimeReduce = 500;
                var pluginattr = "";

                if (_uiToolbarDragEndTime) {
                    uiToolbarTimeReduce = currentTime - _uiToolbarDragEndTime;
                }
                _uiToolbarDragEndTime = null;

                var $uiMoving = $("#flow_ui_moving");
                var $apiMoving = $("#flow_service_moving");
                // related UI
                if ((uiTimeReduce >= 0 && uiTimeReduce <= 30) && $uiMoving.html() != "") {
                    if (parentUnit.componentname == "pageNo") {
                        return;
                    }

                    var parentunittype = parentUnit.componenttype;
                    if (parentunittype == "API" || parentunittype == "INPUT" || parentunittype == "EOF"
                        || parentunittype == "UI" || parentunittype == "FUNCTION") {
                        return;
                    }

                    if (parentUnit.componenttype == "PARA") {
                        this.relatedPara(parentUnit);
                        return;
                    }

                    if (this.units.get(parentUnit.parentunitid)
                        && this.units.get(parentUnit.parentunitid).componenttype == "OUTPUT") {
                        return;
                    }
                    if ($uiMoving[0].childNodes[0] == null) {
                        console.error("Nothing in ui dragging object.");
                        return;
                    }
                    componentid = $uiMoving[0].childNodes[0].id.replace("logic", "");

                    if (this.checkUnitSubRelatedObj(parentUnit.unitinstanceid, componentid)) {
                        return;
                    }

                    unitwidth = $uiMoving.css("width");
                    unitheight = $uiMoving.css("height");
                    componentname = getControlType(componentid);

                    componenttype = "UI";
                    if (parentunittype == "OUTPUT") {
                        componenttype = "TOUI";
                    }

                    // unitinstanceid=parentUnitId+this.ID_SEPARATOR+componentid+"_"+ currentTime;
                    unitinstanceid = parentUnitId + this.ID_SEPARATOR + componentid;
                    level = parentUnit.level + 1;
                }
                // relate api
                else if ((apiTimeReduce >= 0 && apiTimeReduce <= 100) && $apiMoving.html() != "") {
                    var parentunittype = parentUnit.componenttype;
                    var parentlevel = parentUnit.level;
                    var componentname = $apiMoving.children().first().attr("type");
                    var apiMeta = metaHub.getApiMeta(componentname);
                    if (!apiMeta) {
                        console.warn("Not such api meta, api name = %s", componentname);
                        return;
                    }
                    var apiBean = {
                        name: componentname,
                        displayName: apiMeta.displayName,
                        type: apiMeta.type,
                        provider: apiMeta.provider,
                        className: apiMeta.className,
                        functionName: apiMeta.functionName,
                        params: apiMeta.params,
                        icon: apiMeta.icon
                    };
                    var unitwidth = $apiMoving.css("width");
                    var unitheight = $apiMoving.css("height");

                    if (apiMeta.type == "XLT") {
                        if (parentunittype != "OUTPUT") {
                            return;
                        }
                        unitinstanceid = parentUnitId + this.ID_SEPARATOR + componentname
                            + Math.random().toString().substr(-3);
                        componenttype = "XLT";
                        apiBean = apiModel.addApi(apiBean);
                        componentid = apiBean.aid;
                        level = parentUnit.level + 1;
                    }
                    // SPJ JS API
                    else if (apiMeta.type == "SPAPI") {
                        if (parentunittype != "OUTPUT") {
                            return;
                        }
                        unitinstanceid = parentUnitId + this.ID_SEPARATOR + componentname
                            + Math.random().toString().substr(-3);
                        componenttype = "API";
                        apiBean = apiModel.addApi(apiBean);
                        componentid = apiBean.aid;
                        level = parentUnit.level + 1;
                    }
                    // service api
                    else {
                        if (parentunittype == "API" || parentunittype == "INPUT" || parentunittype == "OUTPUT"
                            || parentunittype == "PARA" || parentunittype == "XLT" ||  parentunittype == "UI") {
                            return;
                        }
                        /*
                         * if(parentUnit.belongregion == this.REGION_USER &&
                         * parentlevel != 4){ return; }
                         */
                        unitinstanceid = parentUnitId + this.ID_SEPARATOR + componentname;
                        componenttype = "API";
                        apiBean = apiModel.addApi(apiBean);
                        componentid = apiBean.aid;
                        pluginattr = apiBean.Plugin;
                        level = parentUnit.level + 1;
                    }
                }
                // related component dragged from toolbar
                else if ((uiToolbarTimeReduce >= 0 && uiToolbarTimeReduce <= 300) && $("#mouseMoving").html() != ""
                    && parentUnit.componenttype == "PARA") {
                    var mousemovingimgobj = $("#mouseMoving").children()[0];
                    if (mousemovingimgobj && mousemovingimgobj.src != "") {
                        //TODO parameter config
                        if (mousemovingimgobj.src.indexOf("images/toolbox/effect/imagelarge.png") > 0) {
                            parentUnit.fromuibar = "IMAGE";
                            showChooseImagePanel("flowDesigner.selectImgForPara", "");
                        }
                        else if (mousemovingimgobj.src.indexOf("images/toolbox/effect/inputboxlarge.png") > 0) {
                            parentUnit.fromuibar = "TEXT";
                            this.textForPara();
                        }
                    }

                    return;

                } else// only simple mouseover event
                {
                    this.makeUnitDragable(parentUnitId);
                    return;
                }

                if (componentname != "" && componenttype != "" && componentid != "" && unitinstanceid != ""
                    && this.units.get(unitinstanceid) == null) {
                    var unit = {};
                    unit.componentname = componentname;
                    unit.componenttype = componenttype;
                    unit.componentid = componentid;
                    unit.unitinstanceid = unitinstanceid;
                    unit.belongregion = belongregion;
                    unit.parentunitid = parentUnitId;
                    unit.level = level;
                    unit.subUnitMap = $.Map();
                    unit.Plugin = pluginattr || "";
                    unit.viwer = parentUnit.viwer;

                    var unitwidthint = util.parseIntPx(unitwidth);
                    var unitheightint = util.parseIntPx(unitheight);

                    unit.width = unitwidth;
                    unit.height = unitheight;

                    this.units.put(unitinstanceid, unit);

                    this.renderUnit(unit);
                    parentUnit.subUnitMap.put(unitinstanceid, "");

                    // re-layout sub units
                    this.layoutSubUnits(parentUnit);

                    // rewire parent unit to sub units
                    this.reconnectSubUnits(parentUnit);

                    // this.createEvents(unit);
                    this.createEventsTips(unit.unitinstanceid);

                    this.createUiFunsTips(unit.unitinstanceid);

                    this.createInputAndOutput(unit);

                }

                $uiMoving.html("");
                if (componenttype == "XLT" || componenttype == "SPAPI") {
                    //TODO   show config dialog for xlt api
                    // showParaBox(componentid);
                }
            },

            makeUnitDragable: function (unitId) {
                var $unitEl = this.$("#" + unitId);
                var unit = this.units.get(unitId);

                //this.highlightRelatableControls(unit);
                this.switchDelete(unitId, "over");
                var objtop = parseIntPx($unitEl.css("top"));
                var objleft = $unitEl.css("left");
                // enable unit dragable
                var drag = new YAHOO.util.DD(unitId);
                var _this = this;

                function objDraging(event) {
                    if ($unitEl.css("opacity") != "1") {
                        return;
                    }
                    if (unit.componenttype == "useroprate"
                        && parseIntPx($unitEl.css("top")) > 4274) {
                        _this.$("#userdrive" + unit.viwer).css("top", "4274px")
                    } else if (unit.componenttype == "systeminitization"
                        && parseIntPx($unitEl.css("top")) < 4463) {

                        _this.$("#systeminitization" + unit.viwer).css("top", "4463px")
                    }

                    _isMoving = true;

                    var y = event.e.clientY;
                    // drag out desinger
                    if (y > (_this.$el.height() + 140)) {
                        $unitEl.css("top", "4745px");
                        // return;
                    }
                    if (y < 140) {
                        $unitEl.css("top", "4040px");
                        // return;
                    }

                    $unitEl.css("left", objleft);

                    var moveDistance = parseIntPx($unitEl.css("top")) - objtop;

                    var objunit = _this.units.get(unitId);

                    var myParentUnit = _this.units.get(objunit.parentunitid);
                    var objSubUnits = objunit.subUnitMap.datas;
                    var objunitindex = myParentUnit.subUnitMap.indexOfKey(unitId);

                    myParentUnit.subUnitMap.datas[objunitindex].value.destroy();
                    var wire = _this.connectUnit(myParentUnit, objunit, objunitindex);
                    if (objunit.level == 2) {
                        wire.element.style.left = "332px";
                    } else if (objunit.level == 3) {

                        wire.element.style.left = "510px";
                        var objtopdragging = parseIntPx($unitEl.css("top"));
                        if (myParentUnit.subUnitMap.datas.length == 3 && objunitindex > 0) {

                            var dragingtop = parseIntPx($unitEl.css("top"));
                            var dragingterminal = dragingtop + parseIntPx(objunit.height) / 2;

                            var punitterminaltop = parseIntPx(_this.$("#" + objunit.parentunitid).css("top"))
                                + parseIntPx(myParentUnit.height) / 2;

                            if (dragingterminal < punitterminaltop) {
                                wire.element.style.top = dragingterminal + "px";
                            }
                        }
                    }
                    myParentUnit.subUnitMap.datas[objunitindex].value = wire;

                    _this.rescuvieSetChildrenDistance(unitId, moveDistance);
                }

                function startDragEvent() {
                    objtop = parseIntPx($unitEl.css("top"));
                }

                function endDragEvent() {
                    _this.sortSequence(unitId);
                    _isMoving = false;
                }

                drag.subscribe("dragEvent", objDraging);
                drag.subscribe("dragEvent", startDragEvent);
                drag.subscribe("endDragEvent", endDragEvent);
            },


            renderUnit: function (unit) {

                var parentId = unit.parentunitid;
                var belongregion = unit.belongregion;
                var parentLeft = this.$("#" + parentId).css("left");
                var parentTop = this.$("#" + parentId).css("top");
                var unitleft = "";
                var unittop = parentTop;
                var lastunitunitinstanceid = "";
                if (unit.level == 3) {
                    // this.UNIT_DISTANCE=100;
                } else if (unit.level == 5) {
                    // this.UNIT_DISTANCE=80;
                } else if (unit.componenttype == "PARA") {
                    // this.UNIT_DISTANCE=60;
                } else {
                    // this.UNIT_DISTANCE=30;
                }
                var parentUnit = this.units.get(unit.parentunitid);
                var data = parentUnit.subUnitMap.datas;
                if (data.length > 0) {
                    if (parentUnit.subUnitMap.indexOfKey(unit.unitinstanceid) == -1) {
                        lastunitunitinstanceid = data[data.length - 1].key;
                    } else {
                        var lastunitkeyobj = data[parentUnit.subUnitMap.indexOfKey(unit.unitinstanceid) - 1];
                        if (lastunitkeyobj != null) {
                            lastunitunitinstanceid = lastunitkeyobj.key;
                        }
                    }
                    var lastunit = this.units.get(lastunitunitinstanceid);
                    if (lastunit != null) {
                        var lastunittop = parseIntPx(this.$("#" + lastunitunitinstanceid).css("top"));
                        var lastunitheight = parseIntPx(lastunit.height);
                        unittop = lastunittop + lastunitheight + this.UNIT_TOP_OFFSET + "px";
                    }
                }

                unitleft = parseIntPx(parentLeft)
                    + parseIntPx(this.$("#" + parentId).css("width")) + this.UNIT_DISTANCE
                    + "px";

                if (data.length == 0) {
                    if (unit.level == 3) {
                        var top = 0;
                        if (unit.belongregion == this.REGION_USER) {
                            top = this.UNIT_USER_TOP;
                        } else {
                            top = this.SYSTEM_TOP;
                        }
                        unittop = top + parseInt(this.UNIT_USER_HEIGHT / 2, 10)
                            - parseInt(parseIntPx(unit.height) / 2) + "px";
                    } else {
                        var ptop = parseIntPx(this.$("#" + unit.parentunitid).css("top"));
                        unittop = ptop
                            + parseInt((parseIntPx(parentUnit.height) / 2)
                            - (parseIntPx(unit.height) / 2), 10) + "px";
                    }
                }
                var unithtml = "";
                if (unit.componenttype == "PARA") {

                    unithtml = "<div belongtotopic="
                        + unit.belongregion
                        + " onmouseover='flowDesigner.mouseOverUnit(this)' onclick='flowDesigner.setConstValueForPara(\""
                        + unit.unitinstanceid + "\");' onmouseout='flowDesigner.mouseOutUnit(this)' id='"
                        + unit.unitinstanceid + "' style='position:absolute;left:" + unitleft + ";top:"
                        + unittop + ";'>";
                } else {
                    unithtml = "<div belongtotopic="
                        + unit.belongregion
                        + " onmouseover='flowDesigner.mouseOverUnit(this)' onmouseout='flowDesigner.mouseOutUnit(this)' id='"
                        + unit.unitinstanceid + "' style='position:absolute;left:" + unitleft + ";top:"
                        + unittop + ";'>";
                }
                unithtml += '<table style="margin-top:4px;">';
                unithtml += ' <tr>';
                unithtml += '<td align="left" style="width:' + unit.width + '">';
                if (unit.componenttype == "UI" || unit.componenttype == "TOUI") {
                    var html = $("#flow_ui_moving").html().replace("position: absolute;", " ").replace(
                        "position:absolute;", "").replace("onclick", "logiconclick");
                    if (unit.componenttype == "UI") {
                        var firstIndex = html.indexOf(">");
                        html = html.substr(0, firstIndex) + " onclick='flowDesigner.onUnitClick(\"" + unit.unitinstanceid + "\")' title='"
                            + unit.componentid + "'" + html.substring(firstIndex);
                    }
                    if (html.indexOf('img id="html5video') > 0) {
                        html = html.replace("width: 320px", "width: 180px").replace("height: 420px",
                            "height: 220px");
                    }
                    unithtml += html;
                } else if (unit.componenttype == "API") {
                    var html = $("#flow_service_moving").html().replace(/id="/, "logicapiid=\"").replace(
                            "position: absolute;", " ").replace("left:", "logicapileft:").replace("top:",
                            "logicapitop").replace("onclick", "logiconclick").replace("api_item", "api_item_selected");
                    var firstIndex = html.indexOf(">");
                    html = html.substr(0, firstIndex) + " onclick='flowDesigner.onUnitClick(\"" + unit.unitinstanceid + "\")'"
                        + html.substring(firstIndex);
                    html = html.substr(0, firstIndex) + " ondblclick='flowDesigner.onUnitDbClick(\"" + unit.unitinstanceid + "\")'"
                        + html.substr(firstIndex);
                    unithtml += html;
                }
                else if (unit.componenttype == "XLT") {
                    var html = $("#flow_service_moving").html().replace(/id="/, "logicapiid=\"").replace(
                            "position: absolute;", " ").replace("left:", "logicapileft:").replace("top:",
                            "logicapitop").replace("onclick", "logiconclick");
                    var firstIndex = html.indexOf(">");
                    html = html.substr(0, firstIndex) + " onclick='flowDesigner.onUnitClick(\"" + unit.unitinstanceid + "\")'"
                        + html.substring(firstIndex);
                    html = html.substr(0, firstIndex) + " ondblclick='flowDesigner.onUnitDbClick(\"" + unit.unitinstanceid + "\")'"
                        + html.substr(firstIndex);
                    unithtml += html;
                } else if (unit.componenttype == "EVENT") {

                    var unitalias = "";
                    unithtml += "<div title='Drag UI or API to me' class='unit-event' style='height:"
                        + unit.height
                        + ";'><table style='width:100%'><tr><td align=\"center\" style=\"height:50px\"><img style='height:35px;margin-top:15px;' align='center' src='"
                        + unit.icon
                        + "'></td></tr><tr><td align=\"center\"><div style=\"margin-top:1px;color:#ffffff;font-size:17px;\">";
                    if (unit.alias && unit.alias != "") {
                        unitalias = unit.alias;
                    } else {
                        var cname = "";
                        var meta = metaHub.get(parentUnit.componentname);
                        if (meta && meta.events[unit.componentname]) {
                            cname = meta.events[unit.componentname].displayName;
                        }
                        cname = cname || unit.componentname;
                        unitalias = cname;
                    }
                    unithtml += unitalias;

                    unithtml += "</div><td></tr></table></div>";
                } else if (unit.componenttype == "FUNCTION") {

                    unithtml += "<div class='unit-func'>" +
                        "<span class='unit-func-span'>";
                    if (unit.alias && unit.alias != "") {
                        unithtml += unit.alias.substr(0, 12);
                        if (unit.alias.length > 12) {
                            unithtml += '..';
                        }
                    } else {
                        unithtml += unit.componentname.substr(0, 12);
                        if (unit.componentname.length > 12) {
                            unithtml += '..';
                        }
                    }
                    unithtml += "</span></div>";
                }

                else if (unit.componenttype == "OUTPUT") {
                    unithtml += "<div title='Drag UI to me'  class='unit-output' >";
                    unithtml += unit.componentname;
                    unithtml += "</div>";

                } else if (unit.componenttype == "INPUT") {

                    unithtml += "<div class='unit-input' >";
                    unithtml += unit.componentname;
                    unithtml += "</div>";
                }
                else if (unit.componenttype == "EOF") {

                    unithtml += "<div   class='unit-eof' >";
                    unithtml += unit.componentname;
                    unithtml += "</div>";
                } else if (unit.componenttype == "PARA") {

                    var olddiv = null;
                    var $unitEl = this.$("#" + unit.unitinstanceid);
                    if ($unitEl.length > 0) {
                        olddiv = $unitEl.find("td").eq(0).html();
                        var value = "";
                        if (olddiv.indexOf("<input") == 0) {
                            value = $unitEl.find("input").eq(0).val();
                            if (!value) {
                                value = "";
                            }
                        }
                        $unitEl.remove();
                    }

                    if (unit.isrelatedui) {
                        if (unit.rerender) {
                            if (unit.componentname == "pageNo") {
                                unithtml += $("#flow_ui_moving").html()
                                    .replace("position: absolute;", " ").replace(
                                        'logiconmouseout="objMouseOut(this);"',
                                        ' title="Click me to select page"');
                            } else {
                                unithtml += $("#flow_ui_moving").html()
                                    .replace("position: absolute;", " ").replace(
                                        'logiconmouseout="objMouseOut(this);"',
                                        'title=" Drag UI to me from workplace or toolbar"');
                            }
                        } else {
                            if (olddiv.indexOf("<input") == 0) {
                                unithtml += "<input value=\"";
                                unithtml += value;
                                unithtml += "\" class='ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-d' " +
                                    "onmouseout=\"this.blur();return;\"  type='text' style='width:100px;height:15px;margin-top:-4px'  onclick='this.focus()'>";
                            } else {
                                unithtml += olddiv;
                            }
                        }
                    } else {

                        if (unit.componentname == "pageNo" && unit.componenttype == "PARA"
                            && parentUnit.parentunitid.indexOf("changePage") > 0)// select
                        // page
                        {
                            unithtml += "<div  title='Click me to select page' class='unit-select-page' onclick='flowDesigner.setPage(\""
                                + unit.unitinstanceid
                                + "\")' >";
                        } else if (unit.componentname == "src"
                            && this.units.get(parentUnit.parentunitid).componenttype == "FUNCTION"
                            && this.units.get(parentUnit.parentunitid).componentname == "changeSrc"
                            && !_isMoving) {
                        } else {
                            unithtml += "<div title='Drag UI to me from workplace or toolbar' class='unit-from-toolbar'";
                        }

                        unithtml += "</div>";
                    }
                }
                unithtml += '</td>';

                if (unit.componenttype != "PARA" && unit.componenttype != "TOUI") {
                    unithtml += '<td>';

                    unithtml += '<div class="designer-terminal designer-terminal-open" onclick="flowDesigner.closeAndOpen(this,\''
                        + unit.unitinstanceid + '\')"></div>';

                    unithtml += '</td>';
                }
                var punithtml = this.$("#" + unit.parentunitid).html();
                if (punithtml.indexOf("designer-terminal-close") > 0) {
                    this.$("#" + unit.parentunitid).html(
                        punithtml.replace("designer-terminal-close", "designer-terminal-open"));
                }
                unithtml += '</tr>';
                unithtml += '</table>';
                var deleteleft = parseIntPx(unit.width) - 10 + "px";
                var configureleft = parseIntPx(unit.width) - 40 + "px";
                if (unit.componenttype == "API" || unit.componenttype == "XLT" || unit.componenttype == "EVENT"
                    || parentUnit.componenttype == "OUTPUT" || unit.componenttype == "FUNCTION"
                    || unit.componenttype == "PARA" || unit.componenttype == "UI") {
                    if (unit.componenttype == "UI") {
                        if (this.units.get(unit.parentunitid).componenttype == "EVENT") {
                            unithtml += "<img title=\"Delete\" onclick=\"flowDesigner.deleteUnitBefore('"
                                + unit.unitinstanceid
                                + "');\" src='modules/flowDesigner/images/delete.png' class='unit-delete-icon' style='left:"
                                + deleteleft
                                + ";top:-25px;z-index:1100;display:none'><img title=\"Configure Functions\" onclick=\"flowDesigner.configureFunAndEvent('"
                                + unit.unitinstanceid
                                + "');\" src='modules/flowDesigner/images/configure.png' style='width:30px;position:absolute;left:"
                                + configureleft + ";top:-25px;z-index:1100;display:none'>";

                        } else {
                            unithtml += "<img title=\"Delete\" onclick=\"flowDesigner.deleteUnitBefore('"
                                + unit.unitinstanceid
                                + "');\" src='modules/flowDesigner/images/delete.png' style='width:30px;position:absolute;left:"
                                + deleteleft
                                + ";top:-25px;z-index:1100;display:none'><img title=\"Configure Events\" onclick=\"flowDesigner.configureFunAndEvent('"
                                + unit.unitinstanceid
                                + "');\" src='modules/flowDesigner/images/configure.png' style='width:30px;position:absolute;left:"
                                + configureleft + ";top:-25px;z-index:1100;display:none'>";
                        }
                    } else {
                        var parentUnit = this.units.get(unit.parentunitid);
                        if (!parentUnit.Plugin || parentUnit.Plugin.className != 'Timer') {

                            unithtml += "<img title=\"Delete\" onclick=\"flowDesigner.deleteUnitBefore('"
                                + unit.unitinstanceid
                                + "');\" src='modules/flowDesigner/images/delete.png' style='width:30px;position:absolute;left:"
                                + deleteleft + ";top:-25px;z-index:1100;display:none'>";
                        }
                    }
                }
                unithtml += '</div>';

                this.$("#mylogic" + unit.viwer).append(unithtml);

                //flowModel.updateObjInfo(unit.unitinstanceid);
            },


            /**
             * connect two units and draw wire between them,
             * @param fromUnit
             * @param toUnit
             * @param [toUnitIndex]    index of to unit in brother units
             * @param [notpara]
             * @returns {*}
             */
            connectUnit: function (fromUnit, toUnit, toUnitIndex, notpara) {
                var $fromUnitEl = this.$("#" + fromUnit.unitinstanceid);
                var $toUnitEl = this.$("#" + toUnit.unitinstanceid);
                var fromUnitEl = $fromUnitEl[0];
                var toUnitEl = $toUnitEl[0];
                var container = document.getElementById('mylogic' + fromUnit.viwer);

                var wirecolor = this.USER_WIRE_COLOR;
                if (/^systeminitization/.test(fromUnit.unitinstanceid)
                    || /^systeminitization/.test(toUnit.unitinstanceid)) {
                    wirecolor = this.SYSTEM_WIRE_COLOR;
                }

                var wirewidth = 1;
                var tounittop = $toUnitEl.css("top");
                var toOffsetTop = parseInt(parseIntPx(toUnit.height) / 2, 10);

                if (toUnit.level == 3) {
                    var fromOffsetLeft = parseIntPx(fromUnit.width) + 20;
                    var fromOffsetTop = parseInt(parseIntPx(fromUnit.height) / 2, 10) + 3;
                    var toOffsetLeft = -3;
                    // if(fromUnit.subUnitMap.datas.length==1)
                    // {
                    toOffsetTop += 8.5;
                    // }
                } else {
                    var fromOffsetLeft = parseIntPx(fromUnit.width) + 12;
                    var fromOffsetTop = parseInt(parseIntPx(fromUnit.height) / 2, 10) + 1;
                    var toOffsetLeft = -6;
                }

                var wire = null;

                var fromunittop = $fromUnitEl.css("top");
                var fromunitleft = $fromUnitEl.css("left");

                var tounitleft = $toUnitEl.css("left");

                var canvas = null;
                // parent offsettop > to offset top
                if ((parseIntPx(fromunittop) + fromOffsetTop) >= parseIntPx(tounittop) + toOffsetTop) {
                    if (toUnit.level == 3) {
                        var radius = 0;
                        if (fromUnit.subUnitMap.datas.length == 2) {
                            radius = 0.5;
                        }

                        wire = new WireIt.BezierWire(new WireIt.Terminal(fromUnitEl, {
                            direction: [ radius, 0 ],
                            offsetPosition: [ fromOffsetLeft, fromOffsetTop ],
                            editable: false
                        }), new WireIt.Terminal(toUnitEl, {
                            direction: [ -0.3, 0 ],
                            offsetPosition: [ toOffsetLeft, toOffsetTop ],
                            editable: false
                        }), container, {
                            width: wirewidth,
                            borderwidth: 0.3,
                            bordercolor: wirecolor,
                            color: wirecolor
                        });
                    } else {
                        wire = new WireIt.BezierWire(new WireIt.Terminal(fromUnitEl, {
                            direction: [ 0.3, 0 ],
                            offsetPosition: [ fromOffsetLeft, fromOffsetTop ],
                            editable: false
                        }), new WireIt.Terminal(toUnitEl, {
                            direction: [ -0.6, 0 ],
                            offsetPosition: [ toOffsetLeft, toOffsetTop ],
                            editable: false
                        }), container, {
                            width: wirewidth,
                            borderwidth: 0.3,
                            bordercolor: wirecolor,
                            color: wirecolor
                        });
                    }
                    canvas = wire.redraw();

                    if (toUnit.level == 3) {

                        if (fromUnit.subUnitMap.datas.length == 3) {
                            if (toUnitIndex == 0) {
                                canvas.style.top = parseIntPx(tounittop) + toOffsetTop - 5 + "px";

                                canvas.style.left = parseIntPx(tounitleft) - this.UNIT_DISTANCE + 23 + "px";
                            }
                        } else {
                            canvas.style.top = parseIntPx(tounittop) + toOffsetTop - 7 + "px";

                            canvas.style.left = parseIntPx(tounitleft) - this.UNIT_DISTANCE + 20 + "px";
                        }
                    } else {
                        canvas.style.top = parseIntPx(tounittop) + toOffsetTop + "px";

                        canvas.style.left = parseIntPx(tounitleft) - this.UNIT_DISTANCE - 3 + "px";

                        if (toUnit.componenttype == "PARA") {
                            if (!notpara) {
                                this.annotationParaName(toUnit, parseIntPx(tounittop)
                                    + toOffsetTop - 12, parseIntPx($toUnitEl.css("left")));
                            }

                        }
                    }

                }
                // parent offsettop < to offset top
                else {
                    if (toUnit.level == 3) {
                        var radius = 0;
                        if (fromUnit.subUnitMap.datas.length == 2) {
                            radius = 0.5;

                        }
                        wire = new WireIt.BezierWire(new WireIt.Terminal(fromUnitEl, {
                            direction: [ radius, 0 ],
                            offsetPosition: [ fromOffsetLeft, fromOffsetTop ],
                            editable: false
                        }), new WireIt.Terminal(toUnitEl, {
                            direction: [ -0.3, 0 ],
                            offsetPosition: [ toOffsetLeft, toOffsetTop ],
                            editable: false
                        }), container, {
                            width: wirewidth,
                            borderwidth: 0.1,
                            bordercolor: wirecolor,
                            color: wirecolor
                        });
                    } else {
                        wire = new WireIt.BezierWire(new WireIt.Terminal(fromUnitEl, {
                            direction: [ 0.3, 0 ],
                            offsetPosition: [ fromOffsetLeft, fromOffsetTop ],
                            editable: false
                        }), new WireIt.Terminal(toUnitEl, {
                            direction: [ -0.6, 0 ],
                            offsetPosition: [ toOffsetLeft, toOffsetTop ],
                            editable: false
                        }), container, {
                            width: wirewidth,
                            borderwidth: 0.1,
                            bordercolor: wirecolor,
                            color: wirecolor
                        });
                    }
                    canvas = wire.redraw();
                    canvas.style.top = parseIntPx(fromunittop) + fromOffsetTop + "px";
                    if (toUnit.level == 3) {

                        if (fromUnit.subUnitMap.datas.length == 1) {
                            canvas.style.left = parseIntPx(fromunitleft) + fromOffsetLeft + "px";
                        } else if (fromUnit.subUnitMap.datas.length == 2 && toUnitIndex == 1) {
                            canvas.style.left = parseIntPx(fromunitleft) + fromOffsetLeft + "px";

                        } else if (fromUnit.subUnitMap.datas.length == 3) {
                            if (toUnitIndex == 2) {
                                canvas.style.left = parseIntPx(fromunitleft) + fromOffsetLeft + 3 + "px";
                                canvas.style.top = parseIntPx(fromunittop) + 2 + fromOffsetTop + "px"
                            } else if (toUnitIndex == 0) {
                                canvas.style.left = parseIntPx(fromunitleft) + fromOffsetLeft + 5 + "px";
                                canvas.style.top = parseIntPx(fromunittop) + 2 + fromOffsetTop + "px"
                            } else {
                                canvas.style.left = parseIntPx(fromunitleft) + fromOffsetLeft + "px";
                            }

                        } else {
                            canvas.style.left = parseIntPx(fromunitleft) + fromOffsetLeft + "px";

                        }
                    } else {
                        canvas.style.left = parseIntPx(fromunitleft) + fromOffsetLeft + "px";

                        if (toUnit.componenttype == "PARA") {
                            if (!notpara) {
                                var tounittop = parseIntPx($toUnitEl.css("top"));
                                var toOffsetTop = parseInt(parseIntPx(toUnit.height) / 2, 10);
                                this.annotationParaName(toUnit, tounittop + toOffsetTop + 3, parseIntPx($toUnitEl.css("left")));
                            }
                        }
                    }
                }
                wire.width = wire.element.clientWidth;
                wire.height = wire.element.clientHeight;
                return wire;
            },


            layoutSubUnits: function (parentunit) {
                var subdatas = parentunit.subUnitMap.datas;
                if (subdatas.length > 1) {
                    if (subdatas.length % 2 != 0)
                    {
                        var middleunitkey = subdatas[parseInt(subdatas.length / 2, 10)].key;

                        var middleunit = this.units.get(middleunitkey);

                        var parentoffsettop = 0;

                        if (parentunit.level == 2) {
                            parentoffsettop = parseInt(parseIntPx(parentunit.height) / 2, 10) + 3;
                        } else {
                            parentoffsettop = parseInt(parseIntPx(parentunit.height) / 2, 10) + 1;
                        }

                        var parentterminaltop = parseIntPx(this.$("#" + parentunit.unitinstanceid).css("top"))
                            + parentoffsettop;

                        var middleunittop = parseInt(parseIntPx(middleunit.height) / 2, 10);

                        var middleunitterminaltop = parseInt(this.$("#" + middleunit.unitinstanceid).css("top"));

                        var unitsoffsettop = parentterminaltop - middleunitterminaltop - middleunittop;

                        for (var i = 0; i < parentunit.subUnitMap.datas.length; i++) {
                            var id = parentunit.subUnitMap.datas[i].key;
                            var $subUnitEl = this.$("#" + id);
                            var subunittop = parseIntPx($subUnitEl.css("top"));
                            if (id == middleunitkey && parentunit.level == 2) {
                                $subUnitEl.css("top", subunittop + unitsoffsettop - 5 + "px");
                            } else {
                                if (subdatas.length == 3 && i == 0) {
                                    if ((parentunit.belongregion == this.REGION_SYSTEM || parentunit.belongregion == this.unitregionsuser)
                                        && this.units.get(id).componenttype == "PARA"
                                        && $subUnitEl.find("div")[0]
                                        && $subUnitEl.find("div")[0].outerHTML.indexOf("paraflag.png") < 0) {
                                        $subUnitEl.css("top", subunittop + unitsoffsettop + "px");
                                    } else {
                                        $subUnitEl.css("top", subunittop + unitsoffsettop + "px");
                                        // $("#"+id).css("top",subunittop+unitsoffsettop+55+"px");
                                    }
                                } else {
                                    $subUnitEl.css("top", subunittop + unitsoffsettop + "px");
                                }
                            }
                        }
                    }
                    else
                    {
                        var subunitsheight = 0;
                        var length = parentunit.subUnitMap.datas.length;
                        var firstunitid = parentunit.subUnitMap.datas[0].key;
                        for (var i = 0; i < length; i++) {
                            var id = parentunit.subUnitMap.datas[i].key;
                            var unit = this.units.get(id);
                            subunitsheight += parseInt(unit.height.replace("px", ""));
                            if (i < length - 1) {
                                if (length != 2) {
                                    subunitsheight += this.UNIT_TOP_OFFSET;
                                } else {
                                    subunitsheight += this.UNIT_TOP_OFFSET;
                                }
                            }
                        }

                        var parentoffsettop = 0;

                        if (parentunit.level == 2) {
                            parentoffsettop = parseInt(parseIntPx(parentunit.height) / 2, 10) + 3;
                        } else {
                            parentoffsettop = parseInt(parseIntPx(parentunit.height) / 2, 10) + 1;
                        }

                        var parentterminaltop = parseInt(this.$("#" + parentunit.unitinstanceid).css("top"))
                            + parentoffsettop;

                        var top = parentterminaltop - parseInt(subunitsheight / 2, 10);

                        var offsettop = top - parseInt(this.$("#" + firstunitid).css("top"));

                        for (var i = 0; i < length; i++) {
                            var id = parentunit.subUnitMap.datas[i].key;
                            var $subUnitEl = this.$("#" + id);
                            var unittop = parseIntPx($subUnitEl.css("top"));
                            if (length != 2) {
                                $subUnitEl.css("top", unittop + offsettop + "px");
                            } else if (i == 0) {
                                $subUnitEl.css("top", unittop + offsettop + "px");
                            } else {
                                $subUnitEl.css("top", unittop + offsettop + "px");
                                // $("#"+id).css("top",unittop+offsettop+this.UNIT_TOP_OFFSET*3+"px");

                            }
                        }
                    }
                } else if (subdatas.length == 1) {
                    var ptop = parseIntPx(this.$("#" + parentunit.unitinstanceid).css("top"));
                    var stop = parseIntPx(this.$("#" + subdatas[0].key).css("top"));
                    var pheight = parseIntPx(parentunit.height);
                    var sheight = parseIntPx(this.units.get(subdatas[0].key).height);
                    var subnewtop = parseInt(ptop + pheight / 2 - sheight / 2);
                    this.$("#" + subdatas[0].key).css("top", subnewtop + "px");

                } else if (parentunit.componenttype == "INPUT" && subdatas.length == 1
                    && this.$("#" + subdatas[0].key).find("div")[0]
                    && this.$("#" + subdatas[0].key).find("div")[0].outerHTML.indexOf("paraflag.png") < 0) {
                    var parentoffsettop = parseInt(parseIntPx(parentunit.height) / 2, 10) + 1;

                    var parentterminaltop = parseInt($("#" + parentunit.unitinstanceid).css("top"))
                        + parentoffsettop;

                    var paraunitheight = parseInt(this.units.get(subdatas[0].key).height.replace("px", ""));

                    var top = parseInt(parentterminaltop - paraunitheight / 2);
                    this.$("#" + subdatas[0].key).css("top", top + "px");

                }

                for (var i = 0; i < subdatas.length; i++) {
                    var subunit = this.units.get(subdatas[i].key);
                    if (subunit.subUnitMap.datas.length > 0) {
                        this.layoutSubUnits(subunit);

                    }
                }
            },

            // connect parent unit to children again
            reconnectSubUnits: function (parentunit) {
                var subdatas = parentunit.subUnitMap.datas;

                for (var i = 0; i < subdatas.length; i++) {
                    if (subdatas[i].value) {
                        subdatas[i].value.destroy();
                    }

                    this.$("#" + subdatas[i].key).css("opacity", "1");
                    var wire = this.connectUnit(parentunit, this.units.get(subdatas[i].key), i);

                    subdatas[i].value = wire;

                    if (this.units.get(subdatas[i].key).subUnitMap.datas.length > 0) {
                        for (var j = 0; j < this.units.get(subdatas[i].key).subUnitMap.datas.length; j++) {
                            this.reconnectSubUnits(this.units.get(subdatas[i].key));
                        }
                    }
                }

            },

            createEventsTips: function (uinitid) {
                var fromunit = this.units.get(uinitid);
                if (fromunit.level == 3 && fromunit.componenttype == "UI"
                    && fromunit.belongregion == this.REGION_USER) {

                    var componentmeta = metaHub.get(fromunit.componentname);
                    var eventitems = [];
                    var i = 0;
                    for (var eventname in componentmeta.events) {
                        if (!componentmeta.events.hasOwnProperty(eventname))
                            continue;
                        var alias = componentmeta.events[eventname].alias;
                        var icon = componentmeta.events[eventname].icon;
                        eventitems.push({
                            name: eventname,
                            alias: alias,
                            icon: icon
                        });
                        i++;
                    }

                    if (i == 1) {
                        this.createEvents(fromunit, eventitems);
                    } else if (i > 1) {
                        $("#event_selector_container").css(
                                "left",
                                parseIntPx($("#" + uinitid).css("left")) + parseIntPx(fromunit.width)
                                    + 40 + "px").css("top", $("#" + uinitid).css("top")).attr("lang", "event")
                            .show();

                        var selectedvalue = this.getSubUnitComponentName(uinitid);

                        $("#event_selector").html(
                            helper.genJCheckbox('Select Events', eventitems, selectedvalue, uinitid,
                                200)).attr("lang", uinitid + "--flowDesigner.createEvents");
                    }

                }
                else if (fromunit.Plugin && fromunit.Plugin.className == 'Timer') {

                    if (fromunit.Plugin.functionName == 'setInterval'
                        || fromunit.Plugin.functionName == 'setTimeout') {
                        var eventitems = [];
                        var alias = fromunit.Plugin.functionName.replace("set", "");
                        var eventname = fromunit.Plugin.functionName;
                        eventitems.push({
                            name: eventname,
                            alias: alias,
                            icon: "images/toolbox/timer.png"
                        });
                        this.createEvents(fromunit, eventitems);
                    }
                }

            },

            eventAndFunSelectCallback: function () {
                var selectvalue = helper.getJCheckBoxValue();
                var unitandcallback = $("#event_selector").attr("lang").split("--");
                var unit = this.units.get(unitandcallback[0]);

                if (unit == null || !unit) {
                    $("#event_selector_container").hide();
                }

                if ($("#event_selector_container").attr("lang") == "event") {
                    this.createEvents(unit, selectvalue);
                } else if ($("#event_selector_container").attr("lang") == "call function.") {
                    this.createUiFuns(unit, selectvalue);
                }
            },

            eventAndFunSelectRest: function () {
                $("#event_selector_container").css("left", "0px").css("top", "0px").attr("lang", "").hide();

                $("#event_selector").html("").attr("lang", "");

            },

            createEvents: function (fromunit, eventnames) {
                if (eventnames.length == 0)// clear events
                {
                    this.eventAndFunSelectRest();
                    return;  //do not delete existed events
                    var subunits = fromunit.subUnitMap.datas;
                    for (var i = 0; i < subunits.length; i++) {
                        this.deleteUnitBefore(subunits[i].key);
                    }
                } else // re-select events
                {
                    var subUnitsNamesArray = this.getSubUnitComponentName(fromunit.unitinstanceid).split(",");
                    var subunits = this.units.get(fromunit.unitinstanceid).subUnitMap.datas;
                    var eventNameArray = [];
                    for (var i = 0; i < eventnames.length; i++) {
                        eventNameArray.push(eventnames[i].name);

                    }
                    var deleteUnits = [];
                    subUnitsNamesArray = [];  //do not delete existed events
                    // delete unselected units
                    for (var i = 0; i < subUnitsNamesArray.length; i++) {
                        if (!util.inArray(eventNameArray, subUnitsNamesArray[i]))// existed
                        // event not selected yet to delete it
                        {
                            for (var j = 0; j < subunits.length; j++) {
                                if (this.units.get(subunits[j].key).componentname == subUnitsNamesArray[i]) {
                                    deleteUnits.push(subunits[j].key)
                                    // this.deleteUnitBefore(subunits[j].key);
                                    break;
                                }
                            }
                        }
                    }

                    for (var i = 0; i < deleteUnits.length; i++) {
                        this.deleteUnitBefore(deleteUnits[i]);
                    }

                    // create selected events
                    for (var i = 0; i < eventnames.length; i++) {

                        if (!util.inArray(subUnitsNamesArray, eventnames[i].name)) {
                            var eventname = eventnames[i].name;
                            var eventalias = eventnames[i].alias;
                            var icon = eventnames[i].icon;
                            var unit = {};
                            unit.componentname = eventname;
                            unit.alias = eventalias;
                            unit.icon = icon;
                            unit.componenttype = "EVENT";
                            unit.componentid = fromunit.componentid;
                            unit.unitinstanceid = fromunit.unitinstanceid + "_" + fromunit.level + "_"
                                + fromunit.componentname.substring(fromunit.componentname.lastIndexOf(".") + 1)
                                + "_" + eventname;
                            unit.belongregion = fromunit.belongregion;
                            unit.parentunitid = fromunit.unitinstanceid;
                            unit.level = fromunit.level + 1;
                            unit.subUnitMap = $.Map();
                            unit.width = "172px";
                            unit.height = "105px";
                            unit.viwer = fromunit.viwer;

                            this.units.put(unit.unitinstanceid, unit);

                            this.render_layout_connect(fromunit, unit);
                        }
                    }
                }
                this.eventAndFunSelectRest();
            },

            createUiFunsTips: function (uinitid) {
                var fromunit = this.units.get(uinitid);
                if ((fromunit.level == 5 && fromunit.componenttype == "UI" && fromunit.belongregion == this.REGION_USER)
                    || (fromunit.level == 3 && fromunit.componenttype == "UI" && fromunit.belongregion == this.REGION_SYSTEM)) {
                    var componentmeta = metaHub.get(fromunit.componentname);
                    var methoditems = [];

                    var i = 0;
                    for (var methodname in componentmeta.methods) {
                        var method = componentmeta.methods[methodname];
                        var showable = true;
                        if (util.is(method.showable, "Boolean"))
                            showable = method.showable;
                        if (showable)
                            methoditems.push({
                                name: methodname,
                                alias: method.alias
                            });
                        i++;
                    }

                    if (i == 1) {
                        this.createUiFuns(fromunit, methoditems);
                    } else if (i > 1) {
                        $("#event_selector_container").css(
                                "left",
                                parseIntPx($("#" + uinitid).css("left"))
                                    + parseIntPx(fromunit.width) + 40 + "px").css("top",
                                $("#" + uinitid).css("top")).attr("lang", "call function.").show();

                        $("#event_selector").html(
                                helper.genJCheckbox('Select Function', methoditems, '', 200)).attr("lang",
                                uinitid + "--flowDesigner.createUiFuns");
                    }
                }
            },

            createUiFuns: function (fromunit, methoditems) {

                if (methoditems.length == 0)// clear functions
                {
                    this.eventAndFunSelectRest();
                    return;     //do not delete
                    var subunits = fromunit.subUnitMap.datas;
                    for (var i = 0; i < subunits.length; i++) {
                        this.deleteUnitBefore(subunits[i].key);
                    }
                }

                else // re-select functions
                {
                    var subUnitsNamesArray = this.getSubUnitComponentName(fromunit.unitinstanceid).split(
                        ",");
                    var subunits = this.units.get(fromunit.unitinstanceid).subUnitMap.datas;
                    var functionNameArray = [];
                    for (var i = 0; i < methoditems.length; i++) {
                        functionNameArray.push(methoditems[i].name);

                    }

                    var deleteUnits = [];
                    subUnitsNamesArray =[];
                    // delete unselected units
                    for (var i = 0; i < subUnitsNamesArray.length; i++) {
                        if (!util.inArray(functionNameArray, subUnitsNamesArray[i]))
                        // existed  event  not  selected  yet  to  delete  it
                        {
                            for (var j = 0; j < subunits.length; j++) {
                                if (this.units.get(subunits[j].key).componentname == subUnitsNamesArray[i]) {
                                    deleteUnits.push(subunits[j].key)
                                    // this.deleteUnitBefore(subunits[j].key);
                                    break;
                                }
                            }
                        }
                    }

                    for (var i = 0; i < deleteUnits.length; i++) {
                        this.deleteUnitBefore(deleteUnits[i]);
                    }

                    for (var i = 0; i < methoditems.length; i++) {
                        if (!util.inArray(subUnitsNamesArray, methoditems[i].name)) {
                            var methodname = methoditems[i];
                            var unit = {};
                            unit.componentname = methodname.name;
                            unit.alias = methodname.alias;
                            unit.componenttype = "FUNCTION";
                            unit.componentid = fromunit.componentid;
                            unit.unitinstanceid = fromunit.unitinstanceid + "_" + fromunit.level + "_"
                                + fromunit.componentname.substring(fromunit.componentname.lastIndexOf(".") + 1)
                                + "_" + methodname.name;
                            unit.belongregion = fromunit.belongregion;
                            unit.parentunitid = fromunit.unitinstanceid;
                            unit.level = fromunit.level + 1;
                            unit.subUnitMap = $.Map();
                            unit.width = "153px";
                            unit.height = "50px";
                            unit.viwer = fromunit.viwer;

                            this.units.put(unit.unitinstanceid, unit);

                            this.render_layout_connect(fromunit, unit);
                        }
                    }
                    for (var i = 0; i < fromunit.subUnitMap.datas.length; i++) {

                        var functionunit = this.units.get(fromunit.subUnitMap.datas[i].key);
                        if (functionunit.subUnitMap.datas.length < 1) {
                            this.createInputAndOutput(functionunit);
                        }
                    }
                }

                this.eventAndFunSelectRest();

            },

            createInputAndOutput: function (fromunit) {
                if (fromunit.componenttype == "API"
                    && (!fromunit.Plugin || fromunit.Plugin.className != "Timer")) {
                    var apiBean = apiModel.getApi(fromunit.componentid);
                    var parasarray = apiBean.params;
                    if (parasarray.length > 0 && parasarray[0] != "") {
                        var inputunit = {};
                        inputunit.componentname = "INPUT";
                        inputunit.componenttype = "INPUT";
                        var t = new Date();
                        inputunit.componentid = fromunit.componentid;
                        inputunit.unitinstanceid = fromunit.belongregion + "_" + fromunit.level + "_"
                            + fromunit.componentname.substring(fromunit.componentname.lastIndexOf(".") + 1)
                            + "_" + "input_" + t.getTime();
                        inputunit.belongregion = fromunit.belongregion;
                        inputunit.parentunitid = fromunit.unitinstanceid;
                        inputunit.level = fromunit.level + 1;
                        inputunit.subUnitMap = $.Map();
                        inputunit.width = "100px";
                        inputunit.height = "32px";
                        inputunit.viwer = fromunit.viwer;

                        this.units.put(inputunit.unitinstanceid, inputunit);

                        this.render_layout_connect(fromunit, inputunit);
                    }
                    if (fromunit.componenttype == "API" && fromunit.unitinstanceid.indexOf("changePage") < 0
                        && (!fromunit.Plugin || fromunit.Plugin.className != "Timer")) {

                        var outputunit = {};
                        outputunit.componentname = "OUTPUT";
                        outputunit.componenttype = "OUTPUT";
                        var t = new Date();
                        outputunit.componentid = fromunit.componentid;
                        outputunit.unitinstanceid = fromunit.belongregion + "_" + fromunit.level + "_"
                            + fromunit.componentname.substring(fromunit.componentname.lastIndexOf(".") + 1)
                            + "_" + "input_" + t.getTime();
                        outputunit.belongregion = fromunit.belongregion;
                        outputunit.parentunitid = fromunit.unitinstanceid;
                        outputunit.level = fromunit.level + 1;
                        outputunit.subUnitMap = $.Map();
                        outputunit.width = "100px";
                        outputunit.height = "32px";
                        outputunit.viwer = fromunit.viwer;
                        this.units.put(outputunit.unitinstanceid, outputunit);
                        this.render_layout_connect(fromunit, outputunit);

                    }

                    if (parasarray.length > 0) {
                        this.createParasUnits(inputunit);
                    }
                }

                else if (fromunit.componenttype == "FUNCTION") {

                    var componentmeta = metaHub.get(this.units.get(fromunit.parentunitid).componentname);
                    var funname = fromunit.componentname;
                    for (var methodname in componentmeta.methods) {
                        if (funname == methodname) {
                            var method = componentmeta.methods[methodname];

                            if (typeof method.getValue == 'undefined') {
                                method.getValue = false;
                            }

                            if (method.params.length > 0) {
                                var inputunit = {};
                                inputunit.componentname = "INPUT";
                                inputunit.componenttype = "INPUT";
                                var t = new Date();
                                inputunit.componentid = fromunit.componentid;
                                inputunit.unitinstanceid = fromunit.belongregion
                                    + "_"
                                    + fromunit.level
                                    + "_"
                                    + fromunit.componentname
                                    .substring(fromunit.componentname.lastIndexOf(".") + 1) + "_"
                                    + "input_" + t.getTime();
                                inputunit.belongregion = fromunit.belongregion;
                                inputunit.parentunitid = fromunit.unitinstanceid;
                                inputunit.level = fromunit.level + 1;
                                inputunit.subUnitMap = $.Map();
                                inputunit.width = "100px";
                                inputunit.height = "32px";
                                inputunit.viwer = fromunit.viwer;

                                this.units.put(inputunit.unitinstanceid, inputunit);

                                this.render_layout_connect(fromunit, inputunit);

                                this.createParasUnits(inputunit);
                            }
                            else if (method.getValue) {
                                var outputunit = {};
                                outputunit.componentname = "OUTPUT";
                                outputunit.componenttype = "OUTPUT";
                                var t = new Date();
                                outputunit.componentid = fromunit.componentid;
                                outputunit.unitinstanceid = fromunit.belongregion
                                    + "_"
                                    + fromunit.level
                                    + "_"
                                    + fromunit.componentname
                                    .substring(fromunit.componentname.lastIndexOf(".") + 1) + "_"
                                    + "input_" + t.getTime();
                                outputunit.belongregion = fromunit.belongregion;
                                outputunit.parentunitid = fromunit.unitinstanceid;
                                outputunit.level = fromunit.level + 1;
                                outputunit.subUnitMap = $.Map();
                                outputunit.width = "100px";
                                outputunit.height = "32px";
                                outputunit.viwer = fromunit.viwer;
                                this.units.put(outputunit.unitinstanceid, outputunit);
                                this.render_layout_connect(fromunit, outputunit);
                                this.createParasUnits(outputunit);
                            } else {
                                this.$("#" + fromunit.unitinstanceid).html(
                                    this.$("#" + fromunit.unitinstanceid).html().replace("designer-terminal-open",
                                        ""));

                            }

                        }

                    }

                }
                else if (fromunit.componenttype == "XLT") {

                    var trueunit = {}, falseunit = {};
                    trueunit.componentname = "TRUE";
                    falseunit.componentname = "FALSE";
                    trueunit.componenttype = falseunit.componenttype = "EOF";

                    var t = new Date();
                    trueunit.componentid = falseunit.componentid = fromunit.componentid;
                    trueunit.unitinstanceid = fromunit.belongregion + "_" + fromunit.level + "_"
                        + fromunit.componentname.substring(fromunit.componentname.lastIndexOf(".") + 1) + "_"
                        + "true" + t.getTime();
                    falseunit.unitinstanceid = fromunit.belongregion + "_" + fromunit.level + "_"
                        + fromunit.componentname.substring(fromunit.componentname.lastIndexOf(".") + 1) + "_"
                        + "flase_" + t.getTime();
                    trueunit.belongregion = falseunit.belongregion = fromunit.belongregion;
                    trueunit.parentunitid = falseunit.parentunitid = fromunit.unitinstanceid;
                    trueunit.level = falseunit.level = fromunit.level + 1;
                    trueunit.subUnitMap = $.Map();
                    falseunit.subUnitMap = $.Map();
                    trueunit.width = falseunit.width = "100px";
                    trueunit.height = falseunit.height = "32px";
                    trueunit.viwer = falseunit.viwer = fromunit.viwer;

                    this.units.put(trueunit.unitinstanceid, trueunit);
                    this.units.put(falseunit.unitinstanceid, falseunit);

                    this.render_layout_connect(fromunit, trueunit);
                    this.render_layout_connect(fromunit, falseunit);
                }

            },

            createParasUnits: function (inputunit) {
                if (inputunit && inputunit.componenttype == "INPUT") {
                    if (this.units.get(inputunit.parentunitid).componenttype == "API") {
                        var apiBean = apiModel.getApi(this.units.get(inputunit.parentunitid).componentid);
                        var parasarray = apiBean.params;
                        for (var i = 0; i < parasarray.length; i++) {
                            if ($.trim(parasarray[i]) != "") {
                                var para = {};
                                para.componentname = parasarray[i];
                                para.componenttype = "PARA";
                                var t = new Date();
                                para.componentid = this.units.get(inputunit.parentunitid).componentid;
                                para.unitinstanceid = inputunit.belongregion + "_" + inputunit.level + "_"
                                    + inputunit.componentname + "_" + "para_" + parasarray[i] + "_"
                                    + t.getTime();
                                para.belongregion = inputunit.belongregion;
                                para.parentunitid = inputunit.unitinstanceid;
                                para.level = inputunit.level + 1;
                                para.subUnitMap = $.Map();
                                para.width = "40px";
                                para.height = "40px";
                                para.viwer = inputunit.viwer;

                                this.units.put(para.unitinstanceid, para);

                                this.render_layout_connect(inputunit, para);
                            }
                        }
                    } else if (this.units.get(inputunit.parentunitid).componenttype == "FUNCTION") {
                        var componentmeta = metaHub.get(this.units.get(this.units
                            .get(inputunit.parentunitid).parentunitid).componentname);

                        for (var methodname in componentmeta.methods) {

                            if (methodname == this.units.get(inputunit.parentunitid).componentname) {
                                var method = componentmeta.methods[methodname];

                                parasarray = method.params;
                                if (parasarray.length > 0) {
                                    for (var i = 0; i < parasarray.length; i++) {
                                        var para = {};
                                        para.componentname = parasarray[i].name;
                                        para.alias = parasarray[i].alias;
                                        para.componenttype = "PARA";
                                        var t = new Date();
                                        para.componentid = this.units.get(inputunit.parentunitid).componentid;
                                        para.unitinstanceid = inputunit.belongregion + "_" + inputunit.level + "_"
                                            + inputunit.componentname + "_" + "para_" + parasarray[i].name
                                            + "_" + t.getTime();
                                        para.belongregion = inputunit.belongregion;
                                        para.parentunitid = inputunit.unitinstanceid;
                                        para.level = inputunit.level + 1;
                                        para.subUnitMap = $.Map();
                                        para.width = "40px";
                                        para.height = "40px";
                                        para.viwer = inputunit.viwer;

                                        this.units.put(para.unitinstanceid, para);

                                        this.render_layout_connect(inputunit, para);
                                    }
                                }
                                break;
                            }

                        }

                    }
                }
            },

            annotationParaName: function (paraunit, top, left) {
                if (paraunit.componenttype == "PARA") {
                    if (this.$("#" + paraunit.unitinstanceid + "_annotation")) {
                        this.$("#" + paraunit.unitinstanceid + "_annotation").remove();
                    }

                    var paraannotationdiv = "<div style='position:absolute;top:" + top + "px;left:" + left
                        + ";font-weight: bold;font-size:0.9em;' id='" + paraunit.unitinstanceid
                        + "_annotation'>";

                    if (paraunit.alias) {
                        paraannotationdiv += paraunit.alias;
                    } else {
                        paraannotationdiv += paraunit.componentname;
                    }

                    paraannotationdiv += "</div>";

                    this.$("#mylogic" + paraunit.viwer).append(paraannotationdiv);

                    var paranamewidth = this.$("#" + paraunit.unitinstanceid + "_annotation").width();

                    this.$("#" + paraunit.unitinstanceid + "_annotation").css("left", left - paranamewidth - 5);

                    // auto handle resource seelect
                    // this.setConstValueForPara(paraunit.unitinstanceid, true);
                }

            },

            /**
             * @deprecated  to be deprecated
             */
            setConstValueForPara: function (paraunitid) {
                var paraunit = this.units.get(paraunitid);
                var fununit = this.units.get(this.units.get(paraunit.parentunitid).parentunitid);
                if (fununit.componenttype == "FUNCTION" && fununit.componentname == "changeSrc") {

                    var uitype = getControlType(this.units.get(fununit.parentunitid).componentid);
                    switch (uitype) {
                        case "IMAGE":
                            paraunit.fromuibar = "IMAGE";
                            this.relatedParentId = paraunit.unitinstanceid;
                            //TODO
                            showChooseImagePanel("flowDesigner.selectImgForPara", "");

                        case "HTML5AUDIO":
                            break;

                        case "HTML5VIDEO":
                            paraunit.fromuibar = "IMAGE";
                            this.relatedParentId = paraunit.unitinstanceid;
                            showChooseImagePanel("flowDesigner.selectImgForPara", "");
                            break;

                        default:
                            break;

                    }

                }

            },

            relatedPara: function (unit) {
                var parentunit = this.units.get(unit.parentunitid);
                var tounit = null;
                for (var i = 0; i < parentunit.subUnitMap.datas.length; i++) {
                    if (unit.componentname != "page") {
                        if (unit.unitinstanceid == parentunit.subUnitMap.datas[i].key) {
                            var relatedcomponentid = $("#flow_ui_moving").children("div")[0].id.replace(
                                "logic", "");
                            var height = $("#flow_ui_moving").css("height");
                            var width = $("#flow_ui_moving").css("width");
                            var curheight = unit.height;
                            unit.width = width;
                            unit.height = height;
                            if (unit.isrelatedui == null || !unit.isrelatedui) {
                                unit.isrelatedui = true;
                            }
                            unit.rerender = true;
                            unit.relatedcomponent = relatedcomponentid;
                            unit.fromuibar = null;
                            tounit = unit;

                        } else {

                            tounit = this.units.get(parentunit.subUnitMap.datas[i].key);
                            if (tounit.isrelatedui == null) {
                                tounit.isrelatedui = false;
                            }
                            if (tounit.rerender == null || tounit.rerender == true) {
                                tounit.rerender = false;
                            }

                        }
                    }

                }
                this.subunitsRerenderLayoutCnn(parentunit);
            },

            render_layout_connect: function (fromunit, unit) {
                this.renderUnit(unit);
                var unitInstance = this.units.get(fromunit.unitinstanceid);
                unitInstance.subUnitMap.put(unit.unitinstanceid, "");
                this.layoutSubUnits(unitInstance);
                this.reconnectSubUnits(unitInstance);

            },

            subunitsRerenderLayoutCnn: function (unit) {
                for (var i = 0; i < unit.subUnitMap.datas.length; i++) {
                    this.renderUnit(this.units.get(unit.subUnitMap.datas[i].key));
                }
                this.layoutSubUnits(unit);

                for (var i = 0; i < unit.subUnitMap.datas.length; i++) {
                    this.reconnectSubUnits(unit, this.units.get(unit.subUnitMap.datas[i].key));
                }
            },

            onUnitClick: function (unitId) {
                var unit = this.units.get(unitId);
                if (!unit)
                    return;
                if (unit.componenttype == "PARA") {
                    this.setConstValueForPara(unitId);
                } else if (unit.componenttype == "UI"
                    || unit.componenttype == "TOUI") {
                    //TODO make control current
                    //  objClicked(unit.componentid);
                } else if (unit.componenttype == "API") {
                    //TODO make service current
                    //  objDsClicked(unit.componentid);
                }
            },

            onUnitDbClick: function (unitId) {
                var unit = this.units.get(unitId);
                if (!unit)
                    return;
                if (unit.componenttype == "API") {
                    //TODO show api parameter configure dialog
                    showParaBox(unit.componentid);
                }
            },

            closeAndOpen: function (obj, unitid, all) {
                var status = "";

                if (this.$("#" + unitid).css("opacity") == "1") {
                    if (this.units.get(unitid).subUnitMap.datas.length > 0) {
                        if (obj.className.indexOf("designer-terminal-open") > 0) {
                            obj.className = obj.className.replace("designer-terminal-open",
                                "designer-terminal-close");
                            status = "close";

                        } else if (this.units.get(unitid).subUnitMap.datas.length > 0) {
                            obj.className = obj.className.replace("designer-terminal-close",
                                "designer-terminal-open");
                            status = "open";
                        }
                        this.recursiveSubunitsForExpand(this.units.get(unitid), status, all);
                    }
                }

            },

            recursiveSubunitsForExpand: function (unit, status, all) {
                var subunits = unit.subUnitMap.datas;
                for (var i = 0; i < subunits.length; i++) {
                    var wire = subunits[i].value;
                    var $subUnitEl = this.$("#" + subunits[i].key);
                    var subUnit = this.units.get(subunits[i].key);
                    if (status == "close") {
                        $subUnitEl.css("opacity", "0");
                        var type = subUnit.componenttype;
                        if (type == "PARA") {
                            $("#" + subunits[i].key + "_annotation").css("opacity", "0");
                            if ($subUnitEl.find("table tr td div")[0]) {
                                $subUnitEl.find("table tr td div")[0].title = "";
                            }
                        } else if (type == "EVENT" || type == "TOUI") {
                            $subUnitEl.find("table tr td div")[0].title = "";
                        }

                        // wire.element.style.display="none";
                        wire.element.style.opacity = "0";
                    } else if (status == "open") {
                        // wire.element.style.display="block";
                        wire.element.style.opacity = "1";
                        // $("#"+subunits[i].key).show();
                        $subUnitEl.css("opacity", "1");

                        if (subUnit.componenttype == "PARA") {
                            $("#" + subunits[i].key + "_annotation").css("opacity", "1");
                            if (subUnit.componentname == "pageNo") {
                                $subUnitEl.find("table tr td div")[0].title = "Click me to select page";
                            } else {
                                if (subUnit.fromuibar) {
                                    $subUnitEl.find("table tr td")[0].children[0].title = "Drag UI to me from workplace or toolbar";
                                } else {
                                    $subUnitEl.find("table tr td div")[0].title = "Drag UI to me from workplace or toolbar";
                                }
                            }
                        } else if (subUnit.componenttype == "EVENT") {
                            $subUnitEl.find("table tr td div")[0].title = "Drag API or UI to me";
                        } else if (subUnit.componenttype == "OUTPUT") {
                            $subUnitEl.find("table tr td div")[0].title = "Drag UI to me";
                        }

                        if (subUnit.subUnitMap.datas.length > 0) {
                            if (all || subUnit.componenttype == "INPUT") {
                                $subUnitEl.html(
                                    $subUnitEl.html().replace("designer-terminal-close",
                                        "designer-terminal-open"));
                            } else {
                                $subUnitEl.html(
                                    $subUnitEl.html().replace("designer-terminal-open",
                                        "designer-terminal-close"));
                            }
                        }
                    }

                    if (all) {
                        this.recursiveSubunitsForExpand(subUnit, status, all);
                    } else if (status == "close" || subUnit.componenttype == "INPUT"
                        && subUnit.subUnitMap.datas.length > 0) {
                        this.recursiveSubunitsForExpand(subUnit, status, all);
                    }
                }
            },

            configureFunAndEvent: function (unitinstanceid) {
                var punit = this.units.get(this.units.get(unitinstanceid).parentunitid);
                var eventitems = [];
                switch (punit.componenttype) {
                    case "maintopic":
                        var meta = metaHub.get("APP");
                        if (meta && meta.events) {
                            for (var eventname in meta.events) {
                                var event = meta.events[eventname];
                                var alias = event.alias;
                                var icon = event.icon;
                                var type = event.type;
                                eventitems.push({
                                    name: eventname,
                                    alias: alias,
                                    icon: icon
                                });
                            }
                        }
                        if (eventitems.length > 0)// construct the configure
                        // panel of multi-checkbox
                        {
                            var selectedvalue = this.getSubUnitComponentName(unitinstanceid);

                            var uinitid = unitinstanceid;
                            var left = parseIntPx($("#" + uinitid).css("left"))
                                + parseIntPx(this.units.get(unitinstanceid).width)
                                + 40;
                            $("#event_selector_container").css(
                                    "left", left + "px")
                                .css("top", $("#" + uinitid).css("top"))
                                .attr("lang", "event")
                                .show();

                            $("#event_selector").html(
                                    helper.genJCheckbox('Select Events', eventitems, selectedvalue,  200))
                                .attr("lang", uinitid + "--flowDesigner.createEvents");
                        }

                        break;

                    case "useroprate":

                        var unit = this.units.get(unitinstanceid);
                        var type = getControlType(unit.componentid);
                        var meta = metaHub.get(type);
                        if (meta && meta.events) {
                            for (eventname in meta.events) {
                                var event = meta.events[eventname];
                                var alias = event.alias;
                                var icon = event.icon;

                                eventitems.push({
                                    name: eventname,
                                    alias: alias,
                                    icon: icon
                                });
                            }
                        }
                        if (eventitems.length > 0)// construct the configure
                        // panel of multi-checkbox
                        {
                            var uinitid = unitinstanceid;
                            var selectedvalue = this.getSubUnitComponentName(unitinstanceid);
                            var left = parseIntPx($("#" + uinitid).css("left"))
                                + parseIntPx(this.units.get(unitinstanceid).width)
                                + 40;
                            $("#event_selector_container").css(
                                    "left",
                                    left + "px").css("top", $("#" + uinitid).css("top")).attr("lang", "event")
                                .show();

                            $("#event_selector").html(
                                helper.genJCheckbox('Select Events', eventitems, selectedvalue, uinitid,
                                    200)).attr("lang", uinitid + "--flowDesigner.createEvents");
                        }

                        break;

                    case "EVENT":
                        var unit = this.units.get(unitinstanceid);
                        var type = getControlType(unit.componentid);
                        var meta = metaHub.get(type);
                        if (meta && meta.events) {
                            for (var methodname in meta.methods) {
                                var method = meta.methods [methodname];
                                var alias = method.alias;
                                var icon = "";
                                var showable = true;
                                if (util.is(method.showable, "Boolean"))
                                    showable = method.showable;
                                if (showable)
                                    eventitems.push({
                                        name: methodname,
                                        alias: alias,
                                        icon: icon
                                    });
                            }
                        }
                        if (eventitems.length > 0)// construct the configure
                        // panel of multi-checkbox
                        {
                            var uinitid = unitinstanceid;
                            var selectedvalue = this.getSubUnitComponentName(unitinstanceid);
                            var left = parseIntPx($("#" + uinitid).css("left"))
                                + parseIntPx(this.units.get(unitinstanceid).width)
                                + 40;
                            $("#event_selector_container").css(
                                    "left", left + "px").css("top", $("#" + uinitid).css("top")).attr("lang",
                                    "call function.").show();

                            $("#event_selector").html(
                                    helper.genJCheckbox('Select Functions', eventitems, selectedvalue,  200))
                                .attr("lang", uinitid + "--flowDesigner.createUiFuns");
                        }

                        break;

                    default:
                        break;

                }

            },

            getSubUnitComponentName: function (unitinstanceid, flag) {
                var names = "";
                var regexp = new RegExp('^userdrive\\d+' + this.ID_SEPARATOR + 'object\\d+$');

                if (typeof flag == 'undefined' || flag == null || !flag) {
                    flag = false;
                }

                if (regexp.test(unitinstanceid) && !flag) {
                    var $pages = viwer.getAllPage();
                    for (var i = 0; i < $pages.length; i++) {
                        var fu = unitinstanceid.replace(/userdrive\d+/, 'userdrive' + $pages[i]);
                        var subUnits = this.units.get(fu);
                        if (typeof subUnits != 'undefined' && subUnits != null && subUnits) {
                            var unitmap = subUnits.subUnitMap.datas;
                            for (var j = 0; j < unitmap.length; j++) {
                                var onename = this.units.get(unitmap[j].key).componentname;
                                names = names + onename + ","
                            }
                        }
                    }
                } else {

                    var subUnits = this.units.get(unitinstanceid).subUnitMap.datas;
                    var names = "";
                    for (var i = 0; i < subUnits.length; i++) {
                        names = names + this.units.get(subUnits[i].key).componentname + ","
                    }

                }
                return names.substring(0, names.lastIndexOf(","));
            },

            deleteUnitBefore: function (unitinstanceid) {
                var unit = this.units.get(unitinstanceid);
                if (!unit) {
                    this.$("#" + unitinstanceid).remove();
                    return;
                }
                this.deletedUnitArray = [];
                //flowModel.deleteunits = [];
                try {
                    this.deleteUnit(unitinstanceid);
                } catch (e) {
                    console.error("--remove #" + unitinstanceid + " error: \n%o", e);
                }
                var parentunit = this.units.get(unit.parentunitid);
                if (this.deletedUnitArray.length > 0) {
                    for (var i = 0; i < this.deletedUnitArray.length; i++) {
                        this.units.deleteObj(this.deletedUnitArray[i]);
                    }
                }
                // delete unit from logicbizmodel

                //flowModel.deleteunitinstancearray(parentunit.belongregion);

                /*
                 * for(var i=0;i<parentunit.subUnitMap.datas.length;i++) {
                 * this.render_layout_connect(parentunit,this.units.get(parentunit.subUnitMap.datas[i].key)); }
                 */
            },

            deleteUnit: function (unitinstanceid) {
                var unit = this.units.get(unitinstanceid);
                if (!unit) {
                    return;
                }

                //flowModel.deleteInitialObject(unit.belongregion, unitinstanceid);

                var componenttype = unit.componenttype;
                if (componenttype != "PARA") {
                    var subunits = unit.subUnitMap.datas;
                    var unitwire = this.units.get(unit.parentunitid).subUnitMap.get(unitinstanceid);
                    unitwire.destroy();
                    unitwire = null;
                    this.$("#" + unitinstanceid).remove();

                    var parentsubunits = this.units
                        .get(unit.parentunitid).subUnitMap;
                    var parentunitid = unit.parentunitid;
                    parentsubunits.deleteObj(unitinstanceid);
                    this.deletedUnitArray.push(unitinstanceid);
                    if (componenttype == "API")
                        apiModel.deleteApi(unit.componentid);

                    if (subunits.length > 0) {
                        for (var i = 0; i < subunits.length; i++) {
                            this.deleteUnit(subunits[i].key);
                        }
                    }

                } else if (componenttype == "PARA")// remove paraannotation
                {
                    if (!util.inArray(this.deletedUnitArray, unit.parentunitid)) {
                        // this.deletedUnitArray.push(unitinstanceid);

                        var parahtml = this.$("#" + unitinstanceid)
                            .find("td")
                            .html(
                                '<div title="Drag UI to me from workplace or toolbar" class="unit-from-toolbar"></div>');
                        var paraunit = unit;
                        paraunit.width = "40px";
                        paraunit.height = "40px";
                        paraunit.isrelatedui = false;
                        paraunit.relatedcomponent = "";
                        var inputunit = this.units.get(paraunit.parentunitid);
                        this.subunitsRerenderLayoutCnn(inputunit);
                        // update LogicBizObj para as const;
                    } else {
                        this.$("#" + unitinstanceid + "_annotation").remove();
                        var subunits = unit.subUnitMap.datas;
                        var unitwire = this.units.get(unit.parentunitid).subUnitMap.get(unitinstanceid);
                        unitwire.destroy();
                        unitwire = null;
                        this.$("#" + unitinstanceid).remove();

                        var parentsubunits = this.units
                            .get(unit.parentunitid).subUnitMap;
                        var parentunitid = unit.parentunitid;
                        parentsubunits.deleteObj(unitinstanceid);
                        this.deletedUnitArray.push(unitinstanceid);
                        // this.units.deleteObj(unitinstanceid);
                        // var aaa=this.units.get(unitinstanceid);
                        var $parentUnitEl = $("#" + parentunitid);
                        if (parentsubunits.datas.length == 0 && $parentUnitEl
                            && $parentUnitEl.html()) {
                            $parentUnitEl.html(
                                $parentUnitEl.html().replace("designer-terminal-open",
                                    "designer-terminal-close"));
                        }
                        if (subunits.length > 0) {
                            for (var i = 0; i < subunits.length; i++) {
                                this.deleteUnit(subunits[i].key);
                            }
                        }
                    }
                }

            },


            setPage: function (intanceid) {
                var eventdata = {
                    data: "flowDesigner.setPageCallback",
                    instanceid: intanceid
                };
                //TODO  implement MultiplePageManager interface
                MultiplePageManager.prototype.viewAllPagesTumb(eventdata);

            },

            setPageCallback: function (intanceid, pageno) {
                MultiplePageManager.prototype.viewAllPagesTumb();
                var pagenum = parseInt(pageno, 10);
                var pagethumbdivhtml = MultiplePageManager.prototype.getPageThumbHTML(pageno).replace(/ID/g,
                        "MYPAGEID").replace(/ONMOUSEOVER/g, "MYPAGEONMOUSEOVER").replace(/ONMOUSEUP/g,
                        "MYPAGEONMOUSEUP").replace(/ONDBLCLICK/g, "MYONDBLCLICK").replace(/ONMOUSEOUT/g,
                        "MYONMOUSEOUT").replace("mashupMYPAGEIDE", "mashupIDE");
                var paraHTML = "<div  style='cursor:pointer' onclick=\"flowDesigner.setPage('" + intanceid
                    + "')\" class='thumbpagediv'><div class='thumbpagedivinline'>" + pagethumbdivhtml
                    + "</div></div>";
                this.$("#" + intanceid).find("td").eq(0).html(paraHTML);

                var unit = this.units.get(intanceid);
                unit.width = "112px";
                unit.height = "148px";
                unit.pageno = "'" + pagenum + "'";

                unit.isrelatedui = true;
                unit.rerender = false;
                unit.fromuibar = "PAGE";
                //flowModel.updateParaConstValue({}, unit.unitinstanceid);
                this.render_layout_connect(this.units.get(unit.parentunitid), unit);
            },

            switchDelete: function (unitinstanceid, event) // display or hide the icon of delete and configure events
            {
                var $unit = $("#" + unitinstanceid);
                var img = $unit.children("img")[0];
                if (viwer.check(unitinstanceid, 'systeminitization')) {
                    if (event == "over") {
                        img.style.display = "block";
                    } else {
                        img.style.display = "none";
                    }
                } else {
                    var img1 = $unit.children("img")[1];

                    if (img && img.src.indexOf("flowDesigner/images/delete.png") > 0) {
                        var unit = this.units.get(unitinstanceid);
                        if (unit.componenttype == "PARA") {
                            if ($unit.html().indexOf("paraflag.png") > 0) {
                                return;
                            }
                        }
                        if (event == "over") {
                            img.style.display = "block";

                            if (img1) {

                                if (unit.componenttype == "UI"
                                    && this.units.get(unit.parentunitid).componenttype != "EVENT")
                                // more than one event show the configure events icon otherwise not show。
                                {

                                    var objevents = metaHub.get(modelManager.get(unit.componentid).type).events;
                                    var eventsnum = 0;

                                    for (var e in objevents) {
                                        eventsnum++;
                                    }

                                    if (eventsnum > 1 || unit.subUnitMap.datas.length == 0) {
                                        img1.style.display = "block";
                                    }
                                }

                                else if (unit.componenttype == "UI"
                                    && this.units.get(unit.parentunitid).componenttype == "EVENT")
                                // more than one  functions show  the configure events icon otherwise not show。
                                {
                                    var objmethods = metaHub.get(modelManager.get(unit.componentid).type).methods;

                                    var methodsnum = 0;

                                    for (var method in objmethods) {
                                        methodsnum++;
                                    }

                                    if (methodsnum > 1 || unit.subUnitMap.datas.length == 0) {
                                        img1.style.display = "block";
                                    }

                                }
                            }
                        } else if (event == "out") {
                            img.style.display = "none";
                            if (img1) {
                                img1.style.display = "none";
                            }
                        }
                    }
                }
            },

            selectImgForPara: function (imgpath) {
                //TODO show image panel
                panelChooseImagePanel.hide();

                $("#mouseMoving").html("<img src='" + imgpath + "' style='max-height:150px'>");
                var unitheight = $("#mouseMoving").height();
                var unitwidth = $("#mouseMoving").width();
                $("#mouseMoving").html("");

                var imagepatharray = imgpath.split("/");
                var title = imagepatharray[imagepatharray.length - 1];
                $("#" + this.relatedParentId).find("td").eq(0).html(
                    "<img onclick=\"flowDesigner.setConstValueForPara('" + this.relatedParentId
                        + "',false);\" title='" + title + "' style='max-height:150px'src='" + imgpath
                        + "'>");
                // var apendtrandtd="<tr><td
                // align='center'>"+title+"</td></tr>";
                // $($($("#"+this.relatedParentId)).find("tbody")).append(apendtrandtd);

                var unitwidth = $("#" + this.relatedParentId).find("img").eq(0).width();

                var relatedunit = this.units.get(this.relatedParentId);

                if (relatedunit) {
                    relatedunit.width = unitwidth + "px";
                    relatedunit.height = unitheight + "px";
                    relatedunit.isrelatedui = true;
                    relatedunit.rerender = false;
                    delete relatedunit.relatedcomponent;
                    var parentunit = this.units.get(relatedunit.parentunitid);

                    this.subunitsRerenderLayoutCnn(parentunit);
                }
                //flowModel.updateParaConstValue($("#" + this.relatedParentId).find("td").first().find("img")[0], this.relatedParentId);
            },

            textForPara: function () {

                var unitheight = 18
                var unitwidth = 100;

                $("#" + this.relatedParentId).find("td").first()
                    .html(
                        "<input class='ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-d' onmouseout='this.blur()' value='' type='text' style='width:100px;height:15px;margin-top:-4px' onclick='this.focus()'/>");

                var relatedunit = this.units.get(this.relatedParentId);

                if (relatedunit) {
                    relatedunit.width = unitwidth + "px";
                    relatedunit.height = unitheight + "px";
                    relatedunit.isrelatedui = true;
                    relatedunit.rerender = false;
                    delete relatedunit.relatedcomponent;
                    var parentunit = this.units.get(relatedunit.parentunitid);
                    this.subunitsRerenderLayoutCnn(parentunit);
                    //flowModel.updateParaConstValue($("#" + this.relatedParentId).find("td").first().find("input")[0], this.relatedParentId);
                }

            },

            // automic layout all units
            autoAllUnitsLayout: function () {
                // relayout all units

            },

            rescuvieSetChildrenDistance: function (unitId, distance) {
                var objunit = this.units.get(unitId);

                var parentunit = this.units.get(objunit.parentunitid);
                var objSubUnits = objunit.subUnitMap.datas;
                var objunitindex = parentunit.subUnitMap.indexOfKey(unitId);

                if (objSubUnits.length > 0) {
                    for (var i = 0; i < objSubUnits.length; i++) {
                        var unit = this.units.get(objSubUnits[i].key);
                        var unittop = parseIntPx(this.$("#" + objSubUnits[i].key).css("top"));

                        this.$("#" + objSubUnits[i].key).css("top", unittop + distance + "px");
                        // set wire top
                        var wireelement = objSubUnits[i].value.element;
                        var wiretop = parseIntPx(wireelement.style.top);
                        wireelement.style.top = wiretop + distance + "px";

                        if (unit.componenttype == "PARA") {
                            var paraannotationtop = parseIntPx(this.$(
                                "#" + unit.unitinstanceid + "_annotation").css("top"));
                            this.$("#" + unit.unitinstanceid + "_annotation").css("top",
                                paraannotationtop + distance + "px");
                        }

                        if (unit.subUnitMap.datas.length > 0) {
                            this.rescuvieSetChildrenDistance(unit.unitinstanceid, distance);
                        }
                    }

                }

            },

            // when draged the unit re-sort the subunits of parent
            sortSequence: function (objunitid) {
                var unit = this.units.get(objunitid);
                var punit = this.units.get(unit.parentunitid);
                var index = punit.subUnitMap.indexOfKey(unit.unitinstanceid);
                var unittop = parseIntPx(this.$("#" + objunitid).css("top"));
                var subunitstop = [];
                var switchto = index;

                if (punit.subUnitMap.datas.length > 1) {
                    for (var i = 0; i < punit.subUnitMap.datas.length; i++) {
                        subunitstop.push(parseIntPx(this.$("#" + punit.subUnitMap.datas[i].key).css("top")));
                    }
                    subunitstop.sort();

                    for (var j = 0; j < subunitstop.length; j++) {
                        if (subunitstop[j] == unittop && j != index) {
                            switchto = j;
                            break;
                        }

                    }
                    // change punit sub units sequence
                    if (switchto > index)// up to down
                    {
                        var p = index;
                        var pswitchunit = punit.subUnitMap.datas[index];

                        for (p; p < switchto; p++) {
                            punit.subUnitMap.datas[p] = punit.subUnitMap.datas[p + 1];
                        }
                        punit.subUnitMap.datas[switchto] = pswitchunit;

                        //flowModel.adjustCallSeq(objunitid, "down", index, switchto);

                    } else if (switchto < index)// down to up
                    {
                        var p = index;
                        var indexunit = punit.subUnitMap.datas[index];

                        for (p; p > switchto; p--) {
                            punit.subUnitMap.datas[p] = punit.subUnitMap.datas[p - 1];
                        }
                        punit.subUnitMap.datas[switchto] = indexunit;
                        //flowModel.adjustCallSeq(objunitid, "up", index, switchto);
                    }
                }
            },


            subUnitsRelayoutCnn: function (unit, xoffset, yoffset) {

                for (var i = 0; i < unit.subUnitMap.datas.length; i++) {
                    var $subUnitEl = this.$("#" + unit.subUnitMap.datas[i].key);
                    var subunitleft = $subUnitEl.css("left");
                    var subunittop = $subUnitEl.css("top");

                    $subUnitEl.css("left",
                        parseIntPx(subunitleft) + xoffset + "px");

                    // $subUnitEl.css("top",parseIntPx(subunittop)+yoffset+"px");

                    if (this.units.get(unit.subUnitMap.datas[i].key).componenttype == "PARA") {
                        var annotationleft = parseIntPx($("#" + unit.subUnitMap.datas[i].key + "_annotation").css("left"));
                        $("#" + unit.subUnitMap.datas[i].key + "_annotation").css("left",
                            annotationleft + xoffset + "px");

                        // var
                        // annotationtop=parseIntPx($("#"+unit.subUnitMap.datas[i].key+"_annotation").css("top"));
                        // $("#"+unit.subUnitMap.datas[i].key+"_annotation").css("top",annotationtop+yoffset+"px");
                    }
                    var wireelement = unit.subUnitMap.datas[i].value.element;
                    var wireleft = parseIntPx(wireelement.style.left);
                    wireelement.style.left = wireleft + xoffset + "px";
                    // var
                    // wiretop=parseIntPx(wireelement.style.top);
                    // wireelement.style.top=wiretop+yoffset+"px";

                }

                for (var i = 0; i < unit.subUnitMap.datas.length; i++) {
                    this.subUnitsRelayoutCnn(this.units.get(unit.subUnitMap.datas[i].key),
                        xoffset, yoffset);
                }

            },

            updateUIDisplay: function (cid, type) {
                var bean = modelManager.get(cid);
                var el = $("#form_designer_container").find("#" + cid)[0];
                type = type || 'data';
                if (!cid  || !bean || !el)
                    return;
                var $pages = viwer.getAllPage();
                for (var i = 0; i < $pages.length; i++) {
                    var rootunit = this.units.get("maintopic" + $pages[i]);
                    if (type == "data") {
                        this.recursionUpdateUIDisplay(rootunit, el);
                        this.updatePageForPara(rootunit, bean.pageNo);
                    } else if (type == "page") {
                        this.updatePageForPara(rootunit, bean.pageNo);
                    }
                }
            },

            recursionUpdateUIDisplay: function (unit, el) {
                if ((unit.componentid == el.id || unit.relatedcomponent == el.id)) {
                    if (unit.componenttype == "UI" || unit.componenttype == "TOUI" || unit.componenttype == "PARA") {
                        var oldwidth = unit.width;
                        var oldheight = unit.height;

                        // unit.width = el.style.width;
                        unit.width = $(el).width() + "px";
                        unit.height = el.style.height;
                        var newhtml = util.getOuterHTML(el).replace("ID=\"object", "ID=\"logicobject")
                            .replace("left:", "logicleft:").replace("margin-logicleft:", "margin-left:")
                            .replace("top:", "logictop:").replace("margin-logictop", "margin-top").replace(
                                "ONMOUSEUP", "onclick").replace("ONDBLCLICK", "logicondblclick").replace(
                                "ONMOUSEOVER", "logiconmouseover").replace("ONMOUSEOUT", "logiconmouseout")
                            .replace("id=\"object", "id=\"logicobject").replace("href", "logichref").replace(
                                "position: absolute;", " ");
                        /* .replace("<a", "<logica").replace("</a>", "</logica>") */

                        var $unit = this.$("#" + unit.unitinstanceid);
                        $unit.find("td").eq(0).html(newhtml);
                        $unit.find("td").eq(0).width(unit.width);
                        var xoffset = parseIntPx(unit.width) - parseIntPx(oldwidth);
                        var ymove = parseIntPx(unit.height) - parseIntPx(oldheight);
                        var yoffset = parseInt(ymove / 2);
                        this.subUnitsRelayoutCnn(unit, xoffset, yoffset);
                        var objdelete = $unit.children("img")[0];

                        if (objdelete.src.indexOf("delete.png") > 0) {
                            objdelete.style.left = parseIntPx(objdelete.style.left) + xoffset + "px";
                        }

                        $unit.css("top",
                            parseIntPx($unit.css("top")) - yoffset + "px");

                        // this.subUnitsRelayoutCnn(unit);
                    }
                }
                var unitsub = unit.subUnitMap.datas;

                for (var i = 0; i < unitsub.length; i++) {
                    this.recursionUpdateUIDisplay(this.units.get(unitsub[i].key), el);
                }
            },

            updatePageForPara: function (unit, pageNo) {

                if (unit.componenttype == "PARA" && unit.componentname == "pageNo" && unit.pageno
                    && parseInt(unit.pageno.replace("'", ""), 10) == pageNo) {

                    var pagethumbdivhtml = MultiplePageManager.prototype.getPageThumbHTML(pageNo).replace(/ID/g,
                            "MYPAGEID").replace(/ONMOUSEOVER/g, "MYPAGEONMOUSEOVER").replace(/ONMOUSEUP/g,
                            "MYPAGEONMOUSEUP").replace(/ONDBLCLICK/g, "MYONDBLCLICK").replace(/ONMOUSEOUT/g,
                            "MYONMOUSEOUT").replace("mashupMYPAGEIDE", "mashupIDE");
                    var paraHTML = "<div  style='cursor:pointer' onclick=\"flowDesigner.setPage('"
                        + unit.unitintanceid + "')\" class='thumbpagediv'><div class='thumbpagedivinline'>"
                        + pagethumbdivhtml + "</div></div>";
                    this.$("#" + unit.unitinstanceid).find("td").eq().html(paraHTML);
                }

                var unitsub = unit.subUnitMap.datas;

                for (var i = 0; i < unitsub.length; i++) {
                    this.updatePageForPara(this.units.get(unitsub[i].key), pageNo);
                }

            },

            unitsToString: function () {
                var sabUnits = this.units;

                var model = {
                    units: []
                };

                for (var i = 0; i < sabUnits.datas.length; i++) {
                    var unit = {};
                    var oldunit = sabUnits.datas[i];

                    unit.key = oldunit.key;
                    unit.value = {};
                    for (var key in oldunit.value) {
                        if (key != "subUnitMap") {
                            unit.value[key] = oldunit.value [key];
                        }
                    }
                    unit.value.subUnitMap = [];
                    for (var j = 0; j < sabUnits.datas[i].value.subUnitMap.datas.length; j++) {
                        unit.value.subUnitMap.push(sabUnits.datas[i].value.subUnitMap.datas[j].key);
                    }

                    model.units.push(unit);

                }

                return JSON.stringify(model);
            },

            unitsHtmlToString: function () {
                var logichtml = this.$el.html();

                var $resize = this.$el.find("div .yui-resize-handle");
                var $wireit = this.$el.find("div .WireIt-Terminal");
                var canvasarray = this.$el.find("canvas");

                for (var i = 0; i < $resize.length; i++) {
                    logichtml = logichtml.replace($resize[i].outerHTML, "");
                }
                for (var i = 0; i < $wireit.length; i++) {
                    logichtml = logichtml.replace($wireit[i].outerHTML, "");
                }
                for (var i = 0; i < canvasarray.length; i++) {
                    logichtml = logichtml.replace(canvasarray[i].outerHTML, "");
                }

                // ////////////把Tab分页标签也放到这吧。
                logichtml += '<!--[[Tab]]-->' + $("#flow_scroll_tabs").html();

                return encodeURIComponent(logichtml);
            },

            resetUnits: function () {
                return;
                //TODO  back-end api
                var self = this;
                $.ajax({
                    url: "projects/open.php",
                    type: 'GET',
                    data: {
                        action: "loaddesignermodel",
                        projectDir: projectDir,
                        userid: userid,
                        sessionId: sessionId
                    },
                    dataType: "json",
                    success: function (data) {
                        var disignerunitsmodel = data.msg;
                        if (disignerunitsmodel == "") {
                        } else {
                            var objmodel = JSON.parse(disignerunitsmodel).units;
                            self.units.datas = [];
                            for (var i = 0; i < objmodel.length; i++) {
                                var model = objmodel[i];
                                var submodel = model.value.subUnitMap;
                                var subUnitMap = $.Map();
                                for (var j = 0; j < submodel.length; j++) {
                                    subUnitMap.put(submodel[j], "");
                                }
                                model.value.subUnitMap = subUnitMap;
                                self.units.datas.push(model);
                            }
                            // self.userAction= objmodel.user;
                            // self.systemEvent=objmodel.system;
                        }

                    },

                    error: function () {
                        console.warn("load project designer model error.");
                    }
                });
            },

            resetUnitsHTML: function () {
                viwer.clean();
                tabManager.addLabel();
                return;
                //TODO  back-end api
                var self = this;
                $.ajax({
                    url: "projects/open.php",
                    type: "GET",
                    data: {
                        "action": loaddesignerhtml,
                        "projectDir": projectDir,
                        "userid": userid,
                        "sessionId": sessionId
                    },
                    dataType: "json",
                    success: function (data) {

                        if (data.msg == "")// clear logicdisigner units htmll
                        {
                            viwer.clean();
                            tabManager.addLabel();
                        } else {
                            var dataarr = data.msg.split('<!--[[Tab]]-->');
                            self.$el.html(dataarr[0]);
                            $("#flow_scroll_tabs").html(dataarr[1]);
                            tabManager.resetContainer();

                            var $pages = viwer.getAllPage();
                            for (var i = 0; i < $pages.length; i++) {
                                viwer.enablePageDrag($pages[i]);
                                viwer.drawRootLines($pages[i]);
                                self.recnnUnitToSubunitsByModel(self.units.get("userdrive" + $pages[i]));
                                self.recnnUnitToSubunitsByModel(self.units.get("systeminitization" + $pages[i]));
                                if ($("#mylogic" + $pages[i]).css("display") != 'none') {
                                    viwer.switchPage($pages[i]);
                                }
                            }
                        }
                    },
                    error: function () {
                        console.warn("load project designer model error.");
                    }
                });
            },

            /**
             * connect parent unit to children again
             * @param parentunit
             */
            recnnUnitToSubunitsByModel: function (parentunit) {

                if (parentunit) {
                    var subdatas = parentunit.subUnitMap.datas;

                    for (var i = 0; i < subdatas.length; i++) {

                        if (subdatas[i].value) {
                            subdatas[i].value.destroy();
                        }

                        var wire = this.connectUnit(parentunit, this.units.get(subdatas[i].key),
                            i, true);

                        subdatas[i].value = wire;
                        var opacity = this.$("#" + subdatas[i].key).css("opacity");
                        if (opacity == "1") {
                            wire.element.style.opacity = "1";
                        } else if (opacity == "0") {
                            wire.element.style.opacity = "0";
                        }

                        if (this.units.get(subdatas[i].key).subUnitMap.datas.length > 0) {
                            for (var j = 0; j < this.units.get(subdatas[i].key).subUnitMap.datas.length; j++) {
                                this.recnnUnitToSubunitsByModel(this.units.get(subdatas[i].key));
                            }

                        }
                    }
                }

            },


            highlightRelatableControls: function (unit) {
                if (!unit && unit.componentid == "maintopic" || unit.componentid == "systeminitization"
                    || unit.componentname == "pageNo")
                    return;
                var canRelateUI = false, exincludeUiTypes = [];
                if (unit.componentid == "userdrive")
                    canRelateUI = true;
                if (unit.componenttype == "EVENT")
                    canRelateUI = true;
                if (unit.componenttype == "OUTPUT") {
                    canRelateUI = true;
                    exincludeUiTypes = [ "PUSHBUTTON", "LABEL", "DIV", "GESTURE", "IMAGE", "PAGEHEADER",
                        "PAGEFOOTER" ];
                }
                if (unit.componenttype == "PARA") {
                    canRelateUI = !unit.isrelatedui;
                    exincludeUiTypes = [ "PUSHBUTTON", "LABEL", "DIV", "GESTURE", "IMAGE", "HTML5VIDEO",
                        "HTML5AUDIO", "PAGEHEADER", "PAGEFOOTER" ];
                }
                if (!canRelateUI)
                    return;
                if (this.currentHighlightControlId == unit.componentid)
                    return;
                else if (this.currentHighlightControlId != "") {
                    this.cancelHighlightRelatableControls();
                }
                var hasBeChild = function (parentUnit, uiObjId) {
                    var ds = parentUnit.subUnitMap.datas;
                    for (var j = 0; j < ds.length; j++) {
                        var subUnit = this.units.get(ds[j].key);
                        if (subUnit && subUnit.componentid == uiObjId)
                            return true;
                    }
                    return false;
                };

                modelManager.forEach(function (bean) {
                    //TODO MultiplePageManager interface
                    if (bean.pageNo != MultiplePageManager.prototype.getSelectedPageNo().toString())
                        return;
                    if (util.array_contains(exincludeUiTypes, bean.type))
                        return;
                    if (unit.componentid == "userdrive" && hasBeChild(unit, bean.id))
                        return;
                    this.currentHighlightedCids.push(bean.id);
                    dyHighlightControl(bean.id);
                }, this);


                this.currentHighlightControlId = unit.componentid;
            },

            cancelHighlightRelatableControls: function () {
                if (this.currentHighlightedCids.length > 0) {
                    this.currentHighlightedCids.forEach(function (cid) {
                        dyUnhighlightControl(cid);
                    });
                }
                this.currentHighlightedCids = [];
                this.currentHighlightControlId = "";
            },

            getHighLightUnit: function (objtype, cid) {
                switch (objtype) {
                    case "API":
                        for (var i = 2; i < this.units.datas.length; i++) {
                            var unit = this.units.datas[i].value;
                            if (unit.componenttype == "EOF"
                                || (unit.componenttype == "EVENT"
                                && this.$("#" + unit.unitinstanceid).css("opacity") == 1 && !this
                                .checkEventsExistAPI(unit, cid)))
                            {
                                _highLightUnits.push(unit.unitinstanceid);
                            }
                        }
                        break;

                    case "XLT":
                        for (var i = 2; i < this.units.datas.length; i++) {
                            var unit = this.units.datas[i].value;
                            if (unit.componenttype == "OUTPUT" && this.$("#" + unit.unitinstanceid).css("opacity") == 1)
                            {
                                _highLightUnits.push(unit.unitinstanceid);
                            }
                        }
                        break;

                    case "SPAPI":
                        for (var i = 2; i < this.units.datas.length; i++) {
                            var unit = this.units.datas[i].value;
                            if (unit.componenttype == "OUTPUT" && this.$("#" + unit.unitinstanceid).css("opacity") == 1)
                            {
                                _highLightUnits.push(unit.unitinstanceid);
                            }
                        }
                        break;

                    case "UI":
                        if (!this.checkUnitSubRelatedObj('userdrive' + viwer.currentIndex, cid)) {
                            _highLightUnits.push('userdrive' + viwer.currentIndex);
                        }

                        for (var i = 2; i < this.units.datas.length; i++) {
                            var unit = this.units.datas[i].value;
                            if (this.$("#" + unit.unitinstanceid).css("opacity") == 1)
                            {
                                //_highLightUnits.push(unit.unitinstanceid);
                                if (unit.belongregion == "userdrive") {
                                    if (unit.componenttype == "PARA" && unit.relatedcomponent != cid) {
                                        _highLightUnits.push(unit.unitinstanceid);
                                    } else if (unit.componenttype == "EVENT" || unit.componenttype == "OUTPUT"
                                        && !this.checkUnitSubRelatedObj(unit.unitinstanceid, cid)) {
                                        _highLightUnits.push(unit.unitinstanceid);
                                    }

                                } else if (unit.belongregion == "systeminitization") {
                                    if (unit.componenttype == "PARA" || unit.componenttype == "OUTPUT") {
                                        _highLightUnits.push(unit.unitinstanceid);
                                    }
                                }
                            }
                        }

                        break;

                    default:
                        break;
                }
            },

            checkUnitSubRelatedObj: function (unitid, childObjId) {
                //viwer.check(unitid,'userdrive')||
                var unit = this.units.get(unitid);
                if (unit.componenttype == "EVENT" || unit.componenttype == "OUTPUT") {
                    var subunits = unit.subUnitMap.datas;
                    /*if(viwer.check(unitid,'userdrive')){
                     $pages = viwer.getAllPage();
                     var subunits = [];
                     for(var n=0; n<$pages.length; n++){
                     var oneunits = this.units.get("userdrive"+$pages[n]).subUnitMap.datas;
                     for(var x=0; x<oneunits.length; x++){
                     subunits.push(oneunits[x]);
                     }
                     }
                     }*/
                    for (var i = 0; i < subunits.length; i++) {
                        var myUnit = this.units.get(subunits[i].key);
                        if (childObjId == myUnit.componentid) {
                            return true;
                        }
                    }
                }
                return false;
            },

            checkEventsExistAPI: function (eventUnit, apiName) {
                for (var i = 0; i < eventUnit.subUnitMap.datas.length; i++) {
                    var key = eventUnit.subUnitMap.datas[i].key;
                    var childUnit = this.units.get(key);
                    if (childUnit.componenttype == "API" && childUnit.componentname == apiName) {
                        return true;
                    }

                }
                return false;
            },

            highLightUnits: function (objtype, objId) {
                _highLightUnits = [];
                this.getHighLightUnit(objtype, objId);
                for (var i = 0; i < _highLightUnits.length; i++) {
                    var $unit = this.$("#" + _highLightUnits[i]);
                    var left = $unit.css("left");
                    var top = $unit.css("top");
                    var height = $unit.height();
                    var width = $unit.width() - 16;
                    if (viwer.check(_highLightUnits[i], 'userdrive')) {
                        width = width + 20;
                        height = height + 5;
                        top = parseIntPx(top) + 5 + "px";
                        left = parseIntPx(left) + 3 + "px";
                    }
                    if (this.units.get(_highLightUnits[i]).componenttype == "PARA"
                        && $unit.html().indexOf("paraflag") > 0) {
                        width = width + 17;

                    } else if (this.units.get(_highLightUnits[i]).componenttype == "PARA"
                        && $unit.html().indexOf("paraflag") < 0) {
                        top = parseIntPx(top) + 3 + "px";
                        width = width + 23;

                    }

                    var tipsdiv = "<div onmouseover='this.style.display=\"none\";' class='logic-tips ui-btn-corner-all ui-shadow' style='z-index:2800;background:#FF9933;-moz-opacity:0.8;opacity:0.8;position:absolute;left:"
                        + left
                        + ";top:"
                        + top
                        + ";height:"
                        + height
                        + "px;width:"
                        + width
                        + "px' id='tip_"
                        + _highLightUnits[i] + "'></div>"
                    this.$("#mylogic" + viwer.currentIndex).append(tipsdiv);
                }

            },

            cancelHighListUnits: function () {
                var objs = document.getElementsByClassName("logic-tips");
                var length = objs.length;
                for (var i = 0; i < length; i++) {

                    document.getElementById("mylogic" + viwer.currentIndex).removeChild(objs[0]);

                }
                _highLightUnits = [];
            },

            handleControlPropetyUpdateEvent: function(controlId){
                this.updateUIDisplay(controlId);
            },

            handleControlDeleteEvent: function (controlId) {
                var effectedUnits = [];
                var changed = false;
                this.forEach(function (unit) {
                    if (unit.componenttype == "UI" && unit.componentid == controlId) {
                        effectedUnits.push(unit);
                    }
                }, this);
                for (var i = 0; i < effectedUnits.length; i++) {
                    var unit = effectedUnits[i];
                    this.deleteUnitBefore(unit.unitinstanceid);
                    changed = true;
                }
                return changed;
            },

            handlePageDeleteEvent: function (pageNo, removedBeans) {

            },

            handleControlRenameIdEvent: function (newControlId, oldControlId) {

            },

            /************************************************************************/
            /*  flow model functions:                                                                     */
            /************************************************************************/
            getUnit: function (unitId) {
                return this.units.get(unitId);
            },

            getParentUnit: function (unitId) {
                var unit = this.getUnit(unitId);
                if (!unit)
                    return null;
                return this.getUnit(unit.parentunitid);
            },

            countChildUnits: function (unitId) {
                var unit = this.getUnit(unitId);
                return unit ? unit.subUnitMap.datas.length : 0;
            },

            getChildUnits: function (unitId) {
                var childrens = [];
                var unit = this.getUnit(unitId);
                if (unit) {
                    for (var i = 0; i < unit.subUnitMap.datas.length; i++) {
                        var childUnitId = unit.subUnitMap.datas[i].key;
                        childrens.put(this.getUnit(childUnitId));
                    }
                }
                return childrens;
            },

            forEach: function (callback, thisObj) {
                var pages = viwer.getAllPage();
                if (!pages || pages.length == 0)
                    return false;
                for (var i = 0; i < pages.length; i++) {
                    var rootUnitId = "maintopic" + pages[i];
                    var rootUnit = this.getUnit(rootUnitId);
                    if (!rootUnit)
                        continue;
                    var interrupted = false;
                    if (thisObj)
                        interrupted = callback.call(thisObj, rootUnit, null);
                    else
                        interrupted = callback(rootUnit, null);
                    if (interrupted == true)
                        return true;
                    interrupted = this.forEachChildren(rootUnitId, callback, thisObj);
                    if (interrupted == true)
                        return true;
                }
                return false;
            },

            forEachChildren: function (unitId, callback, thisObj) {
                var interrupted = false;
                var unit = this.getUnit(unitId);
                if (!unit)
                    return false;
                for (var i = 0; i < unit.subUnitMap.datas.length; i++) {
                    var childId = unit.subUnitMap.datas[i].key;
                    var childUnit = this.getUnit(childId);
                    if (!childUnit)
                        continue;
                    if (thisObj)
                        interrupted = callback.call(thisObj, childUnit, unit);
                    else
                        interrupted = callback(childUnit, unit);
                    if (interrupted == true)
                        return true;
                    interrupted = this.forEachChildren(childId, callback, thisObj);
                    if (interrupted == true)
                        return true;
                }
                return interrupted || false;
            }


        };

        function getControlType(controlId) {
            var bean = modelManager.get(controlId);
            return bean != null ? bean.type : null;
        }


        /**
         * highlight the specified ui control in form designer
         * @param cid control id
         */
        function dyHighlightControl(cid) {
            //TODO implement
        }

        /**
         * cancel highlighting the specified ui control in form designer
         * @param cid control id
         */
        function dyUnhighlightControl(cid) {
            //TODO  implement
        }

        /**
         * parse integer value from px string
         * @param pxstring
         * @returns {Number}
         */
        function parseIntPx(pxstring) {
            if (pxstring) {
                return parseInt(pxstring.replace("px", ""), 10);
            }
            return 0;
        }

        //export the global variable 'flowDesigner', which is used in onclick code in static HTML  content
        window.flowDesigner = flowDesigner;

        return flowDesigner;
    });
