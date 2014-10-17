/**
 * UI.Label 设计器
 * @dependency  stdfunc.js、metadata.js、ui.textbox.js
 */

UI.Label_Designer = function (control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
    this.defaultWidth = '98%';
    this.defaultHeight = 20;
};
extend(UI.Label_Designer, UI.Div_Designer);
UI.Label_Designer.prototype.meta = UI.extendMeta(UI.Div_Designer.prototype.meta, {
    type: "UI.Label",
    props: {
        "backgroundImage": {
            datatype: "ImageUrl", //url
            readOnly: true,
            browseable: false,
            designable: false
        },
        textValue: {
            datatype: "String", //url
            readOnly: false,
            browseable: true,
            designable: false
        },
        "align": {
            datatype: "String",
            readOnly: false,
            designable: false,
            category: "Common",
            description: "",
            valueRange: ["left", "center", "right"],
            defaultValue: "center",
            serializable: false
        }
        /*  "text-color": {
         datatype: "text-color", //url
         readOnly: true,
         browseable: true,
         designable: false
         }*/
    },
    events: {
//        onClick: {params: [],  icon:"controls/eventicon/click.png", alias: "click"}
    },
    methods: {
        _getText: {alias: "getText", params: [], getValue: true},
        _setText: {alias: "setText", params: [
            {name: "text", alias: "text"}
        ]}
    }
});
MetaHub.register(UI.Label_Designer.prototype.meta);

UI.Label_Designer.prototype.render = function () {
    var rendered = UI.Label_Designer.superClass.render.apply(this, arguments);
    if (rendered) {
        this._control.setStyle("border:rgb(247,255,255) 1px dashed;font-size:14px; color:#014;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
    }
    return rendered;
};