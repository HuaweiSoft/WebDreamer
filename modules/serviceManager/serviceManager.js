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
 *Load the services meta data defined in /services/metadata.json
 *Display all services on the services board of the top toolbar base on meta data loaded
 *Register meta data loaded to MetaHub
 */
define(
        [ "text!services/ServiceGroup.json", "css!modules/serviceManager/service",
                "text!modules/serviceManager/model.json", "text!modules/serviceManager/service_board_tmpl.xml",
                "text!modules/serviceManager/service_import_tmpl.xml", "css!modules/serviceManager/service_import",
                "text!modules/serviceManager/service_create_tmpl.xml", "css!modules/serviceManager/service_create",
                "text!modules/serviceManager/service_show_all_tmpl.xml", "css!modules/serviceManager/service_show_all",
                "util", "metaHub" ],
        function(serviceGroup, css, model, boardTmpl, serviceImportTmpl, serviceImportCss, serviceCreateTmpl,
                serviceCreateCss, serviceDisplayTmpl, serviceDisplayCss, util, metaHub) {

            var init = function() {
                Arbiter.subscribe(EVENT_TOOLBAR_PUBLISH_RENDERED, {
                    async: true
                }, function(data) {
                    var boardId = data.servicesBoardId;
                    var boardView = new ServicesBoardView({
                        el: $("#" + boardId)
                    });
                    boardView.subscribe();

                    // service import view
                    var serviceImportView = new ServiceImportView({
                        el: $("body")
                    });
                    serviceImportView.init();
                    serviceImportView.serviceBoardView = boardView;
                    // service create view
                    var serviceCreateView = new ServiceCreateView({
                        el: $("body")
                    });
                    serviceCreateView.subscribeMsg();
                });
            };

            /**
             * Define services display view class to display all services on the services board of toolbar
             */
            var ServicesBoardView = Backbone.View.extend({

                numberPerPage: 6,
                totalPage: 1,
                currentPage: 1,
                services: [],
                servicesMeta: [],
                allServices: [],
                isFlowDesignerOpened: false,
                loginedUser: null,
                render: function() {

                },

                /**
                 * Display all services the specified page contains on the services board
                 * 
                 * @param {Number} pageNo
                 */
                toPage: function(pageNo) {
                    var start = (pageNo - 1) * this.numberPerPage;
                    var end = pageNo * this.numberPerPage - 1;
                    if (start < 0) {
                        return;
                    }
                    this.currentPage = pageNo;
                    var pageHTML = "";
                    var pageServices = [];
                    for ( var i = 0; i < this.services.length; i++) {
                        if (i >= start && i <= end) {
                            pageServices.push(this.services[i]);
                        }
                    }
                    if (pageServices.length == 0) {
                        this.$el.html("");
                    } else {
                        pageHTML = _.template(boardTmpl, {
                            services: pageServices
                        });
                        this.$el.html(pageHTML);
                        this.enableDragable();
                    }
                },

                upPage: function() {
                    this.toPage(this.currentPage--);
                },

                nextpage: function() {
                    this.toPage(this.currentPage++);
                },

                registerServiceMetaData: function() {
                    metaHub.clearServiceMetas();
                    for ( var i = 0; i < this.servicesMeta.length; i++) {
                        var items = this.servicesMeta[i];
                        for ( var p = 0; p < items.services.length; p++) {
                            var service = items.services[p];
                            var  icon = "services/" + service.serviceName + "/icon/" + service.icon;
                            var serviceMeta;
                            if (service.isJsApi == true) {
                                var jsApiInfo = service.jsApiInfo;
                                serviceMeta = {
                                    name: service.serviceName,
                                    displayName: service.serviceName,
                                    provider: service.createdBy,
                                    type: service.type,
                                    className: jsApiInfo.className,
                                    functionName: jsApiInfo.functionName,
                                    jsFileName: jsApiInfo.jsFileName,
                                    icon: icon,
                                    params: jsApiInfo.params,
                                    hasCallback: jsApiInfo.hasCallback,
                                    result: {
                                        return: jsApiInfo.result.return,
                                        type: jsApiInfo.result.type,
                                        format: jsApiInfo.result.format
                                    }
                                };
                            }
                            else {
                                var parameters = [];
                                for (var j = 0; j < service.parameterList.length; j++) {
                                    parameters.push(service.parameterList[j].name);
                                }
                                serviceMeta = {
                                    name: service.serviceName,
                                    displayName: service.serviceName,
                                    provider: service.createdBy,
                                    type: service.type,
                                    className: "wd_service." + service.serviceName,
                                    functionName: "request",
                                    jsFileName: service.serviceName + ".js",
                                    icon: icon,
                                    params: parameters,

                                    hasCallback: true,
                                    result: {
                                        return: true,
                                        type: service.outputParameterType,
                                        format: service.outputParameterFormat
                                    }
                                };
                            }
                            metaHub.registerApiMeta(serviceMeta);
                        }
                    }
                },

                update: function(userInfo) {
                    this.setServices();
                },
                setServices: function(services) {
                    if (services) {
                        this.servicesMeta = [];
                        util.deepCopy(this.servicesMeta, services);
                    } 
                    if (this.loginedUser != null) {
                        this.services = [];
                        for ( var i = 0; i < this.servicesMeta.length; i++) {
                            var items = this.servicesMeta[i];
                            for ( var p = 0; p < items.services.length; p++) {
                                var service = items.services[p];
                                if (this.checkServiceDisplay(service)) {
                                    var copied = util.deepCopy({}, service);
                                    copied.icon = "services/" + copied.serviceName + "/icon/" + copied.icon;
                                    this.services.push(copied);
                                }

                            }
                        }
                        console.debug("-----------------service load:"+this.services.length);
                        this.toPage(1);
                        this.registerServiceMetaData();
                    }
                    this.registerFlowOpenEvent();
                },
                checkServiceDisplay: function(service) {
                    if (service.createdBy == "SYSTEM") {
                        return true;
                    } else {
                        if (service.isPrivate) {

                            if (this.loginedUser.user != service.createdBy) {
                                return false;
                            } else {
                                for ( var i = 0; i < this.loginedUser.subscribeServices.length; i++) {
                                    if (service.serviceName == this.loginedUser.subscribeServices[i]) {
                                        return true;
                                    }
                                }
                                return false;
                            }
                        } else {
                            for ( var i = 0; i < this.loginedUser.subscribeServices.length; i++) {
                                if (service.serviceName == this.loginedUser.subscribeServices[i]) {
                                    return true;
                                }
                            }
                            return false;
                        }
                    }
                },
                registerFlowOpenEvent: function() {
                    var _this = this;
                    Arbiter.subscribe(EVENT_FLOW_OPEN, function(data) {
                        _this.isFlowDesignerOpened = true;
                    });
                    Arbiter.subscribe(EVENT_FLOW_CLOSE, function(data) {
                        _this.isFlowDesignerOpened = false;
                    });
                },

                enableDragable: function() {
                    var $children = this.$el.children();
                    for ( var i = 0; i < $children.length; i++) {
                        this.bindDragEvent($children[i]);
                    }
                },
                subscribe: function() {
                    var _this = this;
                    Arbiter.subscribe(EVENT_USERM_MANAGER_PUBLISH_USER_LOGIN, function(data) {
                        _this.loginedUser = data;
                        _this.setServices();
                    });
                },
                bindDragEvent: function(itemEl) {
                    var $item = $(itemEl);
                    var serviceName = $item.attr("type");

                    var _this = this;
                    function dragging(event) {
                        $item.css("top", "").css("left", "");
                        if (!_this.isFlowDesignerOpened) {
                            // cancel the drag
                            return;
                        }
                        $("#flow_service_moving").css("top", event.e.clientY - 15 + "px").css("left",
                                event.e.clientX - 15 + "px").show();
                    }

                    function dragEnd(event) {
                        $item.css("top", "").css("left", "");
                        if (!_this.isFlowDesignerOpened) {
                            // cancel the drag
                            return;
                        }
                        Arbiter.publish(EVENT_TOOLBAR_SERVICE_DRAG_END, {
                            time: (new Date()).getTime(),
                            apiName: serviceName
                        });
                        $("#flow_service_moving").hide();
                    }

                    function dragStart(event) {
                        if (!_this.isFlowDesignerOpened) {
                            // cancel the drag
                            return;
                        }
                        if ($("#service-import-panel").css("display") != "none") {
                            Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE, null, {
                                asyn: true
                            });
                            $("#service-import-panel").hide();
                        }

                        var html = util.getOuterHTML(itemEl).replace("id=\"", "logicid=\"").replace("onmouseup",
                                "logiconmouseup").replace("onmouseup", "logiconmouseup").replace("ondblclick",
                                "logicondblclick").replace("onmouseover", "logiconmouseover").replace("onmouseout",
                                "logiconmouseout").replace("title=", "logicunittitle=").replace("\"api_item\"",
                                "\"api_item_drag\"");

                        var $moving = $("#flow_service_moving");
                        $moving.html(html).css("left", itemEl.offsetLeft + 12 + "px").css("top",
                                itemEl.offsetTop + 59 + "px").show();
                        Arbiter.publish(EVENT_TOOLBAR_SERVICE_DRAG_BEGIN, {
                            time: (new Date()).getTime(),
                            apiName: serviceName
                        });
                    }

                    var dragobj = new YAHOO.util.DD(itemEl.id);
                    dragobj.subscribe("endDragEvent", dragEnd);
                    dragobj.subscribe("startDragEvent", dragStart);
                    dragobj.subscribe("dragEvent", dragging);
                },

                events: {}
            });
            /**
             * Define import service to services board(open a panel to display all services or register new service) view class 
             * TO　DO
             */
            var ServiceImportView = Backbone.View
                    .extend({
                        id: "service-import-panel",
                        selectedGroup: "",
                        operateService: "",
                        unitOfServiceTmpl: "",
                        serviceOptMenuTmpl: "",
                        panelTmpl: "",
                        services: [],
                        loginedUser: null,
                        serviceBoardView: null,
                        openType: "",
                        USER_SERVICES_UPDATE_USERINFO_EVENT: 'SERVICE_MANAGER_ADD_SERVICE_TO_USER_SERVICES_UPDATE_USERINFO_EVENT',

                        init: function() {
                            this.loadServices();
                            this.panelTmpl = $($(serviceImportTmpl).children()[0]).html();
                            this.unitOfServiceTmpl = $($(serviceImportTmpl).children()[1]).html().replace(/&lt;/g, "<")
                                    .replace(/&gt;/g, ">");
                            this.serviceOptMenuTmpl = $($(serviceImportTmpl).children()[2]).html();
                            this.$el.append(this.panelTmpl);
                            $view = $("#" + this.id);
                            $document = $(window);
                            var width = $view.outerWidth();
                            var height = $view.outerHeight();
                            var left = $document.width() / 2 - width / 2;
                            var top = $document.height() / 2 - height / 2;
                            $view.css("top", top + "px");
                            $view.css("left", left + "px");

                            this.subscribeMsg();
                            this.renderGroupTabs();
                           
                            this.renderServiceOptMenu();
                        },
                        open: function() {
                            this.renderServicesByGroup();
                            $("#" + this.id).show();
                            Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, null, {
                                asyn: true
                            });
                        },
                        close: function() {
                            $("#" + this.id).hide();
                            Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE, null, {
                                asyn: true
                            });
                        },
                        subscribeMsg: function() {
                            var _this = this;
                            Arbiter.subscribe("toolbar/service/import", function(data) {
                                _this.openType = "import";
                                _this.open();
                            });

                            Arbiter.subscribe(EVENT_USERM_MANAGER_PUBLISH_USER_LOGIN, function(data) {
                                _this.loginedUser = data;
                            });
                            Arbiter.subscribe(EVENT_USERM_MANAGER_PUBLISH_UPADTE_LOGINED_USER_INFO, function(data) {
                                if (data.triggerId == _this.USER_SERVICES_UPDATE_USERINFO_EVENT) {
                                    $("#mask_maskpanel_container").css("z-index", 8);
                                    if (data.result) {
                                        alert('"' + _this.operateService + '" added successfully.');
                                        _this.serviceBoardView.update(_this.loginedUser);

                                    } else {
                                        alert('"' + _this.operateService + '" added fail.');
                                    }
                                }
                            });

                            Arbiter.subscribe("service/create", function(data) {
                                _this.loadServices();
                                _this.switchGroupTab(data.service.type);
                            });
                            Arbiter.subscribe("service/update", function(data) {
                                alert("\"" + data.service.serviceName + "\" has been updated.");
                                _this.loadServices();
                                _this.switchGroupTab(data.service.type);
                            });

                            Arbiter.subscribe("toolbar/service/container/all", function() {
                                _this.openType = "showAll";
                                _this.open();
                            });

                        },
                        clickMenuItem: function(event) {
                            var $target = $(event.target);
                            var msg = $target.attr("msg");
                            if (!msg) {
                                return;
                            }
                            this.close();
                            Arbiter.publish(msg, null, {
                                asyn: true
                            });
                        },
                        renderGroupTabs: function() {
                            var jsonGroup = JSON.parse(serviceGroup);
                            var tabsHTML = "";
                            for ( var i = 0; i < jsonGroup.length; i++) {
                                tabsHTML += "<div class='service_group_tab' servicegroup='" + jsonGroup[i] + "'>"
                                        + jsonGroup[i] + "</div>";
                            }
                            $("#service_group_tab_container").html(tabsHTML);
                            this.switchGroupTab(jsonGroup[0]);
                        },
                        switchGroupTab: function(name) {
                            this.selectedGroup = name;
                            var $tabs = $("#service_group_tab_container").children();
                            for ( var i = 0; i < $tabs.length; i++) {
                                var $tab = $($tabs[i]);
                                if ($tab.attr("servicegroup") == name) {
                                    $tab.attr("class", "service_group_tab_selected");
                                } else {
                                    $tab.attr("class", "service_group_tab");
                                }
                            }
                            this.renderServicesByGroup();
                        },
                        renderServicesByGroup: function() {
                            var servicesOfGroup = [];
                            for ( var i = 0; i < this.services.length; i++) {
                                var groupObj = this.services[i];
                                if (groupObj.group == this.selectedGroup) {
                                    servicesOfGroup = groupObj.services;
                                    break;
                                }
                            }
                            if (servicesOfGroup.length == 0) {
                                $("#service_list_container").html("");
                            } else {
                                var html = "";
                                var datas = {
                                    services: servicesOfGroup
                                };
                                if (this.openType == "import") {
                                    $("#service_list_create").show();
                                    var tmpl = this.unitOfServiceTmpl.replace("imagesource", "src");

                                    var html = _.template(tmpl, {
                                        services: servicesOfGroup
                                    });
                                    $("#service_list_container").html(html);
                                } else if (this.openType == "showAll") {
                                    $("#service_list_create").hide();
                                    html = _.template(serviceDisplayTmpl, {
                                        services: servicesOfGroup
                                    });
                                    $("#service_list_container").html(html);
                                    var $children = $("#service_list_container").children();
                                    for ( var i = 0; i < $children.length; i++) {
                                        this.serviceBoardView.bindDragEvent($children[i]);
                                    }

                                }

                            }
                        },
                        clickGroupTabEvent: function(event) {
                            var $tab = $(event.target);
                            this.switchGroupTab($tab.attr("servicegroup"));
                        },

                        renderServiceOptMenu: function() {
                            this.$el.append(this.serviceOptMenuTmpl);
                            var $view = $("#service_list_operate_menu_container");
                            var $document = $(window);
                            var width = $view.outerWidth();
                            var height = $view.outerHeight();
                            var left = $document.width() / 2 - width / 2;
                            var top = $document.height() / 2 - height / 2;
                            $view.css("top", top + "px");
                            $view.css("left", left + "px");
                        },
                        openServiceOptMenu: function() {
                            $("#" + this.id).css("z-index", 6);
                            $("#service_list_operate_menu_container").show();
                        },
                        closeServiceOptMenu: function() {
                            $("#service_list_operate_menu_container").hide();
                            $("#" + this.id).css("z-index", 10);
                        },
                        clickServiceOptMenuItem: function(event) {
                            var _this = this;
                            var operate = $(event.target).attr("operate");
                            if (operate == "delete") {
                                if (_this.getServiceByName(_this.operateService).createdBy == "SYSTEM") {
                                    alert("\"" + _this.operateService
                                            + "\" is system defined service can't been deleted.");
                                    return;
                                } else {
                                    this.deleteRegisteredServie();
                                }
                            } else if (operate == "add") {
                                this.addServiceToUser();
                            } else if (operate == "edit") {
                                this.editService();
                            }
                        },
                        getServiceByName: function(name) {
                            for ( var i = 0; i < this.services.length; i++) {
                                for ( var p = 0; p < this.services[i].services.length; p++) {
                                    var service = this.services[i].services[p];
                                    if (service.serviceName == name) {
                                        return service;
                                    }

                                }
                            }
                            return null;
                        },
                        editService: function() {

                            var editedService = this.getServiceByName(this.operateService);
                            var result = this.checkServiceUsed(this.operateService);
                            var canEdit = true;
                            var title = "Edit Service";
                            if (result.isImported || result.isUsed) {
                                canEdit = true;
                                title = "Service has been used can't been edited."
                            }

                            Arbiter.publish("service/edit/update", {
                                title: title,
                                mode: "edit",
                                lock: canEdit,
                                service: editedService
                            }, {
                                asyn: true
                            });
                        },
                        addServiceToUser: function() {

                            if (this.getServiceByName(this.operateService).createdBy == "SYSTEM") {
                                alert('"' + this.operateService + '" service has been added to your services.');
                                return;
                            }
                            var added = false;
                            var userSerivce = [];
                            if (this.loginedUser != "" && this.loginedUser.subscribeServices) {
                                userSerivce = this.loginedUser.subscribeServices;
                            }
                            for ( var i = 0; i < userSerivce.length; i++) {

                                if (this.operateService == userSerivce[i]) {
                                    added = true;
                                    break;
                                }

                            }
                            if (added) {
                                alert('"' + this.operateService + '" service has been added to your services.');
                            } else {
                                this.loginedUser.subscribeServices.push(this.operateService);
                                $("#mask_maskpanel_container").css("z-index", 11);
                                Arbiter.publish(EVENT_USERM_MANAGER_SUBSCRIBE_UPADTE_LOGINED_USER_INFO, {
                                    triggerId: this.USER_SERVICES_UPDATE_USERINFO_EVENT,
                                    user: this.loginedUser
                                }, {
                                    asyn: true
                                });

                            }

                        },

                        clickServiceMenu: function(event) {
                            var $target = $(event.target);
                            this.operateService = $target.attr("name");
                            this.openServiceOptMenu();
                        },
                        notifyCreateNewService: function() {
                            $("#" + this.id).css("z-index", 6);
                            Arbiter.publish("service/edit/create", {
                                title: "Create New Service",
                                mode: "create",
                                group: this.selectedGroup
                            }, {
                                asyn: true
                            });
                        },
                        deleteRegisteredServie: function() {
                            var _this = this;
                            if (confirm('Are you sure to delete "' + this.operateService + '" service ?')) {

                                var result = this.checkServiceUsed(_this.operateService);
                                if (result.isUsed || result.isImported) {
                                    alert("Can't delete \"" + _this.operateService
                                            + "\" service because it has been used.");
                                    return;
                                }
                                $.ajax({
                                    type: "Delete",
                                    url: "rest/services/" + this.operateService, //
                                    dataType: "json",
                                    success: function(data, textStatus, jqXHR) {
                                        if (textStatus == "success") {
                                            _this.loadServices();
                                            alert("\"" + _this.operateService + "\" has been deleted.");
                                        } else {
                                            alert("Error, please try again later.");
                                        }
                                    },

                                    error: function(jqXHR, textStatus, errorThrown) {
                                        alert("Error, please try again later.");
                                    },

                                    timeout: 10000, // 10s
                                    asyn: true
                                });
                            }

                        },
                        checkServiceUsed: function(serviceName) {
                            var _this = this;
                            var result = {
                                "isUsed": false,
                                "isImported": false
                            };
                            $.ajax({
                                type: "GET",
                                async: false,
                                dataType: "json",
                                url: "rest/services",
                                data: "operate=isUsed&service=" + serviceName,
                                success: function(data) {
                                    result = data;
                                },
                                error: function(msg) {
                                    console.error("check service is used error [" + msg + "]");
                                },
                                timeout: 10000, // 10s

                            });

                            return result;

                        },
                        loadServices: function() {
                            var _this = this;
                            $.ajax({
                                type: "GET",
                                dataType: "json",
                                url: "rest/services",
                                success: function(data) {
                                    _this.services = data;
                                    _this.renderServicesByGroup();
                                    _this.serviceBoardView.setServices(data);
                                },
                                error: function(msg) {
                                    console.error("Load services error [" + msg + "]");
                                    _this.services = [];
                                    _this.renderServicesByGroup();
                                    _this.serviceBoardView.setServices(_this.services);
                                },
                                timeout:10000,
                                async: true
                            });
                        },
                        events: {
                            "click #serivce-import-panel-close-btn": "close",
                            "click #service-import-panel div[class='service_group_tab']": "clickGroupTabEvent",
                            "click #service_list_container div[class='service_list_item_menu']": "clickServiceMenu",
                            "click #service_list_operate_menu_container_close": "closeServiceOptMenu",
                            "click #service_list_create": "notifyCreateNewService",
                            "click #service_list_operate_menu_container div[class^='service_list_operate_menu_div']": "clickServiceOptMenuItem"
                        }
                    });

            /**
             * Display all services by category on a panel
             * TO DO
             */
            var ServiceDisplayView = Backbone.View.extend({

                id: "service-display-panel",

                services: {},

                render: function() {
                    var tmpl = _.template(serviceDisplayTmpl, {
                        services: this.services
                    });
                    this.$el.append(tmpl);
                    this.close();

                    $view = $("#" + this.id);
                    $document = $(window);
                    var width = $view.outerWidth();
                    var height = $view.outerHeight();
                    var left = $document.width() / 2 - width / 2;
                    var top = $document.height() / 2 - height / 2;
                    $view.css("top", top + "px");
                    $view.css("left", left + "px");

                    this.subscribeMsg();
                },
                open: function() {
                    $("#" + this.id).show();
                    Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, null, {
                        asyn: true
                    });
                },
                close: function() {
                    $("#" + this.id).hide();
                    Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE, null, {
                        asyn: true
                    });
                },
                subscribeMsg: function() {
                    var _this = this;
                    Arbiter.subscribe("service/display/open", function(data) {
                        _this.open();
                    });
                },

                events: {}
            });

            /**
             * panel to create new service
             */
            var ServiceCreateView = Backbone.View
                    .extend({

                        id: "service-create-panel",

                        /**
                         * parameter number
                         */
                        paramNum: 0,

                        /**
                         * save path of icon, full path is iconTmpPath/uuid/filename
                         */
                        iconTmpPath: "tmp/icon",

                        uuid: "",

                        rendered: false,

                        /**
                         * create or update
                         */
                        mode: "",

                        render: function(data) {
                            this.mode = data.mode;

                            var title = data.title;
                            var service = data.service;

                            var tmpl = _.template(serviceCreateTmpl, {
                                title: title,
                                mode: this.mode
                            });
                            this.$el.append(tmpl);

                            this.initPanel();
                            this.bindEventHandler();
                            this.reset();
                            if (service) {
                                this.loadService(service);
                            }
                            this.rendered = true;
                        },

                        open: function(data) {
                            if (this.rendered) {
                                this.destroy();
                            }
                            if (!this.rendered) {
                                this.render(data);
                            }
                            if (this.mode == "create") {
                                $("#service-create-panel #serviceType").val(data.group);
                            } else if (this.mode == "edit") {
                                $("#service-create-panel #serviceType").val(data.service.type);
                            }
                            $("#" + this.id).show();

                        },

                        close: function() {
                            $("#" + this.id).hide();
                            if (this.mode == "create") {
                                $("#service-import-panel").css("z-index", 10);
                            }

                        },

                        destroy: function() {
                            this.pageNum = 0;
                            this.uuid = "";
                            this.rendered = false;
                            this.mode = "";
                            $("#" + this.id).remove();
                        },

                        initPanel: function() {
                            $view = $("#" + this.id);
                            $document = $(window);
                            var width = $view.outerWidth();
                            var height = $view.outerHeight();
                            var left = $document.width() / 2 - width / 2;
                            var top = $document.height() / 2 - height / 2;
                            $view.css("top", top + "px");
                            $view.css("left", left + "px");
                            $view.css("height", "auto");

                            $("#service-create-panel-form").css("max-height", ($document.height() / 2) + 50 + "px");

                            var serviceTypes = this.getServiceType();
                            var $serviceType = $("#serviceType");
                            var i = 0;
                            for (i = 0; i < serviceTypes.length; i++) {
                                var option = "<option value=\"" + serviceTypes[i] + "\">" + serviceTypes[i]
                                        + "</option>";
                                $serviceType.append(option);
                            }
                        },

                        subscribeMsg: function() {
                            var _this = this;
                            Arbiter.subscribe("service/edit/create", function(data) {
                                _this.open(data);
                            });

                            Arbiter.subscribe("service/edit/update", function(data) {
                                _this.open(data);
                                if (_this.mode == "edit" && data.service.createdBy == "SYSTEM" || data.lock) {
                                    $("#service-create-panel #service-update-btn").hide();
                                } else {
                                    $("#service-create-panel #service-update-btn").show();
                                }
                            });

                            Arbiter.subscribe(EVENT_UPLOAD_PUBLISH_UPLOADED, function(data) {
                                _this.setIcon(data);
                            });
                        },

                        clickMenuItem: function(event) {

                        },

                        bindEventHandler: function() {
                            var _this = this;

                            var $backBtn = $("#service-back-btn");
                            $backBtn.on("click", function(event) {
                                _this.backToServiceImportView();
                            });

                            var $resetBtn = $("#service-reset-btn");
                            $resetBtn.on("click", function(event) {
                                _this.reset();
                            });

                            var $createBtn = $("#service-create-btn");
                            $createBtn.on("click", function(event) {
                                _this.createService();
                            });

                            var $addParamBtn = $("#parameter-add-btn");
                            $addParamBtn.on("click", function(event) {
                                _this.addParameter();
                            });

                            var $selectIconBtn = $("#icon-select-btn");
                            $selectIconBtn.on("click", function(event) {
                                _this.openIconSelectPanel();
                            });

                            var $updateBtn = $("#service-update-btn");
                            $updateBtn.on("click", function(event) {
                                _this.updateService();
                            });
                        },

                        // event handler
                        backToServiceImportView: function() {
                            this.close();
                        },

                        loadService: function(service) {
                            $("input[id=user]").val(service.createdBy);
                            $("input[id=serviceName]").val(service.serviceName);
                            $("input[id=serviceName]").prop("disabled", true);
                            $("#serviceType").val(service.type);
                            $("input[id=serviceUrl]").val(service.url);
                            $("#method").val(service.methodType);
                            var isPrivate = service.isPrivate ? "private" : "public";
                            $("input[type=radio][name=isPrivate][value=" + isPrivate + "]").attr("checked", "checked");
                            $("#parameterFormat").val(service.parameterFormatType);

                            this.paramNum = 1;
                            this.removeAllParameter();
                            var i = 0;
                            for (i = 0; i < service.parameterList.length; i++) {
                                var curParamId = "param-" + this.paramNum;
                                var parameter = service.parameterList[i];
                                this.addParameter();

                                var $param = $("#" + curParamId);
                                var children = $param.children();
                                var $paramKey = $(children[0]);
                                var $paramFixedValue = $(children[1]);
                                var $paramDefaultValue = $(children[2]);
                                var $paramType = $(children[3]);
                                var $paramFixedSet = $(children[4]);

                                var isFixedValueSet = parameter.fixedValue ? true : false;
                                $paramFixedSet.attr("checked", isFixedValueSet);
                                $paramKey.val(parameter.name);

                                var checked = $paramFixedSet.is(":checked");

                                if (checked) {
                                    $paramFixedValue.val(parameter.fixedValue);
                                    $paramFixedValue.show();
                                    $paramDefaultValue.val("");
                                    $paramDefaultValue.hide();
                                    // $paramType.get(0).selectedIndex = parameter.type;
                                } else {
                                    $paramFixedValue.val("");
                                    $paramFixedValue.hide();
                                    $paramDefaultValue.val(parameter.defaultValue);
                                    $paramDefaultValue.show();
                                }
                                $paramType.val(parameter.type);
                                $paramType.show();
                            }

                            $("#outputParameterType").val(service.outputParameterType)
                            $("#outputParameterFormat").val(service.outputParameterFormat);
                            $("#description").val(service.description);

                            var iconPath = "services/" + service.serviceName + "/icon/" + service.icon;
                            this.showIcon(iconPath, service.icon);
                            $("#service-create-result").hide();
                        },

                        reset: function() {
                            $("input[id=user]").val("guest");
                            $("input[id=serviceName]").val("");
                            $("#serviceType").get(0).selectedIndex = 0;
                            $("input[id=serviceUrl]").val("");
                            $("#method").get(0).selectedIndex = 0;
                            $("input[type=radio][name=isPrivate][value=private]").attr("checked", "checked");
                            $("#parameterFormat").get(0).selectedIndex = 0;

                            this.paramNum = 1;
                            this.removeAllParameter();
                            // this.addParameter();

                            $("#outputParameterType").get(0).selectedIndex = 0;
                            $("#outputParameterFormat").val("");
                            $("#description").val("");

                            this.hideIcon();

                            this.uuid = "";

                            $("#service-create-result").hide();
                        },

                        getServiceType: function() {
                            var serviceTypes = JSON.parse(serviceGroup);
                            return serviceTypes;
                        },

                        generateService: function() {
                            var service = {};

                            var user = $("input[id=user]").val();
                            var serviceName = $("input[id=serviceName]").val();
                            var type = $("#serviceType").val();
                            var url = $("input[id=serviceUrl]").val();
                            var method = $("#method").val();
                            var isPrivate = $("input[type=radio][name=isPrivate]:checked").val();
                            var parameterFormat = $("#parameterFormat").val();

                            var parameters = [];
                            var $parameters = $("div[class^=parameter-input]");
                            var i = 0;
                            for (i = 0; i < $parameters.length; i++) {
                                var $param = $($parameters[i]);
                                var children = $param.children()
                                var pKey = $(children[0]).val();
                                var pFixedVal = $(children[1]).val();
                                var pDefaultVal = $(children[2]).val();
                                var pType = $(children[3]).val();
                                parameters.push({
                                    name: pKey,
                                    fixedValue: pFixedVal,
                                    defaultValue: pDefaultVal,
                                    type: pType
                                });
                            }

                            var outputParameterType = $("#outputParameterType").val();
                            var outputParameterFormat = null;
                            outputParameterFormat = $("#outputParameterFormat").val();

                            var description = $("#description").val();
                            var icon = $("#icon-name").html();

                            // validate
                            if (user.trim() == "") {
                                this.showResult(false, "user name cannot be empty!");
                                return null;
                            }
                            if (serviceName.trim() == "") {
                                this.showResult(false, "service name cannot be empty!");
                                return null;
                            }

                            service.user = user;
                            service.serviceName = serviceName;
                            service.type = type;
                            service.url = url;
                            service.method = method;
                            service.isPrivate = isPrivate == "private" ? true : false;
                            service.parameterFormat = parameterFormat;
                            service.parameters = parameters;
                            service.outputParameterType = outputParameterType;
                            service.outputParameterFormat = outputParameterFormat;
                            service.description = description;
                            service.icon = icon;

                            return service;
                        },

                        createService: function() {
                            this.hideResult();

                            var service = this.generateService();
                            if (service == null) {
                                return;
                            }

                            var _this = this;
                            $.ajax({
                                type: "POST",
                                url: "rest/services",
                                dataType: "json",
                                data: {
                                    service: JSON.stringify(service),
                                    iconTmpPath: this.uuid == "" ? null : this.iconTmpPath + "/" + this.uuid
                                },

                                success: function(data, textStatus, jqXHR) {
                                    _this.reset();
                                    _this.showResult(true, "create sucess");
                                    _this.close();
                                    _this.destroy();
                                    Arbiter.publish("service/create", {
                                        service: data
                                    }, {
                                        asyn: true
                                    });
                                },

                                error: function(jqXHR, textStatus, errorThrown) {
                                    _this.showResult(false, jqXHR.responseText);
                                },

                                timeout: 10000, // 10s
                                asyn: true
                            });
                        },

                        updateService: function() {
                            this.hideResult();
                            var service = this.generateService();
                            if (service == null) {
                                return null;
                            }

                            var _this = this;
                            $.ajax({
                                type: "POST",
                                url: "rest/services/" + service.serviceName,
                                dataType: "json",
                                data: {
                                    service: JSON.stringify(service),
                                    iconTmpPath: this.uuid == "" ? null : this.iconTmpPath + "/" + this.uuid
                                },
                                success: function(data, textStatus, jqXHR) {
                                    _this.reset();
                                    _this.showResult(true, "update sucess");
                                    _this.close();
                                    _this.destroy();

                                    Arbiter.publish("service/update", {
                                        service: data
                                    }, {
                                        asyn: true
                                    });
                                },

                                error: function(jqXHR, textStatus, errorThrown) {
                                    _this.showResult(false, jqXHR.responseText);
                                },

                                timeout: 10000, // 10s
                                asyn: true
                            });
                        },

                        addParameter: function() {
                            var $parametersDiv = $("#parameters");
                            var paramId = "param-" + this.paramNum;
                            var odd = this.paramNum % 2 == 0 ? "" : " odd";
                            this.paramNum += 1;

                            var parameterHtml = "<div id=\""
                                    + paramId
                                    + "\" class=\"parameter-input"
                                    + odd
                                    + "\">"
                                    + "<input type=\"text\" class=\"input-text-parameter-key\" placeholder=\"key\"/>"
                                    + "<input type=\"text\" class=\"input-text-parameter-value\" placeholder=\"fixed value\" style=\"display: none\"/>"
                                    + "<input type=\"text\" class=\"input-text-parameter-value\" placeholder=\"default value\"/>"
                                    + "<select class=\"input-select\">"
                                    + "<option value=\"string\" selected=\"selected\">String</option>"
                                    + "<option value=\"int\">Int</option>" + "<option value=\"json\">Json</option>"
                                    + "<option value=\"xml\">XML</option>" + "</select>"
                                    + "<input type=\"checkbox\" name=\"" + paramId + "\" id=\"checkbox-" + paramId
                                    + "\"/>fixed value" + "</div>";
                            $parametersDiv.append(parameterHtml);

                            $("#checkbox-" + paramId).attr("checked", false);

                            // bind event
                            $("input[type=checkbox][name=" + paramId + "]").on("change", function() {
                                var checked = $(this).is(":checked");
                                var $param = $("#" + paramId);
                                var children = $param.children();
                                var $paramKey = $(children[0]);
                                var $paramFixedValue = $(children[1]);
                                var $paramDefaultValue = $(children[2]);
                                var $paramType = $(children[3]);
                                if (checked) {
                                    $paramFixedValue.val("");
                                    $paramFixedValue.show();
                                    $paramDefaultValue.val("");
                                    $paramDefaultValue.hide();
                                    $paramType.get(0).selectedIndex = 0;
                                    $paramType.show();
                                } else {
                                    $paramFixedValue.val("");
                                    $paramFixedValue.hide();
                                    $paramDefaultValue.val("");
                                    $paramDefaultValue.show();
                                    $paramType.get(0).selectedIndex = 0;
                                    $paramType.show();
                                }
                            });

                        },

                        removeAllParameter: function() {
                            var $parametersDiv = $("#parameters");
                            $parametersDiv.empty();
                        },

                        openIconSelectPanel: function() {
                            this.uuid = this.generateUUID();
                            Arbiter.publish(EVENT_UPLOAD_SUBSCRIBE_OPEN, {
                                "suffix": [ ".gif", ".png", ".jpg", ".jpeg" ],
                                "savePath": this.iconTmpPath + "/" + this.uuid,
                                "maxSize": "10",
                                "triggerId": this.id
                            }, {
                                asyn: true
                            });
                        },

                        setIcon: function(data) {
                            // if(data.triggerId != this.id) {
                            // return;
                            // }
                            var iconName = data.name;
                            var iconPath = data.path;

                            this.showIcon(iconPath + "/" + iconName, iconName);
                        },

                        showIcon: function(iconPath, iconName) {
                            $("#icon-display").css("border", "1px dotted #000").css("width", "60px").css("height",
                                    "60px").css("background", "url(" + iconPath + ") no-repeat").css("background-size",
                                    "60px 60px");
                            $("#icon-name").html(iconName);

                            $("#icon-display").show();
                            $("#icon-name").show();
                        },

                        hideIcon: function() {
                            $("#icon-display").hide();
                            $("#icon-name").hide();
                        },

                        showResult: function(success, msg) {
                            $result = $("#service-create-result");
                            if (success) {
                                $result.removeClass("error");
                                $result.addClass("success");
                            } else {
                                $result.removeClass("success");
                                $result.addClass("error");
                            }

                            $result.html(msg);
                            $result.show();
                        },

                        hideResult: function() {
                            $("#service-create-result").hide();
                        },

                        generateUUID: function() {
                            var d = new Date().getTime();
                            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                                var r = (d + Math.random() * 16) % 16 | 0;
                                d = Math.floor(d / 16);
                                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
                            });
                            return uuid;
                        },

                        events: {}
                    });

            return {
                init: init
            };

        });