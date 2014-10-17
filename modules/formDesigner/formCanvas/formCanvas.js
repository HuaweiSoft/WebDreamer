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
 * canvas for design and display UI of apps 
 */
define(
		[ "css!modules/formDesigner/formCanvas/formCanvas",
				"text!modules/formDesigner/formCanvas/model.json",
				"text!modules/formDesigner/formCanvas/formCanvas_tmpl.xml", "controlBean","util" ],
		function(css, model, tmpl, Bean, util) {

			var init = function() {

				Arbiter.subscribe("layout/center/rendered", {
					async : true
				}, function(data) {
					var view = new FormDesignerView({
						el : $("#" + data.body)
					});
					view.render();
					view.pushlishMsg();
					view.initSubscription();
				});

			};
			var FormDesignerView = Backbone.View
					.extend({
						
						PROPERTIES_STYLE_ABOUT: ['margin', 'left', 'top', 'width', 'height', 'zIndex', 'visibility'],
						
						controls : [],
						currentSelectedControlId : "",

						// record the position and index of dragged control
						// before dragging
						draggedControlPos : null,
						draggedControlIndex : -1,
						
						//page management about, page no ranges from
						curPageIndex: 1,   //current page showed
						pageIdNumber: 1,   //page id, auto increment
                        _isFlowDesignerOpened: false,

						render : function() {
							this.$el.append(tmpl);
						},
						pushlishMsg : function() {
							Arbiter.publish("layout/center/open", null, {
								async : true
							});
						},

						/**
						 * init subscription
						 */
						initSubscription : function() {
							var _this = this;
							
							// toolbar
							Arbiter.subscribe(EVENT_TOOLBAR_DRAG_DROP, function(data) {
								_this.controlDropFromToolbar(data);
							});
							Arbiter.subscribe(EVENT_TOOLBAR_PUBLISH_DELETE, function() {
								_this.toolbarDelete();
							});
							
							// control
							Arbiter.subscribe(EVENT_CONTROL_ADD,
									function(data) {
										_this.controlAdd(data);
									});

							Arbiter.subscribe(EVENT_CONTROL_REMOVE, function(
									data) {
								_this.controlRemove(data);
							});

							Arbiter.subscribe(EVENT_CONTROL_RENAME, function(
									data) {
								_this.controlRename(data);
							});

							Arbiter.subscribe(EVENT_CONTROL_UPDATE, function(
									data) {
								_this.controlUpdate(data);
							});

							// page
							Arbiter.subscribe(EVENT_CONTROL_ADD_PAGE, function(data) {
								_this.pageAdd(data);
							});
							
							Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE, function(data) {
								_this.pageRemove(data);
							});
							
							Arbiter.subscribe(EVENT_FORMDESIGNER_PAGEMANAGER_SWITCH_PAGE, function(data) {
								_this.pageSwitch(data);
							});

							// outline
							Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_CLICK_PAGE, function(data) {
								_this.outlinePageClick(data);
							});
							
							Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_CLICK_CONTROL, function(data){
								_this.outlineControlClick(data);
							});
							
							//configurator
							Arbiter.subscribe(EVENT_PROPERTTY_EDITOR_UPDATE_PROPERTY, function(data) {
								_this.updateProperty(data);
							});
							
							//clear
							Arbiter.subscribe(EVENT_CONTROL_CLEAR, function() {
								_this.controlClear();
							});
                            Arbiter.subscribe(EVENT_FLOW_OPEN, function(){
                                _this._isFlowDesignerOpened = true;
                            });
                            Arbiter.subscribe(EVENT_FLOW_CLOSE, function(){
                                _this._isFlowDesignerOpened = false;
                            });
						},

						/**
						 * generate control of type {UI.control} with id defined by Bean 
						 * 
						 * @param {Bean} bean
						 */
						generateControl : function(bean) {
							var _this = this;

							var controlType = bean.type;
							var control, designer;
							try {
								control = eval(String.format('new {0}()', controlType));
							} catch (e) {
								console.error("Failed to create new %s control: %o.", controlType, e);
								return;
							}
							control.id = bean.id;
							if (bean.parentId == "") {
								control.setContainer('controlContainer');
							} else {
								// TODO, set the parent of new control
							}

							designer = control.designer;
							if (!designer || !(designer instanceof UI.Designer)) {
								try {
									designer = eval(String.format('new {0}(control)', control.designerType));
								} catch (e) {
									console.error("Failed to create new %s designer: %o", control.designerType, e);
									return;
								}
							}
							designer = designer || (new UI.Designer(control));
							designer.objIndex = control.id;
							control.designer = designer;
							designer.render();
							
							// add control to array
							this.controls.push(control);

							// add event handler
							var $el = $(control.element);
							if (/* !(control instanceof UI.Table) */true) {
								// for controls that not belong to container
								$el.on('click', function(event) {
									_this.controlClicked(control.id);
									event.stopPropagation();
								});
								$el.on('dblclick', function(event) {
									_this.controlDblClicked(control.id);
									event.stopPropagation();
								});
								$el.on('keydown', function(event) {
								});
								$el.on('keypress', function(event) {
								});
							} else {

							}

							this.setDragEventHandler(control.id);

						},
						
						/**
						 * update control properties and broadcast the changes
						 * 
						 * @param {String} control id used to get control instance
						 */
						updateControlProperties: function(controlId) {
							var control = this.getControlByControlId(controlId);
							if(control == null) {
								return;
							}
							
							// set customized properties and publish message, exclude the original properties
							var designer = control.designer;
							var props = designer.meta.props;
							var commonProperties = window.MetaHub.get("UI.control").props;
							for (var pname in props) {
								if(!props.hasOwnProperty(pname)) {
									continue;
								}
								var value = props[pname].defaultValue;
								if (value != null) {
									designer.setPropValue(pname, value);
								}
								var browseable = props[pname].browseable;
								if(!commonProperties.hasOwnProperty(pname) && browseable) {
									value = control[pname];
									Arbiter.publish(EVENT_MODEL_UPDATE, {
										id: controlId,
										propName: pname,
										propValue: (value == null ? "" : value),
									}, {
										asyn: true,
									});
								}
							}
							
							// set common properties and publish message
							var controlWidth = designer.defaultWidth ? designer.defaultWidth + "px": "98%";
							var controlHeight = designer.defaultHeight ? designer.defaultHeight + "px": "20px";
	
							var controlMargin = "0 auto 5px auto";
							if (control.autowidth) {
								controlWidth = "98%";
								controlMargin = "0 1px 5px 2px";
							}
							
							var commonStyle = {
								position : "relative",
								zIndex : "1",
								left : "auto",
								top : "auto",
								width : controlWidth,
								height : controlHeight,
								margin : controlMargin
							};
							control.setStyle(commonStyle);
					
							for(var cs in commonStyle) {
								//left & top are replaced by x & y
								if(cs == 'left' || cs == 'top') {
									continue;
								}
								if(commonStyle.hasOwnProperty(cs)) {
									Arbiter.publish(EVENT_MODEL_UPDATE, {
										id: controlId,
										propName: cs,
										propValue: commonStyle[cs],
									}, {
										asyn: true
									});
								}
							}

							// Header and Footer, not use now.
							if (control.autowidth && control.Header) {
								control.setStyle({
									width : "100%",
									margin : "0",
									"z-index" : "9999",
									"margin-bottom" : "5px"
								});
							}
							if (control.autowidth && control.Footer) {
								control.setStyle({
									width : "100%",
									"z-index" : "9999",
									margin : "0"
								});
							}
						},
						
						/**
						 * insert the control to certain index of the form
						 * 
						 * @param {String} control id
						 * @param {Number} index
						 * @param {Number} page number
						 */
						insertControlToIndex : function(controlId, index, pageNo) {
							var $control = $("#" + controlId);
							var pageId = this.getPageIdByIndex(pageNo);
							var $controls = this.getControlsByPageId(pageId);
							var $page = $("#" + pageId);

							if (index == 0) {
								$page.prepend($control);
								return;
							}
							if (index == $controls.length) {
								$page.append($control);
								return;
							}
							var $nextControl = $($controls[index]);
							if ($nextControl.attr('id') == $control.attr('id')) {
								$nextControl = $($controls[index + 1]);
							}
							$control.insertBefore($nextControl);
						},

						/**
						 * calculate the index of control(new or existing) in
						 * control container according to coordinate.
						 * 
						 * @param {Number} left relative to the canvas
						 * @param {Number} top relative to the canvas
						 * @returns {Number} index
						 */
						calculateIndex : function(left, top) {
							var index;
							//var $controls = $("#controlContainer > [id!=controlSelected]");
							var pageId = this.getPageIdByIndex(this.curPageIndex);
							var $controls = this.getControlsByPageId(pageId);

							if (top <= 0) {
								return 0;
							}

							var i = 0;
							for (; i < $controls.length; i++) {
								var $curControl = $($controls[i]);
								var curControlId = $curControl.attr('id');

								var pos = $curControl.position();
								var curLeft = pos.left;
								var curTop = pos.top;
								var curBottom = pos.top
										+ $curControl.outerHeight();

								if (top >= curTop && top <= curBottom) {
									index = i + 1;
									break;
								}
							}

							if (i == $controls.length) {
								index = i;
							}

							return index;
						},
						
						/**
						 * get index of control by control id, -1 for not found.
						 * 
						 * @param {String} control id
						 * @returns {Number} index
						 */
						getControlIndex : function(controlId) {
							var pageId = this.getPageIdByIndex(this.curPageIndex);
							var $controls = this.getControlsByPageId(pageId);
							for ( var i = 0; i < $controls.length; i++) {
								var $curControl = $($controls[i]);
								if (controlId == $curControl.attr('id')) {
									return i;
								}
							}
							return -1;
						},
						/**
						 * get index of control by position and control id
						 * 
						 * @param {Number} left
						 * @param {Number} top
						 * @param {String} control id
						 * @returns {Number} index
						 */
						getControlIndexAfterDragged : function(left, top,
								controlId) {
							var index;
							var $control = $("#" + controlId);
							//var $controls = $("#controlContainer > [id!=controlSelected]");
							var pageId = this.getPageIdByIndex(this.curPageIndex);
							var $controls = this.getControlsByPageId(pageId);

							if (top <= 0) {
								return 0;
							}

							var i = 0;
							for (; i < $controls.length; i++) {
								var $curControl = $($controls[i]);
								var curControlId = $curControl.attr('id');
								if (curControlId == controlId) {
									if (top >= this.draggedControlPos.top
											&& top <= (this.draggedControlPos.top + $control
													.outerHeight())) {
										index = i;
										break;
									}
									continue;
								}

								var pos = $curControl.position();
								var curLeft = pos.left;
								var curTop = pos.top;
								var curBottom = pos.top
										+ $curControl.outerHeight();

								if (top >= curTop && top <= curBottom) {
									index = i + 1;
									break;
								}
							}

							if (i == $controls.length) {
								index = i;
							}

							return index;
						},
						
						
						/*
						 * operation on controls array.
						 */
						
						/**
						 * get UI.control by control id
						 * 
						 * @param {String} control id
						 * @return {UI.control}
						 */
						getControlByControlId: function(controlId) {
							var control = null;
							
							for(var i = 0; i < this.controls.length; i++) {
								if(this.controls[i].id == controlId) {
									control = this.controls[i];
								}
							}
							
							return control;
						},
						
						/**
						 * remove control from controls array
						 * 
						 * @param {String} control id
						 */
						removeControlByControlId: function(controlId) {
							for(var i = 0; i < this.controls.length; i++) {
                                var control = this.controls[i];
                                if(control.id == controlId) {
									this.controls.splice(i, 1);
									return;
								}
							}
						},
						
						/**
						 * remove controls belong to given page no
						 * 
						 * @param {Number} page number
						 */
						removeControlsByPageIndex: function(pageNo) {
							var pageId = this.getPageIdByPageNo(pageNo);
							var $controls = this.getControlsByPageId(pageId);
							for(var i = 0; i < $controls.length; i++) {
								this.removeControlByControlId($($controls[i]).attr('id'));
							}
						},
						
						/**
						 * clear controls array
						 */
						 clearControlsArray: function() {
						 	this.controls = [];
						 },
						 
						
						/*
						 * control clicked
						 */
						controlClicked : function(controlId) {
							this.highlightSelectedControl(controlId);
							Arbiter.publish(EVENT_FORMDEISGNER_CONTROL_CLICK, {
								id: controlId
							}, {
								asyn: true
							});
						},
						controlDblClicked : function(controlId) {
							this.highlightSelectedControl(controlId);
						},

						highlightSelectedControl : function(controlId) {
                            var $currentSelectedControl;
                            if (this.currentSelectedControlId != "") {
                                $currentSelectedControl = $("#"
                                    + this.currentSelectedControlId);
                                $currentSelectedControl.css('opacity', "1");
                            }

                            var $controlSelected = $("#controlSelected");
                            var $control = $("#" + controlId);
							$control.css('opacity', "0.7");

							var pos = $control.position();
							pos.left = 2;

							$controlSelected.css('left', pos.left + "px");
							$controlSelected.css('top', pos.top + "px");
							$controlSelected
									.css('width', $control.outerWidth());
							$controlSelected.css('height', $control
									.outerHeight());
							$controlSelected.css('display', 'block');

							this.currentSelectedControlId = controlId;
						},
						unhighlight : function() {
							this.currentSelectedControlId = "";
                            var $controlSelected = $("#controlSelected");
							$controlSelected.css('display', 'none');
						},

						/**
						 * get controlId by index, index starts from 0.
						 */
						getControlIdByIndex: function(index) {
							//var $controls = $("#controlContainer > [id!=controlSelected]");
							var pageId = this.getPageIdByIndex(this.curPageIndex);
							var $controls = this.getControlsByPageId(pageId);
							if(index < 0 || index >= $controls.length) {
								return null;
							}
							return $($controls[index]).attr('id');
						},
						
						/**
						 * get page id by index, index starts from 0
						 */
						getPageIdByIndex: function(index) {
							var $pages = $("#controlContainer > [id^=page]");
							if(index <= 0 || index > $pages.length) {
								return null;
							}
							return $($pages[index - 1]).attr('id');
						},
						
						/**
						 * get page id by pageNo
						 */
						getPageIdByPageNo: function(pageNo) {
							return "page_" + pageNo;
						},
						
						/**
						 * get controls by page id
						 * 
						 * @param {String} page id
						 * @returns {Array[Jquery Object]} array of jquery object
						 */
						getControlsByPageId: function(pageId) {
                            var $controls = $("#" + pageId + " > [id!=controlSelected]");
							return $controls;
						},
						
						/**
						 * show page
						 */
						 showPageByIndex: function(index) {
						 	var curPageId = this.getPageIdByIndex(this.curPageIndex);
						 	$("#" + curPageId).hide();
						 	var pageId = this.getPageIdByIndex(index);
						 	if(pageId == null) {
						 		return;
						 	}
						 	
						 	$("#" + pageId).show();
						 	this.curPageIndex = index;
						 	this.unhighlight();
						 },
		
						 		
						/**
						 * set drag event for control
						 */
						setDragEventHandler : function(controlId) {
							var _this = this;
                            var $controlEl = $("#" + controlId);
                            var controlEl = $controlEl[0];
                            var objleft = "";
                            var objtop = "";
                            var distanceX = 0;
                            var distanceY = 0;

							var dragControl = new YAHOO.util.DD(controlId);
							dragControl.subscribe('dragEvent', dragEvent); // draging
							dragControl.subscribe('startDragEvent',
									startDragEvent); // start drag
							dragControl.subscribe('endDragEvent', endDragEvent); // end
							// drag

							function dragEvent(event) {
                                if (!_this._isFlowDesignerOpened) {

                                }else{
                                    $controlEl.css("left", objleft);
                                    $controlEl.css("top", objtop);
                                    var left = event.e.pageX - $("#layout_center_container").offset().left - distanceX;
                                    var top = event.e.pageY - $("#layout_center_container").offset().top - distanceY;
                                    $("#flow_ui_moving").css("left", left + "px");
                                    $("#flow_ui_moving").css("top", top + "px");
                                }
							}

							function startDragEvent(event) {
								console.log('start drag event');
                                if (!_this._isFlowDesignerOpened) {
                                    _this.draggedControlIndex = _this
                                        .getControlIndex(controlId);
                                    _this.draggedControlPos = $("#" + controlId)
                                        .position();
                                } else {
                                    Arbiter.publish(EVENT_FORMDESIGNER_CONTROL_DRAG_BEGIN, {
                                        cid: controlId,
                                        time: (new Date()).getTime()
                                    });
                                    var objOffset = $controlEl.offset();
                                    objleft = $controlEl.css("left");
                                    objtop = $controlEl.css("top");
                                    distanceX = event.x - objOffset.left;
                                    distanceY = event.y - objOffset.top;
                                    var $uiMoving = $("#flow_ui_moving");
                                    $uiMoving.hide();
                                    var objLeft = objOffset.left - $("#layout_center_container").offset().left;
                                    var objTop = objOffset.top - $("#layout_center_container").offset().top;

                                    $uiMoving.width($controlEl.width());
                                    $uiMoving.height($controlEl.height());

                                    $uiMoving.css("left", objLeft + "px");
                                    $uiMoving.css("top", objTop + "px");
                                    $uiMoving.css("z-index", 2000);
                                    var html = util.getOuterHTML(controlEl).replace("ID=\"object", "ID=\"logicobject")
                                        .replace("id=\"object", "id=\"logicobject")
                                        .replace("left:", "logicleft:")
                                        .replace("top:", "logictop:")
                                        .replace("ONMOUSEUP", "onclick")
                                        .replace("ONDBLCLICK", "logicondblclick")
                                        .replace("ONMOUSEOVER", "logiconmouseover")
                                        .replace("ONMOUSEOUT", "logiconmouseout")
                                        .replace("href", "logichref")
                                        .replace("position:absolute", " ");
                                    /*.replace("<a", "<logica").replace("</a>", "</logica>")*/

                                    if ($uiMoving.html() != html) {
                                        $uiMoving.html(html);
                                    }
                                    $uiMoving.show();
                                }
							}

							function endDragEvent(event) {
								console.log('end drag event');
                                if (!_this._isFlowDesignerOpened) {
                                    var $control = $("#" + controlId);
                                    var x = $control.position().left;
                                    var y = $control.position().top;

                                    var index = _this.getControlIndexAfterDragged(
                                        x, y, controlId);
                                    _this.insertControlToIndex(controlId, index, _this.curPageIndex);
                                    $control.css('left', 'auto');
                                    $control.css('top', 'auto');
                                    _this.highlightSelectedControl(controlId);

                                    if (index != _this.draggedControlIndex) {
                                        Arbiter.publish(EVENT_MODEL_REORDER, {
                                            'id' : controlId,
                                            'newPageIndex' : index
                                        }, {
                                            asyn : true
                                        });
                                    }
                                    _this.draggedControlIndex = -1;
                                    _this.draggedControlPos = null;
                                }else{
                                    Arbiter.publish(EVENT_FORMDESIGNER_CONTROL_DRAG_END, {
                                        cid: controlId,
                                        time: (new Date()).getTime()
                                    });
                                    distanceX = 0;
                                    distanceY = 0;
                                    objleft = "";
                                    objtop = "";
                                    $("#flow_ui_moving").hide();
                                }
							}
						},

						/*
						 * subscription response function
						 */
						 
						 /*
						  * toolbar about
						  */
						controlDropFromToolbar : function(data) {
							var x = data.x;
							var y = data.y;
							var controlType = data.controlType;

							var canvasDesignRect = $('#canvasDesign')[0]
									.getBoundingClientRect();
							var left = canvasDesignRect.left;
							var right = canvasDesignRect.right;
							var top = canvasDesignRect.top;
							var bottom = canvasDesignRect.bottom;

							if (x < left || x > right || y < top || y > bottom) {
								console.info("dropping control out of range.");
								return;
							}

							x = x - left;
							y = y - top;

							var index = this.calculateIndex(x, y);
							var newBean = new Bean();
							newBean.pIndex = index;
							newBean.type = controlType;
							newBean.pageNo = this.curPageIndex;
							//reset props
							newBean.props = {};
//							for(var prop in Bean.prototype.props) {
//								newBean.props[prop] = Bean.prototype.props[prop];
//							}
							deepCopy(newBean.props, Bean.prototype.props);

							Arbiter.publish(EVENT_MODEL_ADD, {
								'bean' : newBean,
							}, {
								asyn : true
							});
						},

						toolbarDelete: function() {
							if (this.currentSelectedControlId != "") {
								Arbiter.publish(EVENT_MODEL_REMOVE, {
									'id' : this.currentSelectedControlId
								}, {
									asyn : true
								});
							}						
						},

						/*
						 * control about
						 */
						controlAdd : function(data) {
							var bean = data.bean;

							this.generateControl(bean);
							this.insertControlToIndex(bean.id, bean.pIndex, bean.pageNo);
							this.updateControlProperties(bean.id);
							this.controlClicked(bean.id);
						},

						controlRemove : function(data) {
							var controlId = data.id;
							var $control = $("#" + controlId);
							if ($control == null) {
								return;
							}
							//reset the current selected control
							var removedControlIndex = this.getControlIndex(controlId);
							var nextControlId = this.getControlIdByIndex(removedControlIndex + 1);
							var preControlId = this.getControlIdByIndex(removedControlIndex - 1);
							
							this.removeControlByControlId(controlId);
							$control.remove();
							
							if(nextControlId != null) {
								this.highlightSelectedControl(nextControlId);
								this.controlClicked(nextControlId);
							} else if(preControlId != null){
								this.highlightSelectedControl(preControlId);
								this.controlClicked(preControlId);
							} else {
								this.unhighlight();
							}
							
														
						},

						controlRename : function(data) {
							var controlId = data.oldId;
							var $control = $("#" + controlId);
							if ($control == null) {
								return;
							}
							$control.attr('id', data.newId);
						},

						controlUpdate : function(data) {
							var controlId = data.id;
							var propName = data.propName;
							var propValue = data.propValue;
							var $control = $("#" + controlId);
							if ($control == null) {
								return;
							}

							$control.css(propName, propValue);
						},
						
						
						/*
						 * page about
						 */
						 pageAdd: function(data) {
						 	var pageNo = data.newPageNo;
                             var $controlContainer = $("#controlContainer");
						 	this.pageIdNumber += 1;
						 	var pageId = "page_" + this.pageIdNumber;
						 	var pageHmtl = "<div id='" + pageId + "' ></div>";
						 	$controlContainer.append(pageHmtl);
						 	$("#" + pageId).hide();
						 	this.showPageByIndex(pageNo);
						 },
						 
						 pageRemove: function(data) {
						 	var pageNo = data.pageNo;
						 	var pageId = this.getPageIdByIndex(pageNo);
						 	if(pageId == null) {
						 		return;
						 	}
						 	this.removeControlsByPageIndex(pageNo);
						 	$("#" + pageId).remove();
						 	//show next page
						 	pageId = this.getPageIdByIndex(pageNo);
						 	if(pageId == null) {
						 		pageId = this.getPageIdByIndex(pageNo);
						 	}
						 	$("#" + pageId).show();
						 },
						 
						 pageSwitch: function(data) {
						 	var pageNo = data.page;
						 	if(pageNo == this.curPageIndex) {
						 		return;
						 	}
						 	this.showPageByIndex(pageNo);
						 },
						 
						 outlinePageClick: function(data) {
						 	var pageNo = data.page;
						 	if(pageNo == this.curPageIndex) {
						 		return;
						 	}
						 	this.showPageByIndex(pageNo);
						 },
						 
						 outlineControlClick: function(data) {
						 	var controlId = data.id;
						 	var pageNo = data.pageNo;
						 	this.showPageByIndex(pageNo);
						 	this.controlClicked(controlId);
						 },
						 
						/*
						 * configurator about
						 */
						  
						updateProperty: function(data) {
						  	var controlId = data.id;
						  	var propName = data.propName;
						  	var value = data.value;
						  	
						  	//TODO, if propName is css style properties or not
						  	var control = this.getControlByControlId(controlId);
						  	var designer = control.designer;
						  	var oldValue = designer.getPropValue(propName);
						  	designer.setPropValue(propName, value);
						  	var newValue = designer.getPropValue(propName);
						  	if(oldValue != newValue) {
								Arbiter.publish(EVENT_MODEL_UPDATE, {
									id: controlId,
									propName: propName,
									propValue: newValue,
								}, {
									asyn: true
								});
						  	}
						  	this.controlClicked(controlId);
						},
						  
						 /*
						  * clear 
						  */
						 controlClear: function() {
						 	//unhighlight
						 	this.unhighlight();
						 
						 	//remove all pages and control in it.
						 	var $pages = $("#controlContainer > [id^=page]");
						 	for(var i = 0; i < $pages.length; i++) {
						 		var pageId = $($pages[i]).attr('id');
						 		$("#" + pageId).remove();
						 	}
						 	
						 	//reset some variables
						 	this.curPageIndex = 1;
						 	this.pageIdNumber = 1;
						 	
						 	//add a default page
						 	var pageHtml = "<div id='page_1'></div>";
						 	$("#controlContainer").append(pageHtml);
						 	
						 	this.clearControlsArray();
						 }
						
					});
			return {

				init : init,
			};

		});