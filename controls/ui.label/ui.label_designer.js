/**
 * UI.Label designer code
 */

UI.Label_Designer = function (control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

};
extend(UI.Label_Designer, UI.Div_Designer,{
    defaultHeight : 22
});

UI.Label_Designer.prototype.meta = UI.extendMeta(UI.Div_Designer.prototype.meta, {
    type: "UI.Label",
    props: {
        "backgroundImage": {
            datatype: "ImageUrl", //url
            readOnly: true,
            browsable: false,
            designable: false
        },
        textValue: {
            datatype: "String", //url
            readOnly: false,
            browsable: true,
            designable: false,
            defaultValue: "Label text"
        },
        "align": {
            datatype: "String",
            readOnly: false,
            designable: false,
            category: "Common",
            description: "",
            valueRange: ["left", "center", "right"],
            defaultValue: "left",
            serializable: false
        }
    },
    events: {
    },
    methods: {
        _getText: {alias: "getText", params: [], output: true},
        _setText: {alias: "setText", params: [
            {name: "text", alias: "text"}
        ]}
    },
    defaultProperty: "textValue"
});


UI.Label_Designer.prototype.render = function () {
    var rendered = UI.Label_Designer.superClass.render.apply(this, arguments);
    if (rendered) {
        this._control.setStyle("border:rgb(247,255,255) 1px dashed;font-size:14px; color:#014;");
    }
    return rendered;
};

//register
UI.Label.prototype.designerType = "UI.Label_Designer";
MetaHub.register(UI.Label_Designer.prototype.meta);