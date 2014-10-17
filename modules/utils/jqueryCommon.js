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
 * custom common jquery functions
 */
define(["jquery"], function ($) {

    /**
     * Map implement like HashMap in Java
     */
    $.Map = function () {

        var HashMap = {};

        HashMap.datas = [];

        HashMap.size = function () {
            return HashMap.datas.length;
        };

        HashMap.containsKey = function (key) {
            return HashMap.get(key) != null;
        };

        HashMap.containsValue = function (value) {
            for (var i = 0; i < HashMap.datas.length; i++) {
                if (HashMap.datas[i].value == value) {
                    return true;
                }
            }
            return false;
        };

        HashMap.contains = function (key, value) {
            for (var i = 0; i < HashMap.datas.length; i++) {
                if (HashMap.datas[i].key == key && HashMap.datas[i].value == value) {
                    return true;
                }
            }
            return false;
        };

        HashMap.get = function (key) {
            if (HashMap.datas == null || HashMap.datas.length == 0) {
                return null;
            }
            for (var i = 0; i < HashMap.datas.length; i++) {
                if (HashMap.datas[i].key == key) {
                    return HashMap.datas[i].value;
                }
            }
            return null;
        };

        HashMap.getValues = function (keys) {
            var values = [];
            for (var i = 0; i < HashMap.datas.length; i++) {
                if (HashMap.datas[i].key == key) {
                    values[values.length] = HashMap.datas[i].value;
                }
            }
            return values;
        };

        HashMap.put = function (key, value) {
            var obj = HashMap.get(key);
            if (obj == null) {
                HashMap.datas[HashMap.datas.length] = {
                    key: key,
                    value: value,
                    index: HashMap.datas.length
                }
            } else {
                obj.value = value;
            }
        };

        HashMap.putAll = function (maps) {
            for (var i = 0; i < maps.length; i++) {
                HashMap.put(maps[i].key, maps[i].value);
            }
        };

        HashMap.remove = function (key) {
            var map = HashMap.get(key);
            if (map != null || map.index > 0) {
                HashMap.datas.slice(0, map.index).concat(HashMap.datas.slice(map.index + 1, HashMap.datas.length));
            }
        };

        HashMap.deleteObj = function (key) {
            var map = HashMap.get(key);
            if (map != null) {
                var datas = [];
                for (var i = 0; i < HashMap.datas.length; i++) {
                    if (HashMap.datas[i].key != key) {
                        datas.push(HashMap.datas[i]);
                    }
                }

                HashMap.datas = datas;
            }
        };

        HashMap.clear = function () {
            HashMap.datas = [];
        };

        HashMap.addAll = function (maps, str) {
            if (maps != null && maps.length == 0) {
                return null;
            }
            for (var i = 0; i < maps.length; i++) {
                var temp = maps[i].split(str);
                HashMap.put(temp[0], temp[1]);
            }
        };

        HashMap.indexOfKey = function (key) {
            for (var i = 0; i < HashMap.datas.length; i++) {

                if (HashMap.datas[i].key == key) {
                    return i;
                }
            }
            return -1;
        };

        HashMap.add = function (map) {
            if (map != null && map.length > 0) {
                return null;
            }
            var temp = null;
            if (map.indexOf("=") > -1) {
                temp = map.split("=");
            } else if (map.indexOf(":") > -1) {
                temp = map.split(":");
            }
            HashMap.put(temp[0], temp[1]);
        };
        return HashMap;
    };

    //extend jquery functions
    $.fn.extend({
        /**
         *  Yet another bind function which supports changes this object by the context parameter
         * @param {String} eventType
         * @param {Function} handler  handler(eventData)   call back function
         * @param {Object} context  Value to use as this when executing callback.
         * @returns {jQuery}
         */
        xbind: function (eventType, handler, context) {
            if (!context)
                return this.bind(eventType, handler);
            else
                return this.bind(eventType, ( function (event) {
                    handler.apply(context, arguments);
                }));
        },

        /**
         *  bind the enter event handler
         * @param {Function}  handler   call back function
         * @param {Object}  context    Value to use as this when executing callback.
         * @returns {jQuery}
         */
        enter: function (handler, context) {
            return   this.bind('keydown.enter', function (e) {
                var key = e.which;
                if (key == 13) {
                    e.preventDefault();
                    context = context || this;
                    handler.apply(context, arguments);
                }
            });
        }
    });

    return $;

});