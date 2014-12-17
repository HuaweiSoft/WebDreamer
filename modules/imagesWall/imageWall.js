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
 * Define the image wall  function in this
 */
define([ "css!modules/imagesWall/imageWall", "text!modules/imagesWall/image_wall_tmpl.xml",
       "text!modules/imagesWall/image_list_tmpl.xml" ], function(css, tmpl,     listImgTmpl) {

    var init = function() {

        Arbiter.subscribe("layout/top/rendered", {
            async: true
        }, function() {

            /**
             * Instance one view and render the view
             */
            var view = new ImagesWallView({
                el: "body"
            });
            view.render();
            view.subscribeMsg();
        });
    };

    /**
     * Define the image wall view class in backbone model
     */
    var ImagesWallView = Backbone.View.extend({

        viewId: "images_wall_view_panel",
        maskId: "images_wall_view_panel_mask",
        rendered: false,
        imageArray: [],
        triggerId: "",
        numPerPage: 6,
        selectedSrc: "",
        projectName: "",
        user: null,

        render: function() {
            if (!this.rendered) {
                this.$el.append(tmpl);
                var $view = $("#" + this.viewId);
                $view.css("left", ($(window).width() - $view.width()) / 2 + "px").css("top",
                        ($(window).height() - $view.height()) / 2 + "px");
            }
            this.rendered = true;
        },
        open: function(data) {
            this.reset();
            $("#" + this.viewId).show();
            this.triggerId = data.triggerId;
            this.imageArray = data.images;
            if (this.imageArray.length <= this.numPerPage) {
                this.updatePageBar(1);
            } else {
                this.updatePageBar(Math.round(this.imageArray.length / this.numPerPage));
            }
            this.toPage(1);
        },
        getImagesFromProject: function(data) {
            var _this = this;
            var images = [];
            $.ajax({
                type: "POST",
                async: true,
                url: window.location.pathname + "fileServlet",
                data: "operateType=getFiles&path=data/" + _this.user.user + "/" + _this.projectName + "/resources",
                dataType: 'json',
                success: function(result) {

                    if (result.length > 0) {
                        for ( var i = 0; i < result.length; i++) {
                            try {
                                var subffix = result[i].split(".")[1].toLowerCase();
                                if ( subffix == "gif" || subffix == "png" || subffix == "jpeg" || subffix == "jpg" || subffix == "bmp") {
                                    images.push("data/" + _this.user.user + "/" + _this.projectName + "/resources/"
                                            + result[i]);
                                }
                            } catch (e) {
                                console.debug("Get image subffix error" + e);
                            }

                        }
                    }

                    data.images = images;
                    _this.open(data);
                },
                error: function(msg) {
                    _this.open(data);
                }
            });

        },
        updatePageBar: function(pageNum) {
            $("#image_wall_page_bar").html("");
            var pageBarInnerHTML = "";
            for ( var i = 1; i <= pageNum; i++) {
                if (i == 1) {
                    pageBarInnerHTML += '<div page=' + i + ' class="image_wall_page_item_selected">' + i + '</div>';
                } else {
                    pageBarInnerHTML += '<div page=' + i + ' class="image_wall_page_item_unselected">' + i + '</div>';
                }
            }
            $("#image_wall_page_bar").append(pageBarInnerHTML);
            $view = $("#image_wall_page_bar");
            $view.css("left", ($("#images_wall_view_panel").width() - $view.width()) / 2 + "px");
        },

        toPage: function(event) {
            var itemArray = $("#image_wall_page_bar").children();
            var pageSelected = 0;
            if (typeof (event) == "number") {
                var $item = $(itemArray[0]);
                $item.attr("class", "image_wall_page_item_selected");
                pageSelected = event;
            } else {
                var pageNo = $(event.target).attr("page");
                pageSelected = parseInt(pageNo, 10);
                if (pageNo != "") {
                    for ( var i = 0; i < itemArray.length; i++) {
                        var $item = $(itemArray[i]);
                        if ($item.attr("page") == pageNo) {
                            $item.attr("class", "image_wall_page_item_selected");
                        } else {
                            $item.attr("class", "image_wall_page_item_unselected");
                        }
                    }
                }
            }
            if (pageSelected > 0) {
                var datas = [];
                var start = this.numPerPage * (pageSelected - 1);
                var endMax = this.numPerPage * pageSelected;
                for ( var i = start; i < endMax; i++) {
                    if (i < this.imageArray.length) {
                        var image = this.imageArray[i];
                        var nameSplit = image.split("/");
                        var name = "unknown";
                        if (nameSplit.length > 0) {
                            name = nameSplit[nameSplit.length - 1];
                        }

                        datas.push({
                            "src": image,
                            "name": name
                        });
                    }
                }
                var html = _.template(listImgTmpl, {
                    "datas": datas
                });
                $("#image_wall_List").html(html);
            }
        },
        close: function() {
            $("#" + this.viewId).hide();
            $("#" + this.maskId).remove();
        },
        closeEvent: function() {
            this.close();
        },
        preview: function() {
            var url = $.trim($("#image_url_input").val());
            if (url == "") {
                $("#image_wall_preview_img").hide();
                alert("Please input url of image.");
                $("#image_url_input").focus();
            } else {
                $("#image_wall_preview_img").attr("src", url).show();
            }
        },
        reset: function() {
            this.$el.append("<div id=" + this.maskId + " class='mask'></div>");
            $("#" + this.maskId).width($(window).width()).height($(window).height()).css("z-index", 799).show();
            $("#image_url_input").val("");
            $("#image_wall_preview_img").attr("src", "").hide();
            this.selectedSrc = "";
        },
        selectedImage: function(event) {
            var $target = $(event.target);
            var url = $target.attr("lang");
            Arbiter.publish(EVENT_IMAGES_WALL_PUBLISH_SELECTED_IMAGE, {
                "triggerId": this.triggerId,
                "image": url
            });
            this.close();
        },
        confirm: function() {
            var url = $.trim($("#image_url_input").val());
            if (url == "") {
                $("#image_wall_preview_img").hide();
                alert("Please input url of image.");
                $("#image_url_input").focus();
            } else {
                Arbiter.publish(EVENT_IMAGES_WALL_PUBLISH_SELECTED_IMAGE, {
                    "triggerId": this.triggerId,
                    "image": url
                });
                this.close();
            }
        },
        /**
         * Subscribe message to receive notify from other modules
         */
        subscribeMsg: function() {
            var _this = this;
            Arbiter.subscribe(EVENT_IMAGES_WALL_SUBSCRIBE_OPEN, {
                async: true
            }, function(data) {
                if (data && (!data.images || data.images == null || data.images.length == 0)) {
                    if (_this.user != null && _this.projectName != "") {
                        _this.getImagesFromProject(data);
                    } else {
                        _this.open(data);
                    }

                } else {
                    _this.open(data);
                }

            });
            Arbiter.subscribe(EVENT_USERM_MANAGER_PUBLISH_USER_LOGIN, function(data) {
                _this.user = data;
            });
            Arbiter.subscribe(EVENT_MODEL_SET_PROJECT_NAME, function(data) {
                _this.projectName = data.name;
            });
        },

        events: {
            "click #image_wall_page_bar": "toPage",
            "click #image_wall_view_panel_close": "closeEvent",
            "click #image_wall_preview": "preview",
            "click #image_url_confirm_btn": "confirm",
            "click div[class^='image_wall_unit_div']": "selectedImage"
        }
    });

    return {
        init: init
    };

});