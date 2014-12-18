/**
 * UI.RadioButtonH Designer
 * @param control
 * @subClass UI.Designer
 */
UI.RadioButtonH_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
    this.defaultWidth = 0;
    this.defaultHeight = 62;
};

extend(UI.RadioButtonH_Designer, UI.Designer);

UI.RadioButtonH_Designer.prototype.meta = UI.extendMeta(UI.RadioButtonH_Designer.prototype.meta, {
    type: "UI.RadioButtonH",
    props: {
        "height": {
            datatype: "String",
            readOnly: true,
            designable: false,
            browsable: false
        },
        theme: {
            datatype: "String",
            editType: "Theme",
            readOnly: false,
            designable: true,
            valueRange: UI.THEMES
        },
        data: {
            datatype: "Object",
            readOnly: false,
            designable: true,
            serializable: true
        },
        value: {
            datatype: "String",
            readOnly: true,
            designable: false,
            browsable: false,
            defaultValue: ""
        },
        text: {
            datatype: "String",
            readOnly: true,
            designable: false,
            browsable: false,
            defaultValue: ""
        },
        titleText: {
            datatype: "String",
            readOnly: false,
            designable: true,
            defaultValue: "Input Something!"
        }
    },
    events: {
        onClick: {params: [], icon: "controls/eventicon/click.png", alias: "click"}
    },

    dataFormat: [
        {"text": "显示信息", "value": "实际取值", "checked": true}
    ],

    methods: {    _setValue: {alias: "setValue", params: [
        {name: "value", alias: "text"}
    ]},
        _getValue: {alias: "getValue", params: [], output: true},
        _getText: {alias: "getText", params: [], output: true},
        _setText: {alias: "setText", params: [
            {name: "text", alias: "text"}
        ]}
    },
    defaultProperty: "value",
    defaultEvent: "onClick"
});

UI.RadioButtonH.prototype.designerType = "UI.RadioButtonH_Designer";
MetaHub.register(UI.RadioButtonH_Designer.prototype.meta);