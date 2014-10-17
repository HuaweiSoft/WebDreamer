/**
 * @file Common codes for web dreamer and generated apps (used by ui control).
 * Since this module is not wrapped as require js module, it's allow global variables
 * pollution, but more carefully.
 */

DataType = {
	Boolean : "Boolean",
	Int : "Int",
	Float : "Float",
	String : "String",         // Single line string
	MString : "MString", // Multiple ling String
	Date : "Date",
	DateString : "DateString",
	ImageUrl : "ImageUrl",
	Color : "Color",
	Object : "Object",
	Function : "Function",
	Undefined : "undefined",
	TextList : "TextList",
	Theme : "Theme",
	IconPage : "IconPage",
	ImagePage : "ImagePage",
	ListPic : "ListPic",
	Select : "Select",
	SelectBoxValue : "SelectBoxValue"
};

if (typeof String.prototype.trim != "function") {
	String.prototype.trim = function() {
		return this.replace(/(^\s*)|(\s*$)/g, "");
	}
}

if (typeof String.format != "function") {
	/**
	 * String format function like String.format() in C# language. Example: var
	 * msg= String.format("'{0}' is not a valid name.", name);
	 */
	String.format = function(src) {
		if (arguments.length == 0)
			return null;
		var args = Array.prototype.slice.call(arguments, 1);
		return src.replace(/\{(\d+)\}/g, function(m, i) {
			return args[i];
		});
	}
}

/**
 * support outerHTML property in firefox
 */
if (typeof (HTMLElement) != "undefined"
		&& navigator.userAgent.indexOf("Firefox") >= 0) {
	HTMLElement.prototype.__defineGetter__("outerHTML", function() {
		var a = this.attributes, str = "<" + this.tagName, i = 0;
		for (; i < a.length; i++)
			if (a[i].specified)
				str += " " + a[i].name + '="' + a[i].value + '"';
		if (!this.canHaveChildren)
			return str + " />";
		return str + ">" + this.innerHTML + "</" + this.tagName + ">";
	});
	HTMLElement.prototype.__defineSetter__("outerHTML", function(s) {
		var r = this.ownerDocument.createRange();
		r.setStartBefore(this);
		var df = r.createContextualFragment(s);
		this.parentNode.replaceChild(df, this);
		return s;
	});
	HTMLElement.prototype
			.__defineGetter__(
					"canHaveChildren",
					function() {
						return !/^(area|base|basefont|col|frame|hr|img|br|input|isindex|link|meta|param)$/
								.test(this.tagName.toLowerCase());
					});
}

/**
 *  Compatible with IE browser for console object.
 */
if (!window.console)
	console = {};
console.log = console.log || function() {
};
console.warn = console.warn || function() {
};
console.error = console.error || function() {
};
console.info = console.info || function() {
};

/**
 * extend function
 * 
 * @param {Function} SubClass  function name of subclass
 * @param {Function} SuperClass function name of superclass
 * @param {Object}  [overrides]
 * @see YAHOO.extend() function in yahoo.js
 */
function extend(SubClass, SuperClass, overrides) {
	if (!SubClass || !SuperClass) {
		throw new Error(
				"extend failed, please check all dependencies are included.");
	}
	var F = function() {};
	F.prototype = SuperClass.prototype;
	SubClass.prototype = new F();
	SubClass.prototype.constructor = SubClass;
	SubClass.superClass = SuperClass.prototype;
	SubClass.baseConstructor = SuperClass;

	if (overrides) {
		for ( var key in overrides) {
			if (overrides.hasOwnProperty(key))
                SubClass.prototype[key] = overrides[key];
		}
	}
}

/**
 * copy data into the target obj
 */
function extendObj(target, obj1 /* , ... */) {
	target = target || {};
	for ( var i = 1; i < arguments.length; i++) {
		var obj = arguments[i];
		for ( var key in obj) {
			target[key] = obj[key];
		}
	}
	return target;
}

/**
 * Return the parsed object by the specified json content.
 * If the json content has wrong format, this function will return null value,
 * not throw an exception.
 * @param jsonText
 * @returns {*}
 */
function parseFromJsonText(jsonText) {
	if (!jsonText)
		return {};
	var obj = null;
	try {
		obj = JSON.parse(jsonText);
	} catch (e) {
		if (console)
			console.warn("Failed to parse json text '%s'.\nError: %o",
					jsonText, e);
		return null;
	}
	return obj;
}

/**
 * Return the json format content of specified object
 * @param obj
 * @returns {*}
 * @see  {@link JSON.stringify()}
 */
function stringifyToJsonText(obj) {
	return JSON.stringify(obj);
}

/**
 * Attach input value listener.
 * 
 * @param input {HTMLElement}
 * @param func     {function}
 */
