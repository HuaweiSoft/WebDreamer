/**
 * UI.CheckBoxV Designer
 * @param control
 * @subClass UI.RadioButtonV_Designer
 */
UI.CheckBoxV_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    this.defaultWidth = 0;
    //    this.defaultHeight = 30;
};

extend(UI.CheckBoxV_Designer, UI.RadioButtonV_Designer);

UI.CheckBoxV_Designer.prototype.meta = UI.extendMeta(UI.CheckBoxV_Designer.prototype.meta, {
    type: "UI.CheckBoxV",
    props: { },
    events: {

    }
});

UI.CheckBoxV.prototype.designerType = "UI.CheckBoxV_Designer";
MetaHub.register(UI.CheckBoxV_Designer.prototype.meta);