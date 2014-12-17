/**
 * @file Common codes for generated apps (used by ui control).
 * Since this module is not wrapped as require js module, it's allow global variables
 * pollution, but more carefully.
 * @dependency   none
 */

DataType = {
    Boolean: "Boolean",
    Int: "Int",
    Float: "Float",
    String: "String", // Single line string
    MString: "MString", // Multiple ling String
    Date: "Date",
    DateString: "DateString",
    ImageUrl: "ImageUrl",
    Color: "Color",
    Object: "Object",
    Function: "Function",
    Undefined: "undefined",
    TextList: "TextList",
    Theme: "Theme",
    IconPage: "IconPage",
    ImagePage: "ImagePage",
    ListPic: "ListPic",
    Select: "Select",
    SelectBoxValue: "SelectBoxValue"
};

var RUNTIME_DESIGN = "design";
var RUNTIME_PREVIEW = "preview";
var RUNTIME_APP = "app";

function checkRuntime() {
    if ("undefined" != typeof RUNTIME_IS_DESIGN) {
        return RUNTIME_DESIGN;
    }
    else {
        var pathName = window.location.pathname;
        var pathArray = pathName.split("/");
        if (pathArray.length == 6 && pathArray[2] == "data") {
            return RUNTIME_PREVIEW;
        }
        else
            return RUNTIME_APP;
    }
}

/**
 * Convert the resource uri path for APP, adaptive for current runtime context.
 * Often used to change src value of image element.
 * @param path {String} the resource path, the path should be relative to the app.
 * @returns {String} adaptive resource path
 */
