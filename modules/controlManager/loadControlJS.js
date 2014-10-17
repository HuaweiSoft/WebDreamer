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
 * Dynamically load all javascript files of controls depend on to runtime
 */
define([ "jquery", "util" ], function($, util) {

    var init = function() {
	Arbiter.subscribe(EVENT_CONTROLS_LOAD_METADATA, {
	    async : true
	}, function(controlData) {
	    var jsLoader = new JSFilesLoader();
	    jsLoader.loadJS(controlData)
	});
    };

    var JSFilesLoader = Backbone.View.extend({
	loadJS : function(controlData) {
	    var loader = new this.jsLoader();
	    var controlJSArray = this.getValidJS(controlData.controls);
	    for ( var i = 0; i < controlJSArray.length; i++) {
		loader.addURL(controlJSArray[i]);
	    }
	    loader.traverse();
	},

	/**
	 * Resort the loading sequence of controls javascript files base on controls meta data
	 * @param {ObjectArray} jsArray 
	 */
	getValidJS : function(jsArray) {
	    var controlJSArray = [];
	    for ( var i = 0; i < jsArray.length; i++) {

		var control = jsArray[i];
		var designerJS = window.location.pathname + "controls/"
			+ control.dir + "/" + control.designerJS + ".js";
		var runtimeJS = window.location.pathname + "controls/"
			+ control.dir + "/" + control.runtimeJS + ".js";
		var dependJS = control.dependJS;
		for ( var p = 0; p < dependJS.length; p++) {

		    var dependX = window.location.pathname + dependJS[p]
			    + ".js";
		    if (!util.inArray(controlJSArray, dependX)) {
			controlJSArray.push(dependX);
		    }

		}
		if (!util.inArray(controlJSArray, runtimeJS)) {
		    controlJSArray.push(runtimeJS);
		}
		if (!util.inArray(controlJSArray, designerJS)) {
		    controlJSArray.push(designerJS);
		}
	    }
	    return controlJSArray;

	},

	/**
	 * Asynchronously load Javascript file to runtime class through Jquery AJAX 
	 */
	jsLoader : function() {

	    return {

		dataURLs : new Array(),
		datasCount : 0,
		count : 0,
		traverse : function(obj) {
		    if (!obj)
			obj = this;
		    var dataURL = obj.dataURLs[this.datasCount];
		    if (!dataURL) {

			this.clear(obj);
			return;
		    }
		    obj.datasCount += 1;
		    $.ajax({
			url : window.location.origin + dataURL.url,
			dataType : dataURL.type ? dataURL.type : "script",
			success : function(data, textStatus) {
			    obj.traverse(obj);
			},
			error : function(e) {
			    Logger.error("Load Control JS", e);
			}
		    });
		},
		eventCount : 0,
		ready : function(callBack) {
		    this.eventCount += 1;
		},
		onCompletes : new Array(),
		addURL : function(_url) {

		    this.dataURLs[this.count] = {
			url : _url
		    };
		    this.count += 1;
		    return this;
		},
		clear : function(obj) {
		    if (obj)
			obj = this;
		    obj == null;
		}
	    }
	}
    });
    return {
	init : init,
	JSFilesLoader : JSFilesLoader
    };

});