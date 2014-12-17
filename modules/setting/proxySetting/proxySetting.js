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

define([ "text!modules/setting/proxySetting/proxy_setting_tmpl.xml",
        "css!modules/setting/proxySetting/proxy_setting.css" ], function(tmpl, css) {

    var init = function() {
        var proxySettingView = new ProxySettingView({
            el: $("body")
        });
        proxySettingView.subscribeMsg();
    };

    /**
     *  panel to display proxy setting
     */
    var ProxySettingView = Backbone.View.extend({

        id: "proxy-setting-panel",

        rendered: false,

        /**
         * proxy that stay same with server
         */
        proxy: null,

        /**
         * init subscription
         */
        subscribeMsg: function() {
            var _this = this;

            Arbiter.subscribe("toolbar/setting/proxy", function() {
                _this.open();
            });
        },

        open: function() {
            if (!this.rendered) {
                this.render();
                this.bindEventHandler();
                this.rendered = true;
                this.getProxySetting();
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

        bindEventHandler: function() {
            var _this = this;

            var $closeBtn = $("#proxy-setting-panel-operation #close-btn");
            $closeBtn.on("click", function(event) {
                _this.close();
            });

            var $resetBtn = $("#proxy-setting-panel-operation #reset-btn");
            $resetBtn.on("click", function(event) {
                _this.reset(_this.proxy);
            });

            var $saveBtn = $("#proxy-setting-panel-operation #save-btn");
            $saveBtn.on("click", function(event) {
                _this.save();
            });
        },

        /**
         * event handler
         */
        reset: function(proxy) {
            proxy = proxy || {};

            var enable = (proxy.enable == false ? false : true);
            var host = proxy.host;
            var port = proxy.port;
            var username = proxy.username;
            var password = proxy.password;
            var nonProxyHost = proxy.nonProxyHost;

            var index = enable ? "0" : "1";
            $("input[type=radio][name=proxy-enable][value=\"" + index + "\"]").attr("checked", "checked");

            $("#proxy-host").val(host);
            $("#proxy-port").val(port);
            $("#proxy-username").val(username);
            $("#proxy-password").val(password);
            $("#non-proxy-host").val(nonProxyHost);
        },

        save: function() {
            var proxy = this.generateProxySetting();
            this.saveProxySetting(proxy);
        },

        generateProxySetting: function() {
            var proxy = {};

            var enable = $("input[type=radio][name=proxy-enable]:checked").val();
            var host = $("#proxy-host").val();
            var port = $("#proxy-port").val();
            var username = $("#proxy-username").val();
            var password = $("#proxy-password").val();
            var nonProxyHost = $("#non-proxy-host").val();

            proxy.enable = enable == "0" ? true : false;
            proxy.host = host;
            proxy.port = port;
            proxy.username = username;
            proxy.password = password;
            proxy.nonProxyHost = nonProxyHost;

            return proxy;
        },

        /**
         * get proxy setting from server
         */
        getProxySetting: function() {
            var _this = this;

            $.ajax({
                type: "GET",
                async: false,
                dataType: "json",
                url: "rest/setting/proxy",
                success: function(proxy) {
                    _this.proxy = proxy;
                    _this.reset(proxy);
                },
                error: function(msg) {
                    console.error("get proxy setting error: [" + msg + "]");
                },
                timeout: 10000, // 10s
            });
        },

        /**
         * save proxy setting to server
         */
        saveProxySetting: function(proxy) {
            var _this = this;

            $.ajax({
                type: "POST",
                async: false,
                dataType: "json",
                url: "rest/setting/proxy",
                data: {
                    proxy: JSON.stringify(proxy)
                },
                success: function(proxy) {
                    _this.proxy = proxy;
                    alert("save proxy setting success!");
                    _this.close();
                },
                error: function(msg) {
                    console.error("save proxy setting error: [" + msg + "]");
                },
                timeout: 10000, // 10s
            });
        }

    });

    return {
        init: init
    };

});