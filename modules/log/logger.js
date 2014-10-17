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
 * Define logger of WebDreamer in this 
 * Writing the log information on console of browser
 */
var Logger = (function() {

    return {

	/**
	 * Writing debug information on console of browser
	 * 
	 * @param moudle
	 * @param msg
	 */
	debug : function(modlue, msg) {
	    console
		    .debug(this.__getTime__() + " [" + modlue + "]" + "  "
			    + msg);
	},

	/**
	 * Writing information information on console of browser
	 * 
	 * @param moudle
	 * @param msg
	 */
	info : function(modlue, msg) {
	    console.info(this.__getTime__() + " [" + modlue + "]" + "  " + msg);
	},

	/**
	 * Writing error information on console of browser
	 * 
	 * @param moudle
	 * @param msg
	 */
	error : function(modlue, msg) {
	    console
		    .error(this.__getTime__() + " [" + modlue + "]" + "  "
			    + msg);
	},

	/**
	 * Formating the time of log
	 */
	__getTime__ : function() {
	    var myDate = new Date();
	    return myDate.getFullYear() + "-" + (myDate.getMonth() + 1) + "-"
		    + myDate.getDate() + " " + myDate.getHours() + ":"
		    + myDate.getMinutes() + ":" + myDate.getSeconds() + "."
		    + myDate.getMilliseconds();

	}
    };
})();
;