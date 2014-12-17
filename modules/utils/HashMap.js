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
 * @module HashMap
 */
define(function () {

    /**
     *  HashMap
     * @constructor
     */
    var HashMap = function () {
        this._map = {};
    };

    HashMap.prototype = {
        /**
         * Associates the specified value with the specified key in this map.
         * @param key {string|number} key with which the specified value is to be associated,
         *                                                     the datatype of key must be string or number.
         * @param value {*}     value to be associated with the specified key
         * @returns {boolean}
         */
        put: function (key, value) {
            if (key == null || key == "" || typeof key == "object" || typeof key == "function")
                return false;
            this._map[key] = value;
            return true;
        },

        /**
         *  Returns the value to which the specified key is mapped, or null if this map contains no mapping for the key.
         * @param key {string|number}
         * @return {*}
         */
        get: function (key) {
            if (!this._map.hasOwnProperty(key))
                return null;
            return this._map[key];
        },

        /**
         *  Removes the mapping for the specified key from this map if present.
         * @param key {string|number}
         */
        remove: function (key) {
            if (!this._map.hasOwnProperty(key))
                return false;
            delete this._map[key];
            return true;
        },

        /**
         * Removes all of the mappings from this map.
         */
        clear: function () {
            this._map = null;
            this._map = {};
        },

        /**
         * Returns true if this map contains a mapping for the specified key.
         * @param key
         * @return {boolean}
         */
        containsKey: function (key) {
            return  this._map.hasOwnProperty(key);
        },

        /**
         *  Returns true if this map maps one or more keys to the specified value.
         * @param value
         * @returns {boolean}
         */
        containsValue: function (value) {
            for (var key in this._map) {
                if (this._map.hasOwnProperty(key) && this._map[key] == value)
                    return true;
            }
            return false;
        },

        /**
         *
         * @param value
         * @returns {Array}
         */
        findKeysByValue: function (value) {
            var keys = [];
            for (var key in this._map) {
                if (this._map.hasOwnProperty(key) && this._map[key] == value)
                    keys.push(key);
            }
            return keys;
        },

        /**
         *  remove mapping by the the specified value
         * @param value
         * @return {number}
         */
        removeByValue: function (value) {
            var count = 0;
            var keys = this.findKeysByValue(value);
            for (var index = 0; index < keys.length; index++) {
                delete  this._map[keys[index]];
                count++;
            }
            return count;
        },

        toArray: function () {
            var result = [];
            for (var key in this._map) {
                if (this._map.hasOwnProperty(key)) {
                    result.push({
                        key: key,
                        value: this._map[key]
                    })
                }
            }
            return result;
        },

        /**
         * forEach executes the provided callback once for each mapping present in the HashMap.
         * @param {Function} callback function(key, value)  Function to execute for each element.
         * @param {object} thisObj  Value to use as this when executing callback.
         */
        each: function (callback, thisObj) {
            var interrupted;
            for (var key in this._map) {
                if (this._map.hasOwnProperty(key)){
                    if(thisObj)
                        interrupted =  callback.call(thisObj, key, this._map[key]);
                    else
                        interrupted =   callback(key, this._map[key]);
                   if(interrupted == true)
                   break;
                }
            }
            return interrupted;
        },

        /**
         *  Returns the number of key-value mappings in this map.
         */
        size: function () {
            var count = 0;
            for (var key in this._map) {
                if (this._map.hasOwnProperty(key))
                    count++;
            }
            return count;
        },

        _dump: function(){
            console.debug("map data: %o", this._map);
        },

        toData: function(){
            var data={};
            for (var key in this._map) {
                if(this._map.hasOwnProperty(key))
                  data[key] = this._map[key];
            }
            return data;
        },

        load: function(data) {
            if (data == null || typeof  data != "object")
                return false;
            this._map = {};
            for (var key in data) {
                if (!data.hasOwnProperty(key))
                    continue;
                var value = data[key];
                if (typeof value != "function")
                    this._map[key] = value;
            }
            return true;
        }

    };

    //function alias
    HashMap.prototype.push = HashMap.prototype.add = HashMap.prototype.put;
    HashMap.prototype.forEach = HashMap.prototype.each;
    HashMap.prototype.contains = HashMap.prototype.containsKey;

    //export
    return HashMap;
});
