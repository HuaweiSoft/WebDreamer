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
 *  mange the tab labels on the bottom of flow designer
 * @moduel tabManager
 */
define(['jquery'], function ($) {

    var midWidth = 480;
    var liWidth = 120;
    var ulWidth = 0;
    var liSize = 0;
    var displayNum = 0;
    var viwer = null;
    var LABEL_ID_PREFIX= 'tabLabel';

    return {
        ID_PREFIX: LABEL_ID_PREFIX,
        MENU_MID_ID: 'labelMenuMid',
        currentLabelId: 'tabLabel1',
        tabs: [
            {
                id: 'tabLabel1',
                name: 'FunctionView1',
                isNew: true
            }
        ],

        $container: null,


        init: function (_viwer) {
            viwer = _viwer;
            this.$container = $("#" + this.MENU_MID_ID).find("ul").eq(0);
        },

        resetContainer: function () {
            this.$container = $("#" + this.MENU_MID_ID).find("ul").eq(0);
        },

        cleanAll: function () {
            displayNum = 0;
            this.$container.empty();
            this.tabs = [];
        },

        /*move the tab lables to left*/
        labelLeftMove: function () {
            if (ulWidth == 0) {
                this.resetLabelLi();
            }
            if (ulWidth <= midWidth) {
                return;
            }
            else if (displayNum < 1) {
                return;
            }
            else if (displayNum > 0) {
                displayNum = displayNum - 1;
            }
            this.moveLabelBox();
        },

        /*move the tab lables to right*/
        labelRightMove: function () {
            if (ulWidth == 0) {
                this.resetLabelLi();
            }
            if (ulWidth <= midWidth) {
                return;
            }
            else if (displayNum >= (liSize - 4)) {
                return;
            }
            displayNum = displayNum + 1;
            this.moveLabelBox();
        },

        moveLabelBox: function () {
            $('#' + this.MENU_MID_ID + ' ul').animate({
                left: '-' + (displayNum * liWidth) + 'px'
            }, 100);

        },

        /**
         * add a new tab label
         */
        addLabel: function () {
            var $tabs = this.$container.find('li');
            var size = $tabs.length;
            var maxNum = 0;
            for (var n = 0; n < size; n++) {
                var id = $tabs[n].id;
                var num = parseInt(id.substring(LABEL_ID_PREFIX.length, id.length));
                if (maxNum < num) {
                    maxNum = num;
                }
            }

            var no = maxNum + 1;

            var newlabel =
            {
                id: LABEL_ID_PREFIX + no + '',
                name: "FunctionView" + no + ''
            };

            this.labelHtml(newlabel);
            this.selectLabel(newlabel.id);
            size = this.$container.find('li').length;
            this.resetLabelLi();
            if (size > 4) {
                displayNum = size - 4;
                this.moveLabelBox();
            }
            viwer.newPage(no + "");
        },


        deleteLabel: function (deleteLabelId) {
            var size = this.$container.find('li').length;

            if (size <= 1) {
                alert('This flow tab cann\'t be deleted!');
                return;
            }

            this.$container.find('li[id="' + deleteLabelId + '"]').remove();
            if (deleteLabelId == this.currentLabelId) {
                this.selectLabel(this.$container.find('li')[0].id);
            }
            size = this.$container.find('li').length;
            this.resetLabelLi();
            if (displayNum > (size - 4)) {
                displayNum = size - 4;
                if (displayNum < 0) {
                    displayNum = 0;
                }
                this.moveLabelBox();
            }
            viwer.deletePage(deleteLabelId.replace(LABEL_ID_PREFIX, ''));
        },

        labelHtml: function (label) {
            var html = '<li id="' + label.id + '">';
            html += '<span ondblclick="flowDesigner.tabManager.modifyLabelName(\'' + label.id + '\');"  onclick="flowDesigner.tabManager.selectLabel(\'' + label.id + '\');" >';
            html += label.name;
            html += '</span><a href="javascript:void(0)" onclick="flowDesigner.tabManager.deleteLabel(\'' + label.id + '\');"></a></li>';
            this.$container.append(html);
        },

        modifyLabelName: function (labelsId) {
            var dom = $('#' + labelsId)
            var span = $(dom.find('span')[0]);
            var text = span.text();
            dom.prepend('<input value="' + text + '" onBlur="flowDesigner.tabManager.modifyLabelNameSub(\'' + labelsId + '\')"/>');
            span.css('display', 'none');
        },

        modifyLabelNameSub: function (labelsId) {
            var dom = $('#' + labelsId)
            var span = $(dom.find('span')[0]);
            var input = $(dom.find('input')[0]);
            var text = input.val();
            span.text(text);
            span.css('display', 'block');
            input.remove();
        },

        resetLabelLi: function () {
            liSize = this.$container.find('li').length;
            ulWidth = liWidth * liSize;
            this.$container.css('width', ulWidth + 'px');
        },

        selectLabel: function (labelId) {
            this.$container.find('li').removeClass('selected');
            this.$container.find('#' + labelId).addClass('selected');
            viwer.switchPage(labelId.replace(LABEL_ID_PREFIX, ''));
            this.currentLabelId = labelId;
        }

    };

});
