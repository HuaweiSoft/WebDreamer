/**
 * @file designer for UI.TextButton control
 * @dependency  ui.textbutton.js, ui.designer.js
 */
UI.TextButton_Designer = function (control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    this.defaultWidth = 60;
    this.defaultHeight = 38;
};

extend(UI.TextButton_Designer, UI.Designer);

UI.TextButton_Designer.prototype.meta = UI.extendMeta(UI.TextButton_Designer.prototype.meta, {
    type: "UI.TextButton",
    props: {
        buttontheme: {
            datatype: "Theme",
            readOnly: false,
            designable: true,
            defaultValue: "D"
        },
        value: {
            datatype: "String",
            readOnly: false,
            designable: true,
            defaultValue: "Button"
        },
        "height": {
            datatype: "String",
            readOnly: true,
            designable: false
        },
        "width": {
            datatype: "String",
            readOnly: true,
            designable: false
        }
    },

    events: {
        onClick: {params: [], icon: "controls/eventicon/click.png", alias: "onClick"}
    },
    methods: {
        _setValue: {alias: "setText", params: [
            {name: "value", alias: "text"}
        ]},
        _getValue: {alias: "getText", params: [], getValue: true}},
    defaultProperty: "value",
    defaultEvent: "",
    defaultMethod: ""
});

MetaHub.register(UI.TextButton_Designer.prototype.meta);