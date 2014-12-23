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
 * Define the top shortcut menu bar on the left and top corner function in this
 */
define([ "css!modules/simulator/simulator", "text!modules/simulator/model.json",
        "text!modules/simulator/simulator_tmpl.xml" ], function(css, model, tmpl) {

    var init = function() {
        var simulator = new SimulatorView({
            el: "body"
        });
        simulator.subscribe();
    };
    var SimulatorView = Backbone.View.extend({
        projectName: "",
        baseURL: "data/",
        user: "",
        rendered: false,
        viewId: "project_simulator_panel",
        render: function() {
            this.$el.append(tmpl);
            var $view = $("#" + this.viewId);
            $view.css("left", ($(window).width() - $view.width()) / 2 + "px").css("top",
                    ($(window).height() - $view.height()) / 2 + "px");
            this.rendered = true;
        },
        open: function(url) {
            if (!this.rendered) {
                this.render();
            }
            Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                "showText": false,
                "opacity": 0.97,
                "showGif": false
            });
            var iframe = $("#project_simulator_iframe")[0];
            iframe.src = url;
            iframe.onload = iframe.onreadystatechange =function(){
                var contentWindow =  this.contentWindow;
                contentWindow["IS_RUNTIME_PREVIEW"] = true;
                var loc = contentWindow.location;
                var path = loc.origin + loc.pathname;
                path = path.substring(0, path.lastIndexOf("/")) + "/controls/";
                $(this.contentWindow.document.body).find("img").each(function(index, el){
                    if(el.src){
                        var index1 = el.src.indexOf(path);
                        var index2 = el.src.indexOf("controls/");
                        if(index1 == 0){
                            el.src = "../../../controls/" +  el.src.substring(path.length);
                        }else if(index2 == 0){
                            el.src = "../../../" +  el.src;
                        }
                    }
                });
            };
            $("#" + this.viewId).show();
        },
        close: function() {
            Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
            $("#" + this.viewId).hide();
        },
        subscribe: function() {
            var _this = this;
            var SIMULATOR_RUN_NOTIFY_BACK_SAVE = "simulator_run_notify_back_save";
            Arbiter.subscribe(EVENT_MODEL_BACK_SAVED, function(data) {
                if (data.triggerId && data.triggerId == SIMULATOR_RUN_NOTIFY_BACK_SAVE) {
                    var url = document.location.pathname + _this.baseURL + data.user + "/" + data.project + "/"
                            + data.project + ".html?" + (new Date()).getTime();
                    _this.open(url);
                }

            });
            Arbiter.subscribe(EVENT_MODEL_BACK_SAVED_ERROR, function() {
                alert("Save project fail,please try again later.");
                Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
            });
            Arbiter.subscribe(EVENT_MODEL_RUN, function() {
                Arbiter.publish(EVENT_MODEL_TO_BACK_SAVED, {
                    triggerId: SIMULATOR_RUN_NOTIFY_BACK_SAVE
                }, {
                    async: true
                });
            });

        },
        events: {
            "click #project_simulator_panel_close": "close"
        }

    });
    return {
        init: init
    };

});