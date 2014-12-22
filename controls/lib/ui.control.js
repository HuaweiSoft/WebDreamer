/**
 * @file implement some core function for UI control used in app,
 *          for example, define the base control class
 * @dependency  common.js, jQuery.js
 */
if (typeof UI === "undefined") {
    UI = {
        TYPE_HEADER: "UI.",
        count: 0,
        LOADING_ID: "loading9999x",
        THEMES:  [ "A", "B", "C", "D", "E", "F", "G" ],

        setProps: function(control, jsonText) {
            var obj;
            if (typeof jsonText == "object")
                obj = jsonText;
            else
                obj = parseFromJsonText(jsonText);
            if (!obj)
                return false;
            for (var propName in obj) {
                //if (propName in control)
                if (checkWritable(control, propName))
                    control[propName] = obj[propName];
            }
            return true;
        },

        attachEventHandlers: function(control, jsonText) {
            var obj = parseFromJsonText(jsonText);
            if (!obj)
                return false;
            for (var eventName in obj) {
                UI.attachOneEventHandler(control, eventName, obj[eventName]);
            }
            return true;
        },

        attachOneEventHandler: function(control, eventName, handlerName) {
            if (!eventName || !handlerName)
                return;
            var func = null;
            try {
                func = eval(handlerName);
            } catch (e) {
                if (console)
                    console.warn("could not find function %s.\n error: %o", handlerName, e);
                return;
            }
            if (typeof func === "function" && eventName in control)
                control[eventName] = func;
        },

        showLoading: function(title){
            title = title || "loading";
            var $el = $(document.body).children("#" + this.LOADING_ID);
            if($el.length == 0){
                $el = $('<div class="loading-overlay"><div class="loading-backdrop"></div><div class="loading-container">' +
                    '<div class="loading-gif"></div><div class="loading-text"></div></div></div>');
                $el.attr("id", this.LOADING_ID);
                $(document.body).append($el);
            }
            $el.show();
            $el.find(".loading-text").text(title);
        },

        hideLoading: function(){
            $(document.body).children("#" + this.LOADING_ID).hide();
        }
    };
}

UI.State = {
    UnRender: "UnRender",
    Rendered: "Rendered",
    Detached: "Detached",
    Destroyed: "Destroyed"
};

UI.Event = {
    Resized: "Resized"
};

/**
 * UI control base class,  subclass can use extend() function to inherit.
 * @param {String|HTMLElement|Container} container  parent element id / reference, or container control
 */
UI.Control = function(container) {
    if (typeof arguments.callee.baseConstructor == "function")
        arguments.callee.baseConstructor.apply(this, arguments);
    this._state = UI.State.UnRender;
    UI.count++;
    this.resourceDir = "controls/" + this.type.toLowerCase() + "/resources/";

    if (container) {
        if (typeof container === "string" || container instanceof HTMLElement) {
            this.setContainer(container);
        }
        else if (container instanceof UI.Container) {
            this.setParent(container);
        }
    }
};

