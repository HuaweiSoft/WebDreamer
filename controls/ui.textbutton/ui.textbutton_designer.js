/**
 * @file designer for UI.TextButton control
 * @dependency  ui.textbutton.js, ui.designer.js
 */
UI.TextButton_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.TextButton_Designer, UI.Designer, {
    defaultHeight: 38
});

UI.TextButton_Designer.prototype.meta = UI.extendMeta(UI.TextButton_Designer.prototype.meta, {
    type: "UI.TextButton",
    props: {
        buttontheme: {
            // datatype: "Theme",
            datatype: "String",
            designable: false,
            defaultValue: "D",
            valueRange: [ "A", "B", "C", "D", "E", "F", "G" ]
        },
        "height": {
            datatype: "String",
            designable: false
        },
        "width": {
            datatype: "String",
            designable: false
        },
        "textAlign": {
            datatype: "String",
            designable: false,
            valueRange: [ "left", "center", "right" ],
            defaultValue: "center"
        },
        value: {
            datatype: "String",
            designable: true,
            defaultValue: "Button"
        }
    },

    events: {
    },
    methods: {
        _setValue: {alias: "setText", params: [
            {name: "value", alias: "text"}
        ]},
        _getValue: {alias: "getText", params: [], output: true}
    },
    defaultProperty: "value"
});

//register
UI.TextButton.prototype.designerType = "UI.TextButton_Designer";
MetaHub.register(UI.TextButton_Designer.prototype.meta);