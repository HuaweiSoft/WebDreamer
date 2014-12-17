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
 *  changePage API
 * @dependency  jquery.js
 */

var toPage = (function() {
    var currentPageNo = 1;

    /**
     *Switch application to the specified page number
     *@param {Number} pageNo,target page number
     */
    function changePage(pageNo) {
        var href = window.location.href;
        if (href.indexOf("#PAGE") > 0) {
            try {
                currentPageNo = parseInt(href.substring(href.indexOf("#PAGE") + 6, href.length), 10);
            } catch (e) {
                // ....
            }
        }
        if (typeof pageNo == "string") {
            pageNo = parseInt(pageNo);
            if (isNaN(pageNo)) {
                return;
            }
        }
        var reverse = pageNo < currentPageNo;
        jQuery.mobile.changePage("#PAGE" + pageNo, {
            transition: "slide",
            reverse: reverse,
            changeHash: true
        });
        currentPageNo = pageNo;
    }

    return changePage;
})();