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
define(
        [ "css!modules/deploy/exportAsWar/exportAsWar", "text!modules/deploy/exportAsWar/export_as_war_tmpl.xml",
                "util" ], function(css, tmpl, util) {

            var init = function() {

                /**Instance a layout view and initialize it*/
                var view = new ExportView({
                    el: 'body'
                });
                view.render();
            };

            /**Define the class of layout view */
            var ExportView = Backbone.View.extend({
                panelId: "export-war-proxy-setting-panel",
                triggerSaveModelId: "deploy_export_as_war_event",
                proxy: {},
                proxyTrs: null,
                render: function() {

                    var _this = this;
                    this.$el.append(tmpl);
                    if(INGORE_PROXY_SETTING){
                        this.$el.find("#export_war_proxy_setting").hide();
                    }

                    this.resetViewXY();
                    this.subscripeOperateMsg();
                    $("input[name='export-war-proxy-enable']").bind("click", function(event) {
                        _this.clickEnable(event);
                    });
                    this.proxyTrs = $("#export-war-proxy-setting-panel-content .export-war-proxy-setting-table tr");
                    this.hideProxy();
                },
                resetViewXY: function() {
                    var $view = $("#" + this.panelId);
                    var $document = $(window);
                    var width = $view.outerWidth();
                    var height = $view.outerHeight();
                    var left = $document.width() / 2 - width / 2;
                    var top = $document.height() / 2 - height / 2;
                    $view.css("top", top + "px");
                    $view.css("left", left + "px");
                    $view.css("height", "auto");
                },
                clickEnable: function(event) {
                    var _this = this;
                    var clickedValue = $(event.target).attr("value");
                    if (clickedValue == "disabled") {
                        _this.hideProxy();
                    } else if (clickedValue == "enabled") {
                        _this.showProxy();
                    }
                },
                showProxy: function() {
                    for ( var i = 1; i <= 5; i++) {
                        $(this.proxyTrs[i]).show();
                    }
                    this.resetViewXY();
                },
                hideProxy: function() {
                    for ( var i = 1; i <= 5; i++) {
                        $(this.proxyTrs[i]).hide();
                    }
                    this.resetViewXY();
                },
                generateProxySetting: function() {
                    var proxy = {};

                    var enable = $("input[type=radio][name=export-war-proxy-enable]:checked").val();
                    var host = $("#export-war-proxy-host").val();
                    var port = $("#export-war-proxy-port").val();
                    var username = $("#export-war-proxy-username").val();
                    var password = $("#export-war-proxy-password").val();
                    var nonProxyHost = $("#export-war-non-proxy-host").val();

                    proxy.enable = enable == "enabled" ? true : false;
                    if (proxy.enable) {
                        proxy.host = host;
                        proxy.port = port;
                        proxy.username = username;
                        proxy.password = password;
                        proxy.nonProxyHost = nonProxyHost;
                    }

                    return proxy;
                },
                getProxySetting: function() {
                    var _this = this;
                    if ($("#export-war-proxy-host").val() != "") {
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
                    this.proxy = proxy;
                    if (proxy.enable) {
                        if ($.trim(proxy.host) == "") {
                            alert("Host can't be null.");
                            $("#export-war-proxy-host").focus();
                            return false;
                        } else if ($.trim(proxy.port) == "") {
                            alert("Port can't be null.");
                            $("#export-war-proxy-port").focus();
                            return false;
                        } else if ($.trim(proxy.username) == "") {
                            alert("Username can't be null.");
                            $("#export-war-proxy-username").focus();
                            return false;
                        } else if ($.trim(proxy.password) == "") {
                            alert("password can't be null.");
                            $("#export-war-proxy-password").focus();
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
                    $("input[type=radio][name=export-war-proxy-enable][value=\"" + index + "\"]").attr("checked",
                            "checked");

                    $("#export-war-proxy-host").val(host);
                    $("#export-war-proxy-port").val(port);
                    $("#export-war-proxy-username").val(username);
                    $("#export-war-proxy-password").val(password);
                    $("#export-war-non-proxy-host").val(nonProxyHost);
                },
                open: function() {

                    $("#download-url").html(
                            "<span style='color:#00f'>Click Export buton to make war then download it.</span>");
                    Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                        "showText": true,
                        "showGif": true,
                        "zindex": 8
                    });
                    this.getProxySetting();
                    $("#" + this.panelId).show();

                },
                close: function() {
                    Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                    $("#" + this.panelId).hide();

                },
                expWarEvent: function() {
                    var _this = this;
                    if (_this.checkProxy()) {
                        $("#mask_maskpanel_container").css("z-index", 12);
                        _this.notifySaveModel();
                    }
                },
                notifySaveModel: function() {
                    var _this = this;
                    Arbiter.publish(EVENT_MODEL_TO_BACK_SAVED, {
                        triggerId: _this.triggerSaveModelId
                    }, {
                        async: true
                    });
                },
                expWar: function(userName, projectName) {

                    var _this = this;
                    $.ajax({
                        type: "POST",
                        async: true,
                        dataType: "json",
                        url: "rest/deploy",
                        data: "action=exportAsWar&userName=" + userName + "&project=" + projectName + "&proxy="
                                + JSON.stringify(_this.proxy) + "&uuid=" + util.uuid(10),
                        success: function(result) {
                            $("#mask_maskpanel_container").css("z-index", 8);
                            if(result.war.charAt(0) == '/')
                                result.war = result.war.substr(1);
                            $("#download-url").html(
                                    "<a href='" + result.war + "'>" + projectName
                                            + ".war</a>");
                        },
                        error: function(msg) {
                            console.error("Export war errory,please try again later.");
                            $("#mask_maskpanel_container").css("z-index", 8);

                        },
                        timeout: 100000, // 10s
                    });
                },

                /**Subscribe the notify for operating the layout from other modules*/
                subscripeOperateMsg: function() {

                    var _this = this;
                    Arbiter.subscribe("toolbar/deploy/war", {
                        async: true
                    }, function() {
                        _this.open();
                    });
                    Arbiter.subscribe(EVENT_MODEL_BACK_SAVED, {
                        async: true
                    }, function(data) {
                        if (data.triggerId == _this.triggerSaveModelId) {

                            _this.expWar(data.user, data.project);

                        }
                    });
                    Arbiter.subscribe(EVENT_MODEL_BACK_SAVED_ERROR, {
                        async: true
                    }, function(data) {
                        if (data.triggerId == _this.triggerSaveModelId) {
                            alert("Sorry,export as war error.");
                            $("#mask_maskpanel_container").css("z-index", 8);
                        }
                    });

                },
                events: {
                    "click #export-war-close-btn": "close",
                    "click #export-war-export-btn": "expWarEvent"
                }
            });

            return {
                init: init
            };

        });