/**
 *  UI.TextArea control designer
 * @param control
 * @constructor
 * @superClass UI.Text_Designer
 */
UI.TextArea_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    this.defaultWidth = 0;
    this.defaultHeight = 96;
};

extend(UI.TextArea_Designer, UI.Text_Designer);

UI.TextArea_Designer.prototype.meta = UI.extendMeta(UI.Text_Designer.prototype.meta, {
    type: "UI.TextArea",
    props: {
        value: {
            datatype: "MString",
            readOnly: false,
            designable: true
        },
        placeholder: {
            datatype: "String",
            readOnly: false,
            designable: false,
            defaultValue: "text"
        }
    }
});
delete   UI.TextArea_Designer.prototype.meta.props.inputType; //remove inputType property declared by super class

UI.TextArea.prototype.designerType = "UI.TextArea_Designer";
MetaHub.register(UI.TextArea_Designer.prototype.meta);