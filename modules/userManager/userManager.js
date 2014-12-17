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
 * @module user manager
 */
define([], function() {

    var init = function() {

        Arbiter.subscribe(EVENT_INITIATION_PUBLISH_PAGE_LOADED, {
            async: true
        }, function() {
            UserManager.login("guest", "");
            UserManager.subscribe();
        });

    };
    var UserManager = {
        loginedUser: null,
        userInfo: null,
        login: function(userId, password) {
            this.loginedUser = userId;
            this.publishUserInfo();
        },
        logOff: function() {
            this.loginedUser = "";
        },
        register: function(userId, email, password) {
        },
        remove: function(userId) {
        },
        rename: function(oldUserId, newUserId) {
        },
        publishUserInfo: function() {
            var _this = this;
            $.ajax({
                type: "POST",
                async: true,
                url: window.location.pathname + "fileServlet",
                data: "operateType=read&path=data/" + this.loginedUser + "/userinfo.json",
                dataType: 'json',
                success: function(userInfo) {
                    _this.userInfo = userInfo;
                    Arbiter.publish(EVENT_USERM_MANAGER_PUBLISH_USER_LOGIN, userInfo, {
                        async: true
                    });
                },
                error: function(msg) {
                    console.error("Get user subscribe services error [" + msg + "]");
                    _this.userInfo = null;
                    Arbiter.publish(EVENT_USERM_MANAGER_PUBLISH_USER_LOGIN, {
                        user: ""
                    }, {
                        async: true
                    })

                }
            });

        },
        updateUserInfo: function(userInfo, eventId) {
            var info = null;
            var _this = this;
            var isAsync = false;
            if (eventId) {
                isAsync = true;
            }
            $.ajax({
                type: "POST",
                async: false,
                url: window.location.pathname + "fileServlet",
                data: "operateType=save&path=data/" + this.loginedUser + "/userinfo.json&content="
                        + JSON.stringify(userInfo),
                dataType: 'json',
                success: function(updateResult) {
                    info = userInfo;
                    if (eventId) {
                        Arbiter.publish(EVENT_USERM_MANAGER_PUBLISH_UPADTE_LOGINED_USER_INFO, {
                            triggerId: eventId,
                            result: updateResult
                        }, {
                            async: true,
                            persist: false
                        })
                    }
                    if (info) {
                        _this.userInfo = userInfo;
                    }
                },
                error: function(msg) {
                    console.error("Get user subscribe services error [" + msg + "]");
                    info = false;
                    if (eventId) {
                        Arbiter.publish(EVENT_USERM_MANAGER_PUBLISH_UPADTE_LOGINED_USER_INFO, {
                            triggerId: eventId,
                            result: false
                        }, {
                            async: true
                        })
                    }
                }
            });
            if (!isAsync) {
                return info;
            }
        },
        subscribe: function() {
            var _this = this;
            Arbiter.subscribe(EVENT_USERM_MANAGER_SUBSCRIBE_UPADTE_LOGINED_USER_INFO, {
                async: true
            }, function(data) {
                var eventId = data.triggerId;
                var userInfo = data.user;
                _this.updateUserInfo(userInfo, eventId);

            });
        }
    };

    var LoginView = Backbone.View.extend({
        render: function() {
        },
        open: function() {
            $("#" + this.id).show();
        },
        close: function() {
            $("#" + this.id).hide();
        },
        events: []
    });

    var RegisterView = Backbone.View.extend({
        render: function() {
        },
        open: function() {
            $("#" + this.id).show();
        },
        close: function() {
            $("#" + this.id).hide();
        },
        events: []
    });
    return {
        init: init
    };
});