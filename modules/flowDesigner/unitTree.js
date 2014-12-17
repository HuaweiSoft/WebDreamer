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
 * @module UnitTree, store datas for unit tree in flow page
 */
define(['util'], function (util) {

    var UnitTreeNode = function (data) {
        //copy data
        if (data && typeof data == "object") {
            for (var key in data) {
                if (!data.hasOwnProperty(key))
                    continue;
                var value = data[key];
                if (typeof value != "function")
                    this[key] = value;
            }
        }
    };
    UnitTreeNode.prototype = {
        depth: 1,
        parent: "",
        children: [],
        obj: null
    };

    /**
     *   Unit tree implemented by a hash map
     * @constructor
     */
    var UnitTree = function () {
    };

    UnitTree.prototype = {
        _map: null,
        _rootId: "",

        init: function (rootUnit) {
            if (!rootUnit || !rootUnit.id)
                throw new Error("Invalid root unit data");
            var rootId = rootUnit.id;
            var rootNode = new UnitTreeNode({
                depth: 1,
                parent: "",
                children: [],
                obj: rootUnit
            });
            this._map = {};
            this._map[rootId] = rootNode;
            this._rootId = rootId;
        },

        destroy: function () {
            this._map = null;
            this._rootId = "";
        },

        load: function (mapData) {
            if (typeof mapData != "object")
                return false;
            if (!this._validate(mapData)) {
                console.error("Data errors in unit tree: %o", mapData);
                return false;
            }
            this._map = {};
            var rootId = "";
            for (var id in mapData) {
                if (!mapData.hasOwnProperty(id))
                    continue;
                var node = mapData[id];
                this._map[id] = node;
                if (!node.parent && node.depth ==1 && !rootId)
                    rootId = id;
            }
            this._rootId = rootId;
            return true;
        },

        _validate: function (mapData) {
            var errors = [];
            for (var id in mapData) {
                if (!mapData.hasOwnProperty(id))
                    continue;
                var node = mapData[id];
                if (node.parent) {
                    var parentNode = mapData[node.parent];
                    if (!parentNode || typeof parentNode != "object") {
                        errors.push("Parent id '" + node.parent + "' of node '" + id + "' is invalid.");
                    } else if (!util.inArray(parentNode.children, id)) {
                        errors.push("Node '" + id + "' doesn't exist in children data of its' parent node '" + node.parent + "'.");
                    } else if (parentNode.depth + 1 != node.depth ) {
                        errors.push("Error depth between child node '" + id + "' and parent node '" + node.parent + "'.");
                    }
                }
                var children = node.children;
                if (node.children) {
                    for (var i = 0; i < node.children.length; i++) {
                        var childId = node.children[i];
                        if (!childId || !mapData.hasOwnProperty(childId) || typeof mapData[childId] != "object") {
                            errors.push("Child node id '" + childId + "' of parent node '" + id + "' doesn't exist in the unit tree.")
                        }
                    }
                }
            }
            if (errors.length > 0) {
                console.debug("There are %s errors in unit tree map '%o':\n %s", errors.length, mapData, errors.join("\n"));
                return false;
            }
            else
                return true;
        },

        validate: function () {
            return this._validate(this._map) == true;
        },

        get: function (id) {
            if (!id || !this._map.hasOwnProperty(id))
                return null;
            var node = this._map[id];
            if (node && typeof node == "object")
                return node;
            else
                return null;
        },

        getRoot: function () {
            return this._map[this._rootId];
        },

        /**
         * add a new unit into the unit tree
         * @param unit {Object} the new added unit
         * @param parentId {String} parent unit id
         * @returns {Boolean}
         */
        add: function (unit, parentId) {
            var id = unit.id;
            if (!id) {
                console.error("Unit id must not be null, unit: %o", unit);
                return false;
            }
            if (this.get(id) != null) {
                console.error("Unit id %s has been in tree, id:", id);
                return false;
            }
            var parentNode = this.get(parentId);
            if (!parentNode) {
                console.error("Parent unit id [=%s] is not valid. unit: %o", parentId);
                return false;
            }
            if (util.indexOfArray(parentNode.children, id) >= 0) {
                console.error("Id %s has been in children array of node %s, some error in current unit tree: %o", id, parentId, this._map);
                return false;
            }
            var node = new UnitTreeNode({
                depth: parentNode.depth + 1,
                parent: parentId,
                children: [],
                obj: unit
            });
            this._map[id] = node;
            parentNode.children = parentNode.children || [];
            parentNode.children.push(id);
            unit.parentId = parentId;
            return true;
        },

        /**
         *  remove node for unit tree
         * @param id  {String} unit id
         * @return {Boolean}
         */
        remove: function (id) {
            var node = this.get(id);
            if (!node || node.id == this._rootId)
                return false;
            var parentId = node.parent;
            this._simpleRemove(id);
            var parentNode = this.get(parentId);
            if (parentNode && parentNode.children) {
                var index = util.indexOfArray(parentNode.children, id);
                if (index >= 0)
                    parentNode.children.splice(index, 1);
            }
            node.parent = "";
            return true;
        },

        _simpleRemove: function (id) {
            var node = this._map[id];
            if (!node)
                return;
            delete  this._map[id];
            var children = node.children;
            if (children && children.length > 0) {
                for (var i = 0; i < children.length; i++) {
                    this._simpleRemove(children[i]);
                }
            }
            node.parent = "";
        },

        getSiblingIndex: function (id) {
            var node = this.get(id);
            if (!node)
                return -1;
            if (!node.parent)
                return 0;
            var parentNode = this.get(node.parent);
            if (!parentNode)
                return -1;
            return util.indexOfArray(parentNode.children, id);
        },

        changeSiblingIndex: function(id, newSiblingIndex){
            var node = this.get(id);
            if (!node || !node.parent)
                return false;
            var parentNode = this.get(node.parent);
            if (!parentNode || !parentNode.children || newSiblingIndex>=parentNode.children.length)
                return false;
            var children = parentNode.children;
            var index =   util.indexOfArray(children, id);
            if(index== -4)
            return false;
            if (newSiblingIndex > index) {
                for (var i = index; i < newSiblingIndex; i++) {
                    children[i] = children[i + 1];
                }
                children[newSiblingIndex] = id;
            } else if (newSiblingIndex < index) {
                for (var i = index; i > newSiblingIndex; i--) {
                    children[i] = children[i - 1];
                }
                children[newSiblingIndex] = id;
            }
            return true;
        },

        isChildOf: function (childId, parentId) {
            var parentNode = this.get(parentId);
            if (!parentNode)
                return false;
            return util.indexOfArray(parentNode.children, childId) >= 0;
        },

        count: function () {
            var n = 0;
            for (var key in this._map) {
                if (!this._map.hasOwnProperty(key))
                    continue;
                var value = this._map[key];
                if (value && typeof value == "object")
                    n++;
            }
            return n;
        },

        getData: function () {
            return this._map || {};
        },

        forEach: function (callback, thisObj) {
            var root = this.getRoot();
            if (!this._rootId)
                return true;
            var interrupted = false;
            if (thisObj)
                interrupted = callback.call(thisObj, this._rootId, root, 0);
            else
                interrupted = callback(this._rootId, root, 0);
            if (interrupted == true)
                return true;
            return this.forEachChildren(this._rootId, callback, thisObj);
        },

        forEachChildren: function (id, callback, thisObj) {
            var node = this.get(id);
            if (!node)
                return false;
            var interrupted = false;
            for (var i = 0; i < node.children.length; i++) {
                var childId = node.children[i];
                var childNode = this.get(childId);
                if (thisObj)
                    interrupted = callback.call(thisObj, childId, childNode, i);
                else
                    interrupted = callback(childId, childNode, i);
                if (interrupted == true)
                    return true;
                interrupted = this.forEachChildren(childId, callback, thisObj);
                if (interrupted == true)
                    return true;
            }
            return interrupted || false;
        },

        forEachDisorderly: function (callback, thisObj) {
            var interrupted;
            for (var key in this._map) {
                if (!this._map.hasOwnProperty(key))
                    continue;
                if (thisObj)
                    interrupted = callback.call(thisObj, key, this._map[key]);
                else
                    interrupted = callback(key, this._map[key]);
                if (interrupted == true)
                    break;
            }
            return interrupted;
        },

        _dump: function () {
            console.debug("Unit Tree object: %o ", this._map);
            console.debug("Unit Tree : %s", JSON.stringify(this._map, null, "\t"));
        }
    };


    return UnitTree;
});