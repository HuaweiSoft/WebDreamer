/**
 * @file designer for UI.Text control
 * @dependency  ui.Text.js, ui.designer.js
 */

UI.Text_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};
extend(UI.Text_Designer, UI.Designer,{
    defaultHeight: 30
});

UI.Text_Designer.prototype.meta = UI.extendMeta(UI.Text_Designer.prototype.meta, {
    type: "UI.Text",
    props: {
        inputType: {
            datatype: "String",
            readOnly: false,
            designable: false,
            // valueRange: ["text", "password", "email", "tel", "url", "search", "color", "number",
            // "range", "date"]
            valueRange: [ "text", "password", "email", "tel", "url", "number", "color", "date", "time", "datetime" ]
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
        onValueChanged: {
            params: [ "value" ],
            icon: "controls/eventicon/change.png",
            alias: "changeValue"
        },
        onfocus: {
            params: [],
            icon: "controls/eventicon/focus.png",
            alias: "onFocus"
        },
        onblur: {
            params: [],
            icon: "controls/eventicon/blur.png",
            alias: "onBlur"
        }
    },
    methods: {
        _setValue: {
            alias: "setText",
            params: [ {
                name: "value",
                alias: "text"
            } ]
        },
        _getValue: {
            alias: "getText",
            params: [],
            output: true
        }
    },
    defaultProperty: "value",
    defaultEvent: "onValueChanged"
});

UI.Text.prototype.designerType = "UI.Text_Designer";
MetaHub.register(UI.Text_Designer.prototype.meta);