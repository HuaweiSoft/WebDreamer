/**
 * @file designer for UI.Div
 * @dependency  ui.div.js, ui.container_designer.js
 */

UI.Div_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

};

extend(UI.Div_Designer, UI.Container_Designer, {
    defaultHeight: 105
});

UI.Div_Designer.prototype.meta = UI.extendMeta(UI.Container_Designer.prototype.meta, {
    type: "UI.Div",
    props: {
        "color": {
            datatype: "Color",
            readOnly: false,
            browsable: true,
            designable: false,
            defaultValue: "black"
        },
        "backgroundColor": {
            datatype: "Color", // rgba(0, 0, 0, 0)
            readOnly: false,
            browsable: true,
            designable: false,
            defaultValue: ""
        },
        "backgroundImage": {
            datatype: "ImageUrl", //url
            readOnly: false,
            browsable: true,
            designable: false
        },
        "borderWidth": {
            datatype: "String", //1 px
            readOnly: false,
            browsable: true,
            designable: false,
            defaultValue: "0px"
        },
        "borderStyle": {
            datatype: "String",
            readOnly: false,
            browsable: true,
            designable: false,
            valueRange: ["none", "hidden", "solid", "dotted", "dashed", "double", "groove", "ridge", "inset", "outset"]
        },
        "borderColor": {
            datatype: "Color",
            readOnly: false,
            browsable: true,
            designable: false,
            defaultValue: "rgb(0, 0, 0)"
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
    },
    events: {    }
});


UI.Div_Designer.prototype.render = function() {
    var rendered = UI.Div_Designer.superClass.render.apply(this, arguments);
    if (rendered) {
        this._control.setStyle("border:rgb(247,103,103) 1px dashed; text-align:center;font-size:12px; color:#888;");
    }
    return rendered;
};


UI.Div.prototype.designerType = "UI.Div_Designer";
MetaHub.register(UI.Div_Designer.prototype.meta);