function attachInputValueListener(input, func) {
	if (window.addEventListener) {
		input.addEventListener('input', func, false);
	} else {
		input.attachEvent('onpropertychange', function() {
			if (window.event.propertyName == "value")
				func.call(input);
		});
	}
}

function formatDateString(date, separator, timeVisible, secondVisible) {
	if (!date || !(date instanceof Date))
		return "";
	if (!separator)
		separator = "|";
	if (timeVisible == undefined || timeVisible == null)
		timeVisible = true;
	if (secondVisible == undefined || secondVisible == null)
		secondVisible = false;
	separator = separator[0];
	var month = date.getMonth() + 1;
	var fs = function(d) {
		return d < 10 ? "0" + d.toString() : d.toString();
	}
	var str = date.getFullYear().toString() + separator + fs(month) + separator
			+ fs(date.getDate());
	if (timeVisible) {
		str += " " + fs(date.getHours()) + ":" + fs(date.getMinutes());
		if (secondVisible) {
			str += ":" + fs(date.getSeconds());
		}
	}
	return str;
}

/*
 * parse boolean value from a string text
 */
function parseBoolean(boolString) {
	if (boolString == null)
		return NaN;
	switch (boolString) {
	case "true":
	case "TRUE":
	case "1":
		return true;
		break;
	case "false":
	case "FALSE":
	case "0":
	case "":
		return false;
		break;
	default:
		return NaN;
	}
}

function parseBool(boolString) {
	return parseBoolean(boolString);
}

function getDataString(obj, type) {
	var t = typeof obj;
	switch (t) {
	case "string":
		return obj;
	case "number":
	case "boolean":
	case "function":
		return obj.toString();
	case "object": {
		if (obj instanceof Date)
			return String.format("{0}/{1}/{2} {3}:{4}", obj.getFullYear(), obj
					.getMonth() + 1, obj.getDate(), obj.getHours(), obj
					.getMinutes());
		else {
			switch (type) {
			case "":
				break;
			case "Object":
				return stringifyToJsonText(obj);
				break;
			}
		}
	}
		break;
	case "undefined":
		return "";
	}
}

function parseDataByString(str, type) {
	if (typeof str != "string" || typeof type != "string" || type == "")
		return NaN;
	switch (type) {
	case DataType.Boolean:
		return parseBoolean(str);
	case DataType.Int:
		return parseInt(str);
	case DataType.Float:
		return parseFloat(str);
	case DataType.String:
		return str;
	case DataType.Date:
		return Date.parse(str);
	case DataType.DateString:
		return !isNaN(Date.parse(str)) ? str : NaN;
	case DataType.Object: {
		var obj = parseFromJsonText(str);
		return obj != null ? obj : NaN;
	}
	case DataType.Function: {
		var func = null;
		try {
			func = eval(str);
		} catch (e) {
			return NaN;
		}
		return (typeof func === "function") ? func : NaN;
	}
	default:
		return NaN; // or return null
		break;
	}
}

/**
 * Check whether the specified property of the specified object can be written.
 * @param {Object} obj  object
 * @param {String}  prop property name
 * @return {Boolean} writable
 */
function checkWritable(obj, prop) {
	return obj.__lookupSetter__(prop) != null
			|| (obj.__lookupGetter__(prop) == null && prop in obj);
    // lenient implement:
    // obj.__lookupGetter__(prop)==null || obj.__lookupSetter__(prop)!=null;
}

/**
 * Check whether the specified property of the specified object can be read.
 *
 * @param {Object} obj  object
 * @param {String}  prop property name
 * @return {Boolean} readable
 */
function checkReadable(obj, prop) {
	return obj.__lookupGetter__(prop) != null || prop in obj;
}

/**
 * check the object type
 * @param obj
 * @param type
 * @returns {boolean}
 */
function is(obj, type) {
	var toString = Object.prototype.toString, undefined;
	return (type === "Null" && obj === null)
			|| (type === "Undefined" && obj === undefined)
			|| toString.call(obj).slice(8, -1) === type;
}

/**
 * deep copy the source data into the target object, like jQuery.extend function
 * @param target
 * @param source
 * @returns {*}
 */
function deepCopy(target, source) {
	if (target == null)
		target = {};
	for ( var key in source) {
		var copy = source[key];
		if (target === copy)
			continue;
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

/**
 *  Merge the source object data into the target object
 *
 * @param target
 * @param obj
 * @param isDeepCopy
 * @return {*}  return the merged object, which is the same object with target
 */
function merge(target, obj, isDeepCopy) {
	target = target || {};
	isDeepCopy = isDeepCopy || false;
	if (is(target, "Array") && is(obj, "Array")) {
		for ( var i = 0; i < obj.length; i++) {
			if (obj[i] !== undefined)
				target.push(obj[i]);
		}
	} else {
		return isDeepCopy ? deepCopy(target, obj) : extendObj(target, obj);
	}

	return target;
}