/**
 * @module MappingEditor
 */
define(["css!modules/flowDesigner/flowDesigner", "text!modules/flowDesigner/dialogs/mapping_tmpl.html",
    "jqueryCommon", "util", "underscore", "yahoo_treeview", "metaHub", "xml2json"],
    function(css, tmpl, $, util, _, YAHOO, metaHub) {

        var MAPPING_TYPE_PROPERTY = "PROPERTY";
        var MAPPING_TYPE_DATA = "DATA";
        var MAPPING_TYPE_SINGLE = "SINGLE";

        var RESULT_ROOT_NAME = "result";
        var UI_DATA_ROOT_NAME = "data";
        var UI_PROP_ROOT_NAME = "ui";

        /**
         * MappingEditor class, used to configure data mapping between service result and ui properties/binding data
         * @param options
         * @param options.container
         * @param options.unit
         * @param options.resultMeta  {type, format } service result data format description
         * @param options.serviceName
         * @param [options.callback]  function(canceled, mappingType, mapping)
         * @constructor
         */
        var MappingEditor = function(options) {
            if (!options.container || !options.unit || !options.unit.controlId || !options.unit.controlType) {
                throw new Error("Parameter 'options'  error: %o", options)
            }
            this.options = options;
            if (typeof options.container == "String")
                this.container = document.getElementById(options.container);
            else
                this.container = options.container;

            this.resultMeta = options.resultMeta;
            this.unit = options.unit;
            this.callback = options.callback;
            this.unitId = options.unit.id;
            this.serviceName = options.serviceName;
            if (options.unit.mappingType == MAPPING_TYPE_SINGLE || !options.unit.mappingType) {
                //convert mapping type
                this.mappingType = MAPPING_TYPE_PROPERTY;
                if (options.unit.propName) {
                    this.mapping = [
                        {
                            "source": RESULT_ROOT_NAME,
                            "target": options.unit.propName
                        }
                    ]
                }
                else
                    this.mapping = [];
            }
            else {
                this.mappingType = options.unit.mappingType == MAPPING_TYPE_DATA ?
                    MAPPING_TYPE_DATA : MAPPING_TYPE_PROPERTY;
                if (util.isArray(options.unit.mapping)) {
                    this.mapping = util.deepCopy([], options.unit.mapping);
                }
                else
                    this.mapping = [];
            }

            var meta = metaHub.getUiMetadata(options.unit.controlType);
            if (meta && meta.dataFormat != null){
                if(typeof meta.dataFormat == "string"){
                    try{
                        this.dataFormat =JSON.parse(meta.dataFormat )
                    }catch (e){
                        console.warn("Data format of control [%s] is not valid json content: \n%s",
                            options.unit.controlType,  meta.dataFormat )    ;
                        this.dataFormat = meta.dataFormat ; //string
                    }
                }else
                    this.dataFormat = meta.dataFormat;
            }
        };

        MappingEditor.prototype = {
            $el: null,
            options: null,
            container: null,
            resultMeta: null,
            resultType: "JSON",
            unit: null,
            unitId: null,
            serviceName: "",
            dataFormat: null,

            mappingType: MAPPING_TYPE_DATA,
            mapping: [],
            itemList: [],

            resultTree: null,
            uiTree: null,
            resultRootNode: null,
            uiRootNode: null,

            selectedResultNode: null,
            selectedUiNode: null,
            changed: false,

            $: function(selector) {
                if (this.$el)
                    return this.$el.find(selector);
                else
                    return null;
            },

            show: function() {
                if (this.$el != null) {
                    this.$el.show();
                    return;
                }
                var id = "fme_" + util.uuid(8);
                //var html = _.template(tmpl)({id: id});
                this.$el = $(tmpl);
                this.$el.attr("id", id);

                this.$el.find("#cancel_mapping").xbind("click", this._cancel, this);
                this.$el.find("#save_mapping").xbind("click", this._save, this);
                this.$el.find("#add_mapping").xbind("click", this._onClickAdd, this);
                this.$el.find("#remove_mapping").xbind("click", this._onClickRemove, this);
                this.$el.find("#mapping_type_select").xbind("change", this._onMappingTypeChanged, this);

                this.$el.find("#mapping_type_select").val(this.mappingType);

                this._renderResultTree();
                this._renderUiTree();
                this._convertMapping();
                this._renderMappings();

                $(this.container).append(this.$el);
                this.$el.show();
                this.changed = false;
            },

            _renderResultTree: function() {
                this.$("#mapping_api_name").text(this.serviceName);
                this.resultRootNode = null;
                this.resultTree = new YAHOO.widget.TreeView(this.$("#result_tree")[0]);
                this.resultType = "JSON";
                if (!this.resultMeta || !this.resultMeta.type) {
                    this._renderResultTreeByJson(null);
                }
                else {
                    var type = this.resultMeta.type.toLowerCase();
                    switch (type) {
                        case "string":
                            this._renderResultTreeByJson("string");
                            break;
                        case "json":
                            var format = this.resultMeta.format;
                            if (!format)
                                this._renderResultTreeByJson(null);
                            else if (typeof format == "string") {
                                var obj;
                                try {
                                    obj = JSON.parse(format);
                                } catch (e) {
                                    console.error("[renderResultTree] Invalid json format for data meta:\n %s", format);
                                    obj = null;
                                }
                                this._renderResultTreeByJson(obj);
                            }
                            else
                                this._renderResultTreeByJson(format);
                            break;
                        case "xml":
                            // convert to json
                            this.resultType = "XML";
                            var jsonObj = null;
                            try{
                                 jsonObj = $.xml2json(this.resultMeta.format);
                            }catch (e){
                                console.warn("Invalid xml content: \n\t" + this.resultMeta.format);
                                jsonObj = {};
                            }
                            this._renderResultTreeByJson(jsonObj);
                            break;
                        default:
                            this._renderResultTreeByJson({});
                            break;
                    }
                }
                var _this = this;
                this.resultTree.subscribe("clickEvent", function(e) {
                    _this._setSelectedResultNode(e.node);
                    return false;
                });

                this.resultTree.render();

                if (this.resultRootNode)
                    this._updateNodeIcon(this.resultRootNode);

            },

            _renderResultTreeByJson: function(format) {
                var type = format == null ? "null" : typeof format;
                var onlyRoot = type != "object";
                var obj = {
                    dataType: type,
                    name: RESULT_ROOT_NAME,
                    depth: 0,
                    path: RESULT_ROOT_NAME,
                    relativePath: RESULT_ROOT_NAME,
                    isArray: util.isArray(format)
                };

                var html = '<div class="mpp-node result root">' +
                    '<span class="mpp-icon-container"><div class="mpp-icon"></div></span>' +
                    '<span class="mpp-node-text">Result</span>';
                if (obj.isArray)
                    html += '<span class="mpp-array-tag">[]</span>	';
                html += '</div>';
                var rootNode = new YAHOO.widget.TextNode({
                    label: html,
                    title: "Result",
                    expanded: true
                }, this.resultTree.root);
                rootNode.obj = obj;
                this.resultRootNode = rootNode;
                if (!onlyRoot && type == "object") {
                    var next = null;
                    if (obj.isArray) {
                        if (format.length > 0) {
                            //does not support array type of element
                            next = format[0];
                        }
                    }
                    else {
                        next = format;
                    }
                    if (next) {
                        for (var key in next) {
                            if (!next.hasOwnProperty(key))
                                continue;
                            var value = next[key];
                            if (typeof value == "function")
                                continue;
                            this._buildResultNode(rootNode, key, value);
                        }
                    }
                }
            },

            _buildResultNode: function(parentNode, propName, propValue) {
                var parentObj = parentNode.obj;
                var type = propValue == null ? "null" : typeof propValue;
                var isArray = util.isArray(propValue);

                var obj = {
                    dataType: type,
                    name: propName,
                    depth: parentObj.depth + 1,
                    path: parentObj.path + "." + propName,
                    relativePath: parentObj.isArray ? propName : parentObj.relativePath + "." + propName,
                    isArray: isArray
                };
                var html = '<div class="mpp-node result terminal">' +
                    '<span class="mpp-icon-container"><div class="mpp-icon"></div></span>' +
                    '<span class="mpp-node-text">' + propName + '</span>';
                if (isArray)
                    html += '<span class="mpp-array-tag">[]</span>	';
                html += '</div>';
                var node = new YAHOO.widget.TextNode({
                    label: html,
                    title: propName,
                    expanded: obj.depth <= 3
                }, parentNode);
                node.obj = obj;
                if (type == "object") {
                    var next = null;
                    if (isArray) {
                        if (propValue.length > 0) {
                            //does not support array type of element
                            next = propValue[0];
                        }
                    }
                    else {
                        next = propValue;
                    }
                    if (next) {
                        for (var key in next) {
                            if (!next.hasOwnProperty(key))
                                continue;
                            var value = next[key];
                            if (typeof value == "function")
                                continue;
                            this._buildResultNode(node, key, value);
                        }
                    }
                }
            },

            _updateNodeIcon: function(node) {
                var children = node.children;
                if (node.depth > 0) {
                    var $content = this.$("#" + node.contentElId).find(".mpp-node");
                    if (children.length == 0) {
                        $content.removeClass("branch").addClass("terminal");
                    }
                    else {
                        $content.removeClass("terminal").addClass("branch");
                    }
                }
                for (var i = 0; i < children.length; i++) {
                    this._updateNodeIcon(children[i]);
                }
            },

            _renderUiTree: function() {
                this.$("#mapping_control_id").text(this.unit.controlId);
                var treeEl = this.$("#ui_tree")[0];
                this.uiRootNode = null;
                this.uiTree = new YAHOO.widget.TreeView(treeEl);

                if (this.mappingType == MAPPING_TYPE_DATA)
                    this._renderUiTreeByData();
                else
                    this._renderUiTreeByProps();

                var _this = this;
                this.uiTree.subscribe("clickEvent", function(e) {
                    if (_this.mappingType == MAPPING_TYPE_PROPERTY && e.node.depth == 0)
                        return false; //root node for property can't be selected
                    _this._setSelectedUiNode(e.node);
                    return false;
                });

                this.uiTree.render();

                if (this.mappingType == MAPPING_TYPE_DATA) {
                    if (this.uiRootNode)
                        this._updateNodeIcon(this.uiRootNode);
                }
            },

            _renderUiTreeByProps: function() {
                var html = '<div class="mpp-node ui root">' +
                    '<span class="mpp-icon-container"><div class="mpp-icon"></div></span>' +
                    '<span class="mpp-node-text">UI</span></div>';
                var rootNode = new YAHOO.widget.TextNode({
                    label: html,
                    title: "UI",
                    expanded: true
                }, this.uiTree.root);
                rootNode.obj = {
                    depth: 0,
                    name: UI_PROP_ROOT_NAME,
                    type: MAPPING_TYPE_PROPERTY,
                    path: UI_PROP_ROOT_NAME,
                    relativePath: UI_PROP_ROOT_NAME
                };
                this.uiRootNode = rootNode;

                var props = getWritableProperties(this.unit.controlType);
                for (var i = 0; i < props.length; i++) {
                    var prop = props[i];
                    var propName = prop.name;
                    var propHtml = '<div class="mpp-node ui property">' +
                        '<span class="mpp-icon-container"><div class="mpp-icon"></div></span>' +
                        '<span class="mpp-node-text">' + propName + '</span>';
                    var propNode = new YAHOO.widget.TextNode({
                        label: propHtml,
                        title: propName,
                        expanded: true
                    }, rootNode);
                    propNode.obj = {
                        depth: 1,
                        name: propName,
                        type: MAPPING_TYPE_PROPERTY,
                        path: UI_PROP_ROOT_NAME + "." + propName,
                        relativePath: UI_PROP_ROOT_NAME + "." + propName,
                        dataType: prop.dataType
                    };
                }
            },

            _renderUiTreeByData: function() {
                var format = this.dataFormat;
                var dataType = format == null ? "null" : typeof format;
                var onlyRoot = dataType != "object";
                var isArray = util.isArray(format);

                var html = '<div class="mpp-node ui root">' +
                    '<span class="mpp-icon-container"><div class="mpp-icon data-root"></div></span>' +
                    '<span class="mpp-node-text">Data</span>';
                if (isArray)
                    html += '<span class="mpp-array-tag">[]</span>	';
                html += '</div>';
                var rootNode = new YAHOO.widget.TextNode({
                    label: html,
                    title: "UI",
                    expanded: true
                }, this.uiTree.root);
                rootNode.obj = {
                    type: MAPPING_TYPE_DATA,
                    dataType: dataType,
                    name: UI_DATA_ROOT_NAME,
                    depth: 0,
                    path: UI_DATA_ROOT_NAME,
                    relativePath: UI_DATA_ROOT_NAME,
                    isArray: isArray,
                    jPath: UI_DATA_ROOT_NAME
                };
                this.uiRootNode = rootNode;

                if (!onlyRoot && dataType == "object") {
                    var next = null;
                    if (isArray) {
                        if (format.length > 0) {
                            //does not support array type of element
                            next = format[0];
                        }
                    }
                    else {
                        next = format;
                    }
                    if (next) {
                        for (var key in next) {
                            if (!next.hasOwnProperty(key))
                                continue;
                            var value = next[key];
                            if (typeof value == "function")
                                continue;
                            this._buildDataNode(rootNode, key, value);
                        }
                    }
                }
            },

            _buildDataNode: function(parentNode, propName, propValue) {
                var parentObj = parentNode.obj;
                var type = propValue == null ? "null" : typeof propValue;
                var isArray = util.isArray(propValue);
                var obj = {
                    type: MAPPING_TYPE_DATA,
                    dataType: type,
                    name: propName,
                    depth: parentObj.depth + 1,
                    path: parentObj.path + "." + propName,
                    relativePath: parentObj.isArray ? propName : parentObj.relativePath + "." + propName,
                    isArray: isArray,
                    jPath: parentObj.isArray ? parentObj.jPath + "[0]." + propName : parentObj.jPath + "." + propName
                };
                var html = '<div class="mpp-node ui terminal">' +
                    '<span class="mpp-icon-container"><div class="mpp-icon"></div></span>' +
                    '<span class="mpp-node-text">' + propName + '</span>';
                if (isArray)
                    html += '<span class="mpp-array-tag">[]</span>	';
                html += '</div>';
                var node = new YAHOO.widget.TextNode({
                    label: html,
                    title: propName,
                    expanded: obj.depth <= 3
                }, parentNode);
                node.obj = obj;
                if (type == "object") {
                    var next = null;
                    if (isArray) {
                        if (propValue.length > 0) {
                            //does not support array type of element
                            next = propValue[0];
                        }
                    }
                    else {
                        next = propValue;
                    }
                    if (next) {
                        for (var key in next) {
                            if (!next.hasOwnProperty(key))
                                continue;
                            var value = next[key];
                            if (typeof value == "function")
                                continue;
                            this._buildDataNode(node, key, value);
                        }
                    }
                }
            },

            _setSelectedResultNode: function(node) {
                if (this.selectedResultNode == node) {
                    return;
                }
                if (this.selectedResultNode) {
                    this.$("#" + this.selectedResultNode.contentElId).find(".mpp-node").removeClass("selected");
                }
                if (node)
                    this.$("#" + node.contentElId).find(".mpp-node").addClass("selected");
                this.selectedResultNode = node;
                this._setSelectedMappingItemByNodes();
            },

            _setSelectedUiNode: function(node) {
                if (this.selectedUiNode == node) {
                    return;
                }
                if (this.selectedUiNode) {
                    this.$("#" + this.selectedUiNode.contentElId).find(".mpp-node").removeClass("selected");
                }
                if (node)
                    this.$("#" + node.contentElId).find(".mpp-node").addClass("selected");
                this.selectedUiNode = node;
                this._setSelectedMappingItemByNodes();
            },

            _renderMappings: function() {
                this.$("#data_mapping_list").empty();
                for (var i = 0; i < this.itemList.length; i++) {
                    var item = this.itemList[i];
                    this._addMappingItem(item);
                }
            },

            _addMappingItem: function(mappingItem) {
                var $list = this.$("#data_mapping_list");
                var index = $list[0].children.length;

                var html = '<li class="mapping-item"  data-index="' + index + '">' +
                    '<span class="item-text">' + mappingItem.toString() + '</span>' +
                    '<div class="item-delete"></div>' +
                    '</li>';
                $list.append(html);
                var $item = $($list[0].children[index]);
                var _this = this;
                $item.click(function() {
                    var myIndex = parseInt($(this).attr('data-index'));
                    _this._setSelectedMapping(myIndex);
                    _this._setSelectedNodesByMappingItem(myIndex);
                });
                $item.find(".item-delete").click(function() {
                    var myIndex = parseInt($(this.parentElement).attr('data-index'));
                    _this._removeMappingAt(myIndex);
                });
                $item.bind("mouseenter", function() {
                    $(this).find(".item-delete").show();
                });
                $item.bind("mouseleave", function() {
                    $(this).find(".item-delete").hide();
                });
                return index;
            },

            /**
             * convert mapping tree to item list
             * @private
             */
            _convertMapping: function() {
                this.itemList = [];
                if (!this.mapping) {
                    this.mapping = [];
                    return;
                }
                if (this.mappingType == MAPPING_TYPE_PROPERTY) {
                    this._convertPropItem("", this.mapping, this.itemList);
                }
                else {
                    this._convertDataItem("", "", this.mapping, this.itemList);
                }
            },

            _convertPropItem: function(parentPath, items, targetList) {
                for (var i = 0; i < items.length; i++) {
                    var obj = items[i];
                    if (!obj.source)
                        continue;
                    var path = parentPath ? parentPath + "." + obj.source : obj.source;
                    if (obj.target) {
                        targetList.push(new MappingItem({
                            source: path,
                            target: UI_PROP_ROOT_NAME + "." + obj.target
                        }));
                    }
                    if (obj.isArray && obj.items && obj.items.length > 0) {
                        this._convertPropItem(path, obj.items, targetList)
                    }
                }
            },

            _convertDataItem: function(sourceParentPath, targetParentPath, items, targetList) {
                for (var i = 0; i < items.length; i++) {
                    var obj = items[i];
                    if (!obj.source)
                        continue;
                    var path = sourceParentPath ? sourceParentPath + "." + obj.source : obj.source;
                    var targetPath;
                    if (obj.target) {
                        targetPath = targetParentPath ? targetParentPath + "." + obj.target : obj.target;
                        targetList.push(new MappingItem({
                            source: path,
                            target: targetPath
                        }));
                    }
                    else {
                        targetPath = targetParentPath;
                    }
                    if (obj.isArray && obj.items && obj.items.length > 0) {
                        this._convertDataItem(path, targetPath, obj.items, targetList)
                    }
                }
            },

            _findChildNode: function(node, name) {
                for (var i = 0; i < node.children.length; i++) {
                    var child = node.children[i]
                    if (child.obj.name == name)
                        return child;
                }
                return null;
            },

            /**
             * revert mapping tree from item list
             * @returns {boolean}
             * @private
             */
            _revertMapping: function() {
                var mapping = [];
                if (this.mappingType == MAPPING_TYPE_PROPERTY) {
                    for (var i = 0; i < this.itemList.length; i++) {
                        var item = this.itemList[i];
                        if (!item.source || !item.target || item.target.indexOf(UI_PROP_ROOT_NAME + ".") != 0)
                            continue;
                        var propName = item.target.substring((UI_PROP_ROOT_NAME + ".").length);
                        if (!propName || propName.indexOf(".") != -1) {
                            console.warn("Invalid property name: %s", propName);
                            continue;
                        }
                        this._drillPropItem(mapping, item.source.split("."), 0, this.resultTree.root, propName);
                    }
                }
                else {
                    //mapping data
                    var handled = [];
                    var validList = [];
                    for (var i = 0; i < this.itemList.length; i++) {
                        var item = this.itemList[i];
                        if (!item.source || !item.target)
                            continue;
                        var sourceNode = this._getResultNodeByPath(item.source);
                        var targetNode = this._getDataNodeByPath(item.target);
                        if (!sourceNode) {
                            console.warn("Result path '%s' is invalid, not exist in result tree.", item.source);
                            continue;
                        }
                        if (!targetNode) {
                            console.warn("Data path '%s' is invalid, not exist in data tree.", item.target);
                            continue;
                        }
                        validList.push({
                            source: sourceNode,
                            target: targetNode,
                            originalIndex: i
                        });

                    }
                    for (var i = 0; i < validList.length; i++) {
                        var item = validList[i];
                        var reverted = this._revertDataItem(item.source, item.target, mapping,
                            this.itemList, item.originalIndex, handled);
                        if (!reverted)
                            return false;
                    }
                }
                this.mapping = mapping;
                return true;
            },

            _revertDataItem: function(sourceNode, targetNode, mappings, itemList, itemIndex, handled) {
                if (handled[itemIndex] == true)
                    return true;
                var sourceObj = sourceNode.obj;
                var targetObj = targetNode.obj;
                var isLeaf = targetNode.children.length == 0;
                if (isLeaf) { // target is a leaf node                  
                    if (targetObj.path == targetObj.relativePath) {
                        //[Condition] no array node in path 
                        this._drillDataItem(mappings, sourceObj.path.split("."), 0, this.resultTree.root, targetObj.path);
                    }
                    else {
                        //[Condition] target node is a child node of array node (parent or ancestor)
                        if (sourceNode.children.length != 0) {
                            console.warn("Source node in mapping '%s' should be a leaf node.", itemList[itemIndex].toString());
                        }

                        //All array nodes in target path must be mappinged.
                        var mappingedList = this._collectMappingArrayPairs(targetNode, sourceNode, itemList);
                        if (!mappingedList || mappingedList.length == 0) {
                            this._setSelectedMapping(itemIndex);
                            this._setSelectedNodesByMappingItem(itemIndex);
                            showAlert("'" + itemList[itemIndex].toString() + "' mapping is invalid!");
                            return false;
                        }
                        else {
                            var sourcePathArray = [];
                            var targetPathArray = [];
                            for (var i = mappingedList.length - 1; i >= 0; i--) {
                                var item = mappingedList [i];
                                handled[item.index] = true;
                                if (!item.isArray)
                                    console.debug("Although '%s' is not an array node, but here suppose it is.", item.source);
                                if (i == mappingedList.length - 1) {
                                    sourcePathArray.push(item.source);
                                    targetPathArray.push(item.target);
                                }
                                else {
                                    var lastItem = mappingedList[i + 1];
                                    sourcePathArray.push(item.source.substring(lastItem.source.length + 1));
                                    targetPathArray.push(item.target.substring(lastItem.target.length + 1));
                                }
                            }
                            var mappingedItem = this._pushArrayItem(mappings, sourcePathArray, targetPathArray, 0);
                            if (!mappingedItem) {
                                console.error("_pushArrayItem error");
                            }
                            else {
                                var sourceRelativePath = sourceObj.path.substring(mappingedList[0].source.length + 1);
                                var targetRelativePath = targetObj.path.substring(mappingedList[0].target.length + 1);
                                mappingedItem.items = mappingedItem.items || [];
                                var item = findItem(mappingedItem.items, sourceRelativePath, targetRelativePath);
                                if (!item)
                                    mappingedItem.items.push({
                                        source: sourceRelativePath,
                                        target: targetRelativePath,
                                        isArray: sourceObj.isArray
                                    });
                                else
                                    item.isArray = sourceObj.isArray;
                            }
                        }
                    }
                }
                else {
                    //target is a branch node
                    if (!targetObj.isArray) {
                        console.warn("target node value must not be a json object");
                        this._setSelectedMapping(itemIndex);
                        this._setSelectedNodesByMappingItem(itemIndex);
                        showAlert("'" + itemList[itemIndex].toString() + "' mapping is invalid!");
                        return false;
                    }
                    else { // target node is a array node ,also as a branch node
                        var mappingedList = this._collectMappingArrayPairs(targetNode, sourceNode, itemList);
                        if (!mappingedList) {
                            this._setSelectedMapping(itemIndex);
                            this._setSelectedNodesByMappingItem(itemIndex);
                            showAlert("'" + itemList[itemIndex].toString() + "' mapping is invalid!");
                            return false;
                        }
                        else if (mappingedList.length == 0) {
                            this._pushArrayItem(mappings, [ sourceObj.path], [ targetObj.path], 0);
                        }
                        else {
                            var sourcePathArray = [];
                            var targetPathArray = [];
                            for (var i = mappingedList.length - 1; i >= 0; i--) {
                                var item = mappingedList [i];
                                handled[item.index] = true;
                                if (!item.isArray)
                                    console.debug("Although '%s' is not an array node, but here suppose it is.", item.source);
                                if (i == mappingedList.length - 1) {
                                    sourcePathArray.push(item.source);
                                    targetPathArray.push(item.target);
                                }
                                else {
                                    var lastItem = mappingedList[i + 1];
                                    sourcePathArray.push(item.source.substring(lastItem.source.length + 1));
                                    targetPathArray.push(item.target.substring(lastItem.target.length + 1));
                                }
                            }
                            if (!sourceObj.isArray)
                                console.debug("Although '%s' is not an array node, but here suppose it is.", item.sourceObj.path);
                            sourcePathArray.push(sourceObj.path.substring(mappingedList[0].source.length + 1));
                            targetPathArray.push(targetObj.path.substring(mappingedList[0].target.length + 1));
                            this._pushArrayItem(mappings, sourcePathArray, targetPathArray, 0);
                        }
                    }
                }
                handled[itemIndex] = true;
                return true;
            },

            _collectMappingArrayPairs: function(targetBeginNode, sourceBeginNode, itemList) {
                var mappingedList = [];
                var sourceObj = sourceBeginNode.obj;
                var targetObj = targetBeginNode.obj;

                var targetArrayParentNodes = this._getAllArrayParentNodes(targetBeginNode);
                var sourceArrayParentNodes = this._getAllArrayParentNodes(sourceBeginNode);
                if (sourceArrayParentNodes.length == targetArrayParentNodes.length) {
                    // All array node must be mappinged
                    for (var i = 0; i < targetArrayParentNodes.length; i++) {
                        var sourcePath = sourceArrayParentNodes[i].obj.path;
                        var targetPath = targetArrayParentNodes[i].obj.path;
                        var index = findItemIndex(itemList, sourcePath, targetPath);
                        if (index < 0) {
                            console.warn("Data node'" + targetPath + "' must be mappinged.");
                            return null;
                        }
                        mappingedList.push({
                            source: sourcePath,
                            target: targetPath,
                            isArray: true,
                            index: index
                        });
                    }
                }
                else {

                    var lastSourcePath = sourceObj.path;
                    for (var i = 0; i < targetArrayParentNodes.length; i++) {
                        var matchedResult = findMatchedItems(itemList, null, targetArrayParentNodes[i].obj.path);
                        var matchedSourcePath = null;
                        var matchedIndex = -1;
                        var isArrayNode = false;
                        for (var j = 0; j < matchedResult.length; j++) {
                            var path = matchedResult[j].item.source;
                            if (lastSourcePath.indexOf(path + ".") == 0) {
                                var isArray = this._getResultNodeByPath(path).obj.isArray == true;
                                if (matchedSourcePath) {
                                    if (isArray) {
                                        if (isArrayNode) {
                                            //chose the nearest array node
                                            if (path.length > matchedSourcePath.length) {
                                                matchedSourcePath = path;
                                                matchedIndex = matchedResult[j].index;
                                                isArrayNode = true;
                                            }
                                        }
                                        else {
                                            matchedSourcePath = path;
                                            isArrayNode = true;
                                        }
                                    }
                                    else { // !isArray
                                        if (!isArrayNode) {
                                            //chose the nearest node
                                            if (path.length > matchedSourcePath.length) {
                                                matchedSourcePath = path;
                                                matchedIndex = matchedResult[j].index;
                                                isArrayNode = false;
                                            }
                                        }
                                    }
                                }
                                else {
                                    matchedSourcePath = path;
                                    matchedIndex = matchedResult[j].index;
                                    isArrayNode = isArray;
                                }
                            }
                        }
                        if (!matchedSourcePath) {
                            console.warn("Data node'" + targetArrayParentNodes[i].obj.path + "' must be mappinged.");
                            return null;
                        }
                        lastSourcePath = matchedSourcePath;
                        mappingedList.push({
                            source: matchedSourcePath,
                            target: targetArrayParentNodes[i].obj.path,
                            isArray: isArrayNode,
                            index: matchedIndex
                        });
                    }
                }
                return mappingedList;
            },

            _pushArrayItem: function(mappingArray, sourcePathArray, targetPathArray, index) {
                if (sourcePathArray.length != targetPathArray.length || index < 0 || index >= sourcePathArray.length)
                    return null;
                var sourcePath = sourcePathArray[index];  //this is a relative path
                var targetPath = targetPathArray[index];
                var item = findItem(mappingArray, sourcePath, targetPath);
                if (!item) {
                    item = {
                        source: sourcePath,
                        target: targetPath,
                        isArray: true      //maybe the source is a object
                    };
                    mappingArray.push(item);
                }
                if (index < sourcePathArray.length - 1) {
                    if (!item.items)
                        item.items = [];
                    var result = this._pushArrayItem(item.items, sourcePathArray, targetPathArray, index + 1);
                    if (result)
                        return result;
                }
                return item;
            },

            _drillDataItem: function(mappingArray, pathArray, beginDepth, parentNode, targetPath) {
                if (beginDepth >= pathArray.length || !parentNode)
                    return;
                var firstArrayNode = null, depth = -1;
                var node = this._findChildNode(parentNode, pathArray[beginDepth]);
                if (node) {
                    var myNode = node;
                    depth = beginDepth;
                    while (true) {
                        if (myNode.obj.isArray) {
                            firstArrayNode = myNode;
                            break;
                        }
                        else if (depth >= pathArray.length - 1 || !myNode.children || myNode.children.length == 0) {
                            break;
                        }
                        else {
                            var childNode = this._findChildNode(myNode, pathArray[depth + 1]);
                            if (!childNode)
                                break;
                            else {
                                myNode = childNode;
                                depth++;
                                continue;
                            }
                        }
                    }
                }
                else {
                    console.warn("Can't find child name '%s' in parent node '%o'", pathArray[beginDepth],
                        parentNode);
                }

                if (firstArrayNode) {
                    var path = pathArray.slice(beginDepth, depth + 1).join(".");
                    var item = findItem(mappingArray, path);
                    var isEnd = depth == pathArray.length - 1;
                    if (isEnd) {
                        if (!item || (item.target && item.target != targetPath)) {
                        }
                        else {// item && (item.target == "" || item.target == targetPath)
                        }
                        //always create a new mapping item
                        mappingArray.push({
                            source: path,
                            target: targetPath,
                            isArray: true,
                            valued: true
                        });
                    }
                    else {
                        //next child node
                        if (!item || item.target) {
                            item = {
                                source: path,
                                target: "",
                                isArray: true,
                                items: []
                            };
                            mappingArray.push(item);
                        }
                        if (!item.items)
                            item.items = [];
                        this._drillDataItem(item.items, pathArray, depth + 1, firstArrayNode, targetPath);
                    }
                }
                else {
                    var path = pathArray.slice(beginDepth, pathArray.length).join(".");
                    //doesn't have array node in path
                    mappingArray.push({
                        source: path,
                        target: targetPath
                    });
                }
            },

            _drillPropItem: function(mappingArray, pathArray, beginDepth, parentNode, propName) {
                if (beginDepth >= pathArray.length || !parentNode)
                    return;
                var firstArrayNode = null, depth = -1;
                var node = this._findChildNode(parentNode, pathArray[beginDepth]);
                if (node) {
                    var myNode = node;
                    depth = beginDepth;
                    while (true) {
                        if (myNode.obj.isArray) {
                            firstArrayNode = myNode;
                            break;
                        }
                        else if (depth >= pathArray.length - 1 || !myNode.children || myNode.children.length == 0) {
                            break;
                        }
                        else {
                            var childNode = this._findChildNode(myNode, pathArray[depth + 1]);
                            if (!childNode)
                                break;
                            else {
                                myNode = childNode;
                                depth++;
                                continue;
                            }
                        }
                    }
                }
                else {
                    console.warn("Can't find child name '%s' in parent node '%o'", pathArray[beginDepth],
                        parentNode);
                }

                if (firstArrayNode) {
                    var path = pathArray.slice(beginDepth, depth + 1).join(".");
                    var item = findItem(mappingArray, path);
                    var isEnd = depth == pathArray.length - 1;
                    if (isEnd) {
                        if (!item || (item.target && item.target != propName))
                            mappingArray.push({
                                source: path,
                                target: propName,
                                isArray: true
                            });
                        else
                            item.target = propName;
                    }
                    else {
                        //next child node
                        if (!item) {
                            item = {
                                source: path,
                                target: "",
                                isArray: true
                            };
                            mappingArray.push(item);
                        }
                        if (!item.items)
                            item.items = [];
                        this._drillPropItem(item.items, pathArray, depth + 1, firstArrayNode, propName);
                    }
                }
                else {
                    var path = pathArray.slice(beginDepth, pathArray.length).join(".");
                    //doesn't have array node in path
                    mappingArray.push({
                        source: path,
                        target: propName
                    });
                }
            },

            close: function() {
                if (this.$el) {
                    if (this.resultTree) {
                        this.resultTree.destroy();
                        this.resultTree = null;
                    }
                    if (this.uiTree) {
                        this.uiTree.destroy();
                        this.uiTree = null;
                    }
                    this.resultRootNode = null;
                    this.uiRootNode = null;
                    this.$el.remove();
                    this.$el = null;
                }
            },

            getMapping: function() {
                if (this.uiTree != null)
                    this._revertMapping();
                return this.mapping;
            },

            _cancel: function() {
                this.close();
                if (typeof this.callback == "function")
                    this.callback(true, null, null);
            },

            _save: function() {
                if (this.changed) {
                    var reverted = this._revertMapping();
                    if (!reverted)
                        return false;
                }
                this.close();
                this.unit.mappingType = this.mappingType;
                this.unit.mapping = this.mapping;
                this.unit.propName = "";
                if (typeof this.callback == "function")
                    this.callback(false, this.mappingType, this.mapping);
                return true;
            },

            _onMappingTypeChanged: function() {
                this.mappingType = this.$el.find("#mapping_type_select").val();
                this.mapping = [];
                this.itemList = [];

                if (this.uiTree) {
                    this.uiTree.destroy();
                    this.uiTree = null;
                }
                this.uiRootNode = null;
                this.selectedUiNode = null;
                this._renderUiTree();
                this.$("#data_mapping_list").empty();
                this.changed = true;
            },

            _onClickAdd: function() {
                if (!this.selectedResultNode) {
                    showAlert("Please select a node in result tree for mapping!");
                    return false;
                }
                else if (!this.selectedUiNode) {
                    var msg = this.mappingType == MAPPING_TYPE_PROPERTY ?
                        "Please select a property in ui tree for mapping!" :
                        "Please select a data node in ui tree for mapping!";
                    showAlert(msg);
                    return false;
                }
                else if (this.selectedUiNode.depth == 0 && this.mappingType == MAPPING_TYPE_PROPERTY) {
                    showAlert("Please select a property node.");
                    return false;
                }
                var resultNodeInfo = this.selectedResultNode.obj;
                var uiNodeInfo = this.selectedUiNode.obj;
                if (this.mappingType == MAPPING_TYPE_DATA) {
                    if (this.selectedUiNode.children.length > 0 && !uiNodeInfo.isArray) {
                        showAlert("'" + uiNodeInfo.name + "' data node is an object, can't be selected for mapping! \nPlease select it's children node.");
                        return false;
                    }
                }

                var item = new MappingItem({
                    source: resultNodeInfo.path,
                    target: uiNodeInfo.path,
                });
                //check  mapping whether has been existed
                for (var i = 0; i < this.itemList.length; i++) {
                    var other = this.itemList[i];
                    if (other.source == item.source && other.target == item.target) {
                        showAlert("Mapping item has been added.");
                        return false;
                    }
                }


                this.itemList.push(item);
                var index = this._addMappingItem(item);
                this._setSelectedMapping(index);

                this.changed = true;
                return true;
            },

            _onClickRemove: function() {
                var $selected = this.$("#data_mapping_list").children(".mapping-item.selected");
                if ($selected.length == 0)
                    return false;
                var index = parseInt($selected.attr("data-index"));
                this._removeMappingAt(index);
                return true;
            },

            _removeMappingAt: function(index) {
                var $children = this.$("#data_mapping_list").children();
                if (index < 0 || index >= $children.length)
                    return false;
                var $item = $children.eq(index);
                var isSelected = $item.hasClass("selected");
                if (isSelected) {
                    //change selected node to next one
                    var newSelectedIndex = index < $children.length - 1 ? index + 1 : index - 1;
                    if (newSelectedIndex >= 0)
                        $children.eq(newSelectedIndex).addClass("selected");
                }
                for (var i = index + 1; i < $children.length; i++) {
                    $children.eq(i).attr("data-index", i - 1);
                }

                $item.remove();
                //update item list
                this.itemList.splice(index, 1);
                this.changed = true;
                var $newSelected = $("#data_mapping_list").children(".selected");
                if ($newSelected.length > 0) {
                    this._setSelectedNodesByMappingItem(parseInt($newSelected.attr("data-index")));
                }
                return true;
            },


            _setSelectedMapping: function(index) {
                var $children = this.$("#data_mapping_list").children();
                $children.removeClass("selected");
                if (index >= 0)
                    $children.eq(index).addClass("selected");
            },

            _getResultNodeByPath: function(path) {
                return this._getNodeByPath(this.resultRootNode, path);
            },

            _getDataNodeByPath: function(path) {
                return this._getNodeByPath(this.uiRootNode, path);
            },

            _getNodeByPath: function(node, path) {
                if (!path)
                    return null;
                if (node.obj.path == path)
                    return node;
                else if (path.indexOf(node.obj.path + ".") == 0) {
                    //search children
                    for (var i = 0; i < node.children.length; i++) {
                        var found = this._getNodeByPath(node.children[i], path);
                        if (found)
                            return found;
                    }
                }
                return null;
            },

            _getNodeByRelativePath: function(parentNode, relativePath) {
                if (!parentNode)
                    return null;
                for (var i = 0; i < parentNode.children.length; i++) {
                    var node = parentNode.children[i];
                    if (node.obj.relativePath == relativePath)
                        return node;
                    else if (relativePath.indexOf(node.obj.relativePath + ".") == 0) {
                        var rp = relativePath;
                        if (node.obj.isArray) {
                            rp = relativePath.substring((node.obj.relativePath + ".").length);
                        }
                        var found = this._getNodeByRelativePath(node, rp);
                        if (found)
                            return found;
                    }
                }
                return null;
            },

            _getFirstArrayParentNode: function(node) {
                var parent = node.parent;
                while (parent && parent.depth >= 0) {
                    if (parent.obj && parent.obj.isArray)
                        return parent;
                    parent = parent.parent;
                }
                return null;

            },

            _getAllArrayParentNodes: function(node) {
                var result = [];
                var parent = node.parent;
                while (parent && parent.depth >= 0) {
                    if (parent.obj && parent.obj.isArray)
                        result.push(parent);
                    parent = parent.parent;
                }
                return result;
            },

            _setSelectedNodesByMappingItem: function(index) {
                if (index < 0 || index >= this.itemList.length)
                    return;
                var item = this.itemList[index];
                this._setSelectedResultNode(this._getResultNodeByPath(item.source));
                this._setSelectedUiNode(this._getDataNodeByPath(item.target));
            },

            _setSelectedMappingItemByNodes: function() {
                var toClear = false;
                if (!this.selectedResultNode || !this.selectedUiNode) {
                    toClear = true;
                }
                else {
                    var itemIndex = -1;
                    for (var i = 0; i < this.itemList.length; i++) {
                        var item = this.itemList[i];
                        if (item.source == this.selectedResultNode.obj.path && item.target == this.selectedUiNode.obj.path) {
                            itemIndex = i;
                            break;
                        }
                    }
                    if (itemIndex >= 0) {
                        toClear = false;
                        this._setSelectedMapping(itemIndex);
                    }
                    else
                        toClear = true;
                }
                if (toClear)
                    this._setSelectedMapping(-1);
            },

            _dump: function() {
                console.debug(JSON.stringify(this.getMapping(), null, "\t"));
            }

        };

        function getWritableProperties(controlType) {
            var meta = metaHub.get(controlType);
            if (!meta || !meta.props)
                return [];
            var result = [];
            var props = meta.props;
            //make the default property at the first position
            var defaultPropertyName = meta.defaultProperty || "";
            if (defaultPropertyName && props.hasOwnProperty(defaultPropertyName)) {
                var defaultProperty = props[defaultPropertyName];
                if (!defaultProperty.readOnly && !defaultProperty.isCssProperty)
                    result.push({
                        name: defaultPropertyName,
                        displayName: defaultProperty.displayName,
                        description: defaultProperty.description,
                        dataType: defaultProperty.datatype
                    });
            }
            for (var propName in props) {
                if (!props.hasOwnProperty(propName) || propName == defaultPropertyName)
                    continue;
                var prop = props[propName];
                //not include css properties
                if (prop.designable && !prop.readOnly && !prop.isCssProperty)
                    result.push({
                        name: propName,
                        displayName: prop.displayName,
                        description: prop.description,
                        dataType: prop.datatype
                    });
            }
            return result;
        }

        function showAlert(msg) {
            alert(msg);
        }

        function findItem(array, source, target) {
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (source != null && target != null) {
                    if (item.source == source && item.target == target)
                        return item;
                }
                else if (source != null && target == null) {
                    if (item.source == source)
                        return item;
                }
                else if (source == null && target != null) {
                    if (item.target == target)
                        return item;
                }
                else
                    return null;
            }
            return null;
        }


        function findItemIndex(array, source, target) {
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (source != null && target != null) {
                    if (item.source == source && item.target == target)
                        return i;
                }
                else if (source != null && target == null) {
                    if (item.source == source)
                        return i;
                }
                else if (source == null && target != null) {
                    if (item.target == target)
                        return i;
                }
                else
                    return -1;
            }
            return -1;
        }

        function findMatchedItems(array, source, target) {
            var result = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (source != null && target != null) {
                    if (item.source == source && item.target == target)
                        result.push({item: item, index: i});
                }
                else if (source != null && target == null) {
                    if (item.source == source)
                        result.push({item: item, index: i});
                }
                else if (source == null && target != null) {
                    if (item.target == target)
                        result.push({item: item, index: i});
                }
                else
                    return result;
            }
            return result;
        }


        function MappingItem(data) {
            this.source = "";
            this.target = "";
            if (data && typeof data == "object")
                util.extendObj(this, data);

            this.toString = function() {
                var text = this.source + " => ";
                if (this.target) {
                    if (this.target.indexOf(UI_DATA_ROOT_NAME + ".") == 0)
                        text += this.target.replace(UI_DATA_ROOT_NAME + ".", "{" + UI_DATA_ROOT_NAME + "}.");
                    else  if (this.target.indexOf(UI_DATA_ROOT_NAME) == 0)
                        text += this.target.replace(UI_DATA_ROOT_NAME , "{" + UI_DATA_ROOT_NAME + "}");
                    else if (this.target.indexOf(UI_PROP_ROOT_NAME + ".") == 0)
                        text += this.target.replace(UI_PROP_ROOT_NAME + ".", "{" + UI_PROP_ROOT_NAME + "}.");
                }
                return text;
            };

        }

        return MappingEditor;
    });