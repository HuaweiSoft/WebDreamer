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
 * Define the controls tree view base on YUI tree view to display the controls in the left tree view container 
 * The structure as follow:
 *   -root
 *   --page
 *   ---controls
 * Update the tree view base on the model from modelMamge
 */
define(
        [ "css!jslibs/yui/2.8.1/treeview/assets/skins/sam/treeview" ],
        function(treeviewCss) {
            var init = function() {

                Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_RENDERED, {
                    async: true
                }, function(data) {

                    /**
                     * Instance tree view and render
                     */
                    var view = new OutLineTreeView({
                        el: $("#" + data.id)
                    });
                    view.render();
                });

            };

            /**
             * Define the outline tree view class in backbone model
             */
            var OutLineTreeView = Backbone.View
                    .extend({
                        _controls: [],
                        _imageBase: "modules/outline/images/",
                        _treeView: null,
                        _projectNode: null,
                        _controlNode: null,

                        /**
                         * Render controls tree view
                         */
                        render: function() {
                            if (this._treeView) {
                                this._treeView.destroy();
                            }
                            this._treeView = new YAHOO.widget.TreeView(this.$el.attr("id"));
                            var root = this._treeView.getRoot();
                            var pNode = new YAHOO.widget.TextNode({
                                label: '',
                                expanded: true
                            }, root);
                            this._controlNode = new YAHOO.widget.TextNode(
                                    {
                                        label: '<img src="'
                                                + this._imageBase
                                                + 'controls.png" class="control_icon" style="width:20px;height:20px;margin-left:-3px" align="absmiddle"> Controls',
                                        expanded: true
                                    }, pNode);

                            this._projectNode = pNode;
                            this._treeView.render();
                            this._addPage(1);
                            this._treeView.subscribe("clickEvent", this._clickNode);
                            this._treeView.expandAll();
                            this._subscribe();

                        },

                        /**
                         *Generate the node label
                         *
                         *@param {String} type,the control type for example UI.TextBox
                         *@Param {String} text,the control name
                         *@return{String} the text of node label 
                         */
                        _buildNodeLabel: function(type, text) {
                            var label = "";
                            if (type == "PAGE") {
                                label = '<img src="' + this._imageBase
                                        + 'page.png" align="absmiddle" class="control_icon">' + text;
                            } else { // control
                                var control = this._getControlMetadata(type);
                                if(!control)
                                    return "";
                                var imagePath = control.outlineIcon;

                                label = '<img src="' + imagePath + '" align="absmiddle" class="control_icon">' + text;
                            }
                            return label;
                        },

                        /**
                         * Get the page tree node 
                         * 
                         * @param {Number} pageNo,page index first page number is 1
                         * @return {YAHOO.widget.TextNode} 
                         */
                        _getPageNode: function(pageNo) {
                            var node;
                            var children = this._controlNode.children;
                            for ( var i = 0; i < children.length; i++) {
                                node = children[i];
                                if (node.attachPageNo == pageNo) {
                                    return node;
                                }
                            }
                            return null;
                        },

                        /**
                         *Selected the specified page number 
                         *
                         *@param {Number} pageNo
                         */
                        _toPageNode: function(pageNo) {
                            var pageNode = this._getPageNode(pageNo);
                            pageNode.focus();
                        },

                        /**
                         *Add new page to tree view
                         *
                         *@param {Number} pageNo
                         */
                        _addPage: function(pageNo) {
                            var label = this._buildNodeLabel("PAGE", "Page" + pageNo);
                            var node = new YAHOO.widget.TextNode({
                                label: label,
                                title: "Page " + pageNo,
                                expanded: true
                            }, this._controlNode);
                            node.attachPageNo = pageNo;
                            node.parent.parent.refresh();
                            node.focus();
                            return node;
                        },

                        /**
                         *Remove the specified page from tree view
                         *
                         *@param {Number} pageNo
                         */
                        _removePage: function(pageNo) {

                            var pageNode = this._treeView.getNodeByProperty("attachPageNo", pageNo);

                            var pageNumber = this._controlNode.children.length;

                            this._treeView.removeNode(pageNode, true)
                            if (parseInt(pageNo, 10) < pageNumber) {
                                var pages = this._controlNode.children;
                                for ( var i = 0; i < pages.length; i++) {
                                    var nextnode = pages[i];
                                    if (nextnode.attachPageNo > pageNo) {
                                        nextnode.attachPageNo--;
                                        nextnode.label = this._buildNodeLabel("PAGE", "Page" + nextnode.attachPageNo);
                                        nextnode.title = "Page" + nextnode.attachPageNo;
                                        nextnode.refresh();
                                    }
                                }
                            }

                        },

                        /**
                         * Add new control to tree view base on control Bean detail see ControlBean.js
                         * 
                         * @param {JSONObject} data, {bean:Object of Bean}
                         */
                        _addControl: function(data) {
                            var type = data.bean.type;
                            var name = data.bean.id;
                            var pageNode = this._treeView.getNodeByProperty("attachPageNo", data.bean.pageNo);
                            if (!pageNode)
                                return null;

                            var label = this._buildNodeLabel(type, name);
                            var node = new YAHOO.widget.TextNode({
                                label: label,
                                title: name,
                                expanded: true
                            }, pageNode, true);
                            node.controlId = name;
                            node.pageNo = data.bean.pageNo;
                            pageNode.parent.refresh();
                            pageNode.expandAll();
                            return node;
                        },

                        _removeControl: function(controlID) {
                            var controlNode = this._treeView.getNodeByProperty("controlId", controlID);
                            if (controlNode) {
                                this._treeView.removeNode(controlNode, true)
                            }
                        },

                        /**
                         *Get the meta data  declared in  the type control designer javascript
                         *
                         *@param {String} type, the type of the control for example UI.TextBox
                         */
                        _getControlMetadata: function(type) {
                            for ( var i = 0; i < this._controls.length; i++) {
                                var control = this._controls[i];
                                if (control.name == type) {
                                    return control;
                                }
                            }
                            return null;

                        },
                        /**
                         * Listener the click node event to notify formDesigner and propertyEditor module to process
                         * 
                         * @param {Event} e
                         */
                        _clickNode: function(e) {

                            var node = e.node;
                            if (node.attachPageNo && node.attachPageNo > 0) {
                                Arbiter.publish(EVENT_OUTLINE_PUBLISH_CLICK_PAGE, {
                                    page: node.attachPageNo
                                }, {
                                    async: true
                                });
                            } else if (node.controlId) {
                                Arbiter.publish(EVENT_OUTLINE_PUBLISH_CLICK_CONTROL, {
                                    id: node.controlId,
                                    pageNo: node.pageNo
                                }, {
                                    async: true
                                });
                            }

                        },

                        _refresh: function(model) {
                            this._treeView.removeChildren(this._controlNode);
                            var formModel = model || {
                                "pageNumber": 1,
                                "beans": []
                            };
                            for ( var i = 1; i <= formModel.pageNumber; i++) {
                                this._addPage(i);
                            }
                            for ( var p = 0; p < formModel.beans.length; p++) {
                                this._addControl({
                                    "bean": formModel.beans[p]
                                });
                            }
                        },
                        _collapseAll: function() {
                            if (this._treeView)
                                this._treeView.collapseAll();
                        },

                        _expandAll: function() {
                            if (this._treeView)
                                this._treeView.expandAll();
                        },

                        /**
                         * Subscribe message from other modules to operate the tree view
                         */
                        _subscribe: function() {
                            var _this = this;
                            Arbiter.subscribe(EVENT_CONTROLS_LOAD_METADATA, {
                                async: true
                            }, function(data) {
                                _this._controls = data.controls;

                            });
                            Arbiter.subscribe(EVENT_CONTROL_LOAD, {
                                async: true
                            }, function(data) {
                                _this._refresh(data);
                            });
                            Arbiter.subscribe(EVENT_CONTROL_ADD_PAGE, {
                                async: true
                            }, function(data) {
                                _this._addPage(data.newPageNo);
                            });
                            Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE, {
                                async: true
                            }, function(data) {
                                _this._removePage(data.pageNo);
                            });
                            Arbiter.subscribe(EVENT_CONTROL_ADD, {
                                async: true
                            }, function(data) {
                                _this._addControl(data);
                            });
                            Arbiter.subscribe(EVENT_FORMDESIGNER_PAGEMANAGER_SWITCH_PAGE, {
                                async: true
                            }, function(data) {
                                _this._toPageNode(data.page);
                            });
                            Arbiter.subscribe(EVENT_CONTROL_REMOVE, function(data) {
                                _this._removeControl(data.id);
                            });

                            Arbiter.subscribe(EVENT_CONTROL_CLEAR, function() {
                                _this._refresh();
                            });

                        }

                    });
            return {
                init: init
            };

        });