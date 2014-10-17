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
 *Define operating LocalStorage global function in this 
 */
var LocalStorage = (function() {

    return {
	/**
	 * Get the value by key
	 * @param key 
	 * @return value
	 */
	getData : function(key) {
	    return window.localStorage.getItem(key);
	},

	/**
	 * Store the key and value to LocalStorage 
	 * @param key 
	 * @param value
	 */
	addData : function(key, data) {
	    window.localStorage.setItem(key, data);
	},

	/**
	 *Set the value of key to the data
	 *@param key
	 *@param data new value
	 */
	updateData : function(key, data) {
	    this.addData(key, data);
	},

	/**
	 * Remove the key and referenced value from LocalStorage
	 * @param key
	 */
	deleteData : function(key) {
	    window.localStorage.removeItem(key);

	}
    };
})();