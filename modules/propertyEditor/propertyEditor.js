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
 * a panel for configuring properties of controls.
 */
define([ "css!modules/propertyEditor/propertyEditor", "css!jslibs/yui/2.8.1/datatable/assets/skins/sam/datatable",
    "text!modules/propertyEditor/propertyEditor_tmpl.xml", 'modelManager' , 'metaHub', "util"], function(css, datatablecss, tmpl, modelManager, metaHub, util) {
    var init = function() {

        Arbiter.subscribe("layout/right/rendered", {
            async: true
        }, function(data) {
            var id = data.body;
            var propertyEditorView = new PropertyEditorView({
                el: $("#" + id)
            });
            propertyEditorView.render();
        });
    };

    var PropertyEditorView = Backbone.View.extend({

        PROPERTY_UNCHANGABLE: [ 'id', 'type' ],

        dataTable: null,

        bean: null,

        triggerId: "",
        currentSrcName: "",

        render: function() {
            this.$el.append(tmpl);
            this.subscribeMsg();
        },
        open: function() {
            Arbiter.publish("layout/right/open", null, {
                async: true
            });

        },
        close: function() {
            Arbiter.publish("layout/right/close", null, {
                async: true
            });
        },
        subscribeMsg: function() {
            var _this = this;
            Arbiter.subscribe(EVENT_PROPERTTY_EDITOR_CLOSE, {
                async: true
            }, function() {

                _this.close();
            });
            Arbiter.subscribe(EVENT_PROPERTTY_EDITOR_OPEN, {
                async: true
            }, function() {

                _this.open();
            });

            Arbiter.subscribe(EVENT_FORMDEISGNER_CONTROL_CLICK, function(data) {

                if (data.id && data.id != "") {
                    _this.updatePropertyPanel(data);
                }
                else {
                    _this.clearPropertyPanel();
                }
            });

            Arbiter.subscribe(EVENT_CONTROL_REMOVE, function(data) {
                if (_this.bean && _this.bean.id == data.id) {
                    _this.clearPropertyPanel();
                }
            });

            Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE, function(data) {
                if(!_this.bean)
                    return;
                var checked = false;
                for (var i = 0; i < data.removedBeans.length; i++) {
                    if (data.removedBeans[i].id == _this.bean.id) {
                        checked = true;
                        break;
                    }
                }
                if (checked)
                    _this.clearPropertyPanel();
            });

            Arbiter.subscribe(EVENT_CONTROL_CLEAR, function() {
                _this.clearPropertyPanel();
            });

            Arbiter.subscribe(EVENT_IMAGES_WALL_PUBLISH_SELECTED_IMAGE, function(data) {
                if (data && data.image && data.triggerId && data.triggerId == _this.triggerId
                    && _this.currentSrcName && _this.bean) {
                    Arbiter.publish(EVENT_PROPERTTY_EDITOR_UPDATE_PROPERTY, {
                        id: _this.bean.id,
                        propName: _this.currentSrcName,
                        value: reversePath(data.image)
                    }, {
                        async: true
                    });
                }
            });
        },

        clickMenuItem: function(event) {
        },

        /**
         * update property panel according to control id
         *
         * @param {Object} object contains control id
         */
        updatePropertyPanel: function(data) {
            if (data == "") {
                this.clearPropertyPanel();
            }
            if (this.dataTable) {
                this.dataTable.cancelCellEditor();
                this.dataTable.destroy();
                this.dataTable = null;
            }
            var controlId = data.id;
            this.bean = modelManager.get(controlId);
            if(!this.bean)
                return;
            var dataJSON = {
                id: this.bean.id,
                type: util.getTypeName(this.bean.type)
            };

            var controlMeta = metaHub.get(this.bean.type);
            if (controlMeta == null) {
                return;
            }

            for (var propName in this.bean.props) {
                if (propName == "id" || propName == "type")
                    continue;
                if (controlMeta.props.hasOwnProperty(propName) && controlMeta.props[propName].browsable) {
                    var value = this.bean.props[propName];
                    if (value != null && typeof value == "object")
                        dataJSON[propName] = JSON.stringify(value);
                    else
                        dataJSON[propName] = value;
                }
            }
            var dataXML = this.generateXMLFromJSON(dataJSON);
            var dataSource = new YAHOO.util.DataSource(dataXML);
            // dataSource.connMethodPost = true;
            dataSource.responseType = YAHOO.util.DataSource.TYPE_XML;
            dataSource.responseSchema = {
                resultNode: "property",
                fields: [ 'id', 'value' ]
            };

            var tableColumnDefs = [
                {
                    key: "id",
                    label: "name",
                    sortable: true,
                    width: 100,
                    resizeable: true
                },
                {
                    key: 'value',
                    label: 'value',
                    sortable: false,
                    width: 198,
                    resizeable: true
                }
            ];

            // display

            this.dataTable = new YAHOO.widget.DataTable('property_editor_body', tableColumnDefs, dataSource);

            // set event handler
            var _this = this;
            this.dataTable.subscribe('cellMouseoverEvent', this.dataTable.onEventHighlightRow);
            this.dataTable.subscribe('cellMouseoutEvent', this.dataTable.onEventUnhighlightRow);
            this.dataTable.subscribe('cellClickEvent', function(args) {
                _this.tableCellClicked(args);
            });
            this.dataTable.subscribe('editorSaveEvent', function(args) {
                   var toSave =   _this.tableCellSave(args);
                   if(!toSave){
                       var editor = args.editor;
                       var record = editor.getRecord();
                       $(editor.getTdEl().children[0]).text( args.oldData);
                       record.setData("value", args.oldData);
                       editor.cancel();
                   }
                }
            );
        },

        tableCellClicked: function(args) {
            if (!this.bean)
                return;
            var controlMeta = metaHub.get(this.bean.type);
            if (!controlMeta) {
                return;
            }

            var cellEdited = args.target;
            if (cellEdited.cellIndex == 0) {
                return;
            }

            var record = this.dataTable.getRecord(cellEdited.parentElement);
            if (!record) {
                return;
            }

            var propName = record.getData().id;
            var value = record.getData().value;

            if (!propName) {
                return;
            }

            var propMeta = controlMeta.props[propName];
            if (propMeta == null || propMeta.readOnly) {
                return;
            }

             cellEditor = null;
            var column = this.dataTable.getColumn(1);
            var cellEditor = this.getCellEditor(propMeta);

            if (cellEditor) {
                this.assignCellEditorToColumn(this.dataTable, column, cellEditor);
                this.dataTable.showCellEditor(cellEdited);
            }
            else {
                if (propMeta.datatype == "ImageUrl") {
                    var triggerId = "properEditor_" + util.uuid(8);
                    this.triggerId = triggerId;
                    this.currentSrcName = propName;
                    Arbiter.publish(EVENT_IMAGES_WALL_SUBSCRIBE_OPEN, {
                        triggerId: triggerId,
                        src: convertPath(value)
                    });
                }
            }
        },

        tableCellSave: function(args) {
            var newData = args.newData;
            var oldData = args.oldData;
            if (newData == oldData) {
                return false;
            }
            var record = args.editor.getRecord();
            var propName = record.getData().id;
            var propValue = newData;

            if (!this.bean || !this.bean.props || !this.bean.props.hasOwnProperty(propName))
                return false;
            var controlMeta = metaHub.get(this.bean.type);
            if (controlMeta && propName in controlMeta.props) {
                var propInfo = controlMeta.props[propName];
                if (typeof newData == "string") {
                    if (propInfo.datatype == DataType.Boolean  || propInfo.datatype == "Bool") {
                        propValue = parseBoolean(newData);
                    }
                    else if (propInfo.datatype == DataType.Int) {
                        propValue = parseInt(newData);
                    }
                    else if (propInfo.datatype == DataType.Float) {
                        propValue = parseFloat(newData);
                    }else if(propInfo.datatype == DataType.Object){
                        var obj = null;
                        try{
                            var obj = JSON.parse(newData);
                        }catch (e){
                            console.debug("Value input is not valid json content: \n%s", newData);
                            return false;
                        }
                        if( typeof obj != "object")
                            return false;
                        propValue = obj;
                    }
                }
            }
            Arbiter.publish(EVENT_PROPERTTY_EDITOR_UPDATE_PROPERTY, {
                id: this.bean.id,
                propName: propName,
                value: propValue
            }, {
                async: true
            });
            return true;
        },

        /**
         * bind event handler to cell editor
         */
        assignCellEditorToColumn: function(dataTable, column, editor) {
            if (column.editor) {
                column.editor.unsubscribeAll();
            }
            column.editor = editor;
            if (editor) {
                editor.unsubscribeAll();
                editor.subscribe('showEvent', dataTable._onEditorShowEvent, dataTable, true);
                editor.subscribe("keydownEvent", dataTable._onEditorKeydownEvent, dataTable, true);
                editor.subscribe("revertEvent", dataTable._onEditorRevertEvent, dataTable, true);
                editor.subscribe("saveEvent", dataTable._onEditorSaveEvent, dataTable, true);
                editor.subscribe("cancelEvent", dataTable._onEditorCancelEvent, dataTable, true);
                editor.subscribe("blurEvent", dataTable._onEditorBlurEvent, dataTable, true);
                editor.subscribe("blockEvent", dataTable._onEditorBlockEvent, dataTable, true);
                editor.subscribe("unblockEvent", dataTable._onEditorUnblockEvent, dataTable, true);
            }
        },

        /**
         * generate XML object from JSON object
         *
         * @param {Object} data
         * @returns {Document} data in XML format
         */
        generateXMLFromJSON: function(dataJSON) {
            var dataXML = "<properties>";
            for (var propName in dataJSON) {
                dataXML += "<property><id>" + propName + "</id>";
                dataXML += "<value><![CDATA[" + dataJSON[propName] + "]]></value></property>";
            }
            dataXML += "</properties>";
            var xmlParser = new DOMParser();
            return xmlParser.parseFromString(dataXML, "text/xml");
        },

        /**
         * get cell editor of table according to property
         * @param {Object} property
         * @return {YAHOO.widget.CellEditor} cell editor
         */
        getCellEditor: function(prop) {
            var datatype = prop.datatype;
            var cellEditor = null;
            switch (datatype) {
                case 'Boolean':
                    cellEditor = new YAHOO.widget.RadioCellEditor({
                        radioOptions: [ "true", "false" ],
                        disableBtns: true
                    });
                    break;
                case 'String':
                case 'Int':
                case 'Float':
                case 'Number':
                    if (prop.valueRange && prop.valueRange instanceof Array) {
                        cellEditor = new YAHOO.widget.DropdownCellEditor({
                            dropdownOptions: prop.valueRange,
                            disableBtns: true
                        });
                    }
                    else {
                        cellEditor = new YAHOO.widget.TextboxCellEditor({
                            disableBtns: true
                        });
                    }
                    break;
                case DataType.MString:
                    cellEditor = new YAHOO.widget.TextareaCellEditor({disableBtns: false});
                    break;
                case  DataType.Date:
                    cellEditor = new YAHOO.widget.DateCellEditor({disableBtns: true});
                    break;
                /* case 'Theme':
                 break;*/
                case "ImageUrl":
                    break;
                case DataType.Object:
                    cellEditor = new YAHOO.widget.TextareaCellEditor({disableBtns: false});
                    break;
                default :
                    cellEditor = new YAHOO.widget.TextboxCellEditor({
                        disableBtns: true
                    });
                    break;
            }

            return cellEditor;
        },

        /**
         * clear property panel
         */
        clearPropertyPanel: function() {
            if(this.dataTable){
                this.dataTable.cancelCellEditor();
                this.dataTable.destroy();
                this.dataTable = null;
            }
            this.bean = null;
            var $propertyPanelBody = $("#property_editor_body");
            $propertyPanelBody.empty();
        },

        events: {}
    });

    return {
        init: init
    };

});