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
 *Load the controls meta data defined in /controls/metadata.json
 *Display all controls on the controls board of the top toolbar base on  meta data loaded of controls
 *Dynamically load all javascript files of all controls depend on to runtime base on meta data loaded of controls 
 */
define([ "text!controls/metadata.json", "css!modules/controlManager/control",
	"text!modules/controlManager/model.json",
	"text!modules/controlManager/control_board_tmpl.xml",
	"modules/controlManager/loadControlJS",
	"css!jslibs/jquerymobile/1.0rc03/jquery.mobile.css" ],
	function(controlMetaData, css, model, boradTmpl, loadControlJS,
		jqueryMobileCss) {

	    var init = function() {
		Arbiter.subscribe(EVENT_TOOLBAR_PUBLISH_RENDERED, {
		    async : true
		}, function(data) {
		    loadControlJS.init();
		    var boardId = data.controlsBoardId;
		    var boardView = new ControlsBoardView({
			el : $("#" + boardId)
		    });
		    boardView.render();

		});
	    };

	    /**
	     * Define the view class to display all controls on the controls board of toolbar
	     */
	    var ControlsBoardView = Backbone.View.extend({

		id : "",
		controls : [],
		currentPageNO : 1,
		numsPerPage : 10,

		/**
		 * Get all controls through parsing the controls meta data and display them on the controls board 
		 */
		render : function() {

		    var metaDataOfControls = JSON.parse(controlMetaData);

		    for ( var i = 0; i < metaDataOfControls.length; i++) {

			var subControls = metaDataOfControls[i].controls;
			for ( var p = 0; p < subControls.length; p++) {

			    var controlTemp = subControls[p];
			    controlTemp.outlineIcon = "controls/"
				    + controlTemp.dir + "/icon/"
				    + controlTemp.outlineIcon;
			    controlTemp.toolbarIcon = "controls/"
				    + controlTemp.dir + "/icon/"
				    + controlTemp.toolbarIcon;
			    controlTemp.effectIcon = "controls/"
				    + controlTemp.dir + "/icon/"
				    + controlTemp.effectIcon;
			    this.controls.push(controlTemp);
			}

		    }

		    this.showPage(1);
		    this.bindEventHandler("control_item");
		    this.notifyLoadControlsJS();
		},

		/**
		 * Display all controls the specified page contains on the controls board
		 * 
		 * @param {Number} pageNo
		 */
		showPage : function(pageNo) {

		    var pageControls = [];
		    if (!pageNo) {
			pageNo = 1;
		    }
		    var startIndex = (pageNo - this.currentPageNO)
			    * this.numsPerPage;
		    if (startIndex > 0) {
			startIndex = startIndex - 1;
		    }
		    var endIndex = startIndex + this.numsPerPage;
		    for ( var i = startIndex; i < endIndex; i++) {
			if (i < this.controls.length) {
			    pageControls.push(this.controls[i]);
			} else {
			    break;
			}
		    }
		    if (pageControls.length > 0) {
			var controls = {
			    "controls" : pageControls
			};
			var itemHTML = _.template(boradTmpl, controls);
			this.$el.html("");
			this.$el.append(itemHTML);
		    }

		},

		/**
		 * Notify LoadControlJS module to load javascript files 
		 */
		notifyLoadControlsJS : function() {

		    Arbiter.publish(EVENT_CONTROLS_LOAD_METADATA, {
			"controls" : this.controls
		    }, {
			async : true,
			persist : true
		    });

		},
		subsribeMsg : function() {
		},
		clickMenuItem : function(event) {
		},

		bindEventHandler : function(className) {
		    var _this = this;
		    $("." + className).on('mousedown', function(event) {
			_this.selectControl(this, event);
			_this.canvasHighlightToggle(true);
		    });

		},

		selectControl : function($control, event) {
		    var _this = this;
		    var isDraging = true;

		    if (event.preventDefault) {
			event.preventDefault();
		    } else {
			event.returnvalue = false;
		    }

		    var img = $control.getAttribute('effectIcon');
		    var $mouseMoving = $("#mouseMoving");
		    $mouseMoving.empty();
		    $mouseMoving.append("<img src='" + img + "' >");
		    $mouseMoving.css("visibility", "visible");

		    // bind mouse move to body
		    $(document).mousemove(function(e) {
			if (isDraging == false) {
			    return true;
			}

			var x = e.clientX;
			var y = e.clientY;
			$mouseMoving.css("left", x + 5 + "px");
			$mouseMoving.css("top", y + 5 + "px");

			return false;
		    });

		    $(document).mouseup(function(e) {
			if (isDraging == false) {
			    return;
			}

			isDraing = false;
			$mouseMoving.css("visibility", "hidden");

			var x = e.clientX + 5;
			var y = e.clientY + 5;

			$(document).unbind('mouseover');
			$(document).unbind('mouseup');

			// publish
			Arbiter.publish(EVENT_TOOLBAR_DRAG_DROP, {
			    'x' : x,
			    'y' : y,
			    'controlType' : $control.getAttribute('name')
			}, {
			    asyn : true
			});

			_this.canvasHighlightToggle(false);

		    });
		},

		canvasHighlightToggle : function(on) {
		    on = on || false;
		    var color = on ? "#FFF8DC" : "#FFF";
		    $("#canvasDesign").css('background', color);

		},

		events : {}
	    });

	    /**
	     * Define display all controls by category on one panel
	     * TO DO
	     */
	    var ShowAllControlsView = Backbone.View.extend({

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