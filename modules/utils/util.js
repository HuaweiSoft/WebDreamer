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

    var EMPTY_ELEMENTS ={HR: true, BR: true, IMG: true, INPUT: true};
    var SPECIA_LELEMENTS = {TEXTAREA: true};


	function is(obj, type) {
		var toString = Object.prototype.toString, undefined;
		return (type === "Null" && obj === null)
				|| (type === "Undefined" && obj === undefined)
				|| toString.call(obj).slice(8, -1) === type;
	}

	function deepCopy(target, source) {
		if (target == null)
			target = {};
		for ( var key in source) {
			var copy = source[key];
			if (target === copy)
				continue; // to avoid endless loop, such as window.window === window
			if (is(copy, "Object")) {
				target[key] = arguments.callee(target[key] || {}, copy);
			} else if (is(copy, "Array")) {
				target[key] = arguments.callee(target[key] || [], copy);
			} else {
				target[key] = copy;
			}
		}
		return target;
	}

	// export
	return {
        /**
         * check the object type
         * @param obj
         * @param type
         * @returns {boolean}
         */
		is : is,

        /**
         * deep copy the source data into the target object, like jQuery.extend function
         * @param target
         * @param source
         * @returns {*}
         */
		deepCopy : deepCopy,

		/**
		 *  merget the source object data into the target object
		 * 
		 * @param target
		 * @param obj
		 * @param isDeepCopy
		 * @return {*}  return the merged object, which is the same object with target
		 */
		merge : function(target, obj, isDeepCopy) {
			target = target || {};
			isDeepCopy = isDeepCopy || false;
			if (is(target, "Array") && is(obj, "Array")) {
				for ( var i = 0; i < obj.length; i++) {
					if (obj[i] !== undefined)
						target.push(obj[i]);
				}
			} else {
				return isDeepCopy ? deepCopy(target, obj) : extendObj(target,
						obj);
			}

			return target;
		},

		array_indexof : function(arr, value) {
			for ( var i = 0; i < arr.length; i++) {
				if (arr[i] == value)
					return i;
			}
			return -1;
		},

		array_contains : function(arr, value) {
			return this.array_indexof(arr, value) >= 0;
		},

		inArray : function(arr, value) {
			return this.array_indexof(arr, value) >= 0;
		},

		getOffset : function(event) {
			var offset = {};
			if (typeof event.offsetX === "undefined"
					|| typeof event.offsetY === "undefined") {
				var targetOffset = $(event.target).offset();
				offset.offsetX = event.pageX - targetOffset.left;
				offset.offsetY = event.pageY - targetOffset.top;
			} else {
				offset.offsetX = event.offsetX;
				offset.offsetY = event.offsetY;
			}
			return offset;
		},


		hasAncestor : function(childElement, ancestorElement) {
			var el = childElement;
			while (el != document.documentElement) {
				el = el.parentElement;
				if (el == ancestorElement)
					return true;
			}
			return false;
		},

        /**
         *  get the formated type name, for example, UI.Textbox is typed 'Textbox' for short.
         * @param {String} type
         */
        getFormatedType: function(type){
            var matched = type.match(/^UI\.(\w+)$/);
             if(matched){
              return matched[1];
             } else
                return type;
        },

        getOuterHTML: function(node){
            var html = '';
            switch (node.nodeType) {
                case Node.ELEMENT_NODE:
                    html += '<';
                    html += node.nodeName;
                    if (!SPECIA_LELEMENTS[node.nodeName]) {
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

        parseIntPx: function(strPx){
            return strPx ? (  typeof strPx == "string" ? parseInt(strPx.replace("px", ""), 10) : parseInt(strPx, 10)) : 0;
        },

        parseFloatPx: function(strPx){
            return strPx ? (  typeof strPx == "string" ? parseFloat(strPx.replace("px", "")) : parseFloat(strPx)) : 0;
        },

        uuid: function (len, radix) {
            var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
            var chars = CHARS, uuid = [], i;
            radix = radix || chars.length;

            if (len) {
                // Compact form
                for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
            } else {
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
        }

	};




});