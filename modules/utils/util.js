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
 * @module util  implement some toolkit functions
 */
define([ "jquery" ], function($) {

    var EMPTY_ELEMENTS = {HR: true, BR: true, IMG: true, INPUT: true};
    var SPECIAl_ELEMENTS = {TEXTAREA: true};
    var CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

    var util = {

        trim: function(str) {
            if (!str)
                return "";
            else if (str.trim)
                return str.trim();
            else
                return  str.replace(/(^\s*)|(\s*$)/g, "");
        },

        /**
         * String format function like String.format() in C# language. Example: var
         * msg= String.format("'{0}' is not a valid name.", name);
         */
        format: function(src) {
            if (arguments.length == 0)
                return null;
            var args = Array.prototype.slice.call(arguments, 1);
            return src.replace(/\{(\d+)\}/g, function(m, i) {
                return args[i];
            });
        },

        /**
         * extend function
         *
         * @param {Function} SubClass  function name of subclass
         * @param {Function} SuperClass function name of superclass
         * @param {Object}  [overrides]
         * @see YAHOO.extend() function in yahoo.js
         */
        extend: function(SubClass, SuperClass, overrides) {
            if (!SubClass || !SuperClass) {
                throw new Error(
                    "extend failed, please check all dependencies are included.");
            }
            var F = function() {
            };
            F.prototype = SuperClass.prototype;
            SubClass.prototype = new F();
            SubClass.prototype.constructor = SubClass;
            SubClass.superClass = SuperClass.prototype;
            SubClass.baseConstructor = SuperClass;

            if (overrides) {
                for (var key in overrides) {
                    if (overrides.hasOwnProperty(key))
                        SubClass.prototype[key] = overrides[key];
                }
            }
        },

        /**
         * copy data into the target obj
         */
        extendObj: function(target, obj1 /* , ... */) {
            target = target || {};
            for (var i = 1; i < arguments.length; i++) {
                var obj = arguments[i];
                for (var key in obj) {
                    target[key] = obj[key];
                }
            }
            return target;
        },

        /**
         * check the object type
         * @param obj
         * @param type
         * @returns {boolean}
         */
        is: function(obj, type) {
            var toString = Object.prototype.toString, undefined;
            return (type === "Null" && obj === null)
                || (type === "Undefined" && obj === undefined)
                || toString.call(obj).slice(8, -1) === type;
        },

        /**
         * deep copy the source data into the target object, like jQuery.extend function
         * @param target
         * @param source
         * @returns {*}
         */
        deepCopy: function(target, source) {
            if (target == null)
                target = {};
            for (var key in source) {
                var copy = source[key];
                if (target === copy)
                    continue; // to avoid endless loop, such as window.window === window
                if (util.is(copy, "Object")) {
                    target[key] = arguments.callee(target[key] || {}, copy);
                }
                else if (util.is(copy, "Array")) {
                    target[key] = arguments.callee(target[key] || [], copy);
                }
                else {
                    target[key] = copy;
                }
            }
            return target;
        },

        /**
         *  merget the source object data into the target object
         *
         * @param target
         * @param obj
         * @param isDeepCopy
         * @return {*}  return the merged object, which is the same object with target
         */
        merge: function(target, obj, isDeepCopy) {
            target = target || {};
            isDeepCopy = isDeepCopy || false;
            if (util.is(target, "Array") && util.is(obj, "Array")) {
                for (var i = 0; i < obj.length; i++) {
                    if (obj[i] !== undefined)
                        target.push(obj[i]);
                }
            }
            else {
                return isDeepCopy ? util.deepCopy(target, obj) : util.extendObj(target,
                    obj);
            }
            return target;
        },

        indexOfArray: function(arr, value) {
            if (!arr || !arr.length)
                return -1;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == value)
                    return i;
            }
            return -1;
        },

        inArray: function(arr, value) {
            return this.indexOfArray(arr, value) >= 0;
        },

        isArray: function(value) {
            return value &&
                typeof value === 'object' &&
                typeof value.length === 'number' &&
                typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
        },

        getOffset: function(event) {
            var offset = {};
            if (typeof event.offsetX === "undefined"
                || typeof event.offsetY === "undefined") {
                var targetOffset = $(event.target).offset();
                offset.offsetX = event.pageX - targetOffset.left;
                offset.offsetY = event.pageY - targetOffset.top;
            }
            else {
                offset.offsetX = event.offsetX;
                offset.offsetY = event.offsetY;
            }
            return offset;
        },

        hasAncestor: function(childElement, ancestorElement) {
            var el = childElement;
            while (el != document.documentElement) {
                el = el.parentElement;
                if (el == ancestorElement)
                    return true;
            }
            return false;
        },

        /**
         *  get the formatted controlType name, for example, 'UI.Textbox 'is displayed as 'Textbox' for short.
         * @param {String} controlType
         */
        getTypeName: function(controlType) {
            if(!controlType)
                return "";
            var matched = controlType.match(/^UI\.(\w+)$/);
            if (matched)
                return matched[1];
            else
                return controlType;
        },

        getOuterHTML: function(node) {
            var html = '';
            switch (node.nodeType) {
                case Node.ELEMENT_NODE:
                    html += '<';
                    html += node.nodeName;
                    if (!SPECIAl_ELEMENTS[node.nodeName]) {
                        for (var a = 0; a < node.attributes.length; a++)
                            html += ' ' + node.attributes[a].nodeName.toUpperCase() +
                                '="' + node.attributes[a].value + '"';
                        html += '>';
                        if (!EMPTY_ELEMENTS[node.nodeName]) {
                            html += node.innerHTML;
                            html += '<\/' + node.nodeName + '>';
                        }
                    }
                    else switch (node.nodeName) {
                        case 'TEXTAREA':
                            for (var a = 0; a < node.attributes.length; a++)
                                if (node.attributes[a].nodeName.toLowerCase() != 'value')
                                    html += ' ' + node.attributes[a].nodeName.toUpperCase() +
                                        '="' + node.attributes[a].value + '"';
                                else
                                    var content = node.attributes[a].value;
                            html += '>';
                            html += content;
                            html += '<\/' + node.nodeName + '>';
                            break;
                    }
                    break;
                case Node.TEXT_NODE:
                    html += node.value;
                    break;
                case Node.COMMENT_NODE:
                    html += '<!' + '--' + node.value + '--' + '>';
                    break;
            }
            return html;
        },

        parseIntPx: function(strPx) {
            return strPx ? (  typeof strPx == "string" ? parseInt(strPx.replace("px", ""), 10) : parseInt(strPx, 10)) : 0;
        },

        parseFloatPx: function(strPx) {
            return strPx ? (  typeof strPx == "string" ? parseFloat(strPx.replace("px", "")) : parseFloat(strPx)) : 0;
        },

        uuid: function(len, radix) {
            var chars = CHARS, uuid = [], i;
            radix = radix || chars.length;

            if (len) {
                // Compact form
                for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
            }
            else {
                // rfc4122, version 4 form
                var r;

                // rfc4122 requires these characters
                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';

                // Fill in random data.  At i==19 set the high bits of clock sequence as
                // per rfc4122, sec. 4.1.5
                for (i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | Math.random() * 16;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
            }
            return uuid.join('');
        },

        buildThumbnailHtml: function(el) {
            var $el = $(el).clone();

            $el.removeAttr("id")
                .attr("flow-id", el.id)
                .removeAttr("onclick")
                .removeAttr("ondblclick")
                .removeAttr("onmouseup")
                .removeAttr("onmouseover")
                .removeAttr("onmouseout")
                .removeAttr("onblur")
                .removeAttr("href")
                .css("position", "static")
                .css("left", "0")
                .css("top", "0");

            if (el.nodeName == "INPUT") {
                $el.attr("value", $el.val());
            }
            else if (el.nodeName == "TEXTAREA") {
                $el.text($el.val());
            }
            $el.find("input").each(function(index, element) {
                $(element).attr("value", $(element).val());
            });
            $el.find("textarea").each(function(index, element) {
                $(element).text($(element).val());
            });
            var clonedEl = $el[0];
            var html = clonedEl.outerHTML || this.getOuterHTML(clonedEl);
            return html.replace(/ id="/g, " flow-id=\"");
        },

        htmlEncode2: function(str) {
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        },

        htmlDecode: function(str) {
            var div = document.createElement('div');
            div.innerHTML = str;
            return div.innerText || div.textContent;
        },

        htmlEncode: function(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        },

        getObjValueByJPath: function(obj, jpath) {
            if (!jpath)
                return null;
            var paths = jpath.split(".");
            for (var i = 0; i < paths.length; i++) {
                var propName = paths[i].trim();
                /*if (propName.match(/^[\w\$]+$/)) {
                 console.error("Error path: " + jpath);
                 return null;
                 }*/
                paths[i] = propName;
            }
            var value = obj, index = 0;
            while (index < paths.length) {
                var propName = paths[index];
                if (value == null)
                    return null;
                else if (propName in value) {
                    value = value[propName];
                    index++;
                }
                else
                    return null;
            }
            return value;
        }

    };

    return util;
});