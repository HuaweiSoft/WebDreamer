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
    Resize: "Resize"
};


UI.extendMeta = function(baseMeta, meta) {
    var obj = deepCopy({}, baseMeta);
    return merge(obj, meta, true);
};

UI.Designer = function(control) {
    if (typeof arguments.callee.baseConstructor == "function")
        arguments.callee.baseConstructor.call(this, control);

    this._control = control;
};

UI.Designer.prototype = {

    _control: null,

    defaultWidth: 0,
    defaultHeight: 0,
    displayMode: UI.DisplayMode.Renderer,
    displayImage: "",

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
         * @property datatype
         *                                          {String}  the data type of property value
         * @property [readOnly=false]
         *                                          {Boolean}   read only or write able
         * @property [browsable=true]
         *                                          {Boolean}   whether to show this property in property editor
         * @property [designable=true]
         *                                          {Boolean}   whether to show this property in logic designer
         * @property [displayName]
         *                                          {String}    the displayed name in designer
         * @property [defaultValue]
         *                                          {*}   default value of this property
         * @property [description]
         *                                          {String}
         * @property [category='Custom']
         *                                          {String} Property category:Common, Custom, CSS.
         * @property [editor]
         *                                         {String} type of property editor, which is created to edit value
         *                                         of current property
         * @property [valueRange]
         *                                        {Array}  String Array, currently only support to declare a string
         *                                        array to describe the value range of string property. For example,
         *                                        the valueRange of textbox input type can be ["text", "password", "date"] .
         * @property [formatter]
         *                                       {Function} formatting function, use to show displayed text in property text.
         * @property [serializable=true]
         *                                       {Boolean}  Whether to save into serialization data such as json.
         * @property [isCssProperty=false]
         *                                       {Boolean}  If the property is a css property, the control doesn't really to
         *                                       implement the property declaration,  just make the property name is valid
         *                                       in properties of element.style object, and the property value is string type.
         * @property [useGetterSetter=false]
         *                                       {Boolean}  Whether to get/set the property value by invoking getter/setter
         *                                       function, instead of accessing property.
         */
        props: {
            "id": {
                datatype: "String",
                readOnly: true,
                browsable: true,
                designable: false,
                category: "Common",
                description: "the id of UI component, which is equal as DOM object id",
                serializable: false
            },

            "type": {
                datatype: "String",
                readOnly: true,
                browsable: true,
                designable: false,
                category: "Common",
                description: "the type of UI component",
                serializable: false
            },

            "width": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "the width of UI component",
                serializable: true,
                defaultValue: "98%"
            },

            "height": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "the height of UI component",
                serializable: true
            },

            "position": {
                datatype: "String",
                readOnly: false,
                designable: false,
                browsable: false,
                category: "Common",
                defaultValue: "relative"
            },

            "left": {
                datatype: "String",
                readOnly: false,
                designable: false,
                browsable: false,
                category: "Common",
                description: "the left position of UI component",
                serializable: true
            },

            "top": {
                datatype: "String",
                readOnly: false,
                browsable: false,
                designable: false,
                category: "Common",
                description: "the top position of UI component",
                serializable: true
            },

            "align": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "",
                valueRange: [ "left", "center", "right" ],
                defaultValue: "left",
                serializable: true
            },

            "zIndex": {
                datatype: "String",
                readOnly: false,
                designable: false,
                browsable: false,
                category: "Common",
                description: "the stack order of UI component",
                serializable: true
            },

            "visibility": {
                datatype: "String",
                readOnly: false,
                designable: false,
                category: "Common",
                description: "",
                valueRange: [ "visible", "hidden" ],
                serializable: true,
                defaultValue: "visible"
            }
        },

        events: {
            onClick: {params: [], icon:"controls/eventicon/click.png",  alias: "click"}
        },

        methods: {
            show: {
                alias: "show",
                params: []
            },
            hide: {
                alias: "hide",
                params: []
            },
            changeDisplay: {
                alias: "changeDisplay",
                params: []
            }
        },

        defaultProperty: "",
        defaultEvent: "onClick",
        defaultMethod: ""
    },

    containProp: function(propName) {
        return this.meta.props.hasOwnProperty(propName);
    },

    containEvent: function(eventName) {
        return this.meta.events.hasOwnProperty(eventName);
    },

    containMethod: function(methodName) {
        return this.meta.methods.hasOwnProperty(methodName);
    },

    /**
     *  Serialize all designable control properties into json text.
     *  If the serializable property value of one control property  is false in metadata,
     *  this property will not be serialized.
     * @return {String} text content in json format
     */
    getProps: function() {
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
    setProps: function(jsonText) {
        var obj = parseFromJsonText(jsonText);
        if (!obj)
            return false;
        for (var propName in obj) {
            this.setPropValue(propName, obj[propName]);
        }
        return true;
    },


    /************************************************************************/
    /*  These following functions can be overrided by subclass.                    */
    /************************************************************************/
    render: function() {
        var rendered = true;
        if (this.displayMode == UI.DisplayMode.Image) {
            this._control._html = String.format(
                '<div style="height:100%; width:100%"><img src="{0}" style="width:100%; height:100%;"/></div>',
                this.displayImage);
            rendered = this._control._renderBase();
        }
        else {
            rendered = this._control.render();
        }
        if (rendered) {
            this._control.$el.addClass("ns-control");
        }
        return rendered;
    },

    remove: function() {
        return this._control.remove();
    },

    destroy: function() {
        this._control.destroy();
    },

    getPropValue: function(propName) {
        var propValue = null;
        var element = this._control._element;
        switch (propName) {
            case "id":
                propValue = element.id;
                break;
            case "type":
                propValue = this._control.type;
                break;
            case "position":
                propValue = $(element).css("position");
                break;
            case "left":
                propValue = $(element).css("left");
                break;
            case "top":
                propValue = $(element).css("top");
                break;
            case "align":
                propValue = $(element).css("text-align");
                break;
            case "width":
                return  element.style.width || $(element).css("width");
                break;
            case "height":
                return  element.style.height || $(element).css("height");
                break;
            case "zIndex":
            case "visibility":
                propValue = $(element).css(propName);
                break;
            default:
                if (this.meta.props.hasOwnProperty(propName)
                    && typeof this.meta.props[propName].formatter == "function") {
                    propValue = this.meta.props[propName].formatter
                        .call(this._control);
                }
                else
                    propValue = this._control[propName];
                break;
        }
        return propValue;
    },


    setPropValue: function(propName, propValue) {
        var element = this._control._element;
        switch (propName) {
            case "id":
            case "type":
                break;
            case "position":
                element.style.position = propValue;
                break;
            case "left":
                element.style.left = propValue;
                break;
            case "top":
                element.style.top = propValue;
                break;
            case "zIndex":
                element.style.zIndex = propValue;
                break;
            case "width":
                element.style.width = propValue;
                this._control.trigger(UI.Event.Resized);
                break;
            case "height":
                element.style.height = propValue;
                this._control.trigger(UI.Event.Resized);
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
    handleDesignEvent: function(event) {
        // To be implemented by subclass
    }
};

UI.Designer.prototype.constructor = UI.Designer;

//register
UI.Control.prototype.designerType = "UI.Designer";
MetaHub.register(UI.Designer.prototype.meta);