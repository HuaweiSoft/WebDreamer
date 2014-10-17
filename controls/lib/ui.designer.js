/**
 * @file define the design-time  behavior of ui control in web dreamer ide
 * @dependency ui.control.js, common.js
 */

UI.DisplayMode = {
    Renderer: "Renderer",
    /**
     * only show an image in ide
     */
    Image: "Image"
};

UI.DesignEventType = {
    Resize:  "Resize"
};


UI.extendMeta = function (baseMeta, meta) {
    var obj = deepCopy({}, baseMeta);
    return merge(obj, meta, true);
};

UI.Designer = function (control) {
    if (typeof arguments.callee.baseConstructor == "function")
        arguments.callee.baseConstructor.call(this, control);

    this._control = control;

    this.defaultWidth = 320;
    this.defaultHeight = 0;
    this.displayMode = UI.DisplayMode.Renderer;
};

UI.Designer.prototype = {

    _control: null,

    objIndex: 0,
    defaultWidth: 320,
    defaultHeight: 0,
    displayMode: UI.DisplayMode.Renderer,
    displayImage: "",
    eventHandlers: {},

    /**
     * metadata description for current kind of control,
     * it's readonly.
     * @type {Object}
     */
    meta: {
        /**
         * control type, same value as Control.type property
         */
        type: "UI.Control",

        /**
         * control property features
         * @type {Object}
         * @property {String} datatype
         * @property defaultValue
         * @property readOnly
         * @property browseable
         * @property designable
         * @property description
         * @property displayName
         * @property category
         * @property editor
         * @property valueRange
         * @property formatter
         * @property serializable
         */
        props: {},

        events: {
            /*
             * for example onClick:{params:[]}
             */
        },

        methods: {
            /*
             * for example enable:{params:["enabled"]}
             */
        },

        defaultProperty: "",
        defaultEvent: "",
        defaultMethod: ""
    },

    containProp: function (propName) {
        return this.meta.props.hasOwnProperty(propName);
    },

    containEvent: function (eventName) {
        return this.meta.events.hasOwnProperty(eventName);
    },

    containMethod: function (methodName) {
        return this.meta.methods.hasOwnProperty(methodName);
    },

    /**
     *  Serialize all designable control properties into json text.
     *  If the serializable property value of one control property  is false in metadata,
     *  this property will not be serialized.
     * @return {String} text content in json format
     */
    getProps: function () {
        var obj = {};
        var ps = this.meta.props;
        for (var key in ps) {
            if (ps[key].serializable != false && key in this._control)
                obj[key] = this._control[key];
        }
        return stringifyToJsonText(obj);
    },

    /**
     * Bulk set property value of ui control by json data
     * @param  {String} jsonText
     */
    setProps: function (jsonText) {
        var obj = parseFromJsonText(jsonText);
        if (!obj)
            return false;
        for (var propName in obj) {
            this.setPropValue(propName, obj[propName]);
        }
        return true;
    },

    getEventHandlers: function () {
        var obj = {};
        var ents = this.meta.events;
        for (var key in ents) {
            var fun = this.eventHandlers[key] || "";
            if (fun.indexOf("_object") > 0) {
                var objid = this._control._elementId.replace("object", "");
                fun = this.eventHandlers[key].substring(0,
                    this.eventHandlers[key].indexOf("_object") + 7)
                    + objid;
            }
            obj[key] = fun;
        }
        return stringifyToJsonText(obj);
    },

    setEventHandler: function (eventName, handlerFuncName) {
        if (this.containEvent(eventName) && typeof handlerFuncName == "string") {
            this.eventHandlers[eventName] = handlerFuncName;
        }
    },

    setEventHandlers: function (jsonText) {
        var obj = parseFromJsonText(jsonText);
        if (!obj)
            return false;
        for (var eventName in obj) {
            this.setEventHandler(eventName, obj[eventName]);
        }
        return true;
    },

    /************************************************************************/
    /*  These following functions can be overrided by subclass.                    */
    /************************************************************************/
    render: function () {
        var rendered = true;
        if (this.displayMode == UI.DisplayMode.Image) {
            this._control._html = String.format(
                '<div style="height:100%; width:100%"><img src="{0}" style="width:100%; height:100%;"/></div>',
                this.displayImage);
            rendered = this._control._renderBase();
        } else {
            rendered = this._control.render();
        }
        if (rendered) {
            $(this._control).addClass("ns-control");
        }
        return rendered;
    },

    remove: function () {
        return this._control.remove();
    },

    destroy: function () {
        this._control.destroy();
    },

    getPropValue: function (propName) {
        var propValue = null;
        var element = this._control._element;
        switch (propName) {
            case "object-id":
                propValue = element.id;
                break;
            case "name":
                propValue = element.name;
                break;
            case "type":
                propValue = this._control.type;
                break;
            case "x":
                propValue = $(element).css("left");
                break;
            case "y":
                propValue = $(element).css("top");
                break;
            case "align":
                propValue = $(element).css("text-align");
                break;
            case "z-index":
            case "width":
            case "height":
            case "visibility":
                propValue = $(element).css(propName);
                break;
            default:
                if (this.meta.props.hasOwnProperty(propName)
                    && typeof this.meta.props[propName].formatter == "function") {
                    propValue = this.meta.props[propName].formatter
                        .call(this._control);
                } else
                    propValue = this._control[propName];
                break;
        }
        return propValue;
    },


    setPropValue: function (propName, propValue) {
        var propInfo = this.meta.props[propName];
        if (propInfo && typeof propValue == "string") {
            if (propInfo.datatype == "Boolean" || propInfo.datatype == "Bool") {
                propValue = parseBoolean(propValue);
            } else if (propInfo.datatype == "Int") {
                propValue = parseInt(propValue);
            } else if (propInfo.datatype == "Float") {
                propValue = parseFloat(propValue);
            }
        }
        var element = this._control._element;
        switch (propName) {
            case "object-id":
            case "type":
                break;
            case "name":
                element.name = propValue;
                break;
            case "x":
                element.style.left = propValue;
                break;
            case "y":
                element.style.top = propValue;
                break;
            case "z-index":
                element.style.zIndex = propValue;
                break;
            case "width":
                element.style.width = propValue;
                break;
            case "height":
                element.style.height = propValue;
                break;
            case "align":
                element.style.textAlign = propValue;
                break;
            case "visibility":
                element.style.visibility = propValue;
                break;
            default:
                if (checkWritable(this._control, propName))
                    this._control[propName] = propValue;
                else
                    return false;
                break;
        }
        return true;
    },

    /**
     * handle IDE design event
     *
     * @param {String} event see {@link UI.DesignEventType}
     */
    handleDesignEvent: function (event) {
        // To be implemented by subclass
    }
};

UI.Designer.prototype.constructor = UI.Designer;
MetaHub.register(UI.Designer.prototype.meta);