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
 * @module Bean  define the structure of  data model for a ui control
 */
define(function(){
    /**
     * control data model
     * @constructor
     */
    function Bean() {
    }

    Bean.prototype = {
        id: "control1",
        type: "",

        /**
         * page number sequence
         */
        pageNo: 1,

        /**
         * index in current page or parent container
         */
        pIndex: -1,

        /**
         * parent control id
         */
        parentId: "",

        /**
         *  control props, include base and custom property
         */
        props: {
            width: "0px",
            height: "0px",
            visibility: "visible",
            /*BEGIN: to be deprecated*/
            x: "auto",
            y: "auto",
            zIndex: 0,
            align: "left",
            /*END: to be deprecated*/
        },

        code: "",
        html: ""
    };

    return Bean;
});
