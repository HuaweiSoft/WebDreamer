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
 *        var meta = MetaHub.get("INPUTBOX");
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
define(["util"], function (util) {

    /** default properties for ui control */
    var defaultPropFeature = {
        datatype: "String",
        defaultValue: null,
        readOnly: false,
        browseable: true, //showable in property editor
        designable: true, //showable in designer
        description: "",
        displayName: "",

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

        serializable: true  //Whether to save to serialization data such as json.
    };

    //define some common metadata
    var commonMeta = {
        props: {
            "object-id": {
                datatype: "String",
                readOnly: true,
                designable: false,
                category: "Common",
                description: "the id of UI component, which is equal as DOM object id",
                serializable: false
            },
            "name": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "the custom name of UI component",
                serializable: false
            },
            "type": {
                datatype: "String",
                readOnly: true,
                designable: false,
                category: "Common",
                description: "the type of UI component",
                serializable: false
            },
            "x": {
                datatype: "String",
                readOnly: true,
                designable: false,
                category: "Common",
                description: "the left position of UI component",
                serializable: false
            },
            "y": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "the top position of UI component",
                serializable: false
            },
            "z-index": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "the stack order of UI component",
                serializable: false
            },
            "width": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "the width of UI component",
                serializable: false
            },
            "height": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "the height of UI component",
                serializable: false
            },
            "align": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "",
                valueRange: ["left", "center", "right"],
                defaultValue: "left",
                serializable: false
            },
            "visibility": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "",
                valueRange: ["visible", "hidden"],
                serializable: false
            }
        },

        events: {
        },

        methods: {
            show: {alias: "show", params: []},
            hide: {alias: "hide", params: []},
            changeDisplay: {alias: "changeDisplay", params: []}
            //getValue: {alias:"Value",params: [],getValue:true}
        },

        defaultProperty: "value",
        defaultEvent: "",
        defaultMethod: ""
    };

    var commonProps = commonMeta.props;
    for (var key in commonProps)
        if (commonProps.hasOwnProperty(key))
            commonProps[key] = _merge(commonProps[key], defaultPropFeature);

    var metaArray = [];

    function _merge(target, obj) {
        target = target || {};
        for (var key in obj) {
            if (target[key] === undefined)
                target[key] = obj[key];
        }
        return target;
    }

    function _copyProperties(target, source, onlyOwnProperty, deepCopy) {
        onlyOwnProperty = onlyOwnProperty || true;
        deepCopy = deepCopy || true;
        for (var key in source) {
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
        var myProps = meta.props;
        meta.props = _copyProperties({}, commonMeta.props);
        for (var key in myProps) {
            if (myProps.hasOwnProperty(key)) {
                meta.props[key] = _merge(myProps[key], defaultPropFeature);
            }
        }
        var cmEvents = commonMeta.events;
        for (var key in cmEvents) {
            if (cmEvents.hasOwnProperty(key) && meta.events[key] == null) {
                meta.events[key] = util.deepCopy(meta.events[key], cmEvents[key]);
            }
        }
        var cmMethods = commonMeta.methods;
        for (var key in cmMethods) {
            if (cmMethods.hasOwnProperty(key) && meta.methods[key] == null) {
                meta.methods[key] = util.deepCopy(meta.methods[key], cmMethods[key]);
            }
        }
        return meta;
    }

    function register(meta) {
        if (!meta || !meta.type)
            return null;
        var mt = metaArray;
        for (var index = 0; index < mt.length; index++) {
            if (mt[index].type == meta.type) {
                console.warn("Replace the older meta, type = " + meta.type); //测试复制meta后是否有改变type
                _addCommonMeta(meta);
                mt[index] = meta;
                return meta;
            }
        }
        _addCommonMeta(meta);
        mt.push(meta);
        return meta;
    }

    function getMetadata(type) {
        var mt = metaArray;
        var typeinfo = typeof type;
        if (typeinfo == "string") {
            for (var index = 0; index < mt.length; index++) {
                if (mt[index].type == type || mt[index].type.toLowerCase() == type.toLowerCase())
                    return  mt[index];
            }
        } else if (typeinfo == "object" && type.designer != null) {
            return type.designer.meta;
        }
        return null;
    }

    var apiMetaArray = [];
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
        for (var index = 0; index < apiMetaArray.length; index++) {
            if (apiMetaArray[index].name == name)
                return  apiMetaArray[index];
        }
        return null;
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
        if (!apiMeta || !apiMeta.name)
            return null;
        var meta = apiMeta;
        //var meta = util.deepCopy({}, apiMeta);
        //meta = _merge(meta, commonApiMeta);
        if (!apiMeta.params)
            meta.params = [];
        if (apiMeta.datasourceURL) {
            var ds = parseDatasourceURL(apiMeta.datasourceURL);
            meta.name = apiMeta.name || (ds.className ? ds.className + "." + ds.functionName : ds.functionName);
            meta.className = apiMeta.className || ds.className;
            meta.functionName = apiMeta.functionName || ds.functionName;
            if (meta.params.length == 0 && ds.params.length > 0) {
                var pm = ds.params.split(",");
                pm.forEach(function (paramName) {
                    meta.params.push(paramName.trim());
                });
            }
        }
        var mt = apiMetaArray;
        for (var index = 0; index < mt.length; index++) {
            if (mt[index].name == meta.name) {
                mt[index] = meta;
                return meta;
            }
        }
        mt.push(meta);
        return meta;
    }

    /*  register the global inbuilt metadata */
    register({
        type: "APP",
        props: { },
        events: {
            "initialFunction": {
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
        methods: {   }
    });


    //export
    return {
        /**
         *  Return the metadata of the specified ui control
         * @param type {string} ui contorl type
         * @return meta
         */
        get: getMetadata,

        /**
         * Register metadata of ui control
         * @param  meta
         */
        register: register,

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

        /**
         * @param {Function} callback params: (meta)
         */
        forEachMeta: function (callback) {
            metaArray.forEach(callback);
        },

        /**
         * @param {Function} callback params: (meta)
         */
        forEachApiMeta: function (callback) {
            apiMetaArray.forEach(callback);
        }
    }
});
