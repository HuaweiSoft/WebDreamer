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
 * Define manage mask function in Arbiter message model
 * Open mask for example:Arbiter.publish("mask/open",{"showText":true,"showGif":true,"opacity":".5","text":"text","zindex":"100"});
 * Close mask for example:Arbiter.publish("mask/close");
 */
define([ "text!modules/mask/mask_panel_model.json",
	"text!modules/mask/mask_panel_tmpl.xml" ], function(model, tmpl) {

    var init = function() {
	var maskView = new MaskPanelView({
	    el : "body"
	});
	maskView.render(tmpl, model);

	Arbiter.subscribe(EVENT_MASK_SUBSCRIPE_CLOSE, {
	    async : true
	}, function() {
	    maskView.close();
	});

	Arbiter.subscribe(EVENT_MASK_SUBSCRIPE_OPNE, {
	    async : true
	}, function(data) // T;
	{
	    maskView.open(data);
	});
    };

    /**
     * Define the mask view class 
     */
    var MaskPanelView = Backbone.View.extend({

	maskPanelId : "",
	gifId : "",
	textId : "",

	/**
	 * Render the mask view base template and model
	 * @param {String} templ,HTML template base backbone 
	 * @param {JSONObject} model,JSON data defined the mask view model,detail see the mask_panel_model.json 
	 */
	render : function(tmpl, model) {
	    var jsonModel = JSON.parse(model);
	    jsonModel = this.__computeLoadingPanelXY(jsonModel);
	    var maskPanel = _.template(tmpl, jsonModel);
	    this.maskContainerId = jsonModel.maskPanelContainerId;
	    this.maskPanelId = jsonModel.maskPanelId;
	    this.gifId = jsonModel.maskPanelGifId;
	    this.textId = jsonModel.maskPanelTextId;

	    $(this.el).append(maskPanel);
	},

	/**
	 * Open mask view
	 * @param {josnObject} data,detail reference {"showText":true,"showGif":true,"opacity":".5","text":"text","zindex":"100"}
	 */
	open : function(data) {
	    var container = $("#" + this.maskContainerId);
	    if (data.hasOwnProperty("showText")) {
		if (data.showText) {
		    if (data.hasOwnProperty("text")) {
			if (data.text != "") {
			    $("#" + this.textId).html(data.text);
			} else {
			    $("#" + this.textId).html("Processing...");
			}

		    } else {
			$("#" + this.textId).html("Processing...");
		    }
		    $("#" + this.textId).show();
		}

	    } else {
		$("#" + this.textId).hide();
	    }

	    if (data.hasOwnProperty("opacity")) {
		container.css("opacity", data.opacity);
	    } else {
		container.css("opacity", model.maskPanelContainerOpacity);

	    }
	    if (data.hasOwnProperty("zindex")) {
		container.css("z-index", data.zindex);
	    } else {
		container.css("z-index", model.maskPanelContainerZindex);

	    }
	    if (data.hasOwnProperty("showGif")) {
		if (data.showGif) {

		    $("#" + this.gifId).show();
		} else {
		    $("#" + this.gifId).hide();
		}
	    } else {
		$("#" + this.gifId).show();
	    }
	    $("#" + this.maskContainerId).show();
	},

	/**
	 * Close the mask
	 */
	close : function() {
	    $("#" + this.maskContainerId).hide();
	},

	/**
	 *Update the location{maskPanelLeft,maskPanelTop} of model to center of browser
	 *@param {JSONObject} panelTemplateModel,detail see amsk_panel_model.json
	 *@return {JSONObject} panelTemplateModel
	 */
	__computeLoadingPanelXY : function(panelTemplateModel) {
	    var windowHeight = $(window).height();
	    var windowWidth = $(window).width();

	    var panelHeight = parseInt(panelTemplateModel.maskPanelHeight
		    .replace("px", ""), 10);
	    var panelWidh = parseInt(panelTemplateModel.maskPanelWidth.replace(
		    "px", ""), 10);

	    var panelTextWidth = parseInt(panelTemplateModel.maskPanelTextWidth
		    .replace("px", ""), 10);

	    panelTemplateModel.maskPanelContainerWidth = windowWidth + "px";
	    panelTemplateModel.maskPanelContainerHeight = windowHeight + "px";
	    panelTemplateModel.maskPanelTop = (windowHeight - panelHeight) / 2
		    + "px";
	    panelTemplateModel.maskPanelLeft = (windowWidth - panelWidh) / 2
		    + "px";

	    panelTemplateModel.maskPanelTextLeft = (panelWidh - panelTextWidth)
		    / 2 + "px";

	    return panelTemplateModel;

	}
    });

    return {
	init : init,
    };

});