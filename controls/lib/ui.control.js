/**
 * @file implement some core function for UI control used in app,
 *          for example, define the base control class
 * @dependency  common.js, jQuery.js
 */
if(typeof UI === "undefined"){
    UI = {
        TYPE_HEADER: "UI.",
        relativeImageDir: "./images/",
        relativeCssDir: "./css/",
        relativeResDir: "./res/",
        count: 0,

        setProps: function(control, jsonText) {
            var obj;
            if(typeof jsonText=="object")
                obj = jsonText;
            else
               obj =  parseFromJsonText(jsonText);
            if(!obj)
                return false;
            for(var propName in obj){
                //if (propName in control)
                if(checkWritable(control, propName))
                    control[propName] = obj[propName];
            }
            return true;
        },

        attachEventHandlers: function(control, jsonText) {
            var obj = parseFromJsonText(jsonText);
            if(!obj)
                return false;
            for(var eventName in obj){
                UI.attachOneEventHandler(control, eventName, obj[eventName]);
            }
            return true;
        },

        attachOneEventHandler: function(control, eventName, handlerName) {
            if(!eventName || !handlerName)
                return;
            var func = null;
            try{
                func = eval(handlerName);
            } catch(e){
                if(console)
                    console.warn("could not find function %s.\n error: %o", handlerName, e);
                return;
            }
            if(typeof func === "function" && eventName in control)
                control[eventName] = func;
        }
    };
}

UI.State = {
    UnRender: "UnRender",
    Rendered: "Rendered",
    Detached: "Detached",
    Destroyed: "Destroyed"
};

/**
 * UI control base class,  subclass can use extend() function to inherit.
 * @param {String|HTMLElement|Container} container  parent element id / reference, or container control
 */
UI.Control = function(container) {
    if(typeof arguments.callee.baseConstructor == "function")
        arguments.callee.baseConstructor.apply(this, arguments);
    this._state = UI.State.UnRender;
    UI.count++;

    if(container){
        if(typeof container === "string" || container instanceof HTMLElement){
            this.setContainer(container);
        } else if(container instanceof UI.Container){
            this.setParent(container);
        }
    }
};

UI.Control.prototype = {
    type: "UI.Control",
    designerType: "UI.Designer",

    _containerId: "",
    _container: null,
    _element: null,
    _elementId: "",
    _rendered: false,
    _html: "<div/>", //static html content, which must have one root element

    _parent: null,      //parent container
    _state: UI.State.UnRender,
    isContainer: false,

    renderOverlay: false,
    pageNo: 1,
    designer: null,

    setParent: function(parent) {
        if(this._rendered)
            return false;
        this._parent = parent;
    },

    setContainer: function(container) {
        /*if(this._rendered)
            return false;*/
        if(!container){
            this._container = null;
            this._containerId = "";
        }
        else if(typeof container == "string"){
            var containerEl = document.getElementById(container);
            if(!containerEl)
                return false;
            this._container = containerEl;
            this._containerId = container;
        } else if(container instanceof  HTMLElement){
            this._container = container;
            this._containerId = container.id;
        } else{
            return false;
        }
        return true;
    },

    _renderBase: function() {
        if(this._rendered)
            return false;
        if(!this._container){
            if(this._parent && this._parent.getContainerEl()){
                this.setContainer(this._parent.getContainerEl());
            } else
                return false;
        }
        if(this._state == UI.State.Detached && this._element){
            this._element = this._container.appendChild(this._element);
        } else{
            if(this._html){
                var el = document.createElement('div');
                this._container.appendChild(el);
                el.outerHTML = this._html;
                this._element = this._container.children.item(this._container.children.length - 1);
                if(this._elementId.trim())
                    this._element.id = this._elementId;
                else
                    this._elementId = this._element.id;
            } else{
                this._element = null;
                this._elementId = "";
            }
        }
        this._state = UI.State.Rendered;
        this._rendered = true;
		
		if(this.autowidth){
			if(this.Header){
				$(this._element).css({
					margin:"0",
					"margin-bottom":"5px"
				});
			}else if(this.Footer){
				$(this._element).css({
					margin:"0"
				});
			}else{
				$(this._element).css({
					margin:"0 1% 5px 1%"
				});
			}
		}else{
			$(this._element).css({
					margin:"0 auto 5px auto"
			});
		}
		
		if(this._parent && this._parent instanceof UI.Table){
			$(this._element).css({
				margin:"0 auto"
			});
		}
			
		//this._element.style.padding="1%";
        return true;
    },

    /**
     * @see _renderBase
     */
    render: function() {
        return  this._renderBase();
    },

    remove: function() {
        if(!this._rendered && !this._container)
            return true;
        if(this._element.parentElement)
            this._container.removeChild(this._element);
        this._rendered = false;
        this._state = UI.State.Detached;
        return true;
    },

    destroy: function() {
        if(this._parent){
            this._parent.removeControl(this);
        }
        this.remove();
        this._containerId = "";
        this._container = null;
        this._element = null;
        this._parent = null;
        this._rendered = false;
        this._state = UI.State.Destroyed;
    },

    show: function() {
        if(this._element)
            this._element.style.display = "block";
    },

    hide: function() {
        if(this._element)
            this._element.style.display = "none";
    },

    /**
     * set object control styles, such as
     *     position, left, top, width, height, visibility, textAlign
     * @param styleConfig {string}/{object}
     */
    setStyle: function(styleConfig) {
        if(!this._element)
            return false;
        if(typeof styleConfig == "object"){
            var style = this._element.style;
            for(var key in styleConfig){
                if(styleConfig.hasOwnProperty(key) && key in style){
                    style[key] = styleConfig[key];
                }
            }
        } else if(typeof styleConfig == "string"){
            this._element.style.cssText = styleConfig;
        }
        return true;
    }

};
UI.Control.prototype.constructor = UI.Control;

/**
 *  define getter/setter for ui control
 */
UI.Control.prototype.__defineGetter__('rendered', function() {
    return this._rendered;
});

UI.Control.prototype.__defineGetter__('element', function() {
    return this._element;
});

UI.Control.prototype.__defineGetter__('id', function() {
    this._elementId = this._element ? this._element.id : this._elementId;
    return this._elementId;
});

UI.Control.prototype.__defineSetter__('id', function(value) {
    this._elementId = value;
    if(this._element){
        this._element.id = value;
    }
});

UI.Control.prototype.__defineGetter__('container', function() {
    return this._container;
});

UI.Control.prototype.__defineGetter__('parent', function() {
    return this._parent;
});

UI.Control.prototype.__defineGetter__('state', function() {
    return this._state;
});

UI.Control.prototype.__defineGetter__('position', function() {
    return this._element ? (this._element.style.position || "static") : "";
});

UI.Control.prototype.__defineSetter__('position', function(value) {
    if(this._element){
        this._element.style.position = value;
    }
});

UI.Control.prototype.Header = false;
UI.Control.prototype.Footer = false;
UI.Control.prototype.autowidth = true;