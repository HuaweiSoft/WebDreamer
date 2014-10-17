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

/*******************************************************************************
 * When loading the index.html and other resources will show the loading panel
 * When all resources have been ready will close the loading panel
 ******************************************************************************/
define([ "css!modules/initiation/initiation",
	"text!modules/initiation/loading_panel_model.json",
	"text!modules/initiation/loading_panel_tmpl.xml" ], function(css,
	model, tmpl) {

    var process = function() {

	var view = showLoading();

	Arbiter.publish(EVENT_INITIATION_PUBLISH_PAGE_LOADED, null, {
	    persist : true,
	    async : true
	});

    };

    var showLoading = function() {

	var loadingView = new LoadingPanelView({
	    el : "body"
	});
	loadingView.render(tmpl, model);
	subLoadingPanelClose(loadingView);
	return loadingView;
    };

    var subLoadingPanelClose = function(view) {
	Arbiter.subscribe(EVENT_INITIATION_SUBSCRIPE_LOADINGVIEW_CLOSE, {
	    async : true
	}, function() {
	    view.destroy();
	})
    };

    /**
     * Define the loading panel view for tipping user to wait for moment
     */
    var LoadingPanelView = Backbone.View.extend({

	divid : "",
	render : function(tmpl, model) {
	    var josnModel = JSON.parse(model);
	    jsonModel = this.__computeLoadingPanelXY(josnModel);
	    var loadingPanel = _.template(tmpl, jsonModel);
	    this.divid = jsonModel.loadingPanelId;
	    $(this.el).html(loadingPanel);
	    panelId = this.divid;
	    setTimeout(function() {
		Arbiter.publish(EVENT_INITIATION_SUBSCRIPE_LOADINGVIEW_CLOSE,
			null, {
			    async : true
			});
	    }, jsonModel.showMaskTime);
	},

	/**
	 * close the loading panel view
	 */
	destroy : function() {
	    $("#" + this.divid).remove();
	},

	/**
	 * Update the location of loading panel model to center of browser
	 * 
	 * @param {jsonObject} panelTemplateModel,detail see the loading_panel_model.json  
	 * @return panelTemplateModel has been updated
	 */
	__computeLoadingPanelXY : function(panelTemplateModel) {
	    var windowHeight = $(window).height();
	    var windowWidth = $(window).width();
	    var panelHeight = parseInt(panelTemplateModel.loadingPanelHeight
		    .replace("px", ""), 10);
	    var panelWidh = parseInt(panelTemplateModel.loadingPanelWidth
		    .replace("px", ""), 10);
	    panelTemplateModel.loadingPanelTop = (windowHeight - panelHeight)
		    / 2 + "px";
	    panelTemplateModel.loadingPanelLeft = (windowWidth - panelWidh) / 2
		    + "px";

	    panelTemplateModel.documentWidth = windowWidth + "px";
	    panelTemplateModel.documentHeight = windowHeight + "px";
	    return panelTemplateModel;

	}
    });

    return {
	process : process,
    };

});