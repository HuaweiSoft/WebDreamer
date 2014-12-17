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
 *Initialize the layout in YUI layout model of index.html 
 */
define([ "css!modules/deploy/publishToCFRuntime/publishCF",
        "text!modules/deploy/publishToCFRuntime/publish_cf_tmpl.xml", "util" ], function(css, tmpl, util) {

    var init = function() {

        /**Instance a layout view and initialize it*/
        var view = new PublishView({
            el: 'body'
        });
        view.render();
    };

    /**Define the class of layout view */
    var PublishView = Backbone.View.extend({
        panelId: "publish-cf-panel",
        proxyTrs: null,
        proxy: null,
        cfconfig: null,
        myinterval: null,
        myUuid: "",
        triggerBackSavedId: "publish-cf-rquest-back-saved-event-id",
        user: null,
        project: "",
        appStarted: false,
        render: function() {
            var _this = this;
            this.$el.append(tmpl);
            var $view = $("#" + this.panelId);
            var $document = $(window);
            var width = $view.outerWidth();
            var height = $view.outerHeight();
            var left = $document.width() / 2 - width / 2;
            var top = $document.height() / 2 - height / 2;
            $view.css("top", top + "px");
            $view.css("left", left + "px");
            $view.css("height", "auto");
            $view = $("#publish-cf-status-panel");
            width = $view.outerWidth();
            height = $view.outerHeight();
            left = $document.width() / 2 - width / 2;
            top = $document.height() / 2 - height / 2;
            $view.css("top", top + "px");
            $view.css("left", left + "px");
            $view.css("height", "auto");

            this.subscripeOperateMsg();
            $("input[name='publish-cf-proxy-enable']").bind("click", function(event) {
                _this.clickEnable(event);
            });
            this.proxyTrs = $("#publish-cf-panel-content .publish-cf-table tr");
            this.hideProxy();

        },
        clickEnable: function(event) {
            var clickedValue = $(event.target).attr("value");
            if (clickedValue == "disabled") {
                this.hideProxy();
            } else if (clickedValue == "enabled") {
                this.showProxy();
            }
        },
        showProxy: function() {
            for ( var i = 1; i <= 5; i++) {
                $(this.proxyTrs[i]).show();
            }
        },
        hideProxy: function() {
            for ( var i = 1; i <= 5; i++) {
                $(this.proxyTrs[i]).hide();
            }
        },
        generateProxySetting: function() {
            var proxy = {};

            var enable = $("input[type=radio][name=export-war-proxy-enable]:checked").val();
            var host = $("#publish-cf-proxy-host").val();
            var port = $("#publish-cf-proxy-port").val();
            var username = $("#publish-cf-proxy-username").val();
            var password = $("#publish-cf-proxy-password").val();
            var nonProxyHost = $("#publish-cf-non-proxy-host").val();

            proxy.enable = enable == "enabled" ? true : false;
            if (proxy.enable) {
                proxy.host = host;
                proxy.port = port;
                proxy.username = username;
                proxy.password = password;
                proxy.nonProxyHost = nonProxyHost;
            }

            this.proxy = proxy;
            return proxy;
        },
        getProxySetting: function() {
            var _this = this;
            if ($("#publish-cf-proxy-host").val() != "") {
                return;
            }

            $.ajax({
                type: "GET",
                async: true,
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
        checkProxy: function() {
            var proxy = this.generateProxySetting();
            if (proxy.enable) {
                if ($.trim(proxy.host) == "") {
                    alert("Host can't be null.");
                    $("#publish-cf-proxy-host").focus();
                    return false;
                } else if ($.trim(proxy.port) == "") {
                    alert("Port can't be null.");
                    $("#publish-cf-proxy-port").focus();
                    return false;
                } else if ($.trim(proxy.username) == "") {
                    alert("Username can't be null.");
                    $("#publish-cf-proxy-username").focus();
                    return false;
                } else if ($.trim(proxy.password) == "") {
                    alert("password can't be null.");
                    $("#publish-cf-proxy-password").focus();
                    return false;
                }

            }
            return true;
        },
        reset: function(proxy) {
            proxy = proxy || {};

            var enable = (proxy.enable == false ? false : true);
            var host = proxy.host;
            var port = proxy.port;
            var username = proxy.username;
            var password = proxy.password;
            var nonProxyHost = proxy.nonProxyHost;

            var index = enable ? "0" : "1";
            $("input[type=radio][name=publish-cf-proxy-enable][value=\"" + index + "\"]").attr("checked", "checked");

            $("#publish-cf-proxy-host").val(host);
            $("#publish-cf-proxy-port").val(port);
            $("#publish-cf-proxy-username").val(username);
            $("#publish-cf-proxy-password").val(password);
            $("#publish-cf-non-proxy-host").val(nonProxyHost);
        },
        checkedCfSetting: function() {
            this.getCFSetting();
            if (this.cfconfig.url == "" || this.space == "") {
                alert("Please setting cloundfoundry runtime.");
                return false;
            } else {
                if ($.trim($("#publish-cf-name").val()) == "") {
                    alert("App name can't be null.");
                    $("#publish-cf-name").focus();
                    return false;
                } else if ($.trim($("#publish-cf-url").val()) == "") {
                    alert("Access app url can't be null.");
                    $("#publish-cf-url").focus();
                    return false;
                }
            }
            return true;
        },
        notifySaveModel: function() {
            var _this = this;
            Arbiter.publish(EVENT_MODEL_TO_BACK_SAVED, {
                triggerId: _this.triggerBackSavedId
            }, {
                async: true
            });
        },
        open: function() {

            Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                "showText": true,
                "showGif": true,
                "zindex": 8
            });
            this.getCFSetting();
            this.getProxySetting();
            var cfurl = this.cfconfig.url;
            var dev = this.cfconfig.dev;
            var subffix = cfurl.replace(cfurl.split(".")[0], "");
            $("#subffix_url_publish_cf").html(subffix);
            this.notifySaveModel();
            $("#" + this.panelId).show();
        },
        openStatusPanel: function() {
            $("#publish-cf-status-panel").show();
        },
        closeStatusPanel: function() {

            $("#publish-cf-status-panel").hide();
        },
        savedProject: function(data) {
            $("#publish-cf-name").val(data.project);
            $("#publish-cf-url").val(data.project);
            this.user = data.user;
            this.project = data.project;
        },
        close: function() {
            Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
            $("#" + this.panelId).hide();
        },
        publishEvent: function() {

            if (this.checkProxy() && this.checkedCfSetting()) {
                // $("#publish-cf-panel").css("z-index", 6);

                var uuid = util.uuid(10);
                var _this = this;
                _this.myUuid = uuid;
                _this.openStatusPanel();
                $("#publish-cf-status-panel-content").append("<span>Starting...</span>");
                var postdata = "action=publishToCf&userName=" + this.user + "&project=" + this.project + "&uuid="
                        + uuid + "&proxy=" + JSON.stringify(this.proxy) + "&appName="
                        + $.trim($("#publish-cf-name").val()) + "&accessURL=" + $.trim($("#publish-cf-url").val())
                        + $("#subffix_url_publish_cf").html() + "&cfUserName=" + this.cfconfig.username
                        + "&cfPassword=" + this.cfconfig.password + "&space=" + this.cfconfig.space + "&memory="
                        + $("#publish-cf-memory-select").val() + "&disk=" + $("#publish-cf-disk-select").val()
                        + "&cfurl=" + this.cfconfig.url;

                $.ajax({
                    type: "POST",
                    async: true,
                    dataType: "json",
                    url: "rest/deploy",
                    data: postdata,
                    success: function(result) {
                        _this.startGetPublishStatus();
                    },
                    error: function(msg) {
                        alert("Export war errory,please try again later.");
                        $("#mask_maskpanel_container").css("z-index", 8);
                    },
                    timeout: 100000, // 10s
                });
            }

        },

        clearPubishMsg: function() {
            var _this = this;

            $.ajax({
                type: "GET",
                async: true,
                dataType: "text",
                url: "rest/deploy",
                data: "action=clear&uuid" + _this.myUuid,
                success: function() {
                    console.debug("Clear publish status success.");
                    if (_this.appStarted) {
                        _this.showAccessURL();
                    }
                },
                error: function(msg) {
                    console.error("Clear publish status error: [" + msg + "]");
                },
                timeout: 10000
            });
        },
        showAccessURL: function() {

            var url = "http://" + $.trim($("#publish-cf-url").val()) + $("#subffix_url_publish_cf").html();
            var urlHTML = "<div onclick=\"window.open ('" + url + "')\">Access App URL:"
                    + "<span style='color:#00f;cursor:pointer'>" + url + "</span></div>";
            $("#publish-cf-status-panel-content").append(urlHTML);

        },
        startGetPublishStatus: function() {
            var _this = this;
            _this.appStarted = false;
            this.myinterval = setInterval(function() {
                $
                        .ajax({
                            type: "POST",
                            async: true,
                            dataType: "json",
                            url: "rest/deploy",
                            data: "action=queryStatus&uuid=" + _this.myUuid,
                            success: function(result) {
                                var msg = "<div>Start...</div>";
                                if (result.length > 0) {
                                    {
                                        msg = "";
                                        for ( var i = 0; i < result.length; i++) {
                                            var dd = result[i];
                                            if (dd.indexOf("error") > 0) {
                                                msg = msg + "<div style='color:#f00'>" + result[i] + "</div>";
                                            } else if (dd.indexOf("success") > -1
                                                    || dd.toLowerCase().indexOf("finished") > -1) {
                                                msg = msg + "<div style='color:#0D960D'>" + result[i] + "</div>";
                                                if (dd.indexOf("Deploy Finished") > -1) {
                                                    clearInterval(_this.myinterval);
                                                    _this.clearPubishMsg();

                                                }
                                                if (dd.indexOf("Start app success") > -1) {
                                                    _this.appStarted = true;
                                                }
                                            } else {
                                                msg = msg + "<div>" + result[i] + "</div>";
                                            }

                                        }

                                    }
                                    $("#publish-cf-status-panel-content").html(msg);
                                }
                            },
                            error: function(msg) {

                                var tip = "<div style='color:#f00'>Export war errory,please try again later.</div>";
                                $("#publish-cf-status-panel-content").append(tip);
                                clearInterval(_this.myinterval);

                            },
                            timeout: 100000, // 10s
                        });
            }, 100);

        },
        /*** get cf setting from server */
        getCFSetting: function() {
            var _this = this;

            $.ajax({
                type: "GET",
                async: false,
                dataType: "json",
                url: "rest/setting/cf",
                success: function(config) {
                    _this.cfconfig = config;
                },
                error: function(msg) {
                    console.error("get cf setting error: [" + msg + "]");
                    _this.cfconfig = null;
                },
                timeout: 10000, // 10s
            });
        },

        /**Subscribe the notify for operating the layout from other modules*/
        subscripeOperateMsg: function() {

            var _this = this;
            Arbiter.subscribe("toolbar/deploy/cf", {
                async: true
            }, function() {
                _this.open();
            });
            Arbiter.subscribe(EVENT_MODEL_BACK_SAVED, {
                async: true
            }, function(data) {
                if (data.triggerId == _this.triggerBackSavedId) {

                    _this.savedProject(data);

                }
            });
            Arbiter.subscribe(EVENT_MODEL_BACK_SAVED_ERROR, {
                async: true
            }, function(data) {
                if (data.triggerId == _this.triggerBackSavedId) {
                    alert("Save project error,please again later.");
                    Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                    $("#" + this.panelId).hide();
                }
            });
        },
        events: {
            "click #publish-cf-close-btn": "close",
            "click #publish-cf-publish-btn": "publishEvent",
            "click #publish-app-stauts-panel-close": "closeStatusPanel"
        }
    });

    return {
        init: init
    };

});