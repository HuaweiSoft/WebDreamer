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
    [ "css!modules/flowDesigner/flowDesigner", "text!modules/flowDesigner/flowDesigner_tmpl.html",
        "modules/flowDesigner/flowModel", "modules/flowDesigner/flowHelper",
        "modules/flowDesigner/flowPager", "modules/flowDesigner/tabManager",
        "jqueryCommon", "underscore", "modelManager", "metaHub", "util", "HashMap", "formdesigner" ],
    function(css, tmpl, FlowModel, helper, pager, tabManager, $, _, modelManager, metaHub, util, HashMap, formDesigner) {

        var DIALOGS_PATH =  "modules/flowDesigner/flowDialogs";

        var TYPE_ROOT = "ROOT";
        var TYPE_USER_ANCHOR = "USER_ANCHOR";
        var TYPE_APP_ANCHOR = "APP_ANCHOR";
        var TYPE_UI = "UI";
        var TYPE_EVENT = "EVENT";
        var TYPE_METHOD = "METHOD";
        var TYPE_API = "API";
        var TYPE_INPUT = "INPUT";
        var TYPE_OUTPUT = "OUTPUT";
        var TYPE_PARAM = "PARAM";
        var TYPE_RESULT_UI = "RESULT_UI";
        var TYPE_PAGE = "PAGE";

        var PAGE_SELECTOR_TRIGGER_ID = "__flow_designer";
        var CHANG_PAGE_API_NAME = "toPage";
        var PAGE_THUMB_ID_PREFIX = "__PAGE__";

        var _initNumber = 0;
        var _uiDragEndTime = 0;
        var _apiDragEndTime = 0;
        var $templates = null;

        var flowDesigner = {
            USER_WIRE_COLOR: "#39C1EB",
            SYSTEM_WIRE_COLOR: "#44B033",
            UNIT_DISTANCE_X: 60,
            UNIT_DISTANCE_Y: 40,
            USER_ANCHOR_TOP: 4270,
            APP_ANCHOR_TOP: 4470,

            $el: null,          //container element
            displayed: false,
            initialized: false,
            loading: false,

            /**
             * Flow model to save all unit data
             * @type  FlowModel
             */
            model: new FlowModel(),

            apiMetas: new HashMap(),
            uiThumbs: new HashMap(),
            highLightedUnits: [],
            selectedPageUnitId: "",
            currentSelectDialog: null,

            pager: null,
            tabManager: null,
            helper: null,
            centerWidth: 0,

            init: function() {
                var _this = this;
                Arbiter.subscribe("layout/center/rendered", {
                    async: true
                }, function(data) {
                    _this._init(data.body);
                });
            },

            _init: function(parentId) {
                var $parentEl = $("#" + parentId);
                var $tmpl = $(tmpl);
                $parentEl.append($tmpl.find("#flow_designer_container"));
                $parentEl.append($tmpl.find("#flow_designer_open"));
                $parentEl.append($tmpl.find("#flow_designer_close"));
                $parentEl.append($tmpl.find("#flow_ui_moving"));
                $(document.body).append($tmpl.find("#flow_service_moving"));
                $templates = $tmpl.find("#templates");
                this.$el = $parentEl.find("#flow_designer_container");
                this.$el.width(document.body.clientWidth - 340);
                this.$el.height(703);

                helper.init(this);
                pager.init(this);
                tabManager.init([]);
                this.pager = pager;
                this.tabManager = tabManager;
                this.helper = helper;

                helper.initOpenSwitch();

                //enable  mouse scroll event
                var scrollFunc = function(event) {
                    pager.scrollFunc(event);
                };
                if ("onmousewheel" in document) {
                    $(document).bind("mousewheel", function(e){
                        pager.scrollFunc(e.originalEvent);
                    });
                }
                else {
                    document.addEventListener('DOMMouseScroll', scrollFunc, false); //firefox
                }
                var _this = this;
                //subscribe other modules' event
                Arbiter.subscribe(EVENT_FORMDESIGNER_CONTROL_DRAG_BEGIN, function(data) {
                    _uiDragEndTime = 0;
                    var controlId = data.cid;
                    if (_this.displayed) {
                        _this.highlightUnits(TYPE_UI, controlId);
                    }
                });
                Arbiter.subscribe(EVENT_FORMDESIGNER_CONTROL_DRAG_END, function(data) {
                    _uiDragEndTime = data.time;
                    var controlId = data.cid;
                    if (_this.displayed) {
                        _this.unhighlightUnits();
                    }
                });
                Arbiter.subscribe(EVENT_TOOLBAR_SERVICE_DRAG_BEGIN, function(data) {
                    _apiDragEndTime = 0;
                    var apiName = data.apiName;
                    if (_this.displayed) {
                        var apiMeta = metaHub.getApiMeta(apiName);
                        _this.highlightUnits(TYPE_API, apiName);
                    }
                });
                Arbiter.subscribe(EVENT_TOOLBAR_SERVICE_DRAG_END, function(data) {
                    _apiDragEndTime = data.time;
                    var apiName = data.apiName;
                    if (_this.displayed) {
                        _this.unhighlightUnits();
                    }
                });
                Arbiter.subscribe(EVENT_CONTROL_CLEAR, function() {
                    _this.reset();
                    _this.createNewFlowPage();
                });
                Arbiter.subscribe(EVENT_CONTROL_REMOVE, /*{async: true}, */  function(data) {
                    _this.handleControlDeleteEvent(data.id, data.bean.pageNo);
                });
                Arbiter.subscribe(EVENT_CONTROL_UPDATE, /*{async: true}, */function(data) {
                    _this.handleControlPropertyUpdateEvent(data.id, data.bean.pageNo);
                });
                Arbiter.subscribe(EVENT_CONTROL_RENAME, /*{async: true}, */function(data) {
                    _this.handleControlRenameIdEvent(data.newId, data.oldId);
                });
                Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE, function(data) {
                    _this.handlePageDeleteEvent(data.pageNo, data.removedBeans);
                });
                Arbiter.subscribe("layout/center/resized", function(data) {
                    _this.centerWidth = data.width;
                    setTimeout(function() {
                        _this.resetWidth();
                    }, 100);
                });
                Arbiter.subscribe(EVENT_FORMDESIGNER_PUB_VIEW_ALL_PAGE_SELECTED, function(data) {
                    if (data.triggerId != PAGE_SELECTOR_TRIGGER_ID || !data.pageNo)
                        return;
                    if (_this.selectedPageUnitId)
                        _this.setPageUnit(_this.selectedPageUnitId, data.pageNo);
                });

                tabManager.bind(tabManager.EVENT_CREATE, function(data) {
                    _this.createNewFlowPage();
                });

                tabManager.bind(tabManager.EVENT_DELETE, function(data) {
                    pager.deletePage(data.pageNo);
                });
                tabManager.bind(tabManager.EVENT_SWITCH, function(data) {
                    pager.switchPage(data.pageNo);
                });
                tabManager.bind(tabManager.EVENT_RENAME, function(data) {
                    _this.model.setPageName(data.pageNo, data.name);
                });
                this.initialized = true;
                Arbiter.publish(EVENT_FLOW_INITIALIZED, {});
            },

            isInitialized: function() {
                return this.initialized;
            },

            /**
             * return  jquery elements by the specified selector in the flow designer container.
             * Use this method to avoid getting wrong elements in the whole dom tree,
             *  because there may be two elements have same dom id but in different modules.
             * @param {String} selector
             * @returns {$}
             */
            $: function(selector) {
                return this.$el.find(selector);
            },

            find: function(elementId) {
                return this.$el.find("#" + elementId);
            },

            open: function(toResetLeft) {
                if (this.displayed)
                    return;
                if (toResetLeft == null)
                    toResetLeft = true;
                this.displayed = true;
                this.$el.show();
                if (toResetLeft)
                    this.$el.css("left", 332);
                this.resetWidth();
                // this.connectMainTopic();
                if (pager.currentPageNo > 0) {
                    this.checkIfRedrawWires(pager.currentPageNo);
                }
                if (this.model.countPages() == 0)
                    this.createNewFlowPage();
                //cached the required modules
                require([DIALOGS_PATH]);

                Arbiter.publish(EVENT_FLOW_OPEN, {});
            },

            close: function() {
                this.hideDragMoving();
                this.$el.hide();
                this.displayed = false;
                Arbiter.publish(EVENT_FLOW_CLOSE, {});
            },

            reset: function(toInitFirstPage) {
                if(toInitFirstPage != false)
                    toInitFirstPage = true;
                _initNumber = 0;
                _uiDragEndTime = 0;
                _apiDragEndTime = 0;
                this.highLightedUnits = [];
                this.selectedPageUnitId = "";
                this.currentSelectDialog = null;
                this.$('#flow_view_container').empty();
                tabManager.clear();
                this.apiMetas = new HashMap();
                this.model = new FlowModel();
                this.uiThumbs = new HashMap();
                helper.clearWires();
                if(toInitFirstPage)
                    this.createNewFlowPage();
            },

            clear: function() {
                _initNumber = 0;
                _uiDragEndTime = 0;
                _apiDragEndTime = 0;
                this.highLightedUnits = [];
                this.selectedPageUnitId = "";
                this.removeCurrentSelectDialog();
                this.$(".modal").remove();
                this.$(".fdialog").remove();
                pager.clean();
                tabManager.clear();
                this.apiMetas.clear();
                this.model.clear();
                this.uiThumbs.clear();
                helper.clearWires();
            },

            resetWidth: function() {
                if (!this.displayed) {
                    return;
                }
                var width = this.centerWidth - formDesigner.getOffsetWidth() + 15;
                this.$el.width(width);

                var titleLeft = ( width - this.$("#flow_designer_title").width()) / 2;
                this.$("#flow_designer_title").css("left", titleLeft);
                var tabLeft = ( width - this.$("#flow_scroll_tabs").width()) / 2;
                this.$("#flow_scroll_tabs").css("left", tabLeft);
                $("#flow_designer_close").css("left", helper.calcCloseSwitchLeftPos());
            },

            isOpened: function() {
                return this.displayed;
            },

            resetLocation: function() {
                if (!this.displayed)
                    return;
                var pages = this.model.getAllPages();
                for (var i = 0; i < pages.length; i++) {
                    pager.resetPosition(pages[i].no);
                }
            },

            toData: function() {
                this.savePositionToModel();
                this.uiThumbs = this.collectUiThumbs();
                var data = this.model.toData();
                data.apiMetas = this.apiMetas.toData();
                data.uiThumbs = this.uiThumbs.toData();
                data.assets = {
                    uiDataMetas:  this.collectUiDataMetas().toData()
                };
                return data;
            },

            load: function(data) {
                if (data.pages == null || data.flows == null)
                    return false;
                this.loading = true;
                this.reset(false);
                this.model.load(data);
                if (data.apiMetas)
                    this.apiMetas.load(data.apiMetas);
                if (data.uiThumbs)
                    this.uiThumbs.load(data.uiThumbs);
                if(data.assets){
                  //if(data.assets.uiDataMetas)
                  //      this.uiDataMetas.load(data.assets.uiDataMetas);
                }
                //redraw all lines
                var pages = this.model.getAllPages();
                if (pages.length > 0) {
                    for (var i = 0; i < pages.length; i++) {
                        var pageNo = pages[i].no;
                        this.$('#flow_view_container').append(pager.buildPageHtml(pageNo));
                        pager.enablePageDrag(pageNo);
                    }
                    this.$('#flow_view_container').children().first().show();
                    this.model.forEach(function(unit) {
                        this.renderUnit(unit);
                    }, this);
                    this.tabManager.reset(data.pages);
                    if (this.displayed) {
                        this.checkIfRedrawWires(pages[0].no);
                    }
                }
                else {
                    this.createNewFlowPage();
                }
                this.loading = false;
                return true;
            },

            /**
             * Validate the flow model, such as checking whether ui control or page exists
             * @returns {boolean}
             */
            validate: function() {
                return true;
            },

            /**
             * Hide flow_ui_moving and flow_service_moving div
             */
            hideDragMoving: function() {
                $("#flow_ui_moving").hide();
                $("#flow_service_moving").hide();
            },

            /**
             * handle mouse over event on the displayed unit element
             * @param el
             */
            mouseOverUnit: function(el) {
                this.relatedUnit(el);
                _uiDragEndTime = 0;
                _apiDragEndTime = 0;
            },

            /**
             * handle mouse out event on the displayed unit element
             * @param el
             */
            mouseOutUnit: function(el) {
                var unit = this.model.getUnit(el.id);
                this.switchDelete(el.id, false);
                if (unit.controlId && unit.controlId != "APP") {
                    clearUiControlHighlight();
                }
            },

            isUnitVisible: function(id) {
                var $el;
                if (typeof id == "string")
                    $el = this.$("#" + id);
                else if (id instanceof HTMLElement)
                    $el = $(id);
                else if (typeof id == "object" && id.id)
                    $el = this.$("#" + id.id);
                else
                    return false;
                return $el.css("opacity") == "1";
            },

            /**
             * 1 When drag and drop a component to the unit node of designer tree.
             *  2 mouse over the node of designer tree
             * @param parentUnitEl
             */
            relatedUnit: function(parentUnitEl) {
                var currentTime = (new Date()).getTime();
                var uiTimeReduce = currentTime - _uiDragEndTime;
                var apiTimeReduce = currentTime - _apiDragEndTime;
                if (!this.isUnitVisible(parentUnitEl)) {
                    return;
                }
                var parentUnitId = parentUnitEl.id;
                var parentUnit = this.model.getUnit(parentUnitId);
                if (!parentUnit) {
                    console.warn("Error parent unit id: %s", parentUnitId);
                    return;
                }
                if (parentUnit.controlId && parentUnit.controlId != "APP") {
                    highlightUiControl(parentUnit.controlId);
                }
                var parentType = parentUnit.type;
                var myUnit = null;

                var $uiMoving = $("#flow_ui_moving");
                var $apiMoving = $("#flow_service_moving");

                // related UI
                if ((uiTimeReduce >= 0 && uiTimeReduce <= 30) && $uiMoving.html() != "") {
                    if (parentType == TYPE_PAGE) {
                        return;
                    }
                    if (parentType != TYPE_USER_ANCHOR && parentType != TYPE_EVENT
                        && parentType != TYPE_PARAM && parentType != TYPE_OUTPUT)
                        return;

                    if (parentType == TYPE_PARAM) {
                        this.relatedPara(parentUnit);
                        return;
                    }
                    var controlId = $uiMoving.children().first().attr("flow-id");
                    if (!controlId) {
                        console.error("Nothing in ui dragging object.");
                        return;
                    }

                    if (this.model.isControlExistInChildren(parentUnit.id, controlId)) {
                        return;
                    }
                    var controlType = getControlType(controlId);
                    if (parentType == TYPE_OUTPUT) {
                        myUnit = new FlowModel.ResultUiUnit();
                        //get default property
                        var uiMeta = metaHub.getUiMetadata(controlType);
                        if (uiMeta) {
                            myUnit.propName = uiMeta.defaultProperty || "";
                        }
                        if(myUnit.propName)
                            myUnit.mappingType = FlowModel.MAPPING_TYPE_SINGLE;
                    }
                    else {
                        myUnit = new FlowModel.UiUnit();
                    }
                    myUnit.id = this.model.createNewId(myUnit.type);
                    myUnit.controlId = controlId;
                    myUnit.controlType = controlType;
                    myUnit.width = parseInt($uiMoving.css("width"));
                    myUnit.height = parseInt($uiMoving.css("height"));
                }
                // relate api
                else if ((apiTimeReduce >= 0 && apiTimeReduce <= 100) && $apiMoving.html() != "") {
                    if (parentType != TYPE_EVENT) {
                        return;
                    }
                    var apiName = $apiMoving.children().first().attr("type");
                    var apiMeta = metaHub.getApiMeta(apiName);
                    if (!apiMeta) {
                        console.warn("Not such api meta, api name = %s", apiName);
                        return;
                    }
                    this.apiMetas.put(apiName, apiMeta);
                    myUnit = new FlowModel.ApiUnit();
                    myUnit.id = this.model.createNewId(myUnit.type);
                    myUnit.aid = this.model.createNewApiId(apiName);
                    myUnit.name = apiName;
                    myUnit.alias = apiMeta.displayName || apiMeta.alias;
                    myUnit.icon = apiMeta.icon || "";
                    myUnit.width = parseInt($apiMoving.css("width"));
                    myUnit.height = parseInt($apiMoving.css("height"));
                    myUnit.isChangePageApi = apiName == CHANG_PAGE_API_NAME;
                }
                else// only simple mouseover event
                {
                    this.switchDelete(parentUnitId, true);
                    return;
                }

                if (myUnit != null && this.model.get(myUnit.id) == null) {
                    myUnit.parentId = parentUnitId;
                    myUnit.pageNo = parentUnit.pageNo;
                    myUnit.region = parentUnit.region;
                    myUnit.depth = parentUnit.depth + 1;

                    this.model.add(myUnit, parentUnitId);

                    this.calcNewUnitPos(myUnit);
                    this.renderUnit(myUnit);
                    // re-layout sub units
                    this.layoutSubUnits(parentUnit);

                    // rewire parent unit to sub units
                    this.reconnectSubUnits(parentUnit);

                    // this.createEvents(unit);
                    if (myUnit.type == TYPE_UI) {
                        if (parentUnit.type == TYPE_USER_ANCHOR) {
                            var defaultEvent = this.getUnUsedDefaultEvent(myUnit);
                            if (defaultEvent) {
                                this.createEventUnits(myUnit, [defaultEvent]);
                            }
                            else
                                this.showEventSelectDialog(myUnit);
                        }
                        else if (parentUnit.type == TYPE_EVENT)
                            this.showMethodSelectDialog(myUnit);
                    }

                    if (myUnit.type == TYPE_API)
                        this.createInputAndOutput(myUnit);
                }

                $uiMoving.html("");
                $apiMoving.html("");
                _uiDragEndTime = 0;
                _apiDragEndTime = 0;

            },

            makeUnitDragable: function(unitId) {
                var $unitEl = this.$("#" + unitId);
                if ($unitEl.length > 0 && !$unitEl[0]._dragObj) {
                    var unit = this.model.get(unitId);
                    var originalTop;
                    var originalLeft;
                    // enable unit dragable
                    var drag = new YAHOO.util.DD(unitId);
                    var _this = this;

                    function unitDraggingEvent(event) {
                        try {
                            $unitEl.css("left", originalLeft);
                            if (!_this.isUnitVisible(unitId)) {
                                $unitEl.css("top", originalTop);
                                return;
                            }
                            var draggingTop = parseIntPx($unitEl.css("top"));
                            if (unit.type == TYPE_USER_ANCHOR && draggingTop > 4274) {
                                $unitEl.css("top", "4274px")
                            }
                            else if (unit.type == TYPE_APP_ANCHOR && draggingTop < 4463) {
                                $unitEl.css("top", "4463px")
                            }

                            var y = event.e.clientY;
                            // drag out of designer
                            if (y > (_this.$el.height() + 140)) {
                                $unitEl.css("top", "4745px");
                            }
                            if (y < 140) {
                                $unitEl.css("top", "4040px");
                            }
                            draggingTop = parseIntPx($unitEl.css("top"));
                            unit.top = draggingTop;

                            var myParentUnit = _this.model.getParentUnit(unitId);
                            var unitIndex = _this.model.getSiblingIndex(unitId);
                            _this.connectUnit(myParentUnit, unit, unitIndex);

                            var moveDistance = draggingTop - originalTop;
                            _this.moveSubUnits(unitId, 0, moveDistance);

                            originalTop = draggingTop;
                        } catch (e) {
                            console.error("error: %o", e);
                        }
                    }

                    function unitStartDragEvent() {
                        originalTop = parseIntPx($unitEl.css("top"));
                        originalLeft = parseIntPx($unitEl.css("left"));
                    }

                    function unitEndDragEvent() {
                        if (_this.isUnitVisible(unitId)) {
                            _this.sortSequence(unitId);
                        }
                    }

                    drag.subscribe("dragEvent", unitDraggingEvent);
                    drag.subscribe("startDragEvent", unitStartDragEvent);
                    drag.subscribe("endDragEvent", unitEndDragEvent);
                    $unitEl[0]._dragObj = drag;
                }
            },

            calcNewUnitPos: function(unit) {
                var parentId = unit.parentId;
                var parentUnit = this.model.get(unit.parentId);
                var $parentUnitEl = this.$("#" + parentId);
                var parentLeft = parseIntPx($parentUnitEl.css("left"));
                var parentTop = parseIntPx($parentUnitEl.css("top"));

                var unitLeft = parentLeft + $parentUnitEl.width() + this.UNIT_DISTANCE_X;
                var unitTop = parentTop;
                var brotherLength = this.model.countChildUnits(parentId);
                if (brotherLength > 1) {  // has brother units
                    var lastUnit = this.model.getPreviousUnit(unit.id);
                    var yDistance = this.UNIT_DISTANCE_Y;
                    if (unit.type == TYPE_UI && unit.depth == 3)
                        yDistance += 40;
                    if (lastUnit != null) {
                        unitTop = parseIntPx(this.$("#" + lastUnit.id).css("top")) + lastUnit.height + yDistance;
                    }
                    else {
                        var nextUnit = this.model.getNextUnit(unit.id);
                        unitTop = parseIntPx(this.$("#" + nextUnit.id).css("top")) - unit.height - yDistance;
                    }
                }
                else { //only itself
                    unitTop = parentTop + parseInt(parentUnit.height / 2 - unit.height / 2);
                }
                unit.left = unitLeft;
                unit.top = unitTop;
            },

            /**
             * render the unit ui
             * @param unit  unit that must have been push into flow model
             */
            renderUnit: function(unit) {
                var $page = this.$("#flowpage" + unit.pageNo);
                if ($page.length == 0) {
                    console.error("Failed to render unit, error unit page number : " + unit.pageNo);
                    return false;
                }
                var isTerminalOpen = true;
                var $oldUnit = $page.find("#" + unit.id);
                if ($oldUnit.length > 0) {
                    isTerminalOpen = !$oldUnit.find(".designer-terminal").hasClass("designer-terminal-close");
                    $oldUnit.remove();
                }
                var html = this.buildUnitHtml(unit);
                $page.append(html);
                var $unit = $page.find("#" + unit.id);

                if (unit.type == TYPE_UI || unit.type == TYPE_RESULT_UI
                    || (unit.type == TYPE_PARAM && unit.valueType == "UI" )) {
                    var thumbHtml = getControlHtml(unit.controlId);
                    $unit.find(".thumb-container").html(thumbHtml);
                    if(unit.type == TYPE_RESULT_UI)
                        this.updateResultUiUnitText(unit);
                }
                else if (unit.type == TYPE_PARAM && unit.valueType == "PAGE" && unit.value) {
                    var thumbHtml = getPageThumbnailHtml(unit.value);
                    $unit.find(".page-thumb-content").html(thumbHtml);
                }
                else if (unit.type == TYPE_METHOD) {
                    if (this.model.countChildUnits(unit.id) == 0 && (!unit.params || unit.params.length == 0) && !unit.output)
                        $unit.find(".terminal-wrapper").hide();
                }
                if (!isTerminalOpen)
                    $unit.find(".designer-terminal").removeClass("designer-terminal-open").addClass("designer-terminal-close");

                if(unit.type == TYPE_API && this.model.countChildUnits(unit.id) == 0 ){
                       $unit.find(".terminal-wrapper").hide();
                }

                this.bindEvent(unit.id);
                return true;
            },

            bindEvent: function(unitId) {
                var $unit = this.$("#" + unitId);
                var _this = this;
                $unit.unbind("mouseenter").bind("mouseenter", function(e) {
                    _this.mouseOverUnit(this);
                });
                $unit.unbind("mouseleave").bind("mouseleave", function(e) {
                    _this.mouseOutUnit(this);
                });
                $unit.unbind("click").bind("click", function(e) {
                    _this.onUnitClick(this.id);
                });
                $unit.unbind("dblclick").bind("dblclick", function(e) {
                    _this.onUnitDbClick(this.id);
                });
                $unit.find(".designer-terminal").unbind("click").bind("click", function() {
                    if (_this.isUnitVisible(unitId) && !$unit.hasClass("unit-root")
                        && !$unit.hasClass("unit-user-anchor") && !$unit.hasClass("unit-app-anchor"))
                        _this.expandOrCollapse(this, unitId);
                });
                $unit.find(".action.action-delete").unbind("click").bind("click", function() {
                    if (_this.isUnitVisible(unitId))
                        _this.deleteUnit(unitId);
                });
                $unit.find(".action.action-config").unbind("click").bind("click", function() {
                    _this.onConfigClick(unitId);
                });
                if (!$unit.hasClass("unit-root"))
                    this.makeUnitDragable(unitId);
            },

            buildUnitHtml: function(unit) {
                if (!unit.type)
                    return "";
                var $temp = null;
                var data = unit;
                if (unit.type == TYPE_PARAM) {
                    if (!unit.valueType)
                        $temp = $templates.find("#unit_param_empty_template");
                    else if (unit.valueType == "UI")
                        $temp = $templates.find("#unit_param_ui_template");
                    else if (unit.valueType == "PAGE") {
                        if (!unit.value)
                            $temp = $templates.find("#unit_param_page_empty_template");
                        else
                            $temp = $templates.find("#unit_param_page_template");
                    }
                    else
                     {
                         $temp = $templates.find("#unit_param_value_template");
                         data = {id: unit.id, left: unit.left, top: unit.top, value: util.htmlEncode(JSON.stringify(unit.value)) };
                     }
                }
                else {
                    var templateId = "#unit_" + unit.type.toLowerCase() + "_template";
                    $temp = $templates.find(templateId);
                }
                if ($temp) {
                    var html;
                    var text = $temp.html();
                    if ($temp.children().length == 0)
                        html = text.substring(text.indexOf("<!--") + 4, text.lastIndexOf("-->"));
                    else
                        html = text;
                    var compliedHtml = "";
                    try {
                        compliedHtml = _.template(html)(data);
                    } catch (e) {
                        console.error("Build html template error: %s\n%s", e.message, e.stack);
                    }
                    return   compliedHtml;
                }
                else
                    return "";
            },

            /**
             * connect two units and draw wire between them,
             * @param fromUnit parent unit
             * @param toUnit child unit
             * @param [toUnitIndex]    index of to unit in brother units
             * @param [notResetParamNameText=false]
             * @returns {*}
             */
            connectUnit: function(fromUnit, toUnit, toUnitIndex, notResetParamNameText) {
                var $fromUnitEl = this.$("#" + fromUnit.id);
                var $toUnitEl = this.$("#" + toUnit.id);
                var fromUnitEl = $fromUnitEl[0];
                var toUnitEl = $toUnitEl[0];
                var container = this.$('#flowpage' + fromUnit.pageNo)[0];

                var wireColor = this.USER_WIRE_COLOR;
                if (fromUnit.region == FlowModel.REGION_APP || toUnit.region == FlowModel.REGION_APP) {
                    wireColor = this.SYSTEM_WIRE_COLOR;
                }

                var fromUnitTop = parseIntPx($fromUnitEl.css("top"));
                var fromUnitLeft = parseIntPx($fromUnitEl.css("left"));
                var toUnitTop = parseIntPx($toUnitEl.css("top"));
                var toUnitLeft = parseIntPx($toUnitEl.css("left"));

                var fromOffsetLeft, fromOffsetTop, toOffsetLeft, toOffsetTop;
                fromOffsetLeft = $fromUnitEl.width();
                fromOffsetTop = $fromUnitEl.find(".terminal-wrapper").height() / 2 || parseInt($fromUnitEl.height() / 2, 10);
                toOffsetLeft = 2;
                toOffsetTop = parseInt(toUnit.height / 2, 10);

                var fromDirection = 0.3;
                var toDirection = -0.6;
                helper.removeWire(toUnit.id);
                var t1 = new WireIt.Terminal(fromUnitEl, {
                    direction: [ fromDirection, 0 ],
                    offsetPosition: [ fromOffsetLeft, fromOffsetTop ],
                    editable: false
                }, container);
                var t2 = new WireIt.Terminal(toUnitEl, {
                    direction: [ toDirection, 0 ],
                    offsetPosition: [ toOffsetLeft, toOffsetTop ],
                    editable: false
                }, container);
                var wire = new WireIt.BezierWire(t1, t2, container, {
                    width: 1,
                    borderwidth: 0.3,
                    bordercolor: wireColor,
                    color: wireColor
                });
                wire.draw();
                wire.width = wire.element.clientWidth;
                wire.height = wire.element.clientHeight;

                if (toUnit.type == TYPE_PARAM && !notResetParamNameText) {
                    var paramNameTop;
                    // parent unit is under child unit
                    if ((fromUnitTop + fromOffsetTop) >= toUnitTop + toOffsetTop) {
                        // paramNameTop = toUnitTop + toOffsetTop - 12;
                        paramNameTop = parseIntPx($(wire.element).css("top")) - 20;
                    }
                    else {// parent unit is above child unit
                        // paramNameTop = toUnitTop + toOffsetTop + 3;
                        paramNameTop = parseIntPx($(wire.element).css("top")) + wire.element.clientHeight;
                    }
                    this.annotationParaName(toUnit, paramNameTop, toUnitLeft);
                }
                helper.addWire(toUnit.id, wire);
                return wire;
            },

            layoutSubUnits: function(parentUnit) {
                var childUnits = this.model.getChildUnits(parentUnit.id);
                if (childUnits.length == 0)
                    return;
                var $parent = this.$("#" + parentUnit.id);
                var parentTop = parseIntPx($parent.css("top"));
                var parentHeight = $parent.height() || parentUnit.height;
                if (childUnits.length == 1) {
                    var subUnit = childUnits[0];
                    var subNewTop = parseInt(parentTop + parentHeight / 2 - subUnit.height / 2);
                    this.$("#" + subUnit.id).css("top", subNewTop + "px");
                    subUnit.top = subNewTop;
                }
                else {
                    if (childUnits.length % 2 != 0) {
                        var middleUnit = childUnits[parseInt(childUnits.length / 2, 10)];
                        var parentOffsetTop = 0;
                        if (parentUnit.depth == 2) {
                            parentOffsetTop = parseInt(parentHeight / 2, 10) + 3;
                        }
                        else {
                            parentOffsetTop = parseInt(parentHeight / 2, 10) + 1;
                        }
                        var parentTerminalTop = parentTop + parentOffsetTop;
                        var middleUnitTop = parseInt(middleUnit.height / 2, 10);
                        var middleUnitTerminalTop = parseInt(this.$("#" + middleUnit.id).css("top"));
                        var unitOffsetTop = parentTerminalTop - middleUnitTerminalTop - middleUnitTop;

                        for (var i = 0; i < childUnits.length; i++) {
                            var subUnit = childUnits[i];
                            var $subUnitEl = this.$("#" + subUnit.id);
                            var subUnitTop = parseIntPx($subUnitEl.css("top"));
                            if (subUnit.id == middleUnit.id && parentUnit.depth == 2) {
                                $subUnitEl.css("top", subUnitTop + unitOffsetTop - 5 + "px");
                                subUnit.top = subUnitTop + unitOffsetTop - 5;
                            }
                            else {
                                $subUnitEl.css("top", subUnitTop + unitOffsetTop + "px");
                                subUnit.top = subUnitTop + unitOffsetTop;
                            }
                        }
                    }
                    else {  //childUnits.length %2 == 0
                        var subunitsHeight = 0;
                        for (var i = 0; i < childUnits.length; i++) {
                            subunitsHeight += childUnits[i].height;
                            if (i < childUnits.length - 1)
                                subunitsHeight += this.UNIT_DISTANCE_Y;
                        }
                        var parentOffsetTop = 0;
                        if (parentUnit.depth == 2) {
                            parentOffsetTop = parseInt(parentHeight / 2, 10) + 3;
                        }
                        else {
                            parentOffsetTop = parseInt(parentHeight / 2, 10) + 1;
                        }
                        var parentTerminalTop = parentTop + parentOffsetTop;
                        var top = parentTerminalTop - parseInt(subunitsHeight / 2, 10);
                        var offsetTop = top - parseInt(this.$("#" + childUnits[0].id).css("top"));

                        for (var i = 0; i < childUnits.length; i++) {
                            var $subUnitEl = this.$("#" + childUnits[i].id);
                            var subunitTop = parseIntPx($subUnitEl.css("top"));
                            $subUnitEl.css("top", subunitTop + offsetTop + "px");
                            childUnits[i].top = subunitTop + offsetTop;
                        }
                    }
                }

                for (var i = 0; i < childUnits.length; i++) {
                    this.layoutSubUnits(childUnits[i]);
                }
            },

            // connect parent unit to children again
            reconnectSubUnits: function(unit) {
                this.model.forEachChildren(unit.id, function(childUnit, childUnitIndex) {
                    var parentUnit = this.model.getParentUnit(childUnit.id);
                    this.reconnect(parentUnit, childUnit, childUnitIndex);
                }, this);
            },

            /**
             * reconnect wires between parent unit and the specified child unit
             * @param parentUnit
             * @param childUnit
             * @param [childUnitIndex]
             */
            reconnect: function(parentUnit, childUnit, childUnitIndex) {
                if (typeof childUnitIndex != "number")
                    childUnitIndex = this.model.getSiblingIndex(childUnit.id);
                if (childUnitIndex < 0 || childUnit.parentId != parentUnit.id)
                    return;
                //this.$("#" + childUnit.id).css("opacity", "1");
                var wire = this.connectUnit(parentUnit, childUnit, childUnitIndex);
                var opacity = this.$("#" + childUnit.id).css("opacity");
                if (opacity == "1") {
                    wire.element.style.opacity = "1";
                }
                else if (opacity == "0") {
                    wire.element.style.opacity = "0";
                }
            },

            showEventSelectDialog: function(unit) {
                var unitId;
                if (typeof  unit == "string") {
                    unitId = unit;
                    unit = this.model.get(unitId);
                }
                else
                    unitId = unit.id;
                if (!unit)
                    return;
                var parentUnit = this.model.getParentUnit(unitId);
                if (unit.type != TYPE_APP_ANCHOR && !(unit.type == TYPE_UI && parentUnit.type == TYPE_USER_ANCHOR))
                    return;
                var $unitEl = this.$("#" + unitId);
                if ($unitEl.length == 0)
                    return;
                var eventItems = [];
                var meta = metaHub.get(unit.controlType);
                if (meta && meta.events) {
                    for (var eventName in meta.events) {
                        if (!meta.events.hasOwnProperty(eventName))
                            continue;
                        var event = meta.events[eventName];
                        eventItems.push({
                            name: eventName,
                            displayName: event.alias,
                            icon: event.icon,
                            description: event.description || "",
                            selected: false,
                            disabled: false
                        });
                    }
                }
                var controlId = unit.type == TYPE_APP_ANCHOR ? "APP" : unit.controlId;
                var usedEventNames = this.model.getAllUsedEventNames(controlId);
                for (var i = 0; i < eventItems.length; i++) {
                    var item = eventItems[i];
                    if (util.inArray(usedEventNames, item.name)) {
                        item.selected = true;
                        item.disabled = true;
                    }
                }
                var left = parseIntPx($unitEl.css("left")) + unit.width;
                var top = parseIntPx($unitEl.css("top"));
                var _this = this;
                require([DIALOGS_PATH], function(Dialogs){
                    _this.removeCurrentSelectDialog();
                    var dialog = new Dialogs.MultiSelectDialog({
                        title: "Select Events",
                        data: eventItems,
                        container: $unitEl.parent()[0],
                        left: left,
                        top: top,
                        callback: function(data) {
                            var selection = [];
                            for (var i = 0; i < data.length; i++) {
                                var item = data[i];
                                if (!item.disabled && item.selected)
                                    selection.push(item);
                            }
                            _this.createEventUnits(unit, selection);
                        },
                        closeCallback: function() {
                            if (_this.currentSelectDialog == dialog)
                                _this.currentSelectDialog = null;
                        }
                    });
                    dialog.unitId = unitId;
                    _this.currentSelectDialog = dialog;
                });
            },

            createEventUnits: function(unit, eventItems) {
                if ((unit.type != TYPE_UI && unit.type != TYPE_APP_ANCHOR) || eventItems.length == 0)
                    return;

                var usedEventNames = this.model.getAllUsedEventNames(unit.controlId);
                var meta = metaHub.getUiMetadata(unit.controlType);
                var eventMetas = meta != null ? meta.events : null;

                // create selected events
                for (var i = 0; i < eventItems.length; i++) {
                    var item = eventItems[i];
                    if (util.inArray(usedEventNames, item.name))
                        continue;
                    var eventName = item.name;
                    var eventUnit = new FlowModel.EventUnit();
                    eventUnit.id = this.model.createNewId(eventUnit.type);
                    eventUnit.name = eventName;
                    eventUnit.alias = item.displayName || item.alias;
                    eventUnit.icon = item.icon;
                    eventUnit.width = 172;
                    eventUnit.height = 105;
                    eventUnit.parentId = unit.id;
                    if (eventMetas != null && eventMetas[eventName] != null) {
                        eventUnit.params = eventMetas[eventName].params || [];
                    }

                    this.model.add(eventUnit, unit.id);
                    this.renderLayoutConnect(unit, eventUnit);
                }
            },

            removeCurrentSelectDialog: function() {
                if (this.currentSelectDialog != null)
                    this.currentSelectDialog.destroy();
                this.currentSelectDialog = null;
            },

            showMethodSelectDialog: function(unit) {
                var unitId;
                if (typeof  unit == "string") {
                    unitId = unit;
                    unit = this.model.get(unitId);
                }
                else
                    unitId = unit.id;
                if (!unit)
                    return;
                var parentUnit = this.model.getParentUnit(unitId);
                if (unit.type != TYPE_UI || parentUnit.type != TYPE_EVENT)
                    return;
                var $unitEl = this.$("#" + unitId);
                if ($unitEl.length == 0)
                    return;

                var methodItems = [];

                var meta = metaHub.get(unit.controlType);
                if (meta && meta.methods) {
                    for (var methodName in meta.methods) {
                        if (!meta.methods.hasOwnProperty(methodName))
                            continue;
                        var method = meta.methods[methodName];
                        if (method.showable != false && method.displayable != false)
                            methodItems.push({
                                name: methodName,
                                displayName: method.alias,
                                icon: null,
                                description: method.description || "",
                                selected: false,
                                disabled: false
                            });
                    }
                }
                var usedMethodNames = this.model.getAllUsedMethodNames(unitId);
                for (var i = 0; i < methodItems.length; i++) {
                    var item = methodItems[i];
                    if (util.inArray(usedMethodNames, item.name)) {
                        item.selected = true;
                        item.disabled = true;
                    }
                }
                var left = parseIntPx($unitEl.css("left")) + unit.width;
                var top = parseIntPx($unitEl.css("top"));
                var _this = this;
                require([DIALOGS_PATH], function(Dialogs){
                    _this.removeCurrentSelectDialog();
                    var dialog = new Dialogs.MultiSelectDialog({
                        title: "Select Functions",
                        data: methodItems,
                        container: $unitEl.parent()[0],
                        left: left,
                        top: top,
                        callback: function(data) {
                            var selection = [];
                            for (var i = 0; i < data.length; i++) {
                                var item = data[i];
                                if (!item.disabled && item.selected)
                                    selection.push(item);
                            }
                            _this.createMethodUnits(unit, selection);
                        },
                        closeCallback: function() {
                            if (_this.currentSelectDialog == dialog)
                                _this.currentSelectDialog = null;
                        }
                    });
                    dialog.unitId = unitId;
                    _this.currentSelectDialog = dialog;
                });
            },

            createMethodUnits: function(unit, methodItems) {
                if (unit.type != TYPE_UI || methodItems.length == 0)
                    return;

                var usedMethodNames = this.model.getAllUsedMethodNames(unit.id);
                var meta = metaHub.getUiMetadata(unit.controlType);
                var methodMetas = meta != null ? meta.methods : null;

                // create selected events
                for (var i = 0; i < methodItems.length; i++) {
                    var item = methodItems[i];
                    if (util.inArray(usedMethodNames, item.name))
                        continue;
                    var methodUnit = new FlowModel.MethodUnit();
                    methodUnit.id = this.model.createNewId(methodUnit.type);
                    methodUnit.name = item.name;
                    methodUnit.alias = item.displayName || item.alias;
                    methodUnit.width = 153;
                    methodUnit.height = 50;
                    methodUnit.parentId = unit.id;
                    if (methodMetas && methodMetas[item.name]) {
                        var methodMeta = methodMetas[item.name];
                        methodUnit.output = methodMeta.output == true || methodMeta.getValue == true;
                        var params = methodMeta.params;
                        if (util.isArray(params)) {
                            methodUnit.params = methodUnit.params || [];
                            for (var j = 0; j < params.length; j++) {
                                var obj = params[j];
                                if (typeof obj == "string")
                                    methodUnit.params.push(obj);
                                else if (obj && obj.name)
                                    methodUnit.params.push(obj.name);
                            }
                        }
                    }
                    this.model.add(methodUnit, unit.id);
                    this.renderLayoutConnect(unit, methodUnit);
                    this.createInputAndOutput(methodUnit);
                }
            },

            createInputAndOutput: function(unit) {
                if (unit.type == TYPE_API) {
                    var apiMeta = getApiMeta(unit.name);
                    var params = apiMeta.params;
                    if (params.length > 0) {
                        //create a new input unit
                        var inputUnit = new FlowModel.InputUnit();
                        inputUnit.id = this.model.createNewId(inputUnit.type);
                        inputUnit.parentId = unit.id;
                        inputUnit.width = 100;
                        inputUnit.height = 32;
                        this.model.add(inputUnit, unit.id);
                        this.renderLayoutConnect(unit, inputUnit);
                        this.createParasUnits(inputUnit);
                    }
                    if ( apiMeta.result.return == true ) {
                        //create a new output unit
                        var outputUnit = new FlowModel.OutputUnit();
                        outputUnit.id = this.model.createNewId(outputUnit.type);
                        outputUnit.parentId = unit.id;
                        outputUnit.width = 100;
                        outputUnit.height = 32;
                        this.model.add(outputUnit, unit.id);
                        this.renderLayoutConnect(unit, outputUnit);
                    }
                    if( this.model.countChildUnits(unit.id) > 0 ){
                        this.$("#" + unit.id).find(".terminal-wrapper").show();
                    }
                }
                else if (unit.type == TYPE_METHOD) {
                    var meta = metaHub.get(this.model.getParentUnit(unit.id).controlType);
                    var method = meta.methods[unit.name];
                    if (method) {
                        method.output = method.output || method.getValue;
                        if (method.output == null) {
                            method.output = false;
                        }

                        if (method.params.length > 0) {
                            var inputUnit = new FlowModel.InputUnit();
                            inputUnit.id = this.model.createNewId(inputUnit.type);
                            inputUnit.parentId = unit.id;
                            inputUnit.width = 100;
                            inputUnit.height = 32;
                            this.model.add(inputUnit, unit.id);
                            this.renderLayoutConnect(unit, inputUnit);
                            this.createParasUnits(inputUnit);
                        }
                        else if (method.output) {
                            var outputUnit = new FlowModel.OutputUnit();
                            outputUnit.id = this.model.createNewId(outputUnit.type);
                            outputUnit.parentId = unit.id;
                            outputUnit.width = 100;
                            outputUnit.height = 32;
                            this.model.add(outputUnit, unit.id);
                            this.renderLayoutConnect(unit, outputUnit);
                        }
                        else {
                            var $el = this.$("#" + unit.id);
                            $el.find(".designer-terminal").removeClass("designer-terminal-open");
                        }
                        if( this.model.countChildUnits(unit.id) > 0 ){
                            this.$("#" + unit.id).find(".terminal-wrapper").show();
                        }
                    }
                }
            },

            createParasUnits: function(inputUnit) {
                if (!inputUnit || inputUnit.type != TYPE_INPUT)
                    return;
                var parentUnit = this.model.get(inputUnit.parentId);
                if (parentUnit.type == TYPE_API) {
                    var params = getApiMeta(parentUnit.name).params;
                    for (var i = 0; i < params.length; i++) {
                        var paramName = params[i];
                        if ($.trim(paramName) == "")
                            continue;
                        var paramUnit = new FlowModel.ParamUnit({
                            name: paramName,
                            alias: paramName,
                            valueType: "",
                            value: null,
                            controlId: "",
                            propName: "",
                            width: 40,
                            height: 40
                        });
                        paramUnit.id = this.model.createNewId(paramUnit.type);

                        if (parentUnit.isChangePageApi || parentUnit.name == CHANG_PAGE_API_NAME) {
                            paramUnit.isRelatedUi = true;
                            paramUnit.valueType = "PAGE";
                        }

                        paramUnit.parentId = inputUnit.id;
                        this.model.add(paramUnit, inputUnit.id);
                        this.renderLayoutConnect(inputUnit, paramUnit);
                    }
                }
                else if (parentUnit.type == TYPE_METHOD) {
                    var controlType = this.model.get(parentUnit.parentId).controlType;
                    var meta = metaHub.get(controlType);
                    var method = meta.methods[parentUnit.name];
                    if (method) {
                        var params = method.params;
                        if (params) {
                            for (var i = 0; i < params.length; i++) {
                                var item = params[i];
                                var paramUnit = new FlowModel.ParamUnit({
                                    name: item.name,
                                    alias: item.alias || item.displayName,
                                    valueType: "",
                                    value: null,
                                    controlId: "",
                                    propName: "",
                                    width: 40,
                                    height: 40
                                });
                                paramUnit.id = this.model.createNewId(paramUnit.type);
                                paramUnit.parentId = inputUnit.id;
                                this.model.add(paramUnit, inputUnit.id);
                                this.renderLayoutConnect(inputUnit, paramUnit);
                            }
                        }
                    }
                }
            },

            annotationParaName: function(paramUnit, top, left) {
                if (paramUnit.type != TYPE_PARAM)
                    return;
                var id = paramUnit.id + "_annotation";
                this.$("#" + id).remove();
                var div = "<div class='param-annotation'  id='" + id + "'>";
                div += paramUnit.alias || paramUnit.name;
                div += "</div>";
                this.$("#flowpage" + paramUnit.pageNo).append(div);
                var $el = this.$("#" + id);
                $el.css("top", top + "px");
                $el.css("left", left - $el.width() - 5);
            },

            relatedPara: function(unit) {
                if (unit.type != TYPE_PARAM || unit.valueType == "PAGE")
                    return;
                var $uiMoving = $("#flow_ui_moving");
                var controlId = $uiMoving.children().first().attr("flow-id");
                if (!controlId)
                    return;
                var height = $uiMoving.css("height");
                var width = $uiMoving.css("width");
                unit.width = parseIntPx(width);
                unit.height = parseIntPx(height);
                unit.isRelatedUi = true;
                unit.valueType = "UI";
                unit.controlId = controlId;
                unit.propName = "";
                unit.propMeta = null;
                var controlType = getControlType(controlId);
                if (controlType) {
                    var meta = metaHub.getUiMetadata(controlType);
                    if (meta)
                        unit.propName = meta.defaultProperty || "";
                    if (unit.propName && meta.props && meta.props.hasOwnProperty(unit.propName))
                        unit.propMeta = meta.props[unit.propName];
                    else
                        unit.propMeta = null;
                }

                var parentUnit = this.model.get(unit.parentId);
                this.renderUnit(unit);
                this.layoutSubUnits(parentUnit);
                this.reconnectSubUnits(parentUnit);
            },

            renderLayoutConnect: function(parentUnit, childUnit) {
                this.calcNewUnitPos(childUnit);
                this.renderUnit(childUnit);
                helper.removeWire(childUnit.id);
                this.layoutSubUnits(parentUnit);
                this.reconnectSubUnits(parentUnit);
            },

            onUnitClick: function(unitId) {
                if (!this.isUnitVisible(unitId))
                    return;
                var unit = this.model.get(unitId);
                if (!unit)
                    return;
                if (unit.type == TYPE_UI || unit.type == TYPE_RESULT_UI || (unit.type == TYPE_PARAM && unit.valueType == "UI")) {
                    if (unit.controlId)
                        setCurrentControl(unit.controlId);
                }
                else if (unit.type == TYPE_API) {
                    //  objDsClicked(unit.controlId);
                }
            },

            onUnitDbClick: function(unitId) {
                if (!this.isUnitVisible(unitId))
                    return;
                var unit = this.model.get(unitId);
                if (!unit)
                    return;
                switch (unit.type) {
                    case TYPE_PARAM:
                        if (unit.valueType == "PAGE")
                            this.callPageSelector(unitId);
                        else if (unit.valueType == "UI")
                            this.showPropSelectDialog(unit);
                        else
                            this.showValueEditor(unit);
                        break;
                    case TYPE_RESULT_UI:
                        this.showMappingEditor(unit);
                        break;
                }
            },

            onConfigClick: function(unitId) {
                if (!this.isUnitVisible(unitId))
                    return;
                var unit = this.model.get(unitId);
                if (!unit)
                    return;
                switch (unit.type) {
                    case TYPE_APP_ANCHOR:
                        this.showEventSelectDialog(unit);
                        break;
                    case TYPE_UI:
                        if (unit.depth == 3)
                            this.showEventSelectDialog(unit);
                        else if (this.model.getParentUnit(unitId).type == TYPE_EVENT) {
                            this.showMethodSelectDialog(unit);
                        }
                        break;
                    case TYPE_PARAM:
                        if (unit.valueType == "UI")
                            this.showPropSelectDialog(unit);
                        else if(unit.valueType == "PAGE")
                            this.callPageSelector(unitId);
                        else
                            this.showValueEditor(unit);
                        break;
                    case TYPE_RESULT_UI:
                        this.showMappingEditor(unit);
                        break;
                }
            },

            expandOrCollapse: function(terminalEl, unitId) {
                var $el = $(terminalEl);
                if ($el.hasClass("designer-terminal-open")) {
                    this.collapse(unitId);
                }
                else {
                    this.expand(unitId);
                }
            },

            expand: function(unitId) {
                this.$("#" + unitId).find(".designer-terminal").removeClass("designer-terminal-close").addClass("designer-terminal-open");
                var childIds = this.model.getChildUnitIds(unitId);
                for (var i = 0; i < childIds.length; i++) {
                    this.showUnit(childIds[i], false);
                }
            },

            expandAll: function(unitId) {
                this.$("#" + unitId).find(".designer-terminal").removeClass("designer-terminal-close").addClass("designer-terminal-open");
                var childIds = this.model.getChildUnitIds(unitId);
                for (var i = 0; i < childIds.length; i++) {
                    this.showUnit(childIds[i], true);
                }
            },

            collapse: function(unitId) {
                var childIds = this.model.getChildUnitIds(unitId);
                if (childIds.length > 0) {
                    this.$("#" + unitId).find(".designer-terminal").removeClass("designer-terminal-open").addClass("designer-terminal-close");
                }
                for (var i = 0; i < childIds.length; i++) {
                    this.hideUnit(childIds[i]);
                }
            },

            showUnit: function(unitId, showAllChildren) {
                var $unit = this.$("#" + unitId);
                if ($unit.length == 0)
                    return;
                $unit.css("opacity", "1");

                var wire = helper.getWire(unitId);
                if (wire)
                    wire.element.style.opacity = "1";
                if ($unit[0]._dragObj && $unit[0]._dragObj.unlock)
                    $unit[0]._dragObj.unlock();

                var unit = this.model.get(unitId);
                if (unit.type == TYPE_PARAM) {
                    $("#" + unitId + "_annotation").css("opacity", "1");
                }
                $unit.attr("title", $unit.attr("data-title") || $unit.attr("title") || "");
                var traversed = false;
                if (showAllChildren) {
                    $unit.find(".designer-terminal").removeClass("designer-terminal-close").addClass("designer-terminal-open");
                    traversed = true;
                }
                else {
                    var closed = $unit.find(".designer-terminal").hasClass("designer-terminal-close");
                    traversed = !closed;
                }

                if (traversed) {
                    var childrenIds = this.model.getChildUnitIds(unitId);
                    for (var i = 0; i < childrenIds.length; i++) {
                        this.showUnit(childrenIds[i], showAllChildren);
                    }
                }
            },

            hideUnit: function(unitId) {
                var $unit = this.$("#" + unitId);
                if ($unit.length == 0 || $unit.css("opacity") == "0")
                    return;
                $unit.css("opacity", "0");
                var wire = helper.getWire(unitId);
                if (wire)
                    wire.element.style.opacity = "0";
                if ($unit[0]._dragObj && $unit[0]._dragObj.lock)
                    $unit[0]._dragObj.lock();

                var unit = this.model.get(unitId);
                if (!unit)
                    return;
                if (unit.type == TYPE_PARAM) {
                    $("#" + unitId + "_annotation").css("opacity", "0");
                }
                if ($unit.attr("title")) {
                    $unit.attr("data-title", $unit.attr("title")).attr("title", "");
                }
                var childrenIds = this.model.getChildUnitIds(unitId);
                for (var i = 0; i < childrenIds.length; i++) {
                    this.hideUnit(childrenIds[i]);
                }
            },

            deleteUnit: function(unitId) {
                var unit = this.model.get(unitId);
                if (!unit) {
                    this.$("#" + unitId).remove();
                    return;
                }
                var deletedUnitArray = [];
                try {
                    this.deleteUnitUi(unitId, deletedUnitArray);
                } catch (e) {
                    console.error("--remove #" + unitId + " error: \n%o", e);
                }
                var deletedApiNames = [];
                for (var i = 0; i < deletedUnitArray.length; i++) {
                    var deletedUnit = deletedUnitArray[i];
                    if (deletedUnit.type == TYPE_API && !util.inArray(deletedApiNames, deletedUnit.name)) {
                        deletedApiNames.push(deletedUnit.name);
                    }
                    this.model.remove(deletedUnit.id);
                }
                for (var i = 0; i < deletedApiNames.length; i++) {
                    var apiName = deletedApiNames[i];
                    if (!this.model.isApiUsed(apiName)) {
                        this.apiMetas.remove(apiName);
                    }
                }

                var $parentUnitEl = $("#" + unit.parentId);
                if (this.model.countChildUnits(unitId.parentId) == 0 && $parentUnitEl.length > 0
                    && $parentUnitEl.find(".designer-terminal").hasClass("designer-terminal-close")) {
                    $parentUnitEl.find(".designer-terminal").removeClass("designer-terminal-close").addClass("designer-terminal-open");
                }
                //renderLayoutConnect
            },

            deleteUnitUi: function(unitId, deletedUnitArray) {
                var unit = this.model.get(unitId);
                if (!unit)
                    return;
                var $unit = this.$("#" + unitId);
                if (unit.type == TYPE_PARAM) {
                    //just set null value
                    var toDeleted = false;
                    for (var i = 0; i < deletedUnitArray.length; i++) {
                        if (deletedUnitArray[i].id == unit.parentId) {
                            toDeleted = true;
                            break;
                        }
                    }
                    if (!toDeleted) {
                        unit.width = 40;
                        unit.height = 40;
                        if (unit.valueType != "PAGE")
                            FlowModel.setNullValueForParamUnit(unit);
                        else
                            unit.value = "";
                        $unit.removeAttr("title");
                        this.renderUnit(unit);
                        this.reconnect(this.model.getParentUnit(unitId), unit);
                        return;
                    }
                }

                if (unit.type == TYPE_PARAM)
                    this.$("#" + unitId + "_annotation").remove();
                helper.removeWire(unitId);

                if ($unit.length > 0 && $unit[0]._dragObj && $unit[0]._dragObj.unreg) {
                    $unit[0]._dragObj.unreg();
                    $unit[0]._dragObj = null;
                }
                $unit.remove();

                if(this.currentSelectDialog != null && this.currentSelectDialog.unitId == unitId){
                    this.removeCurrentSelectDialog();
                }

                deletedUnitArray.push(unit);
                var subunits = this.model.getChildUnits(unitId);
                for (var i = 0; i < subunits.length; i++) {
                    this.deleteUnitUi(subunits[i].id, deletedUnitArray);
                }
            },

            callPageSelector: function(unitId) {
                var unit = this.model.get(unitId);
                if (!unit || unit.type != TYPE_PARAM)
                    return;
                var pageNo = unit.value;
                this.selectedPageUnitId = unitId;
                showPageSelector(pageNo);
            },

            setPageUnit: function(unitId, pageNo) {
                var unit = this.model.get(unitId);
                if (!unit || unit.type != TYPE_PARAM)
                    return;
                var pageNum = parseInt(pageNo, 10);
                /* var html = getPageThumbnailHtml(pageNo);
                 this.$("#" + unitId).find(".page-thumb-content").html(html);
                 this.$("#" + unitId).find(".page-thumb-title").text("Page" + pageNo );*/
                unit.width = 112;
                unit.height = 148;
                unit.valueType = "PAGE";
                unit.value = pageNum;
                unit.isRelatedUi = true;
                this.renderLayoutConnect(this.model.getParentUnit(unitId), unit);
            },

            switchDelete: function(unitId, toShow) {
                var unit = this.model.get(unitId);
                var $unit = this.$("#" + unitId);
                var $actionBar = $unit.find(".action-toolbar");
                if (toShow)
                    $actionBar.show();
                else
                    $actionBar.hide();
            },


            moveSubUnits: function(unitId, xOffset, yOffset) {
                var subunits = this.model.getChildUnits(unitId);

                for (var i = 0; i < subunits.length; i++) {
                    var subunit = subunits[i];
                    var $subUnitEl = this.$("#" + subunit.id);
                    var subLeft = parseIntPx($subUnitEl.css("left")) + xOffset;
                    var subTop = parseIntPx($subUnitEl.css("top")) + yOffset;
                    subunit.left = subLeft;
                    subunit.top = subTop;
                    $subUnitEl.css("left", subLeft + "px");
                    $subUnitEl.css("top", subTop + "px");

                    if (subunit.type == TYPE_PARAM) {
                        var $annotationEl = this.$("#" + subunit.id + "_annotation");
                        $annotationEl.css("left", parseIntPx($annotationEl.css("left")) + xOffset + "px");
                        $annotationEl.css("top", parseIntPx($annotationEl.css("top")) + yOffset + "px");
                    }
                    var wire = helper.getWire(subunit.id);
                    if (wire) {
                        wire.element.style.left = parseIntPx(wire.element.style.left) + xOffset + "px";
                        wire.element.style.top = parseIntPx(wire.element.style.top) + yOffset + "px";
                    }
                    this.moveSubUnits(subunit.id, xOffset, yOffset);
                }
            },

            // when dragged the unit re-sort the subunits of parent
            sortSequence: function(unitId) {
                var unit = this.model.get(unitId);
                if (unit.depth <= 2)
                    return;
                var oldIndex = this.model.getSiblingIndex(unit.id);
                var brothers = this.model.getChildUnits(unit.parentId);
                if (brothers.length < 2)
                    return;
                var subunitTops = [];
                for (var i = 0; i < brothers.length; i++) {
                    subunitTops.push(parseIntPx(this.$("#" + brothers[i].id).css("top")));
                }
                subunitTops.sort();
                var unitTop = parseIntPx(this.$("#" + unitId).css("top"));
                var newIndex = oldIndex;
                for (var i = 0; i < subunitTops.length; i++) {
                    if (subunitTops[i] == unitTop && i != oldIndex) {
                        newIndex = i;
                        break;
                    }
                }
                if (newIndex != oldIndex)
                    this.model.changeSiblingIndex(unit.id, newIndex);
            },

            updateUiDisplay: function(unit, controlId) {
                if (unit.controlId != controlId || !controlId)
                    return;
                var html = getControlHtml(controlId);
                if (!html)
                    return;
                var size = getControlSize(controlId);
                var oldWidth = unit.width;
                var oldHeight = unit.height;
                unit.width = size.width;
                unit.height = size.height;

                var $unit = this.$("#" + unit.id);
                $unit.find(".content").width(unit.width).height(unit.height);
                $unit.find(".content .thumb-container").html(html);
                var xOffset = unit.width - oldWidth;
                var yOffset = parseInt((unit.height - oldHeight) / 2);

                $unit.css("top", parseIntPx($unit.css("top")) - yOffset + "px");

                this.moveSubUnits(unit.id, xOffset, yOffset);
            },

            updatePageForPara: function(pageNo) {
                var pageHtml = "";
                this.model.forEach(function(unit) {
                    if (unit.type == TYPE_PARAM && unit.valueType == "PAGE" && unit.value
                        && unit.value == pageNo) {
                        pageHtml = pageHtml || getPageThumbnailHtml(pageNo);
                        this.$("#" + unit.id).find(".page-thumb-content").html(pageHtml);
                    }
                }, this);
            },

            updatePageUnitTitle: function(pageUnit) {
                var $unit = this.$("#" + pageUnit.id);
                var $title = $unit.find(".page-thumb-title");
                if ($title.length == 0 || !pageUnit.value)
                    return;
                $title.text("Page" + pageUnit.value);
                $unit.attr("title", "Page" + pageUnit.value);
            },

            savePositionToModel: function(parentUnitId) {
                var func = function(unit) {
                    var $unitEl = this.$("#" + unit.id);
                    if ($unitEl.length > 0) {
                        unit.left = parseIntPx($unitEl.css("left"));
                        unit.top = parseIntPx($unitEl.css("top"));
                    }
                };
                if (!parentUnitId) {
                    this.model.forEach(func);
                }
                else {
                    func(this.model.get(parentUnitId));
                    this.model.forEachChildren(parentUnitId, func);
                }
            },

            collectUiThumbs: function() {
                var uiThumbs = new HashMap();
                this.model.forEach(function(unit) {
                    if ((unit.type == TYPE_UI || unit.type == TYPE_RESULT_UI
                        || (unit.type == TYPE_PARAM && unit.valueType == "UI")  ) && unit.controlId) {
                        if (!uiThumbs.containsKey(unit.controlId)) {
                            var thumbHtml = this.$("#" + unit.id).find(".thumb-container").html();
                            if (thumbHtml) {
                                uiThumbs.put(unit.controlId, thumbHtml);
                            }
                        }
                    }
                    else if (unit.type == TYPE_PARAM && unit.valueType == "PAGE" && unit.value) {
                        var key = PAGE_THUMB_ID_PREFIX + unit.value;
                        if (!uiThumbs.containsKey(key)) {
                            var thumbHtml = this.$("#" + unit.id).find(".page-thumb-content").html();
                            if (thumbHtml) {
                                uiThumbs.put(key, thumbHtml);
                            }
                        }
                    }
                }, this);
                return uiThumbs;
            },

            collectUiDataMetas: function() {
                var uiDataMetas = new HashMap();
                this.model.forEach(function(unit) {
                    if (unit.type == TYPE_RESULT_UI && unit.controlType && !uiDataMetas.containsKey(unit.controlType)) {
                        var meta = metaHub.getUiMetadata(unit.controlType);
                        if (meta && meta.dataFormat) {
                            uiDataMetas.put(unit.controlType, meta.dataFormat);
                        }
                        else
                            uiDataMetas.put(unit.controlType, null);
                    }
                }, this);
                return uiDataMetas;
            },

            cleanUnUsedApiMetas: function() {
                var deleted = [];
                this.apiMetas.each(function(apiName, apiMeta) {
                    if (!this.model.isApiUsed(apiName)) {
                        deleted.push(apiName);
                    }
                }, this);
                for (var i = 0; i < deleted.length; i++) {
                    this.apiMetas.remove(deleted[i]);
                }
            },

            createNewFlowPage: function() {
                var page = pager.newFlowPage();
                tabManager.addTab(page.no, page.name);
            },

            redrawAllWires: function(pageNo) {
                var rootUnit = this.model.getRootUnit(pageNo);
                if (rootUnit)
                    this.reconnectSubUnits(rootUnit);
            },

            highlightUnits: function(type, objId) {
                this.unhighlightUnits();
                var currentFlowPageNo = pager.currentPageNo;
                var highLightUnits = this.collectHighlightableUnits(currentFlowPageNo, type, objId);
                var htmlContents = "";
                for (var i = 0; i < highLightUnits.length; i++) {
                    var unit = highLightUnits[i];
                    var $unit = this.$("#" + unit.id);
                    var left = parseIntPx($unit.css("left"));
                    var top = parseIntPx($unit.css("top"));
                    var height = $unit.height();
                    var width = $unit.width();
                    if (unit.type == TYPE_PARAM) {
                        if (FlowModel.isNullValueForParamUnit(unit)) {
                            // width +=  17;
                        }
                    }
                    else {
                        if ($unit.find(".designer-terminal").length > 0)
                            width -= 16;
                    }

                    htmlContents += String.format("<div onmouseover='this.style.display=\"none\";' class='unit-highlight-bg ui-btn-corner-all ui-shadow' " +
                        "style='left:{0}px;top:{1}px;height:{2}px;width:{3}px' id='hl_{4}'></div>", left, top, height, width, unit.id);
                }
                if (htmlContents)
                    this.$("#flowpage" + currentFlowPageNo).append(htmlContents);
                this.highLightedUnits = highLightUnits;
            },

            collectHighlightableUnits: function(flowPageNo, type, cid) {
                var collected = [];
                var rootUnit = this.model.getRootUnit(flowPageNo);
                if (!rootUnit || !cid)
                    return collected;
                switch (type) {
                    case TYPE_API:
                    {
                        var apiName = cid;
                        this.model.forEachChildren(rootUnit.id, function(unit) {
                            if (unit.type == TYPE_EVENT && this.isUnitVisible(unit.id)
                                && !this.checkApiExistInEvents(unit, apiName))
                                collected.push(unit);
                        }, this);
                    }
                        break;
                    case TYPE_UI:
                    {
                        var controlId = cid;
                        this.model.forEachChildren(rootUnit.id, function(unit) {
                            if (!this.isUnitVisible(unit.id))
                                return;
                            var related = false;
                            if (unit.type == TYPE_USER_ANCHOR && !this.model.isControlExistInChildren(unit.id, controlId))
                                related = true;
                            else if (unit.type == TYPE_PARAM && unit.valueType != "PAGE" && unit.controlId != controlId) {
                                related = true;
                            }
                            else if (unit.type == TYPE_EVENT || unit.type == TYPE_OUTPUT
                                && !this.model.isControlExistInChildren(unit.id, controlId)) {
                                related = true;
                            }
                            if (related)
                                collected.push(unit);
                        }, this);
                    }
                        break;
                }
                return collected;
            },

            checkApiExistInEvents: function(eventUnit, apiName) {
                var childUnits = this.model.getChildUnits(eventUnit.id);
                for (var i = 0; i < childUnits.length; i++) {
                    if (childUnits[i].type == TYPE_API && childUnits[i].name == apiName) {
                        return true;
                    }
                }
                return false;
            },

            unhighlightUnits: function() {
                this.$(".unit-highlight-bg").remove();
                this.highLightedUnits = [];
            },

            getUnUsedDefaultEvent: function(uiUnit) {
                if (!uiUnit.controlId || !uiUnit.controlType)
                    return null;
                var designed = false;
                var sameUnits = this.model.findAllUiUnitsInFirstLevel(uiUnit.controlId);
                for (var i = 0; i < sameUnits.length; i++) {
                    if (this.model.countChildUnits(sameUnits[i].id) > 0) {
                        designed = true;
                        break;
                    }
                }
                if (designed)
                    return null;
                var meta = metaHub.get(uiUnit.controlType);
                if (!meta || !meta.events)
                    return null;

                var defaultEventName = "";
                if (meta.defaultEvent && meta.events.hasOwnProperty(meta.defaultEvent))
                    defaultEventName = meta.defaultEvent;
                else {
                    var count = 0;
                    var eventName = "";
                    for (var key in meta.events) {
                        count++;
                        eventName = key;
                    }
                    if (count == 1)
                        defaultEventName = eventName;
                }
                if (defaultEventName) {
                    var defaultEvent = meta.events[defaultEventName];
                    return {
                        name: defaultEventName,
                        displayName: defaultEvent.alias,
                        alias: defaultEvent.alias,
                        icon: defaultEvent.icon
                    }
                }
                else
                    return null;
            },

            showPropSelectDialog: function(unit) {
                var unitId;
                if (typeof  unit == "string") {
                    unitId = unit;
                    unit = this.model.get(unitId);
                }
                else
                    unitId = unit.id;
                if (!unit || !unit.controlId || (unit.type != TYPE_PARAM && unit.type != TYPE_RESULT_UI))
                    return;
                var controlType = unit.controlType || getControlType(unit.controlId);
                if (!controlType)
                    return;
                var parentUnit = this.model.getParentUnit(unitId);
                var $unitEl = this.$("#" + unitId);
                if ($unitEl.length == 0)
                    return;
                var checkReadOnly = unit.type == TYPE_RESULT_UI;
                var propItems = [];
                var meta = metaHub.get(controlType);
                if (meta && meta.props) {
                    var defaultPropertyName = meta.defaultProperty || "";
                    if (defaultPropertyName && meta.props.hasOwnProperty(defaultPropertyName)) {
                        var defaultProperty = meta.props[defaultPropertyName];
                        if (!checkReadOnly || !defaultProperty.readOnly)
                            propItems.push({
                                name: defaultPropertyName,
                                displayName: defaultProperty.displayName,
                                description: defaultProperty.description || ""
                            });
                    }
                    for (var propName in meta.props) {
                        if (!meta.props.hasOwnProperty(propName))
                            continue;
                        var prop = meta.props[propName];
                        if (prop.designable && propName != defaultPropertyName
                            && (!checkReadOnly || !prop.readOnly))
                            propItems.push({
                                name: propName,
                                displayName: prop.displayName,
                                description: prop.description || ""
                            });
                    }
                }

                var left = parseIntPx($unitEl.css("left")) + unit.width;
                var top = parseIntPx($unitEl.css("top"));
                var _this = this;
                require([DIALOGS_PATH], function(Dialogs){
                    _this.removeCurrentSelectDialog();
                    var dialog = new Dialogs.SingleSelectDialog({
                        title: "Select Property",
                        data: propItems,
                        selected: unit.propName || "",
                        container: $unitEl.parent()[0],
                        left: left,
                        top: top,
                        callback: function(selectedItem) {
                            if (selectedItem != null) {
                                unit.propName = selectedItem.name;
                                if (meta && unit.propName && meta.props && meta.props.hasOwnProperty(unit.propName))
                                    unit.propMeta = meta.props[unit.propName];
                                else
                                    unit.propMeta = null;
                                unit.mappingType = FlowModel.MAPPING_TYPE_SINGLE;
                                unit.mapping = null;
                                _this.find(unitId).find(".content .below-text").text(unit.controlId + "." + unit.propName);
                            }
                        },
                        closeCallback: function() {
                            if (_this.currentSelectDialog == dialog)
                                _this.currentSelectDialog = null;
                        }
                    });
                    dialog.unitId = unitId;
                    _this.currentSelectDialog = dialog;
                });
            },


            checkIfRedrawWires: function(pageNo) {
                var $page = this.$("#flowpage" + pageNo);
                if ($page.length == 0)
                    return false;
                if ($page.length > 0 && $page.find("canvas").length == 0 || $page.find("canvas")[0].width <= 8) {
                    this.reconnectSubUnits(this.model.getRootUnit(pageNo));
                    return true;
                }
                return true;
            },

            showMappingEditor: function(resultUnit) {
                var unitId;
                if (typeof  resultUnit == "string") {
                    unitId = resultUnit;
                    resultUnit = this.model.get(unitId);
                }
                else
                    unitId = resultUnit.id;
                if (!resultUnit || resultUnit.type != TYPE_RESULT_UI)
                    return false;
                var grandUnit = this.model.getParentUnit(this.model.getParentUnit(unitId).id);
                if (grandUnit.type == TYPE_METHOD) {
                    this.showPropSelectDialog(resultUnit);
                    return true;
                }
                else if (grandUnit.type != TYPE_API)
                    return false;
                /*var $container = this.$("#flowpage" + resultUnit.pageNo);
                 if ($container.length == 0)
                 return  false;*/
                var apiName = grandUnit.name;
                var resultMeta = null;
                var apiMeta = metaHub.getApiMeta(apiName);
                if (apiMeta && apiMeta.result) {
                    resultMeta = {
                        type: apiMeta.result.type,
                        format: apiMeta.result.format
                    };
                }
               var _this = this;
                require([DIALOGS_PATH], function(Dialogs){
                    var editor = new Dialogs.MappingEditor({
                        container: document.body,  // $container[0],
                        unit: resultUnit,
                        resultMeta:  resultMeta,
                        serviceName: apiName,
                        callback: function(canceled) {
                            if(!canceled){
                                _this.updateResultUiUnitText(resultUnit);
                            }
                        }
                    });

                    editor.show();
                });
                return  true;
            },

            showValueEditor: function(paramUnit){
                var unitId;
                if (typeof  paramUnit == "string") {
                    unitId = paramUnit;
                    paramUnit = this.model.get(unitId);
                }
                else
                    unitId = paramUnit.id;
                if (!paramUnit || paramUnit.type != TYPE_PARAM  || (paramUnit.valueType && paramUnit.valueType != "VALUE"))
                    return false;
                var _this = this;
                require([DIALOGS_PATH], function(Dialogs){
                    var editor = new Dialogs.ValueEditor({
                        container: document.body,
                        value: paramUnit.value,
                        callback: function(newValue){
                            paramUnit.valueType = "VALUE";
                            paramUnit.value = newValue;
                            _this.renderUnit(paramUnit);
                        }
                    });
                    editor.show();
                });
                return true;
            },

            updateResultUiUnitText: function(unit){
                if(unit.type != TYPE_RESULT_UI)
                    return;
                var $text = this.$("#"+ unit.id).find(".below-text");
                if($text.length ==0 )
                    return;
                if(!unit.mappingType || unit.mappingType == FlowModel.MAPPING_TYPE_SINGLE){
                    $text.attr("title", "");
                    if(!unit.propName)
                        $text.text("");
                    else
                        $text.text(unit.controlId +  "." + unit.propName);
                }else if( unit.mappingType == FlowModel.MAPPING_TYPE_PROPERTY){
                    $text.text("{mapping}");
                    $text.attr("title", "mapping/property");
                }else{
                    $text.text("{mapping}");
                    $text.attr("title", "mapping/data");
                }
            },

            //***********************************************************************
            // handle external event
            //***********************************************************************

            handleControlPropertyUpdateEvent: function(controlId, pageNo) {
                this.model.forEach(function(unit) {
                    if ((unit.type == TYPE_UI || unit.type == TYPE_RESULT_UI || unit.type == TYPE_PARAM)
                        && unit.controlId == controlId) {
                        this.updateUiDisplay(unit, controlId);
                    }
                }, this);
                this.updatePageForPara(pageNo);
            },

            handleControlDeleteEvent: function(controlId, pageNo) {
                var deletedUnits = [];
                this.model.forEach(function(unit) {
                    if (( unit.type == TYPE_UI || unit.type == TYPE_RESULT_UI || unit.type == TYPE_PARAM )
                        && unit.controlId == controlId) {
                        deletedUnits.push(unit);
                    }
                }, this);
                for (var i = 0; i < deletedUnits.length; i++) {
                    this.deleteUnit(deletedUnits[i].id);
                }
                this.updatePageForPara(pageNo);
                this.uiThumbs.remove(controlId);
            },

            handlePageDeleteEvent: function(pageNo, removedBeans) {
                var removedControlIds = [];
                if (removedBeans && removedBeans) {
                    for (var i = 0; i < removedBeans.length; i++) {
                        removedControlIds.push(removedBeans[i].id);
                    }
                }
                var deletedUnits = [];
                var titleChangedPageUnits = [];
                this.model.forEach(function(unit) {
                    if (unit.type == TYPE_PARAM && unit.valueType == "PAGE" && unit.value >= 0) {
                        if (unit.value == pageNo)
                            deletedUnits.push(unit);
                        else if (unit.value > pageNo) {
                            unit.value--;
                            titleChangedPageUnits.push(unit);
                        }
                    }
                    else if (( unit.type == TYPE_UI || unit.type == TYPE_RESULT_UI || unit.type == TYPE_PARAM )
                        && util.inArray(removedControlIds, unit.controlId)) {
                        deletedUnits.push(unit);
                    }
                }, this);
                for (var i = 0; i < deletedUnits.length; i++) {
                    this.deleteUnit(deletedUnits[i].id);
                }
                for (var i = 0; i < titleChangedPageUnits.length; i++) {
                    this.updatePageUnitTitle(titleChangedPageUnits[i]);
                }
            },

            handleControlRenameIdEvent: function(newControlId, oldControlId) {

            }

        };

        /************************************************************************/
        /*static functions those may invoke other modules   */
        /************************************************************************/

        function getControlType(controlId) {
            var bean = modelManager.get(controlId);
            return bean != null ? bean.type : null;
        }

        function getPageThumbnailHtml(pageNo) {
            var html = formDesigner.getPageThumbHtml(pageNo);
            if (!html) {
                html = flowDesigner.uiThumbs.get(PAGE_THUMB_ID_PREFIX + pageNo) || "";
            }
            return html;
        }

        function getControlHtml(controlId) {
            var html = formDesigner.getControlHtml(controlId);
            if (!html) {
                html = flowDesigner.uiThumbs.get(controlId) || "";
            }
            return html;
        }

        function getControlSize(controlId) {
            return formDesigner.getControlSize(controlId);
        }

        function highlightUiControl(controlId) {
            return formDesigner.highlightUiControl(controlId);
        }

        function clearUiControlHighlight() {
            return formDesigner.clearUiControlHighlight();
        }

        function setCurrentControl(controlId) {
            Arbiter.publish(EVENT_FORMDESIGNER_CALL_SET_CURRENT_CONTROL, {cid: controlId});
        }

        function showPageSelector(selectedPageNo) {
            Arbiter.publish(EVENT_FORMDESIGNER_SUB_VIEW_ALL_PAGE, {
                triggerId: PAGE_SELECTOR_TRIGGER_ID,
                selectedPage: selectedPageNo
            });
        }

        function getApiMeta(apiName) {
           return    metaHub.getApiMeta(apiName) || flowDesigner.apiMetas.get(apiName);
        }

        /**
         * parse integer value from px string
         * @param str
         * @returns {Number}
         */
        function parseIntPx(str) {
            if (typeof str == "string")
                return parseInt(str.replace("px", ""), 10);
            else if (str)
                return parseInt(str, 10);
            else
                return 0;
        }

        //export the global variable 'flowDesigner'
        window.flowDesigner = flowDesigner;

        return flowDesigner;
    });