function convertPath(path) {
    path = (path || "").trim();
    if(!path)
        return "";
    var runtime = checkRuntime();
    switch (runtime) {
        case RUNTIME_DESIGN:
            if (path.indexOf("controls/") == 0)
                return path;
            else if (path.indexOf("http://") == 0 || path.indexOf("https://") == 0 || path.match(/^[a-zA-Z]+:\/\//))
                return path;
            else {
                //convert the project path to ide path
                if (typeof PROJECT_PATH == "undefined")
                    return path;
                else
                    return PROJECT_PATH + path;
            }
        case RUNTIME_PREVIEW:
            if (path.indexOf("controls/") == 0)
                return "../../../" + path;
            else
                return path;
        case RUNTIME_APP:
            return path;
    }
    return path;
}

function reversePath(path) {
    path =( path || "" ).trim();
    if(!path)
        return "";
    var runtime = checkRuntime();
    switch (runtime) {
        case RUNTIME_DESIGN:
            if(typeof PROJECT_PATH != "undefined" && path.indexOf(PROJECT_PATH) == 0)
                return path.substring(PROJECT_PATH.length);
            else{
                var url = window.location.protocol + "//"+window.location.host +window.location.pathname;
                var matched = false;
               if(typeof PROJECT_PATH != "undefined")
                    url +=  PROJECT_PATH;
               if(path.indexOf(url) == 0)
                    return path.substring(url.length);
                else
                   return path;
            }
        case RUNTIME_PREVIEW:
            if(path.indexOf("../../../controls/") == 0)
                return path.substring("../../../controls/".length);
            else
                return path;
        case RUNTIME_APP:
            return path;
    }
    return path;
}


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
if (typeof (HTMLElement) != "undefined" && navigator.userAgent.indexOf("Firefox") >= 0) {
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
    HTMLElement.prototype.__defineGetter__("canHaveChildren", function() {
        return !/^(area|base|basefont|col|frame|hr|img|br|input|isindex|link|meta|param)$/.test(this.tagName
            .toLowerCase());
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
        throw new Error("extend failed, please check all dependencies are included.");
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
}

/**
 * copy data into the target obj
 */
function extendObj(target, obj1 /* , ... */) {
    target = target || {};
    for (var i = 1; i < arguments.length; i++) {
        var obj = arguments[i];
        for (var key in obj) {
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
    else if (typeof jsonText != "string")
        return jsonText;
    var obj = null;
    try {
        obj = JSON.parse(jsonText);
    } catch (e) {
        console.warn("Failed to parse json text '%s'.\nError: %o", jsonText, e);
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
    }
    else {
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
    };
    var str = date.getFullYear().toString() + separator + fs(month) + separator + fs(date.getDate());
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
        case "object":
        {
            if (obj instanceof Date)
                return String.format("{0}/{1}/{2} {3}:{4}", obj.getFullYear(), obj.getMonth() + 1, obj.getDate(), obj
                    .getHours(), obj.getMinutes());
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
        case DataType.Object:
        {
            var obj = parseFromJsonText(str);
            return obj != null ? obj : NaN;
        }
        case DataType.Function:
        {
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
    return obj.__lookupSetter__(prop) != null || (obj.__lookupGetter__(prop) == null && prop in obj);
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
 * @example   var isArray = is(obj, "Array");
 */
function is(obj, type) {
    var toString = Object.prototype.toString, undefined;
    return (type === "Null" && obj === null) || (type === "Undefined" && obj === undefined)
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
    for (var key in source) {
        var copy = source[key];
        if (target === copy)
            continue;
        if (is(copy, "Object")) {
            target[key] = arguments.callee(target[key] || {}, copy);
        }
        else if (is(copy, "Array")) {
            target[key] = arguments.callee(target[key] || [], copy);
        }
        else {
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
        for (var i = 0; i < obj.length; i++) {
            if (obj[i] !== undefined)
                target.push(obj[i]);
        }
    }
    else {
        return isDeepCopy ? deepCopy(target, obj) : extendObj(target, obj);
    }

    return target;
}

function getValueByJPath(obj, jpath) {
    if (obj == null || !jpath)
        return null;
    var script = jpath[0] == '[' ? "obj" + jpath : "obj." + jpath;
    try {
        return eval(script);
    } catch (e) {
        return null;
    }
}

function getValueByJPathSafely(obj, jpath) {
    if (!jpath)
        return null;
    var paths = jpath.split(".");
    for (var i = 0; i < paths.length; i++) {
        var propName = paths[i].trim();
        if (propName.match(/^[\w\$]+$/)) {
            console.error("Error path: " + jpath);
            return null;
        }
        paths[i] = propName;
    }
    var value = obj, index = 0;
    while (index < paths.length) {
        var propName = paths[index];
        if (value == null)
            return null;
        if (is(value, "Array") && value[0] && propName in value[0]) {
            //get value from the first element obj in array, this is useful in data mapping
            value = value[0][propName];
        }
        else if (propName in value) {
            value = value[propName];
        }
        else
            return null;
        index++;
    }
    return value;
}

function setValueByJPath(obj, jpath, value) {
    if (obj == null || typeof obj != "object" || !jpath) {
        return false;
    }
    var script = jpath[0] == '[' ? "obj" + jpath : "obj." + jpath;
    script += " = value;";
    try {
        eval(script);
    } catch (e) {
        return false;
    }
    return true;
}

doDataMapping = function() {
    var RESULT_ROOT_NAME = "result";
    var UI_DATA_ROOT_NAME = "data";

    function isArray(value) {
        return is(value, "Array");
    }

    function invoke(result, control, dataFormat, mappings) {
        if (!mappings || mappings.length == 0)
            return;
        if (!("setData" in control)) {
            console.warn("Control '%s' doesn't implement setData() function.", control.id);
            return;
        }
        var data = dataFormat;
        var ret = handleMappings(result, data, mappings, true, true);
        if (ret.changed)
            control.setData(ret.value);
    }

    function handleMappings(sourceObj, targetObj, mappings, isSourceRoot, isTargetRoot) {
        if (!mappings || mappings.length == 0)
            return {changed: false, value: targetObj};

        var changed = false;

        for (var i = 0; i < mappings.length; i++) {
            var item = mappings[i];
            if (!item.source)
                continue;
            var sourceValue;
            if (isSourceRoot) {
                if (item.source == RESULT_ROOT_NAME)
                    sourceValue = sourceObj;
                else if (item.source.indexOf(RESULT_ROOT_NAME + ".") == 0) {
                    var sourcePath = item.source.substring(RESULT_ROOT_NAME.length + 1);
                    sourceValue = getValueByJPath(sourceObj, sourcePath);
                }
                else
                    continue;
            }
            else {
                sourceValue = getValueByJPath(sourceObj, item.source);
            }
            if (!item.target) {
                if (item.isArray && item.items && item.items.length > 0
                    && isArray(sourceValue) && sourceValue.length > 0) {
                    var ret = handleMappings(sourceValue[0], targetObj, item.items, false, isTargetRoot);
                    if (ret.changed) {
                        targetObj = ret.value;
                        changed = true;
                    }
                }
                continue;
            }
            // item.target != null
            var targetPath = "";
            if (isTargetRoot) {
                if (item.target == UI_DATA_ROOT_NAME) {
                    targetPath = "";
                }
                else if (item.target.indexOf(UI_DATA_ROOT_NAME + ".") == 0) {
                    targetPath = item.target.substring(UI_DATA_ROOT_NAME.length + 1);
                }
                else
                    continue;
            }
            else {
                targetPath = item.target;
            }
            if (!item.isArray) {
                if (!targetPath)
                    targetObj = sourceValue;
                else
                    setValueByJPath(targetObj, targetPath, sourceValue);
                changed = true;
            }
            else {
                // do array mapping
                var targetValue = targetPath ? getValueByJPath(targetObj, targetPath) : targetObj;
                var newArray = [];
                if (!isArray(targetValue))
                    continue;
                else if (targetValue.length == 0) {
                    if (isArray(sourceValue)) {
                        if (sourceValue.length > 0) {
                            if (typeof sourceValue[0] == "object" || ( item.items && item.items.length > 0))
                                continue;   //do not mapping
                            else  //simple value
                                newArray = sourceValue;
                        }
                        else
                            newArray = [];
                    }
                    else
                        continue;
                }
                else {
                    var objFormat = targetValue[0];
                    // check whether is simple value mapping
                    if (isArray(sourceValue)) {
                        for (var j = 0; j < sourceValue.length; j++) {
                            var arrayValue = sourceValue[j];
                            var objValue = drillArrayValue(arrayValue, objFormat, item.items);
                            if (objValue != null)
                                newArray.push(objValue);
                        }
                    }
                    else {
                        //is a object, may be the original result data is xml format
                        if (!sourceValue || typeof  sourceValue != "object")
                            continue;
                        var objValue = drillArrayValue(sourceValue, objFormat, item.items);
                        if (objValue != null)
                            newArray.push(objValue);
                    }
                }
                if (!targetPath)
                    targetObj = newArray;
                else
                    setValueByJPath(targetObj, targetPath, newArray);
                changed = true;
            }
        }

        return {changed: changed, value: targetObj};
    }

    function drillArrayValue(sourceObj, targetFormat, mappings) {
        if (targetFormat == null)
            return null;
        if (mappings == null || mappings.length == 0) {
            if (typeof  targetFormat != "object") {
                if (typeof sourceObj != "object")
                    return sourceObj;
                else
                    return null;
            }
            else //no mapping
                return null;
        }
        if (typeof  targetFormat != "object" || !sourceObj || typeof sourceObj != "object")
            return null;
        if (isArray(sourceObj) || isArray(targetFormat)) {
            console.warn("Doesn't support mappings when the array element is array type.");
            return null;
        }

        var targetObj = deepCopy({}, targetFormat);
        var ret = handleMappings(sourceObj, targetObj, mappings, false, false);
        if (ret.changed)
            return targetObj;
        else
            return null;
    }

    return invoke;
}();

