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
 *Load the system configuration defined in config_model.json and declare it as global variable
 *Access configuration information for example: window.WDConfiguration.key
 */

define([ "text!modules/config/config_model.json" ], function(model) {

    return {

	init : function() {
	    /**Declare configuration as global variable*/
	    window.WDConfiguration = JSON.parse(model);
	}

    };

});
