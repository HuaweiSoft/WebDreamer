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
define(
		[ "css!modules/propertyEditor/propertyEditor",
				"css!jslibs/yui/2.8.1/datatable/assets/skins/sam/datatable",
				"text!modules/propertyEditor/propertyEditor_tmpl.xml",
				'modelManager' ],
		function(css, datatablecss, tmpl, modelManager) {
			var init = function() {

				Arbiter.subscribe("layout/right/rendered", {
					async : true
				}, function(data) {
					var id = data.body;
					var propertyEditorView = new PropertyEditorView({
						el : $("#" + id)
					});
					propertyEditorView.render();
				});
			};

			var PropertyEditorView = Backbone.View
					.extend({

						PROPERTY_UNCHANGABLE : [ 'id', 'type', 'x', 'y' ],

						dataTable : null,

						bean : null,

						render : function() {
							this.$el.append(tmpl);
							this.subsribeMsg();
						},
						open : function() {
							Arbiter.publish("layout/right/open", null, {
								async : true
							});

						},
						close : function() {
							Arbiter.publish("layout/right/close", null, {
								async : true
							});
						},
						subsribeMsg : function() {
							var _this = this;
							Arbiter.subscribe(EVENT_PROPERTTY_EDITOR_CLOSE, {
								async : true
							}, function() {

								_this.close();
							});
							Arbiter.subscribe(EVENT_PROPERTTY_EDITOR_OPEN, {
								async : true
							}, function() {

								_this.open();
							});

							Arbiter.subscribe(EVENT_FORMDEISGNER_CONTROL_CLICK,
									function(data) {
										_this.updatePropertyPanel(data);
									});

							Arbiter.subscribe(EVENT_CONTROL_REMOVE, function(
									data) {
								if (_this.bean.id == data.id) {
									_this.clearPropertyPanel();
								}
							});

							Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE,
									function() {
										_this.clearPropertyPanel();
									});

							Arbiter.subscribe(EVENT_CONTROL_CLEAR, function() {
								_this.clearPropertyPanel();
							});
						},
						clickMenuItem : function(event) {
						},

						/**
						 * update property panel according to control id
						 * 
						 * @param {Object} object contains control id
						 */
						updatePropertyPanel : function(data) {
							var controlId = data.id;
							this.bean = modelManager.get(controlId);

							var dataJSON = {
								id : this.bean.id,
								type : this.bean.type
							};
							for ( var propName in this.bean.props) {
								dataJSON[propName] = this.bean.props[propName];
							}
							var dataXML = this.generateXMLFromJSON(dataJSON);
							var dataSource = new YAHOO.util.DataSource(dataXML);
							// dataSource.connMethodPost = true;
							dataSource.responseType = YAHOO.util.DataSource.TYPE_XML;
							dataSource.responseSchema = {
								resultNode : "property",
								fields : [ 'id', 'value' ],
							};

							var tableColumnDefs = [ {
								key : "id",
								label : "name",
								sortable : false,
								width : 100,
								resizeable : true,
							}, {
								key : 'value',
								label : 'value',
								sortable : false,
								width : 100,
								resizeable : true,
							} ];

							// display
							this.dataTable = null;
							this.dataTable = new YAHOO.widget.DataTable(
									'property_editor_body', tableColumnDefs,
									dataSource);

							// set event handler
							this.dataTable.subscribe('cellMouseoverEvent',
									this.dataTable.onEventHighlightRow);
							this.dataTable.subscribe('cellMouseoutEvent',
									this.dataTable.onEventUnhighlightRow);
							this.dataTable.subscribe('cellClickEvent',
									tableCellClicked);
							this.dataTable.subscribe('editorSaveEvent',
									tableCellSave);

							var _this = this;
							function tableCellClicked(args) {

								var cellEdited = args.target;
								if (cellEdited.cellIndex == 0) {
									return;
								}

								var record = _this.dataTable
										.getRecord(cellEdited.parentElement);
								if (!record) {
									return;
								}

								var name = record.getData().id;
								var value = record.getData().value;

								if (!name) {
									return;
								}
								for ( var i = 0; i < _this.PROPERTY_UNCHANGABLE.length; i++) {
									if (_this.PROPERTY_UNCHANGABLE[i] == name) {
										return;
									}
								}
								// TODO, now only allow change the value of
								// string type
								var cellEditor = null;
								var column = _this.dataTable.getColumn(1);
								cellEditor = new YAHOO.widget.TextboxCellEditor(
										{
											disableBtns : true
										});
								assignCellEditorToColumn(_this.dataTable,
										column, cellEditor);
								_this.dataTable.showCellEditor(cellEdited);

							}

							function tableCellSave(args) {
								var newData = args.newData;
								var oldData = args.oldData;
								if (newData == oldData) {
									return;
								}

								var record = args.editor.getRecord();
								var propName = record.getData().id;

								Arbiter.publish(
										EVENT_PROPERTTY_EDITOR_UPDATE_PROPERTY,
										{
											id : _this.bean.id,
											propName : propName,
											value : newData,
										}, {
											asyn : true,
										});
							}

							/**
							 * bind event handler to cell editor
							 */
							function assignCellEditorToColumn(dataTable,
									column, editor) {
								if (column.editor) {
									column.editor.unsubscribeAll();
								}
								column.editor = editor;
								if (editor) {
									editor.unsubscribeAll();
									editor.subscribe('showEvent',
											dataTable._onEditorShowEvent,
											dataTable, true);
									editor.subscribe("keydownEvent",
											dataTable._onEditorKeydownEvent,
											dataTable, true);
									editor.subscribe("revertEvent",
											dataTable._onEditorRevertEvent,
											dataTable, true);
									editor.subscribe("saveEvent",
											dataTable._onEditorSaveEvent,
											dataTable, true);
									editor.subscribe("cancelEvent",
											dataTable._onEditorCancelEvent,
											dataTable, true);
									editor.subscribe("blurEvent",
											dataTable._onEditorBlurEvent,
											dataTable, true);
									editor.subscribe("blockEvent",
											dataTable._onEditorBlockEvent,
											dataTable, true);
									editor.subscribe("unblockEvent",
											dataTable._onEditorUnblockEvent,
											dataTable, true);
								}
							}

						},
						
						/**
						 * generate XML object from JSON object
						 * 
						 * @param {Object} data
						 * @returns {XML} data in XML format
						 */
						generateXMLFromJSON : function(dataJSON) {
							var dataXML = "<properties>";
							for ( var propName in dataJSON) {
								dataXML += "<property>";
								dataXML += "<id>";
								dataXML += propName;
								dataXML += "</id>";
								dataXML += "<value>";
								dataXML += dataJSON[propName];
								dataXML += "</value>";
								dataXML += "</property>";
							}
							dataXML += "</properties>";
							var xmlParser = new DOMParser();
							dataXML = xmlParser.parseFromString(dataXML,
									"text/xml");
							return dataXML;
						},

						/**
						 * clear property panel
						 */
						clearPropertyPanel : function() {
							var $propertyPanelBody = $("#property_editor_body");
							$propertyPanelBody.empty();
						},

						events : {}
					});

			return {
				init : init,
			};

		});