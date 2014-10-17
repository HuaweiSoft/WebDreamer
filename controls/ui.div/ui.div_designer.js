/**
 * @file designer for UI.Div
 * @dependency  ui.div.js, ui.container_designer.js
 */

UI.Div_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
    this.defaultWidth = 200;
    this.defaultHeight = 105;
};

extend(UI.Div_Designer, UI.Container_Designer);

UI.Div_Designer.prototype.meta = UI.extendMeta(UI.Container_Designer.prototype.meta, {
    type: "UI.Div",
    props: {
        "backgroundColor": {
            datatype: "Color", // rgba(0, 0, 0, 0)
            readOnly: false,
            browseable: true,
            designable: false,
            defaultValue : ""
        },
        "backgroundImage": {
            datatype: "ImageUrl", //url
            readOnly: false,
            browseable: true,
            designable: false
        },
        "borderWidth": {
            datatype: "String", //1 px
            readOnly: false,
            browseable: true,
            designable: false,
			defaultValue : "0px"
        },
        "borderStyle": {
            datatype: "String",
            readOnly: false,
            browseable: true,
            designable: false,
            valueRange: ["none", "hidden", "solid", "dotted", "dashed", "double", "groove", "ridge", "inset", "outset"]
        },
        "borderColor": {
            datatype: "Color",
            readOnly: false,
            browseable: true,
            designable: false,
            defaultValue : "rgb(0, 0, 0)"
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
    events: {
        onClick: {params: [],  icon:"controls/eventicon/click.png", alias: "click"}
    }
});
MetaHub.register(UI.Div_Designer.prototype.meta);

UI.Div_Designer.prototype.render = function() {
    var rendered = UI.Div_Designer.superClass.render.apply(this, arguments);
    if(rendered){
        this._control.setStyle("border:rgb(247,103,103) 1px dashed; text-align:center;font-size:12px; color:#888;");
    }
    return rendered;
};