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
define([ "jquery", "util", "HashMap" ],
    function($, util, HashMap) {

        return {
            init: function() {
                var _this = this;
                Arbiter.subscribe(EVENT_CONTROLS_LOAD_METADATA, {
                    async: false
                }, function(controlData) {
                    _this.loadJS(controlData);
                });

            },

            loadJS: function(controlData) {
                var controlJSArray = this.getAllControlJS(controlData);
                this.loadAllJsByDom(controlJSArray);
                var cssArray = [];
                if (controlData.controlBase.runtime.css) {
                    for (var i = 0; i < controlData.controlBase.runtime.css.length; i++) {
                        cssArray.push(controlData.controlBase.runtime.css[i]);
                    }
                }
                if (controlData.controlBase.designer.css) {
                    for (var i = 0; i < controlData.controlBase.designer.css.length; i++) {
                        cssArray.push(controlData.controlBase.designer.css[i]);
                    }
                }
                this.loadAllControlCss(cssArray);
            },

            /**
             * Resort the loading sequence of controls javascript files base on controls meta data
             * @param {ObjectArray} jsArray
             */
            getAllControlJS: function(controlData) {

                var controlJSArray = [];
                for (var i = 0; i < controlData.controlBase.runtime.js.length; i++) {
                    controlJSArray.push(controlData.controlBase.runtime.js[i]);
                }
                for (var i = 0; i < controlData.controlBase.designer.js.length; i++) {
                    controlJSArray.push(controlData.controlBase.designer.js[i]);
                }

                var controlArray = controlData.controls;
                var indexMap = new HashMap();
                for (var i = 0; i < controlArray.length; i++) {
                    var control = controlArray[i];
                    if (control && control.name) {
                        indexMap.put(control.name, control);
                    }
                }
                var containedMap = new HashMap();


                for (var i = 0; i < controlArray.length; i++) {
                    var control = controlArray[i];
                    if (!control || !control.name)
                        continue;
                    var dependJSArray = [];
                    this.collectControlJS(control, dependJSArray, indexMap, containedMap);
                    for (var p = dependJSArray.length - 1; p >= 0; p--) {
                        if (!util.inArray(controlJSArray, dependJSArray[p])) {
                            controlJSArray.push(dependJSArray[p]);
                        }
                    }
                }
                return controlJSArray;
            },

            collectControlJS: function(control, jsArray, indexMap, containedMap) {
                if (containedMap.containsKey(control.name))
                    return;

                for (var i = control.designer.js.length - 1; i >= 0; i--) {
                    jsArray.push("controls/" + control.dir + "/" + control.designer.js[i]);
                }

                for (var i = control.runtime.js.length - 1; i >= 0; i--) {
                    var jsPath = control.runtime.js[i];
                    if (jsPath.indexOf("http://") == 0 || jsPath.indexOf("https://") == 0)
                        jsArray.push(jsPath);
                    else
                        jsArray.push("controls/" + control.dir + "/" + control.runtime.js[i]);
                }

                if (control.hasOwnProperty("dependControl") && control.dependControl.length > 0) {
                    for (var i = control.dependControl.length - 1; i >= 0; i--) {
                        var dependName = control.dependControl[i];
                        if (!indexMap.containsKey(dependName)) {
                            console.error("No metadata for '%s' control, and '%s' control would can not to work!",
                                dependName, control.name);
                            continue;
                        }
                        var dependControl = indexMap.get(dependName);
                        this.collectControlJS(dependControl, jsArray, indexMap, containedMap);
                        containedMap.put(dependName, true);
                    }
                }
                containedMap.put(control.name, true);
            },


            /**
             * Asynchronously load Javascript file to runtime class through Jquery AJAX
             */
            loadAllJsByDom: function(controlJSArray) {
                var index = -1;

                function loadNext() {
                    index++;
                    if (index >= controlJSArray.length)
                        return;
                    var scriptElm = document.createElement('script');
                    scriptElm.type = 'text/javascript';
                    scriptElm.async = 'async';
                    scriptElm.src = controlJSArray[index];
                    scriptElm.onload = scriptElm.onreadystatechange = function() {
                        if ((!this.readyState) || this.readyState == "complete" || this.readyState == "loaded") {
                            //script loaded
                        }
                        else {
                            console.warn("Control js may load failed: " + controlJSArray[index]);
                        }
                        loadNext();
                    };
                    scriptElm.onerror = function() {
                        //console.error( "Control js loaded error: " + controlJSArray[index] );
                        loadNext();
                    };
                    var headElm = document.head || document.getElementsByTagName('head')[0];
                    headElm.appendChild(scriptElm);
                }

                loadNext();
            },

            loadAllJsXHR: function(controlJSArray) {
                var index = -1;

                function loadNext() {
                    index++;
                    if (index >= controlJSArray.length)
                        return;
                    $.ajax({
                        url: controlJSArray[index],
                        dataType: "script",
                        success: function(data, textStatus) {
                            loadNext();
                        },
                        error: function(e) {
                            console.error("Load js error: %o", e);
                            loadNext();
                        }
                    });
                }

                loadNext();
            },

            loadAllControlCss: function(cssArray) {
                var paths = [];
                for (var i = 0; i < cssArray.length; i++) {
                    paths.push("css!" + cssArray[i]);
                }
                require(paths, function() {
                    console.debug("All css of ui controls have been loaded!");
                });
            }
        };


    });