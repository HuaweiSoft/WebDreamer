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
 *
 *  @module metaHub  manager the metadatas of all kinds of control and service.
 *  @example
 *  <pre>
 *        var meta = metaHub.get("INPUTBOX");
 *           for(var attr in meta.props){
 *               if(meta.props.hasOwnProperty(attr)){
 *                   var prop = meta.props[attr];
  *                   var datatype = prop.datatype;
 *                       //do something
 *                        ...
 *                    }
 *            }
 *   </pre>
 */
define([ "util", "HashMap" ], function(util, HashMap) {

    /** default properties for ui control */
    var defaultPropFeature = {
        datatype: "String",
        displayName: "",
        browsable: true, // showable in property editor
        designable: true, // showable in designer
        defaultValue: null,
        readOnly: false,
        description: "",


        /**
         * Property category:Common, Custom, CSS.
         */
        category: "Custom",

        /**
         * Property editor type, which is created to edit value of current property
         */
        editor: "",

        /**
         *  value range, currently support string array
         */
        valueRange: null,

        /**
         *  formatting function, use to show displayed text in property text.
         * @type function()  return = {string}
         */
        formatter: null,

        /**
         * Whether to save into serialization data such as json.
         */
        serializable: true,

        /**
         * If the property is a css property, the control doesn't really to implement the property declaration,
         * just make the property name is valid in properties of element.style object, and the property value is string type.
         */
        isCssProperty: false,

        /**
         * Whether to get/set the property value by invoking getter/setter function, instead of accessing property.
         */
        useGetterSetter: false
    };

     var _uiMetas = new HashMap();
    var _apiMetas = new HashMap();

    function _merge(target, obj) {
        target = target || {};
        for ( var key in obj) {
            if (target[key] === undefined)
                target[key] = obj[key];
        }
        return target;
    }

    function _copyProperties(target, source, onlyOwnProperty, deepCopy) {
        onlyOwnProperty = onlyOwnProperty || true;
        deepCopy = deepCopy || true;
        for ( var key in source) {
            if ((onlyOwnProperty && source.hasOwnProperty(key)) || !onlyOwnProperty) {
                target[key] = deepCopy ? util.deepCopy(target[key], source[key]) : source[key];
            }
        }
        return target;
    }

    function _addCommonMeta(meta) {
        if (meta.props == null)
            meta.props = {};
        if (meta.events == null)
            meta.events = {};
        if (meta.methods == null)
            meta.methods = {};
        if (!("defaultProperty" in meta))
            meta.defaultProperty = "";
        if (!("defaultEvent" in meta))
            meta.defaultEvent = "";
        if (!("defaultMethod" in meta))
            meta.defaultMethod = "";
        if(typeof  meta.props != "object")
            meta.props =  {};
        var myProps = meta.props;
        for ( var key in myProps) {
            if (myProps.hasOwnProperty(key)) {
                meta.props[key] = _merge(myProps[key], defaultPropFeature);
            }
        }
        return meta;
    }

    function register(meta) {
        if (!meta || !meta.type || typeof meta.type != "string")
            return null;
        var type = util.trim(meta.type);
        if (_uiMetas.containsKey(type)) {
            console.debug("The '%s' ui meta will be replaced.", type);
        }
        _addCommonMeta(meta);
        _uiMetas.put(type, meta);
        return meta;
    }

    /**
     * get ui control metadata of specified type
     * @param type {String}  ui control type
     * @returns {Object}
     */
    function getMetadata(type) {
        if (!type || typeof type != "string")
            return null;
        type = util.trim(type);
        return _uiMetas.get(type);
    }

    var commonApiMeta = {
        name: "",
        displayName: "",
        type: "SERVICE",
        provider: "",
        className: "",
        functionName: "",
        params: [],
        description: "",
        category: "",
        imageUrl: ""
    };

    function getApiMeta(name) {
        if (!name)
            return null;
        if (name.indexOf("(") > 0) {
            name = name.substr(0, name.indexOf("("));
        }
        return _apiMetas.get(name);
    }

    function parseDatasourceURL(datasourceURL) {
        var first = datasourceURL.indexOf(".");
        var next = datasourceURL.indexOf("(");
        var last = datasourceURL.indexOf(")");
        if (next == -1 || last == -1 || last <= next)
            return null;
        var className, functionName, params;
        if (first >= 0) {
            className = datasourceURL.substring(0, first);
            functionName = datasourceURL.substring(first + 1, next);
        } else {
            className = "";
            functionName = datasourceURL.substring(0, next);
        }
        params = datasourceURL.substring(next + 1, last);
        return {
            className: className,
            functionName: functionName,
            params: params
        };
    }

    function registerApiMeta(apiMeta) {
        if (!apiMeta || !apiMeta.name || typeof apiMeta.name != "string")
            return null;
        var meta = apiMeta;
        // var meta = util.deepCopy({}, apiMeta);
        // meta = _merge(meta, commonApiMeta);
        if (!apiMeta.params)
            meta.params = [];
        if (apiMeta.datasourceURL) {
            var ds = parseDatasourceURL(apiMeta.datasourceURL);
            meta.name = apiMeta.name || (ds.className ? ds.className + "." + ds.functionName : ds.functionName);
            meta.className = apiMeta.className || ds.className;
            meta.functionName = apiMeta.functionName || ds.functionName;
            if (meta.params.length == 0 && ds.params.length > 0) {
                var pm = ds.params.split(",");
                pm.forEach(function(paramName) {
                    meta.params.push(paramName.trim());
                });
            }
        }
        _apiMetas.put(meta.name, meta);
        return meta;
    }
    function clearServiceMetas() {

        _apiMetas.clear();

    }

    /* register the global inbuilt metadata */
    register({
        type: "APP",
        props: {},
        events: {
            "onload": {
                params: [],
                icon: "controls/eventicon/init.png",
                type: "common",
                alias: "Loading"
            },
            "onorientationchange": {
                params: [],
                icon: "controls/eventicon/mobilerotate.png",
                type: "mobile",
                alias: "Rotation"
            }
        },
        methods: {}
    });

    // export
    return {
        /**
         *  Return the metadata of the specified ui control
         * @param type {string} ui contorl type
         * @return meta
         */
        get: getMetadata,

        getUiMetadata: getMetadata,

        /**
         * Register metadata of ui control
         * @param  meta
         */
        register: register,

        registerUiMetadata: register,

        /**
         * Return the metadata of the specified service api
         * @param name {string}  api or service name
         * @return {meta}
         */
        getApiMeta: getApiMeta,

        /**
         * Register metadata of service api
         * @param apiMeta
         */
        registerApiMeta: registerApiMeta,

        clearServiceMetas: clearServiceMetas,

        /**
         * @param {Function} callback params: (meta)
         */
        forEachMeta: function(callback) {
            _uiMetas.forEach(function(type, meta) {
                callback(meta);
            });
        },

        /**
         * @param {Function} callback params: (meta)
         */
        forEachApiMeta: function(callback) {
            _apiMetas.forEach(function(name, meta) {
                callback(meta);
            });
        }
    }
});
