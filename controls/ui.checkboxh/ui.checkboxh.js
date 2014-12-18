/**
 *  Horizontal Check Box Control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.RadioButtonH
 */
UI.CheckBoxH = function (container) {

     arguments.callee.superClass.constructor.apply(this, arguments);

    this._checkbox = null;
};

extend(UI.CheckBoxH , UI.RadioButtonH, {
    type: "UI.CheckBoxH"
});
