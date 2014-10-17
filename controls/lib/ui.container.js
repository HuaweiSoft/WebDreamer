/**
 *  @file implement the UI.Container
 * @dependency  ui.control.js
 */
/**
 * @constructor UI.Container
 * @param container
 */
UI.Container = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.Container, UI.Control, {
    type: "UI.Container",
    designerType: "UI.Container_Designer",

    _html: "<div/>",

    isContainer: true,

    /**
     * children controls
     * @type Array
     */
    children: [],

    getContainerEl: function() {
        return this._element;
    },

    getChildIndex: function(control) {
        if(!control)
            return -1;
        for(var i = 0; i < this.children.length; i++){
            var obj = this.children[i];
            if(obj == control)
                return i;
        }
        return -1;
    },

    hasChild: function(control) {
        return this.getChildIndex(control) >= 0;
    },

    /**
     * Add child control, it requires:
     *     - Child control is not rendered, and doesn't have parent.
     *     - Current container has been rendered.
     * @param {UI.Control} control  child control object
     * @param {Boolean} [toRender=false] whether to render child control immediately
     * @return {Int} control index after appending, return -1 if failed.
     */
    addControl: function(control, toRender) {
        if(control.rendered || this.hasChild(control) || control == this)
            return -1;  //already exists
        this.children.push(control);
        control.setParent(this);
        control.setContainer(this.getContainerEl());
        if(this.rendered && toRender){
            control.render();
        }
        return this.children.length - 1;
    },

    /**
     *  inserts a control as a child, right before an existing child, which you specify.
     * @param {UI.Control} control  The child control you want to insert
     * @param {UI.Control} [before]   The child control you want to insert the new control before.
     * When not specified, the insertBefore method will insert the new control at the end.
     * @param {Boolean} [toRender=false]    whether to render child control immediately
     * @return {Int} control index after appending, return -1 if failed.
     */
    insertBefore: function(control, before, toRender) {
        if(control.rendered || this.hasChild(control))
            return -1;
        if(!before)
            return this.addControl(control, toRender);
        var beforeIndex = this.getChildIndex(before);
        if(beforeIndex < 0)
            return -1;
        var a = this.children;
        this.children = a.slice(0, beforeIndex).contact(control, a.slice(beforeIndex));
        control.setParent(this);
        var container = this.getContainerEl();
        control.setContainer(container);
        if(this.rendered && before.rendered && toRender){
            control.render();
            container.removeChild(control.element);
            container.insertBefore(control.element, before.element);
        }
        return beforeIndex;
    },

    /**
     * @see {@link UI.Container.insertBefore()}
     */
    insertAfter: function(control, after, toRender) {
        if(control.rendered || this.hasChild(control))
            return -1;
        var afterIndex = this.getChildIndex(after);
        if(afterIndex < 0)
            return -1;
        var a = this.children;
        this.children = a.slice(0, afterIndex + 1).concat(control, a.slice(afterIndex + 1));
        control.setParent(this);
        var container = this.getContainerEl();
        control.setContainer(container);
        if(this.rendered && after.rendered && toRender){
            control.render();
            if(afterIndex < this.children.length - 1){
                container.removeChild(control.element);
                container.insertBefore(control.element, after.element.nextSibling);
            }
        }
        return afterIndex + 1;
    },

    removeControl: function(control) {
        var index = this.getChildIndex(control);
        if(index == -1)
            return false;
        return this.removeAt(index);
    },

    removeAt: function(index) {
        if(index < 0 || index >= this.children.length)
            return false;
        var control = this.children[index];
        this.children.splice(index, 1);
        control.remove();
        control.setParent(null);
        control.setContainer(null);
        return true;
    },

    removeAllControls: function(recursive) {
        if(recursive == null)
            recursive = true;
        var controls = this.children.slice(0);
        for(var i = 0; i < controls.length; i++){
            var control = controls[i];
            if(recursive && control instanceof UI.Container){
                control.removeAllControls(recursive);
            }
            this.removeAt(i);
        }
    },

    render: function() {
        var r = UI.Container.superClass.render.call(this);
        if(!r)
            return false;
        this.renderAllChild();
        return true;
    },

    renderAllChild: function() {
        if(!this.rendered)
            return;
        var el = this.getContainerEl();
        this.children.forEach(function(control) {
            if(!control.rendered){
                if(!control.container)
                    control.setContainer(el);
                control.render();
            }
        });
    },

    remove: function() {
        return UI.Container.superClass.remove.call(this);
    },

    destroy: function() {
        this.children.forEach(function(control) {
            control.destroy();
        });
        UI.Container.superClass.destroy.call(this);
        this.children = [];
    },

    isChildAcceptable: function(childControl) {
        return childControl && childControl != this;
    },

    isAncestorOf: function(control) {
        if(control == this)
            return false;
        for(var i = 0; i < this.children.length; i++){
            var ct = this.children[i];
            if(ct == control)
                return true;
            else if(ct.isContainer && ct.isAncestorOf(control))
                return true;
        }
        return false;
    }
});
