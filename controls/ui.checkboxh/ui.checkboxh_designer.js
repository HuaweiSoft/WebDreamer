/**
 * UI.CheckBoxH_Designer Designer
 * @param control
 * @subClass UI.RadioButtonH_Designer
 */
UI.CheckBoxH_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    //    this.defaultHeight = 62;
};

extend(UI.CheckBoxH_Designer, UI.RadioButtonH_Designer);

UI.CheckBoxH_Designer.prototype.meta = UI.extendMeta(UI.CheckBoxH_Designer.prototype.meta, {
    type: "UI.CheckBoxH",
    props: { },
    events: {   }
});

UI.CheckBoxH.prototype.designerType = "UI.CheckBoxH_Designer";
MetaHub.register(UI.CheckBoxH_Designer.prototype.meta);