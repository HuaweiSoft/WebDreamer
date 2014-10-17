/**
 * @file designer for UI.TextBox control
 * @dependency  ui.textbox.js, ui.designer.js
 */

UI.TextBox_Designer = function (control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
    this.defaultWidth = 190;
    this.defaultHeight = 30;
};
extend(UI.TextBox_Designer, UI.Designer);

UI.TextBox_Designer.prototype.meta = UI.extendMeta(UI.TextBox_Designer.prototype.meta, {
    type: "UI.TextBox",
    props: {
        inputType: {
            datatype: "String",
            readOnly: false,
            designable: false,
            //valueRange: ["text", "password", "email", "tel", "url", "search", "color", "number", "range", "date"]
            valueRange: ["text", "password", "email", "tel", "url", "number", "color", "date", "time", "datetime"]
        },
        placeholder: {
            datatype: "String",
            readOnly: false,
            designable: false,
            defaultValue: "input"
        },
        disabled: {
            datatype: "Boolean",
            readOnly: false,
            designable: true
        },
        readOnly: {
            datatype: "Boolean",
            readOnly: false,
            designable: true
        },
        value: {
            datatype: "String",
            readOnly: false,
            designable: true
        }
    },

    events: {
        onValueChanged: {params: ["value"], icon: "controls/eventicon/change.png", alias: "changeValue"},
        onfocus: {params: [], icon: "controls/eventicon/focus.png", alias: "onFocus"},
        onblur: {params: [], icon: "controls/eventicon/blur.png", alias: "onBlur"}
    },
    methods: {
        _setValue: {alias: "setText", params: [
            {name: "value", alias: "text"}
        ]},
        _getValue: {alias: "getText", params: [], getValue: true} },
    defaultProperty: "value",
    defaultEvent: "onValueChanged",
    defaultMethod: ""
});

MetaHub.register(UI.TextBox_Designer.prototype.meta);