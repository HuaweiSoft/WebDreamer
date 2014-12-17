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
 *  @module  pager multiple flow pages manager for flow designer
 */
define(['jquery', 'util', "yahoo_dragdrop"], function ($, util, YAHOO) {
    var flowDesigner = null;
    var DEFAULT_SCALE = 0.82;

    return {

        /**
         * current flow page index
         */
        currentPageNo: 0,

        init: function (_flowDesigner) {
            flowDesigner = _flowDesigner;
        },

        $: function (selector) {
            return flowDesigner.$(selector);
        },

        buildPageHtml: function(Index){
          return   '<div id="flowpage' + Index + '" class="flow-view"></div>';
        },

        /**
         *
         */
        /**
         * create new flow page
         * @param [pageName] {String} the new page name, if pageName is null,
         *                          the flow model will  automatically create a default page name .
         */
        newFlowPage: function (pageName) {
            var page = flowDesigner.model.newPage(pageName);
            var Index = page.no;
            pageName = page.name;
            this.$("#flow_view_container").append(this.buildPageHtml(Index));
            var $page = this.$("#flowpage" + Index);
            /*var html = "";
            html += flowDesigner.buildRootUnitHtml(Index);
            html += flowDesigner.buildUserAnchorUnitHtml(Index);
            html += flowDesigner.buildAppAnchorUnitHtml(Index);

            $page.append(html);*/
            var rootUnit = flowDesigner.model.getRootUnit(Index);
            rootUnit.left = 186;
            rootUnit.top = 4350;
            var userAnchorUnit = flowDesigner.model.getUserAnchorUnit(Index);
            userAnchorUnit.left = 386;
            userAnchorUnit.top = 4270;
            var appAnchorUnit = flowDesigner.model.getAppAnchorUnit(Index);
            appAnchorUnit.left = 386;
            appAnchorUnit.top = 4470;

            flowDesigner.renderUnit(rootUnit);
            flowDesigner.renderUnit(userAnchorUnit);
            flowDesigner.renderUnit(appAnchorUnit);


            this.enablePageDrag(Index);
            //this.drawRootLines(Index);
            flowDesigner.reconnectSubUnits(rootUnit);
            this.switchPage(Index);
            return page;
        },


        /**
         * bind flow page drag event
         */
        enablePageDrag: function (Index) {
            var $page = this.$("#flowpage" + Index);
            var drag = new YAHOO.util.DD($page[0]);
            var _this = this;
            drag.subscribe("dragEvent", function (event) {
               /* var left = util.parseIntPx($page.css("left"));
                var scaledLeft = _this.calcDisplayLeft(Index);
                if (left > scaledLeft)
                    $page.css("left", scaledLeft);*/
                if ($page.find(".unit-root .terminal-wrapper").offset().left > 379) {
                    $page.css("left", _this.calcDisplayLeft(Index));
                }
            });
        },

        calcDisplayLeft: function (Index) {
            var $page = this.$("#flowpage" + Index);
            var scale = parseFloat(($page.css("-webkit-transform") || $page.css("-moz-transform")).replace("matrix(", "").split(",")[0]);
            if(isNaN(scale))
                scale = DEFAULT_SCALE;
           var root_terminal_offset_left = 380 - 54;
            var container_left = util.parseIntPx(flowDesigner.$el.css("left"));
            var page_with = $page.width();
            var root_terminal_left = util.parseIntPx(this.$("#flowroot" + Index).css("left")) + (this.$("#flowroot" + Index + " .content").width());
            var display_left = root_terminal_offset_left - container_left - page_with * (1 - scale) / 2 - root_terminal_left * scale;
            return parseInt(display_left);
        },

        /**
         * calc the top postion of flow view page, which center  the root unit horizontally
         */
        calcDisplayTop: function (Index) {
            var $page = this.$("#flowpage" + Index);
            var scale = parseFloat(($page.css("-webkit-transform") || $page.css("-moz-transform")).replace("matrix(", "").split(",")[0]);
            if(isNaN(scale))
                scale = DEFAULT_SCALE;
            var root_terminal_offset_top = 376;
            var container_top = util.parseIntPx(flowDesigner.$el.css("top"));
            var page_height = $page.height();
            var root_terminal_top = util.parseIntPx(this.$("#flowroot" + Index).css("top")) + (this.$("#flowroot" + Index).height() );
            var display_top = root_terminal_offset_top - container_top - page_height * (1 - scale) / 2 - root_terminal_top * scale;
            return parseInt(display_top);
        },

        /**
         * reset page position
         * @param Index
         */
        resetPosition: function (Index) {
            this.$("#flowpage" + Index)
                .css("left", this.calcDisplayLeft(Index))
                .css("top", this.calcDisplayTop(Index));
        },

        /**
         * switch the specified page to current page
         */
        switchPage: function (Index) {
            if (typeof  Index == "string")
                Index = parseInt(Index);
            if (flowDesigner.model.getPageIndex(Index) == -1)
                return;
            var pages = flowDesigner.model.getAllPages();
            for (var i = 0; i < pages.length; i++) {
                this.$("#" + pages[i].id).hide();
            }
            var $page = this.$("#flowpage" + Index);
            $page.show();
            this.currentPageNo = Index;
            flowDesigner.checkIfRedrawWires(Index);
        },


        /**
         * delete the specified flow page
         */
        deletePage: function (Index) {
            var rootUnit = flowDesigner.model.getRootUnit(Index);
            if (rootUnit) {
                flowDesigner.deleteUnit(rootUnit.id);
            }
            flowDesigner.model.removePage(Index);

            this.$("#flowpage" + Index).remove();
        },


        /**
         * remove all flow pages
         */
        clear: function () {
            var pages = flowDesigner.model.getAllPages();
            for (var i = 0; i < pages.length; i++) {
                var pageNo = pages[i].no;
                this.deletePage(pageNo);
            }
            this.currentPageNo = 0;
        },

        /**
         * zoom in and zoom out flow page view by mouse scroll
         * @param e onmousewheel event
         */
        scrollFunc: function (e) {
            e = e || window.event;
            var $target = $( e.target  || e.toElement || e.srcElement );
            if (!$target.hasClass("flow-view") && $target.parents(".flow-view").length == 0)
                return;
            if (!flowDesigner.isOpened()) {
                return;
            }
            var currentPageNo = this.currentPageNo;
            if (!currentPageNo) {
                return;
            }
            e.preventDefault();
            var $page = flowDesigner.$("#flowpage" + currentPageNo);
            if($page.length == 0)
                return;
            var scale, zoomOut, transformCssName;

            if (e.wheelDelta) {//IE/Opera/Chrome
                transformCssName = '-webkit-transform';
                zoomOut = e.wheelDelta > 0;
            } else if (e.detail) {//Firefox
                transformCssName = '-moz-transform';
                zoomOut = e.detail < 0;
            }
            scale = parseFloat($page.css(transformCssName).replace("matrix(", "").split(",")[0]);
            var oldScale = scale;
            var currentLeft = parseInt($page.css("left"));
            var isRootVisible =  currentLeft >=  this.calcDisplayLeft(currentPageNo);
            var zoomed = false;
            if (zoomOut) {
                if (scale > 0.38) {
                    scale = scale - 0.01;
                    $page.css(transformCssName, "scale(" + scale + ")");
                    zoomed = true;
                }
            } else {
                if (scale < 1.3) {
                    scale = scale + 0.01;
                    $page.css(transformCssName, "scale(" + scale + ")");
                    zoomed = true;
                }
            }
            if (zoomed) {
                var maxLeft = this.calcDisplayLeft(currentPageNo);
                if (currentLeft >= maxLeft || isRootVisible)
                    $page.css("left", maxLeft);
                else { //left < maxLeft
                    //root terminal is invisible, use the mouse cursor as x reference
                    var cursorLeft = 0;
                    var offsetX = e.clientX || e.pageX || e.offsetX;
                    if (offsetX >= 382 && offsetX <= 332 + flowDesigner.$el.width()) {
                        cursorLeft = (offsetX - parseInt(flowDesigner.$el.css("left")) - currentLeft - $page.width() * (1 - oldScale) / 2) / oldScale;
                    }
                    var leftOffset = parseInt(($page.width() / 2 - cursorLeft) * 0.01);
                    var newLeft = currentLeft + (zoomOut ? -leftOffset : leftOffset);
                    if (newLeft > maxLeft)
                        newLeft = maxLeft;
                    $page.css("left", newLeft);
                }
                //use root unit as y/top reference
                var $root = $page.find("#flowroot" + currentPageNo);
                var terminalTop = parseInt($root.css("top")) + ( $root.height() - $root.find(".designer-terminal").height()) / 2;
                var topOffset = parseInt(($page.height() / 2 - terminalTop) * 0.01);
                var newTop = parseInt($page.css("top")) + (zoomOut ? -topOffset : topOffset);
                $page.css("top", newTop);
            }

        }


    };
});
