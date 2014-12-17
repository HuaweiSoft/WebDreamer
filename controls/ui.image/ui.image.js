/**
 *  UI.Image control runtime implement
 * @dependency  ui.control.js
 */

/**
 *  UI.Image control
 * @param container
 * @constructor
 * @superClass UI.Control
 */
UI.Image = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    this.defaultImage = this.resourceDir +  "image.png";

    this._html = '<div><img style="width:100%; height:100%;cursor:pointer;" src="'
        + convertPath(this.defaultImage)  + '"></div>';
    this._image = null;

};

extend(UI.Image, UI.Control, {
    type: "UI.Image",

    autowidth: false,

    getSrc: function() {
        if (!this._image)
            return this.defaultImage;
        return reversePath(this._image.src);
    },

    setSrc: function(src) {
        if (!src)
            return;
        if (this._image) {
            this._image.src = convertPath(src);
        }
    },

    setData: function(data) {
        if (!data || this._image)
            return false;
            if (data.src)
                this.setSrc(data.src);
    },

    render: function() {
        if (!this._renderBase())
            return false;
        this._image = this._element.children[0];
        this._rendered = true;
        return true;
    }
});


UI.Image.prototype.__defineGetter__('src', UI.Image.prototype.getSrc);
UI.Image.prototype.__defineSetter__('src', UI.Image.prototype.setSrc);