UI.Control.prototype = {
    type: "UI.Control",

    _containerId: "",
    _container: null,
    _element: null,
    $el: null,
    _elementId: "",
    _rendered: false,
    _html: "<div></div>", //static html content, which must have one root element

    _parent: null,      //parent container
    _state: UI.State.UnRender,
    isContainer: false,

    renderOverlay: false,
    designer: null,
    resourceDir: "",

    //event handlers
    onClick: null,

    eventListeners: {},

    setParent: function(parent) {
        if (this._rendered)
            return false;
        this._parent = parent;
    },

    setContainer: function(container) {
        /*if(this._rendered)
         return false;*/
        if (!container) {
            this._container = null;
            this._containerId = "";
        }
        else if (typeof container == "string") {
            var containerEl = document.getElementById(container);
            if (!containerEl)
                return false;
            this._container = containerEl;
            this._containerId = container;
        }
        else if (container instanceof  HTMLElement) {
            this._container = container;
            this._containerId = container.id;
        }
        else {
            return false;
        }
        return true;
    },

    $: function(selector) {
        if (!this.$el)
            return $(null);
        return this.$el.find(selector);
    },

    find: function(selector) {
        return this.$(selector);
    },

    _renderBase: function() {
        if (this._rendered)
            return false;
        if (!this._container) {
            if (this._parent && this._parent.getContainerEl()) {
                this.setContainer(this._parent.getContainerEl());
            }
            else
                return false;
        }
        if (this._state == UI.State.Detached && this._element) {
            this._element = this._container.appendChild(this._element);
        }
        else {
            var html = this._html || "<div></div>";
            var el = document.createElement('div');
            this._container.appendChild(el);
            el.outerHTML = html;
            this._element = this._container.children.item(this._container.children.length - 1);
            if (this._elementId && this._elementId.trim() != "")
                this._element.id = this._elementId;
            else
                this._elementId = this._element.id;
        }
        this.$el = $(this._element);
        this._state = UI.State.Rendered;
        this._rendered = true;

        var _this = this;
        if(this._element){
            this.$el.bind("click", function(){
               if(_this.onClick)
                   _this.onClick.call(_this);
            });
        }

        if (this.autowidth) {
            if (this.Header) {
                this.$el.css({
                    margin: "0",
                    "margin-bottom": "5px"
                });
            }
            else if (this.Footer) {
                this.$el.css({
                    margin: "0"
                });
            }
            else {
                this.$el.css({
                    margin: "0 1% 5px 1%"
                });
            }
        }
        else {
            this.$el.css({
                margin: "0 auto 5px auto"
            });
        }

        if (this._parent && this._parent instanceof UI.Table) {
            this.$el.css({
                margin: "0 auto"
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
        if (!this._rendered && !this._container)
            return true;
        if (this._element.parentElement)
            this._container.removeChild(this._element);
        this.unbind();
        this._rendered = false;
        this._state = UI.State.Detached;
        return true;
    },

    destroy: function() {
        if (this._parent) {
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
        if (this._element)
            this._element.style.display = "block";
    },

    hide: function() {
        if (this._element)
            this._element.style.display = "none";
    },

    changeDisplay: function() {
        if (this._element) {
            if (this.$el.css("display") != "none")
                this.$el.hide();
            else
                this.$el.show();
        }
    },

    /**
     * set object control styles, such as
     *     position, left, top, width, height, visibility, textAlign
     * @param styleConfig {string|object}
     */
    setStyle: function(styleConfig) {
        if (!this._element)
            return false;
        if (typeof styleConfig == "object") {
            var style = this._element.style;
            for (var key in styleConfig) {
                if (styleConfig.hasOwnProperty(key) && key in style) {
                    style[key] = styleConfig[key];
                }
            }
        }
        else if (typeof styleConfig == "string") {
            this._element.style.cssText = styleConfig;
        }
        return true;
    },

    bind: function(eventName, callback){
        if(!eventName || !( typeof callback == "function"))
            return;
        this.eventListeners[eventName] = this.eventListeners[eventName] || [];
        var listeners = this.eventListeners[eventName];
        listeners.push(callback);
    },

    unbind: function(eventName, callback){
          if(arguments.length == 0){
              this.eventListeners = {};
          }
        else if(arguments.length == 1){
              if(this.eventListeners.hasOwnProperty(eventName))
                  delete this.eventListeners[eventName];
          }else if(callback!=null){
              if(this.eventListeners.hasOwnProperty(eventName)){
                  var listeners = this.eventListeners[eventName];
                  var index =indexOfArray(listeners, callback);
                  if(index != -1){
                      listeners.splice(index, 1);
                  }
              }
          }
    },

    trigger: function(eventName, data){
        if(this.eventListeners.hasOwnProperty(eventName)){
            var listeners = this.eventListeners[eventName];
            if(listeners){
                for (var i = 0; i < listeners.length; i++) {
                    var callback = listeners[i];
                    callback.call(this, data);
                }
            }
        }
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
    if (this._element) {
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
    if (this._element) {
        this._element.style.position = value;
    }
});

UI.Control.prototype.Header = false;
UI.Control.prototype.Footer = false;
UI.Control.prototype.autowidth = true;