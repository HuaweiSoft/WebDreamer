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
 * @module ApiMeta
 */
define([], function() {

    /**
     * Just for test
     * @constructor
     */
    function ApiMeta() {
    }

    ApiMeta.prototype = {
        "name": "lashou",
        "displayName": "lashou",
        "icon": "services/lashou/icon/lashou.png",
        "dir": "lashou",
        "jsFileName": "lashou.js",
        "dependJS": [],
        "className": "Lashou",
        "functionName": "request",
        "params": [ "city", "page", "begin" ],

        //"async": true,
        "hasCallback": true,
        "result": {
            "return": true,
            "type": "string",
            "format": "{}"
        },

        "singleParam": false,       //put all parameter values into an option object parameter
        "description": ""
    };


    return ApiMeta;
});
