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
define(
        [ "css!modules/projectManager/projectManager", "text!modules/projectManager/project_manager_tmpl.xml",
                "text!modules/projectManager/project_list_item_tmpl.xml",
                "text!modules/projectManager/project_list_no_tip.xml",
                "text!modules/projectManager/project_create_tmpl.xml", "jquery", "util", "modelManager",
                "flowDesigner", "userManager" ],
        function(css, tmpl, itemtmpl, noProTipTmpl, createProTmpl, $, util, modelManager, flowDesigner, userManager) {

            var init = function() {
                Arbiter.subscribe(EVENT_USERM_MANAGER_PUBLISH_USER_LOGIN, function(data) {
                    var mgrView = new ProjectMgrPanelView({
                        el: "body"
                    });
                    mgrView.setUser(data.user);
                    mgrView.render();
                    mgrView.listProjects();
                    mgrView.subscribeEvent();

                });
            };

            var ProjectMgrPanelView = Backbone.View
                    .extend({
                        user: "",
                        currentProjectName: "",
                        viewId: "project_mgr_view_panel",
                        rendered: false,
                        width: 600,
                        height: 500,
                        nextOperate: "",
                        projectMgr: null,
                        projectDatas: null,

                        render: function() {
                            this.$el.append(tmpl);
                            $view = $("#" + this.viewId);
                            $document = $(window);
                            var left = $document.width() / 2 - this.width / 2;
                            var top = $document.height() / 2 - this.height / 2;

                            $view.width(this.width);
                            $view.height(this.height);

                            $view.css("top", top + "px");
                            $view.css("left", left + "px");

                            this.rendered = true;
                            this.open();
                        },

                        setUser: function(userName) {
                            this.user = userName;
                        },

                        listProjects: function() {
                            var $viewBody = $("#project_mgr_container_body");
                            if (this.projectDatas == null) {
                                this.projectDatas = projectService.getUserProjects(this.user);
                            }
                            if (this.projectDatas.length == 0) {
                                $viewBody.html(noProTipTmpl);
                            } else {
                                var datas = {
                                    "datas": this.projectDatas
                                };
                                var itemHTML = _.template(itemtmpl, datas);
                                $viewBody.html(itemHTML);
                            }
                        },

                        open: function() {
                            Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                                "zindex": 8,
                                "showGif": false
                            });
                            $("#" + this.viewId).show();
                        },

                        close: function() {
                            if (this.currentProjectName == "") {
                                alert("Please open a project or create a new project!");
                            } else {
                                Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                                $("#" + this.viewId).hide();
                            }
                        },

                        openProjectEvent: function(event) {
                            var projectName = $(event.target).parents(".project_list_item").attr("project");
                            if (projectName == this.currentProjectName) {
                                alert("The project has been opened.");
                            } else {
                                this.setCurrentProjectName(projectName);
                                this.close();
                                this.toOpenProject();
                            }
                        },
                        toOpenProject: function() {
                            Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                                "showText": true
                            });
                            projectService.open(this.user, this.currentProjectName);
                        },
                        deleteProject: function(event) {
                            var projectName = $(event.target).attr("project");
                            if (confirm("Are you sure to delete [" + projectName + "] ?")) {
                                if (projectService.remove(this.user, projectName)) {
                                    var newArray = [];
                                    for ( var i = 0; i < this.projectDatas.length; i++) {
                                        if (this.projectDatas[i].name != projectName) {
                                            newArray.push(this.projectDatas[i]);
                                        }
                                    }
                                    this.projectDatas = newArray;
                                }
                                this.listProjects();
                            }

                        },

                        crateNewEvent: function() {
                            this.open();
                            var $viewBody = $("#project_mgr_container_body");
                            $viewBody.html(createProTmpl);
                            $("#new_project_name").focus();

                        },

                        toCreateProject: function() {
                            var name = $.trim($("#new_project_name").val());
                            var $tip = $("#create_pro_error");
                            if (name == "") {
                                $tip.html("Enter a project name,please.");
                            } else {
                                if (this.checkProjectNameExist(name)) {
                                    $tip.html("The project name has been used.");
                                } else {
                                    if (!projectService.create(this.user, name)) {
                                        $tip.html("Creating project error,try again later.");
                                    } else {
                                        $tip.html("");
                                        this.setCurrentProjectName(name);
                                        this.close();
                                        PROJECT_PATH = "data/" + this.user + "/" + name + "/";
                                        flowDesigner.reset();
                                        modelManager.load([], 1);
                                    }
                                }
                            }
                        },
                        setCurrentProjectName: function(projectName) {
                            this.currentProjectName = projectName;
                            document.title = projectName ? projectName + " - WebDreamer" : "WebDreamer";
                            Arbiter.publish(EVENT_MODEL_SET_PROJECT_NAME, {
                                "name": projectName
                            }, {
                                async: true
                            });
                        },
                        checkProjectNameExist: function(projectName) {
                            if (this.projectDatas.length.length == 0) {
                                return false;
                            }
                            for ( var i = 0; i < this.projectDatas.length; i++) {
                                if (this.projectDatas[i].name == $.trim(projectName)) {
                                    return true;
                                }
                            }
                            return false;
                        },
                        events: {
                            "click #project_mgr_view_panel_close": "close",
                            "click #project_mgr_view_panel_create": "crateNewEvent",
                            "click #project_create_btn": "toCreateProject",
                            "click div[class^='project_list_item_open']": "openProjectEvent",
                            "click div[class^='project_list_item_delete']": "deleteProject",
                            "click .project_list_item_column.name": "openProjectEvent"
                        },
                        subscribeEvent: function() {
                            var _this = this;
                            var EVENT_MODEL_NEW_NOTIFY_TO_SAVE = "event_model_new_notify_to_save";
                            var EVENT_MODEL_OPEN_NOTIFY_TO_SAVE = "event_model_open_notify_to_save";
                            Arbiter.subscribe(EVENT_MODEL_SAVE, function() {
                                Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                                    "showText": true
                                });
                                projectService.save(_this.user, _this.currentProjectName, false);
                            });
                            Arbiter.subscribe(EVENT_MODEL_NEW, function() {

                                Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                                    "showText": true
                                });
                                if (_this.currentProjectName != "") {
                                    _this.nextOperate = "new";
                                    projectService.save(_this.user, _this.currentProjectName, true,
                                            EVENT_MODEL_NEW_NOTIFY_TO_SAVE);
                                }
                            });
                            Arbiter.subscribe(EVENT_MODEL_OPEN, function() {
                                Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                                    "showText": true
                                });
                                _this.nextOperate = "list";
                                _this.projectDatas = projectService.getUserProjects(_this.user);
                                projectService.save(_this.user, _this.currentProjectName, true,
                                        EVENT_MODEL_OPEN_NOTIFY_TO_SAVE);
                            });
                            Arbiter.subscribe(EVENT_MODEL_TO_BACK_SAVED, function(data) {
                                projectService.save(_this.user, _this.currentProjectName, true, data.triggerId);
                            });

                            Arbiter.subscribe(EVENT_MODEL_BACK_SAVED, function(data) {
                                if (data.triggerId && data.triggerId == EVENT_MODEL_NEW_NOTIFY_TO_SAVE) {
                                    _this.crateNewEvent();
                                } else if (data.triggerId && data.triggerId == EVENT_MODEL_OPEN_NOTIFY_TO_SAVE) {
                                    _this.listProjects();
                                    _this.open();
                                }
                            });

                            Arbiter
                                    .subscribe(
                                            EVENT_MODEL_BACK_SAVED_ERROR,
                                            function(data) {
                                                if (data.triggerId
                                                        && (data.triggerId == EVENT_MODEL_NEW_NOTIFY_TO_SAVE || data.triggerId == EVENT_MODEL_OPEN_NOTIFY_TO_SAVE)) {
                                                    alert("Save prject fail,please try again later.");
                                                    Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                                                }
                                            });

                        }

                    });

            var REST_SERVICE_PATH = "rest/project";

            var projectService = {

                open: function(userId, projectName) {
                    var _this = this;
                    this._loadUiModel(userId, projectName, function() {
                        _this._loadFlowData(userId, projectName, function() {
                            Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                            console.debug("All project data load successfully.");
                        });
                    }, function() {
                        alert("Project ui data load failed.");
                        Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                    });
                },

                save: function(userId, projectName, isBackEndSave, triggerId) {

                    if (!isBackEndSave) {
                        Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                            "showText": true
                        });
                    }
                    var flowData = flowDesigner.toData();
                    var data = {
                        userId: userId,
                        projectName: projectName,
                        ui: JSON.stringify({
                            pageNumber: modelManager.getPageNumber(),
                            beans: modelManager.getBeans()
                        }, null, "\t"),
                        flow: JSON.stringify({
                            pages: flowData.pages,
                            flows: flowData.flows,
                            apiMetas: flowData.apiMetas,
                            assets: flowData.assets
                        }, null, "\t"),
                        uiThumbs: JSON.stringify(flowData.uiThumbs, null, "\t")
                    };
                    $.ajax({
                        url: REST_SERVICE_PATH + "?action=save",
                        type: "POST",
                        dataType: "json",
                        data: data,
                        async: true,
                        success: function(response) {
                            // save success,
                            if (response.result) {
                                console.debug("Project saved.");
                                if (!isBackEndSave) {
                                    alert("Save successfully.");
                                    Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);

                                } else {
                                    Arbiter.publish(EVENT_MODEL_BACK_SAVED, {
                                        user: userId,
                                        project: projectName,
                                        triggerId: triggerId
                                    }, {
                                        async: true
                                    });

                                }
                            } else {
                                console.warn("Save project error");
                                if (!isBackEndSave) {
                                    alert("Save error,please try again later.");
                                    Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                                } else {
                                    Arbiter.publish(EVENT_MODEL_BACK_SAVED_ERROR, {
                                        triggerId: triggerId
                                    }, {
                                        async: true
                                    });
                                }

                            }

                        },
                        error: function(request, textStatus, errorThrown) {
                            if (!isBackEndSave) {
                                console.warn("Save project error, status = %d, response :\n\t%s", request.status,
                                        request.responseText);
                                alert("Save error,please try again later.");
                                Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                            } else {
                                Arbiter.publish(EVENT_MODEL_BACK_SAVED_ERROR, {
                                    triggerId: triggerId
                                }, {
                                    async: true
                                });
                            }
                        }
                    });

                },

                _loadUiModel: function(userId, projectName, successCallback, failCallback) {
                    $.ajax({
                        url: REST_SERVICE_PATH,
                        type: "GET",
                        dataType: "json",
                        data: {
                            userId: userId,
                            projectName: projectName,
                            action: "getUiModel"
                        },
                        async: true,
                        success: function(result) {
                            PROJECT_PATH = "data/" + userId + "/" + projectName + "/";
                            if (result == null) // project data is empty
                                modelManager.load([], 1);
                            else
                                modelManager.load(result.beans, result.pageNumber);
                            if (successCallback)
                                successCallback(result);
                        },
                        error: function(request, textStatus, errorThrown) {
                            console.warn("Load flow data error, status = %d, response :\n\t%s", request.status,
                                    request.responseText);
                            if (failCallback)
                                failCallback(request.status);
                        }
                    });
                },

                _loadFlowData: function(userId, projectName, successCallback, failCallback) {
                    $.ajax({
                        url: REST_SERVICE_PATH,
                        type: "GET",
                        dataType: "json",
                        data: {
                            userId: userId,
                            projectName: projectName,
                            action: "getFlowData"
                        },
                        async: true,
                        success: function(result) {
                            var loaded = flowDesigner.load(result);
                            if (loaded) {
                                if (successCallback)
                                    successCallback(result);
                            } else {
                                console.error("Invalid flow data: %o", result);
                                if (failCallback)
                                    failCallback();
                            }
                        },
                        error: function(request, textStatus, errorThrown) {
                            console.warn("Load flow data error, status = %d, response :\n\t%s", request.status,
                                    request.responseText);
                            if (failCallback)
                                failCallback(request.status);
                        }
                    });
                },

                remove: function(userId, projectName) {
                    var resutl = false;
                    $.ajax({
                        type: "POST",
                        async: false,
                        url: window.location.pathname + "fileServlet?operateType=deleteDir&path=data/" + userId + "/"
                                + projectName,
                        data: "operateType=deleteDir",
                        dataType: 'text',
                        success: function(result) {
                            if (result == "true") {
                                resutl = true;
                            }
                        },
                        error: function(msg) {
                            resutl = false;
                        }
                    });
                    return resutl;
                },

                rename: function(userId, oldProjectName, newProjectName) {
                },

                create: function(userId, projectName) {
                    var resutl = false;
                    $.ajax({
                        type: "POST",
                        async: false,
                        url: window.location.pathname + "fileServlet?operateType=createDir&path=data/" + userId + "/"
                                + projectName + "/resources",
                        data: "operateType=createDir",
                        dataType: 'text',
                        success: function(result) {
                            if (result == "true") {
                                resutl = true;
                            }
                        },
                        error: function(msg) {
                            resutl = false;
                        }
                    });
                    return resutl;
                },

                getUserProjects: function(userId) {
                    var projectArray = [];
                    $.ajax({
                        type: "POST",
                        async: false,
                        contentType: "application/json",
                        url: window.location.pathname + "fileServlet?operateType=getSubDirs&path=data/" + userId,
                        data: "operateType=getSubDirs",
                        dataType: 'json',
                        success: function(result) {
                            projectArray = result;
                        },
                        error: function(msg) {
                        }
                    });
                    return projectArray;
                }
            };

            return {
                init: init
            };
        });