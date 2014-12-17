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
 * Define the upload resource function in this
 */
define([ "css!modules/uploader/uploader", "text!modules/uploader/uploader_tmpl.xml",
        "text!modules/uploader/uploader_preview_tmpl.xml" ], function(css, tmpl, prvTmpl) {

    var init = function() {

        Arbiter.subscribe("layout/top/rendered", {
            async: true
        }, function() {

            /**
             * Instance one view and render the view
             */
            var view = new UploadView({
                el: "body"
            });
            view.render();
            view.subscribeMsg();
        });
    };

    /**
     * Define the left menu view class in backbone model
     */
    var UploadView = Backbone.View.extend({

        viewId: "upload_view_panel",

        dropBoxId: "uploader_drop_box",

        maskId: "upload_view_panel_mask",

        rendered: false,

        triggerId: "",

        fileName: "",

        fileType: "",

        fileSavePath: "",

        fileSize: "",

        $dropBox: null,

        maxSize: 20,

        success: false,

        render: function() {
            if (!this.rendered) {
                this.$el.append(tmpl)
                var $view = $("#" + this.viewId);
                $view.css("left", ($(window).width() - $view.width()) / 2 + "px").css("top",
                        ($(window).height() - $view.height()) / 2 + "px");
                this.$dropBox = $("#" + this.dropBoxId);
                this.rendered = true;
            }
        },

        open: function(data) {
            this.render();
            this.reset();
            $("#" + this.maskId).remove();
            this.$el.append("<div id=" + this.maskId + " class='mask'></div>");
            $("#" + this.maskId).width($(window).width()).height($(window).height()).css("z-index", 999).show();
            if (data.hasOwnProperty("suffix") && data.suffix.length > 0) {
                $("#uploader_drop_box_text").html("Drop " + data.suffix.toString() + " file here to upload");
            } else {
                $("#uploader_drop_box_text").html("Drop file here to upload");
            }
            $("#" + this.viewId).show();
            this.updateDropBox(data);

        },
        updateDropBox: function(jsonData) {

            var _this = this;

            if (!jsonData.hasOwnProperty("suffix") || jsonData.suffix.length == 0) {
                alert("System has not specified file type!");
                return false;
            } else if (!jsonData.hasOwnProperty("savePath") || jsonData.savePath == "") {
                alert("System has not specified path to save !");
                return false;
            }
            if (jsonData.hasOwnProperty("maxSize")) {
                _this.maxSize = jsonData.maxSize;
            }
            this.$dropBox.filedrop({
                // The name of the $_FILES entry:
                paramname: 'file',
                maxfiles: 1,
                maxfilesize: 10,
                url: window.location.pathname + 'fileServlet?operateType=upload&savePath=' + jsonData.savePath,
                uploadFinished: function(i, file, response) {
                    $("#uplad_proccess_tip").hide();
                    $("#delete_uploaded_file").show();
                    $("#upload_success_tip").show();
                    $("#uploader_drop_box").css("background", "rgba(119, 120, 123, 1)");
                    _this.success = true;
                    _this.fileType = file.type;
                    _this.fileName = file.name;
                    _this.fileSavePath = jsonData.savePath;
                    _this.fileSize = parseInt(file.size / 1024, 10) + "(K)";
                },

                error: function(err, file) {
                    switch (err) {
                    case 'BrowserNotSupported':
                        alert('Your browser does not support HTML5 file uploads!');
                        break;
                    case 'TooManyFiles':
                        alert('Too many files! Please select one at most!');
                        break;
                    case 'FileTooLarge':
                        alert(file.name + ' is too large! Please upload files up to ' + jsonData.maxSize + 'MB.');
                        break;
                    default:
                        break;
                    }
                    _this.success = false;
                },
                dragEnter: function() {
                    $("#uploader_drop_box").css("background", "rgba(125, 217, 234, 1)");
                },
                dragLeave: function() {
                    $("#uploader_drop_box").css("background", "rgba(119, 120, 123, 1)");
                },
                // Called before each upload is started
                beforeEach: function(file) {
                    var suffix = "";
                    var nameArray = file.name.split(".");
                    if (nameArray.length > 0) {
                        suffix += "." + nameArray[nameArray.length - 1].toLowerCase();
                    }
                    if (suffix == "") {
                        alert("Please upload [" + jsonData.suffix.toString() + "] file!");
                        return false;
                    } else {
                        var valideFile = false;
                        for ( var i = 0; i < jsonData.suffix.length; i++) {
                            if (suffix == jsonData.suffix[i].toLowerCase()) {
                                valideFile = true;
                                break;
                            }
                        }
                        if (!valideFile) {
                            alert("Please upload [" + jsonData.suffix.toString() + "] file!");
                            return false;
                        }
                    }
                    if (file.size > _this.maxSize * 1024) {
                        alert("File max size only " + _this.maxSize + "K");
                        return false;
                    }

                },

                uploadStarted: function(i, file, len) {

                    _this.fileType = file.type;
                    _this.fileName = file.name;
                    _this.fileSize = parseInt(file.size / 1024, 10) + "(K)";
                    $("#uploader_drop_box_text").hide();
                    if (file.type.indexOf("image/") > -1) {
                        this.preview(file);
                    } else {
                        $("#preview_img_view").remove();
                        $("#uplad_proccess_tip").show();
                    }
                    $("#upload_detail_name").html(file.name);
                    $("#upload_detail_size").html(_this.fileSize);
                    $("#uplad_proccess_tip").hide();

                },
                progressUpdated: function(i, file, progress) {
                    $("#upload_proccess_tip_text").html(progress + "%");
                },
                preview: function(file) {

                    $("#preview_img_view").remove();
                    var preview = $(prvTmpl);

                    var image = $('img', preview);

                    var reader = new FileReader();
                    image.width = 100;
                    image.height = 100;
                    reader.onload = function(e) {
                        image.attr('src', e.target.result);
                    };
                    reader.readAsDataURL(file);
                    var dropbox = $("#uploader_drop_box");
                    preview.appendTo(dropbox);
                }

            });

        },
        close: function() {
            $("#" + this.viewId).hide();
            $("#" + this.maskId).remove();
        },
        upload: function() {
        },
        delFileUploaded: function() {
            var _this = this;
            if (_this.success) {
                var resutl = false;
                $.ajax({
                    type: "POST",
                    async: false,
                    url: window.location.pathname + "fileServlet?operateType=deleteFile&path=" + this.fileSavePath
                            + "/" + this.fileName,
                    data: "operateType=deleteDir",
                    dataType: 'text',
                    success: function(result) {
                        if (result == "true") {
                            _this.reset();
                        }
                    },
                    error: function(msg) {
                        alert("Delete fiel fail.");
                    }
                });
            }
        },
        reset: function() {
            this.triggerId = "";
            this.fileName = "";
            this.fileSavePath = "";
            this.success = false;
            this.fileType = "";
            $("#preview_img_view").remove();
            $("#upload_proccess_tip_text").html("0%");
            $("#delete_uploaded_file").hide();
            $("#upload_detail_name").html("");
            $("#upload_detail_size").html("");
            $("#upload_success_tip").hide();
            $("#uploader_drop_box_text").show();
        },
        confirm: function() {

            var _this = this;
            if (this.success) {
                Arbiter.publish(EVENT_UPLOAD_PUBLISH_UPLOADED, {
                    "name": _this.fileName,
                    "path": _this.fileSavePath,
                    "triggerId": _this.triggerId,
                    "type": _this.fileType,
                    "size": _this.fileSize
                });
                _this.close();
            } else {
                alert("Please upload a file.");
            }
        },
        /**
         * Subscribe message to receive notify from other modules
         */
        subscribeMsg: function() {
            var _this = this;
            Arbiter.subscribe(EVENT_UPLOAD_SUBSCRIBE_OPEN, {
                async: true
            }, function(data) {
                _this.open(data);
            });
        },

        events: {
            "click #upload_view_panel_close": "close",
            "click #uplad_btn_ok": "confirm",
            "click #delete_uploaded_file": "delFileUploaded"
        }
    });

    return {
        init: init
    };

});