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

define([ "text!modules/setting/CFRuntimeSetting/cf_runtime_setting_tmpl.xml",
        "css!modules/setting/CFRuntimeSetting/cf_runtime_setting" ], function(tmpl, css) {

    var init = function() {
        var view = new CFRuntimeSettingView({
            el: $("body")
        });
        view.subscribeMsg();
    };

    var CFRuntimeSettingView = Backbone.View.extend({

        id: "cf-setting-panel",

        rendered: false,

        config: null,

        open: function() {
            if (!this.rendered) {
                this.render();
                this.bindEventHandler();
                this.rendered = true;
                this.getCFSetting();
            }
            $("#" + this.id).show();
            Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                "showText": false,
                "showGif": false
            });

        },

        close: function() {
            if (!this.rendered) {
                return;
            }
            Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
            $("#" + this.id).hide();
        },

        render: function() {
            var viewTmpl = _.template(tmpl, {});
            this.$el.append(viewTmpl);

            $view = $("#" + this.id);
            $document = $(window);
            var width = $view.outerWidth();
            var height = $view.outerHeight();
            var left = $document.width() / 2 - width / 2;
            var top = $document.height() / 2 - height / 2;
            $view.css("top", top + "px");
            $view.css("left", left + "px");
            $view.css("height", "auto");
        },

        subscribeMsg: function() {
            var _this = this;

            Arbiter.subscribe("toolbar/setting/cf", function(data) {
                _this.open();
            });

        },

        bindEventHandler: function() {
            var _this = this;

            var $closeBtn = $("#cf-setting-panel-operation #close-btn");
            $closeBtn.on("click", function(event) {
                _this.close();
            });

            var $resetBtn = $("#cf-setting-panel-operation #reset-btn");
            $resetBtn.on("click", function(event) {
                _this.reset(_this.config);
            });

            var $saveBtn = $("#cf-setting-panel-operation #save-btn");
            $saveBtn.on("click", function(event) {
                _this.save();
            });
        },

        /**
         * event handler
         */
        reset: function(config) {
            config = config || {};

            $("#cf-username").val(config.username);
            $("#cf-password").val(config.password);
            $("#cf-url").val(config.url);
            $("#cf-space").val(config.space);
        },

        save: function() {
            var config = this.generateConfig();
            this.saveCFConfig(config);
        },

        generateConfig: function() {
            var config = {};

            var username = $("#cf-username").val();
            var password = $("#cf-password").val();
            var url = $("#cf-url").val();
            var space = $("#cf-space").val();

            config.username = username;
            config.password = password;
            config.url = url;
            config.space = space;

            return config;
        },

        /**
         * get cf setting from server
         */
        getCFSetting: function() {
            var _this = this;

            $.ajax({
                type: "GET",
                async: false,
                dataType: "json",
                url: "rest/setting/cf",
                success: function(config) {
                    _this.config = config;
                    _this.reset(config);
                },
                error: function(msg) {
                    console.error("get cf setting error: [" + msg + "]");
                    _this.reset(_this.config);
                },
                timeout: 10000, // 10s
            });
        },

        /**
         * save cf setting to server
         */
        saveCFConfig: function(config) {
            var _this = this;

            $.ajax({
                type: "POST",
                async: false,
                dataType: "json",
                url: "rest/setting/cf",
                data: {
                    config: JSON.stringify(config)
                },
                success: function(config) {
                    _this.config = config;
                    alert("save cf setting success!");
                    _this.close();
                },
                error: function(msg) {
                    console.error("save cf setting error: [" + msg + "]");
                },
                timeout: 10000, // 10s
            });
        }

    });

    return {
        init: init
    };
});