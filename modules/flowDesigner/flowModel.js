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
 * @module FlowModel
 */
define(["modules/flowDesigner/unitTree", "util"],
    function (UnitTree, util) {
        var PAGE_ID_PREFIX = "flowpage";
        var ROOT_ID_PREFIX = "flowroot";
        var USER_ANCHOR_ID_PREFIX = "useranchor";
        var APP_ANCHOR_ID_PREFIX = "appanchor";
        var PAGE_NAME_PREFIX = "FlowView";

        /**
         *  FlowModel
         * @class FlowModel
         */
        var FlowModel = function () {
        };

        FlowModel.prototype = {

            _pages: [],
            _trees: [],
            _maxPageNo: 0,

            load: function (data) {
                if (!data)
                    return false;
                if (typeof  data == "string") {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        console.error("Invalid JSON format for flow model data.");
                        return false;
                    }
                }
                var pages = data.pages;
                var trees = data.flows;
                if (!util.isArray(pages) || !util.isArray(trees) || pages.length != trees.length) {
                    console.error("Invalid flow model data: %o.", data);
                    return false;
                }
                this._pages = pages;
                this._trees = [];
                for (var i = 0; i < trees.length; i++) {
                    var tree = new UnitTree();
                    tree.load(trees[i]);
                    this._trees.push(tree);
                }
                this._updateMaxPageNo();
                return true;
            },

            toData: function () {
                var data = {
                    pages: this._pages,
                    flows: []
                };
                for (var i = 0; i < this._trees.length; i++) {
                    data.flows.push(this._trees[i].getData());
                }
                return data;
            },

            clear: function () {
                this._pages = [];
                this._trees = [];
                this._maxPageNo = 0;
            },

            get: function (id) {
                var node = this._getNode(id);
                return node ? node.obj : null;
            },

            _get: function(id , tree){
                var node = tree.get(id);
                return node ? node.obj : null;
            },

            _getNode: function (id) {
                for (var i = 0; i < this._trees.length; i++) {
                    var node = this._trees[i].get(id);
                    if (node)
                        return node;
                }
                return null;
            },

            _getTree: function(id) {
                for (var i = 0; i < this._trees.length; i++) {
                    var tree = this._trees[i];
                    if (tree.get(id))
                        return tree;
                }
                return null;
            },

            add: function (unit, parentId) {
                if (!unit || !unit.id || !unit.type)
                    return null;
                if (this.get(unit.id) != null) {
                    console.error("Unit id '%s' has been used!", unit.id);
                    return null;
                }
                parentId = parentId || unit.parentId;
                var parentUnit = this.get(parentId);
                if (!parentUnit) {
                    console.error("Not exist parent unit: " + parentId);
                    return null;
                }
                if (!this.validate(unit, parentUnit)) {
                    console.error("Failed to append unit %o to parent unit %o.", unit, parentUnit);
                    return null;
                }
                var tree = this._getTree(parentId);
                var success = tree.add(unit, parentId);
                if (!success) {
                    console.error("Failed to add unit %o to tree %o.", unit, tree);
                    return null;
                }
                unit.parentId = parentId;
                unit.pageNo = parentUnit.pageNo;
                unit.region = parentUnit.region;
                unit.depth = parentUnit.depth + 1;

                return unit;
            },

            remove: function (id) {
                for (var i = 0; i < this._trees.length; i++) {
                    this._trees[i].remove(id);
                }
                return true;
            },

            newPage: function (pageName) {
                if (!pageName) {
                    pageName = PAGE_NAME_PREFIX + ( this._maxPageNo + 1);
                    while (this.isPageNameExists(pageName)) {
                        pageName += "_2";
                    }
                } else if (this.isPageNameExists(pageName)) {
                    console.warn("Page name '%s' has been used. ", pageName);
                    return null;
                }
                this._maxPageNo++;
                var no = this._maxPageNo;
                var page = {
                    id: PAGE_ID_PREFIX + no,
                    name: pageName,
                    no: no
                };
                this._pages.push(page);

                var rootUnit = new RootUnit({
                    id: ROOT_ID_PREFIX + no,
                    pageNo: no
                });
                var userAnchorUnit = new UserAnchorUnit({
                    id: USER_ANCHOR_ID_PREFIX + no,
                    parentId: rootUnit.id,
                    pageNo: no
                });
                var appAnchorUnit = new AppAnchorUnit({
                    id: APP_ANCHOR_ID_PREFIX + no,
                    parentId: rootUnit.id,
                    pageNo: no
                });
                var tree = new UnitTree();
                tree.init(rootUnit);
                tree.add(userAnchorUnit, rootUnit.id);
                tree.add(appAnchorUnit, rootUnit.id);
                this._trees.push(tree);
                return page;
            },

            removePage: function (pageNo) {
                if (typeof pageNo == "string")
                    pageNo = parseInt(pageNo);
                var index = this.getPageIndex(pageNo);
                if (index != -1)
                    return  this.removePageByIndex(index);
                else
                    return false;
            },

            _updateMaxPageNo: function () {
                var max = 0;
                for (var i = 0; i < this._pages.length; i++) {
                    var page = this._pages[i];
                    if (page.no > max)
                        max = page.no;
                }
                this._maxPageNo = max;
            },

            removePageByIndex: function (pageIndex) {
                if (pageIndex < 0 || pageIndex >= this._pages.length)
                    return false;
                this._pages.splice(pageIndex, 1);
                this._trees.splice(pageIndex, 1);
                this._updateMaxPageNo();
                return true;
            },

            getPageIndex: function (pageNo) {
                for (var i = 0; i < this._pages.length; i++) {
                    var page = this._pages[i];
                    if (page.no == pageNo) {
                        return i;
                    }
                }
                return  -1;
            },

            getPageNo: function (pageIndex) {
                var page = this.getPage(pageIndex);
                return page != null ? page.no : -1;
            },

            setPageName: function (pageNo, pageName) {
                if (!pageNo || !pageName)
                    return false;
                var valid = true;
                var myPage = null;
                for (var i = 0; i < this._pages.length; i++) {
                    var page = this._pages[i];
                    if (page.no == pageNo)
                        myPage = page;
                    else if (page.name == pageName) {
                        valid = false;
                        break;
                    }
                }
                if ( !myPage /*|| !valid*/ )
                    return false;
                myPage.name = pageName;
                return true;
            },

            isPageNameExists: function(pageName){
                for (var i = 0; i < this._pages.length; i++) {
                    var page = this._pages[i];
                    if (page.name == pageName)
                        return true;
                }
                return false;
            },

            getPage: function (pageIndex) {
                if (pageIndex < 0 || pageIndex >= this._pages.length)
                    return null;
                return this._pages[pageIndex];
            },

            getAllPages: function () {
                return this._pages;
            },

            countPages: function () {
                return this._pages.length;
            },

            validate: function (unit, parentUnit) {
                //TODO  validate dsl rules between unit and parent unit
                return true;
            },

            getParentUnit: function (id) {
                var tree = this._getTree(id);
                if(!tree)
                    return null;
                var unit = this._get(id, tree);
                return unit ? this._get(unit.parentId, tree) : null;
            },

            getParentId: function (id) {
                var node = this._getNode(id);
                return node ? node.parent : null;
            },

            hasChildren: function (id) {
                return this.countChildUnits(id) > 0;
            },

            countChildUnits: function (id) {
                var node = this._getNode(id);
                return node ? node.children.length : 0;
            },

            getChildUnits: function (id) {
                if (!id)
                    return [];
                var tree = this._getTree(id);
                if (!tree)
                    return [];
                var children = [];
                var node = tree.get(id);
                if (!node || !node.children)
                    return children;
                for (var i = 0; i < node.children.length; i++) {
                    var childId = node.children[i];
                    children.push(this._get(childId, tree));
                }
                return children;
            },

            getChildUnitIds: function(id){
                var children = [];
                if (!id)
                    return [];
                var tree = this._getTree(id);
                if (!tree)
                    return [];
                var node = tree.get(id);
                if (!node || !node.children)
                    return children;
                for (var i = 0; i < node.children.length; i++) {
                    children.push(node.children[i]);
                }
                return children;
            },

            getGrandchildUnits: function (id) {
                var units = [];
                this.forEachChildren(id, function (unit) {
                    units.push(unit);
                });
                return units;
            },

            getRootUnit: function (pageNo) {
                var index = this.getPageIndex(pageNo);
                if (index == -1)
                    return null;
                var node = this._trees[index].getRoot();
                return node ? node.obj : null;
            },

            getUserAnchorUnit: function (pageNo) {
                var index = this.getPageIndex(pageNo);
                if (index == -1)
                    return null;
                var id = USER_ANCHOR_ID_PREFIX + pageNo;
                var node = this._trees[index].get(id);
                return node ? node.obj : null;
            },

            getAppAnchorUnit: function (pageNo) {
                var index = this.getPageIndex(pageNo);
                if (index == -1)
                    return null;
                var id = APP_ANCHOR_ID_PREFIX + pageNo;
                var node = this._trees[index].get(id);
                return node ? node.obj : null;
            },

            findUiUnitInFirstLevel: function(pageNo, controlId) {
                var rootUnit = this.getRootUnit(pageNo);
                if (!rootUnit || !controlId)
                    return null;
                var secondUnits = this.getChildUnits(rootUnit.id);
                var userUnit = null;
                for (var i = 0; i < secondUnits.length; i++) {
                    var unit = secondUnits[i];
                    if (unit.type == FlowModel.TYPE_USER_ANCHOR) {
                        userUnit = unit;
                    }
                    else if (controlId == "APP" && unit.type == FlowModel.TYPE_APP_ANCHOR)
                        return unit;
                }
                if (!userUnit)
                    return null;
                var childUnits = this.getChildUnits(userUnit.id);
                for (var i = 0; i < childUnits.length; i++) {
                    if (childUnits[i].controlId == controlId)
                        return childUnits[i];
                }
                return null;
            },

            findAllUiUnitsInFirstLevel: function(controlId) {
                var units = [];
                for (var i = 0; i < this._pages.length; i++) {
                    var unit = this.findUiUnitInFirstLevel(this._pages[i].no, controlId);
                    if (unit)
                        units.push(unit);
                }
                return units;
            },


            getSiblingIndex: function (id) {
                var tree = this._getTree(id);
                if (!tree)
                    return -1;
                else
                    return tree.getSiblingIndex(id);
            },

            changeSiblingIndex: function (id, newSiblingIndex) {
                var tree = this._getTree(id);
                if (!tree)
                    return false;
                else
                    return tree.changeSiblingIndex(id, newSiblingIndex);
            },

            getFirstChildUnit: function (id) {
                var tree = this._getTree(id);
                if(!tree)
                return null;
                var node = tree.get(id);
                if ( !node.children || node.children.length < 1)
                    return null;
                var childNode =  tree.get(node.children[0]);
                return childNode ? childNode.obj : null;
            },

            getLastChildUnit: function (id) {
                var tree = this._getTree(id);
                if(!tree)
                    return null;
                var node = tree.get(id);
                if (!node || !node.children || node.children.length < 1)
                    return null;
                var childNode = tree.get(node.children[node.children.length - 1]);
                return childNode ? childNode.obj : null;
            },

            isChild: function (childId, parentId) {
                var childNode = this._getNode(childId);
                if (!childNode || !parentId)
                    return false;
                return childNode.parent == parentId;
            },

            /**
             * Return previous brother unit
             * @param id
             */
            getPreviousUnit: function (id) {
                var tree = this._getTree(id);
                if (!tree)
                    return null;
                var parentNode = tree.get(tree.get(id).parent);
                if (!parentNode || !parentNode.children)
                    return null;
                var index = util.indexOfArray(parentNode.children, id);
                if (index <= 0)
                    return null;
                var previous = tree.get(parentNode.children[index - 1]);
                return previous ? previous.obj : null;
            },

            /**
             * Return next brother unit
             * @param id
             */
            getNextUnit: function (id) {
                var tree = this._getTree(id);
                if (!tree)
                    return null;
                var parentNode = tree.get(tree.get(id).parent);
                if (!parentNode || !parentNode.children)
                    return null;
                var index = util.indexOfArray(parentNode.children, id);
                if (index < 0 || index == parentNode.children.length - 1)
                    return null;
                var next = tree.get(parentNode.children[index + 1]);
                return next ? next.obj : null;
            },

            /**
             *  Executes the provided callback once for each unit in unit tree of all flow pages.
             * @param callback  {Function} Function to execute for each element, which has
             *                                 two parameters, unit and index: callback(unit, index). When the callback function
             *                                 return true, the for each loop will be interrupted.
             * @param thisObj {Object}  Value to use as this when executing callback.
             * @returns {Boolean} interrupted or not.
             */
            forEach: function (callback, thisObj) {
                var interrupted = false;
                for (var i = 0; i < this._trees.length; i++) {
                    var tree = this._trees[i];
                    interrupted = tree.forEach(function (id, node, index) {
                        var breaked = false;
                        if (thisObj)
                            breaked = callback.call(thisObj, node.obj, index);
                        else
                            breaked = callback(node.obj, index);
                        if (breaked == true)
                            return true;
                        else
                            return false;
                    });
                    if (interrupted == true)
                        return true;
                }
                return false;
            },

            forEachChildren: function (id, callback, thisObj) {
                var tree = this._getTree(id);
                if (!tree)
                    return false;
                var interrupted = tree.forEachChildren(id, function (childId, childNode, index) {
                    var breaked = false;
                    if (thisObj)
                        breaked = callback.call(thisObj, childNode.obj, index);
                    else
                        breaked = callback(childNode.obj, index);
                    if (breaked == true)
                        return true;
                    else
                        return false;
                });
                if (interrupted == true)
                    return true;
                else
                    return false;
            },

            count: function () {
                if (arguments.length == 0) {
                    var num = 0;
                    for (var i = 0; i < this._trees.length; i++) {
                        num += this._trees[i].count();
                    }
                    return num;
                } else if (typeof arguments[0] == "string") {
                    return this.countChildUnits(arguments[0]);
                } else
                    return  0;
            },

            /**
             * Check the specified control whether to exsist in the children units of specified unit
             * @param unitId
             * @param controlId
             */
            isControlExistInChildren: function (unitId, controlId) {
                var units = this.getChildUnits(unitId);
                if (units.length == 0)
                    return false;
                for (var i = 0; i < units.length; i++) {
                    var child = units[i];
                    if (child.type == FlowModel.TYPE_UI && child.controlId == controlId)
                        return true;
                }
                return false;
            },

            createNewId: function (type) {
                type =( type || "unit").toLowerCase();
                while (true) {
                    var id = type + "_" + util.uuid(6).toLowerCase();
                    if (!this.get(id))
                        return id;
                }
            },

            isApiUsed: function(apiName){
                var used = false;
                this.forEach(function(unit){
                    if(unit.type == FlowModel.TYPE_API && unit.name == apiName){
                        used = true;
                        return true; //break out of for each
                    }
                    return false;    //continue
                }, this);
               return used;
            },

            createNewApiId: function(apiName){
                var suffix = 0;
                while(true){
                    suffix++;
                    var aid = apiName + suffix;
                    var used = false;
                    this.forEach(function(unit){
                        if(unit.type == FlowModel.TYPE_API && unit.aid == aid){
                            used = true;
                            return true; //break out of for each
                        }
                        return false;
                    }, this);
                    if( !used)
                    return aid;
                }
            },

            getAllUsedEventNames: function(controlId){
                var uiUnits = this.findAllUiUnitsInFirstLevel(controlId);
                var eventNames = [];
                for (var i = 0; i < uiUnits.length; i++) {
                    var childUnits = this.getChildUnits(uiUnits[i].id);
                    for (var j = 0; j < childUnits.length; j++) {
                        var childUnit = childUnits[j];
                        if(childUnit.type == FlowModel.TYPE_EVENT && childUnit.name)
                            eventNames.push(childUnit.name);
                    }
                }
               return eventNames;
            },

            getAllUsedMethodNames: function(unitId){
                var unit = this.get(unitId);
                if(!unit || unit.type != FlowModel.TYPE_UI)
                    return [];
                var methodNames = [];
                var childUnits = this.getChildUnits(unit.id);
                for (var j = 0; j < childUnits.length; j++) {
                    var childUnit = childUnits[j];
                    if(childUnit.type == FlowModel.TYPE_METHOD && childUnit.name)
                        methodNames.push(childUnit.name);
                }
                return methodNames;
            }





        };

        //function alias
        FlowModel.prototype.getUnit = FlowModel.prototype.get;
        FlowModel.prototype.removeUnit = FlowModel.prototype.remove;
        FlowModel.prototype.addUnit = FlowModel.prototype.add;

        FlowModel.TYPE_ROOT = "ROOT";
        FlowModel.TYPE_USER_ANCHOR = "USER_ANCHOR";
        FlowModel.TYPE_APP_ANCHOR = "APP_ANCHOR";
        FlowModel.TYPE_UI = "UI";
        FlowModel.TYPE_EVENT = "EVENT";
        FlowModel.TYPE_METHOD = "METHOD";
        FlowModel.TYPE_API = "API";
        FlowModel.TYPE_INPUT = "INPUT";
        FlowModel.TYPE_OUTPUT = "OUTPUT";
        FlowModel.TYPE_PARAM = "PARAM";
        FlowModel.TYPE_RESULT_UI = "RESULT_UI";
        FlowModel.TYPE_PAGE = "PAGE";

        FlowModel.REGION_USER = "USER";
        FlowModel.REGION_APP = "APP";

        FlowModel.VALUE_TYPE_UI = "UI";
        FlowModel.VALUE_TYPE_PAGE = "PAGE";
        FlowModel.VALUE_TYPE_VALUE = "VALUE";

        FlowModel.MAPPING_TYPE_PROPERTY = "PROPERTY";
        FlowModel.MAPPING_TYPE_DATA = "DATA";
        FlowModel.MAPPING_TYPE_SINGLE = "SINGLE";

        function copyData(thisObj, data) {
            if (data && typeof data == "object") {
                for (var key in data) {
                    if (!data.hasOwnProperty(key))
                        continue;
                    var value = data[key];
                    if (typeof value != "function")
                        thisObj[key] = value;
                }
            }
        }

        var extend = util.extend;

        var Unit = function (data) {
            this.id = "";
            this.type = "";
            this.parentId = "";
            this.depth = 1;
            this.pageNo = 1;
            this.region = "";

            this.left = 0;
            this.top = 0;
            this.width = 0;
            this.height = 0;
            copyData(this, data);
        };

        var RootUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_ROOT;
            this.parentId = "";
            this.depth = 1;
            this.region = "";
            this.width = 130;
            this.height = 82;
            copyData(this, data);
        };
        extend(RootUnit, Unit);

        var UserAnchorUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_USER_ANCHOR;
            this.depth = 2;
            this.region = FlowModel.REGION_USER;
            this.width = 100;
            this.height = 40;
            copyData(this, data);
        };
        extend(UserAnchorUnit, Unit);

        var AppAnchorUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_APP_ANCHOR;
            this.depth = 2;
            this.region = FlowModel.REGION_APP;
            this.controlId = this.controlType = "APP";
            this.width = 100;
            this.height = 40;
            copyData(this, data);
        };
        extend(AppAnchorUnit, Unit);

        var UiUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_UI;
            copyData(this, data);
        };
        extend(UiUnit, Unit, {
            controlId: "",
            controlType: ""
        });

        var EventUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_EVENT;
            this.params = [];
            copyData(this, data);
        };
        extend(EventUnit, Unit, {
            name: "",
            alias: "",
            icon: ""
        });

        var MethodUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_METHOD;
            this.params = [];
            copyData(this, data);
        };
        extend(MethodUnit, Unit, {
            name: "",
            alias: "",
            output: false   //has returned result
        });

        var ApiUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_API;
            copyData(this, data);
        };
        extend(ApiUnit, Unit, {
            aid: "",
            name: "",
            alias: "",
            icon: "",
            isChangePageApi: false
        });

        var InputUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_INPUT;
            this.name = "INPUT";
            copyData(this, data);
        };
        extend(InputUnit, Unit);


        var OutputUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_OUTPUT;
            this.name = "OUTPUT";
            copyData(this, data);
        };
        extend(OutputUnit, Unit);

        var ParamUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_PARAM;
            copyData(this, data);
        };
        extend(ParamUnit, Unit, {
            name: "",
            alias: "",
            valueType: "",    // UI   or VALUE  or PAGE or null
            value: null,            //used when valueType is "VALUE" or "PAGE"
            controlId: "",         //used when valueType is "UI"
            propName: "",      // used when valueType is "UI"
            propMeta: null
        });

        FlowModel.isNullValueForParamUnit = function (paramUnit) {
            return !paramUnit.valueType || ( paramUnit.valueType == "VALUE" && paramUnit.value == null)
                || ( paramUnit.valueType == "UI" && !paramUnit.controlId) || ( paramUnit.valueType == "PAGE" && !paramUnit.value);
        };
        FlowModel.setNullValueForParamUnit = function (paramUnit) {
            paramUnit.valueType = "";
            paramUnit.value = null;
            paramUnit.controlId = "";
            paramUnit.propName = "";
            paramUnit.propMeta = null;
        };

        var ResultUiUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_RESULT_UI;
            copyData(this, data);
        };
        extend(ResultUiUnit, UiUnit, {
            mappingType: "",   //PROPERTY, DATA, SINGLE, @see FlowModel.MAPPING_TYPE_***
            mapping: null,        // Used when mappingType is PROPERTY or DATA
            propName: ""         // Used when mappingType is SINGLE
        });

        var PageUnit = function (data) {
            arguments.callee.superClass.constructor.call(this);
            this.type = FlowModel.TYPE_PAGE;
            copyData(this, data);
        };
        extend(PageUnit, Unit, {
            pageNo: 1
        });

        FlowModel.Unit = Unit;
        FlowModel.RootUnit = RootUnit;
        FlowModel.UserAnchorUnit = UserAnchorUnit;
        FlowModel.AppAnchorUnit = AppAnchorUnit;
        FlowModel.UiUnit = UiUnit;
        FlowModel.EventUnit = EventUnit;
        FlowModel.MethodUnit = MethodUnit;
        FlowModel.ApiUnit = ApiUnit;
        FlowModel.InputUnit = InputUnit;
        FlowModel.OutputUnit = OutputUnit;
        FlowModel.ParamUnit = ParamUnit;
        FlowModel.ResultUiUnit = ResultUiUnit;
        FlowModel.PageUnit = PageUnit;

        FlowModel.PAGE_ID_PREFIX = PAGE_ID_PREFIX;
        FlowModel.ROOT_ID_PREFIX = ROOT_ID_PREFIX;
        FlowModel.USER_ANCHOR_ID_PREFIX = USER_ANCHOR_ID_PREFIX;
        FlowModel.APP_ANCHOR_ID_PREFIX = APP_ANCHOR_ID_PREFIX;


        //export module
        return FlowModel;
    });

