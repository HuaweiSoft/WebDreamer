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
 *Load the services meta data defined in /services/metadata.json
 *Display all services on the services board of the top toolbar base on meta data loaded
 *Register meta data loaded to MetaHub
 */
define(
	[ "text!services/metadata.json", "css!modules/serviceManager/service",
		"text!modules/serviceManager/model.json",
		"text!modules/serviceManager/service_board_tmpl.xml", "util" ],
	function(serviceMetaData, css, model, boardTmpl, util) {

	    var init = function() {

		Arbiter.subscribe(EVENT_TOOLBAR_PUBLISH_RENDERED, {
		    async : true
		}, function(data) {
		    var boardId = data.servicesBoardId;
		    var boardView = new ServicesBoardView({
			el : $("#" + boardId)
		    });
		    boardView.render();
		});
	    };

	    /**
	     * Define services display view class to display all services on the services board of toolbar
	     */
	    var ServicesBoardView = Backbone.View
		    .extend({

			numberPerPage : 6,
			totalPage : 1,
			currentPage : 1,
			services : [],
			isFlowDesignerOpened : false,

			render : function() {
			    var servicesMetaData = JSON.parse(serviceMetaData);
			    for ( var i = 0; i < servicesMetaData.length; i++) {
				for ( var p = 0; p < servicesMetaData[i].services.length; p++) {
				    servicesMetaData[i].services[p].icon = window.location.origin
					    + window.location.pathname
					    + servicesMetaData[i].services[p].icon;
				    this.services
					    .push(servicesMetaData[i].services[p]);
				}

			    }
			    this.toPage(1);
			    this.registerServiceMetaData();
			    this.registerFlowOpenEvent();
			},

			/**
			 * Display all services the specified page contains on the services board
			 * 
			 * @param {Number} pageNo
			 */
			toPage : function(pageNo) {
			    var start = (pageNo - 1) * this.numberPerPage;
			    var end = pageNo * this.numberPerPage - 1;
			    if (start < 0) {
				return;
			    }
			    this.currentPage = pageNo;
			    var pageHTML = "";
			    var pageServices = [];
			    for ( var i = 0; i < this.services.length; i++) {
				if (i >= start && i <= end) {
				    pageServices.push(this.services[i]);
				}
			    }
			    if (pageServices.length == 0) {
				this.$el.html("");
			    } else {
				pageHTML = _.template(boardTmpl, {
				    services : pageServices
				});
				this.$el.html(pageHTML);
				this.enableDragable();
			    }
			},

			upPage : function() {
			    this.toPage(this.currentPage--);
			},

			nextpage : function() {
			    this.toPage(this.currentPage++);
			},

			registerServiceMetaData : function() {
			    for ( var i = 0; i < this.services.length; i++) {
				MetaHub.registerApiMeta(this.services[i]);
			    }
			},

			registerFlowOpenEvent : function() {
			    var _this = this;
			    Arbiter.subscribe(EVENT_FLOW_OPEN, function(data) {
				_this.isFlowDesignerOpened = true;
			    });
			    Arbiter.subscribe(EVENT_FLOW_CLOSE, function(data) {
				_this.isFlowDesignerOpened = false;
			    });
			},

			enableDragable : function() {
			    var $children = this.$el.children();
			    for ( var i = 0; i < $children.length; i++) {
				this.bindDragEvent($children[i]);
			    }
			},

			bindDragEvent : function(itemEl) {
			    var $item = $(itemEl);
			    var serviceName = $item.attr("type");

			    var _this = this;
			    function dragging(event) {
				$item.css("top", "").css("left", "");
				if (!_this.isFlowDesignerOpened) {
				    // cancel the drag
				    return;
				}
				$("#flow_service_moving").css("top",
					event.e.clientY - 15 + "px").css(
					"left", event.e.clientX - 15 + "px")
					.show();
			    }

			    function dragEnd(event) {
				$item.css("top", "").css("left", "");
				if (!_this.isFlowDesignerOpened) {
				    // cancel the drag
				    return;
				}
				Arbiter.publish(EVENT_TOOLBAR_SERVICE_DRAG_END,
					{
					    time : (new Date()).getTime(),
					    apiName : serviceName
					});
				$("#flow_service_moving").hide();
			    }

			    function dragStart(event) {
				if (!_this.isFlowDesignerOpened) {
				    // cancel the drag
				    return;
				}

				var html = util.getOuterHTML(itemEl).replace(
					"id=\"", "logicid=\"").replace(
					"onmouseup", "logiconmouseup").replace(
					"onmouseup", "logiconmouseup").replace(
					"ondblclick", "logicondblclick")
					.replace("onmouseover",
						"logiconmouseover")
					.replace("onmouseout",
						"logiconmouseout").replace(
						"title=", "logicunittitle=");

				var $moving = $("#flow_service_moving");
				$moving.html(html).css("left",
					itemEl.offsetLeft + 12 + "px").css(
					"top", itemEl.offsetTop + 59 + "px")
					.show();
				Arbiter.publish(
					EVENT_TOOLBAR_SERVICE_DRAG_BEGIN, {
					    time : (new Date()).getTime(),
					    apiName : serviceName
					});
			    }

			    var dragobj = new YAHOO.util.DD(itemEl.id);
			    dragobj.subscribe("endDragEvent", dragEnd);
			    dragobj.subscribe("startDragEvent", dragStart);
			    dragobj.subscribe("dragEvent", dragging);
			},

			events : {}
		    });

	    /**
	     * Define import service to services board(open a panel to display all services or register new service) view class 
	     * TO　DO
	     */
	    var ImportServiceView = Backbone.View.extend({

		id : "",

		render : function() {
		},
		open : function() {

		    $("#" + this.id).show();
		},
		close : function() {
		    $("#" + this.id).hide();
		},
		subsribeMsg : function() {
		},
		clickMenuItem : function(event) {
		},
		events : {}
	    });

	    /**
	     * Display all services by category on a panel
	     * TO DO
	     */
	    var ShowAllServicesView = Backbone.View.extend({

		id : "",

		render : function() {
		},
		open : function() {

		    $("#" + this.id).show();
		},
		close : function() {
		    $("#" + this.id).hide();
		},
		subsribeMsg : function() {
		},
		clickMenuItem : function(event) {
		},
		events : {}
	    });

	    return {
		init : init,
	    };

	});