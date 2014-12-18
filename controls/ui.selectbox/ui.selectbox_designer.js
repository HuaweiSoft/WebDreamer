/**
 * UI.SelectBox Designer
 * @constructor
 * @superClass UI.Designer
 */

UI.SelectBox_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    this.defaultWidth = 0;
    this.defaultHeight = 39;
};
extend(UI.SelectBox_Designer, UI.Designer);

UI.SelectBox_Designer.prototype.meta = UI.extendMeta(UI.SelectBox_Designer.prototype.meta, {
    type: "UI.SelectBox",
    props: {
        height: {
            datatype: "String",
            readOnly: true,
            designable: false,
            browsable: true
        },
        theme: {
            datatype: "String",
            editType: "Theme",
            designable: false,
            defaultValue: "C",
            valueRange: UI.THEMES
        },
        data: {
            datatype: "Object"
        },
        value: {
            datatype: "String"
        },
        selectedIndex: {
            datatype: "Int"
        },
        text: {
            datatype: "String",
            readOnly: true
        },
    },

    events: {
        onChange: {params: ["value"], icon: "controls/eventicon/change.png", alias: "change"}
    },

    methods: {

        setValue: {params: [
            {name: "value"}
        ]},

        getValue: {params: [], output: true},

        getText: {params: [], output: true},

        setSelectedIndex: {params: [
            {name: "index"}
        ]},

        getSelectedIndex: {params: [], output: true},

        setData: {params: [
            {name: "data"}
        ]},

        getData: {params: [], output: true}
    },

    dataFormat: [
        {"name": "meapalias|显示文本", "value": "meapalias|选项值"}
    ],

    defaultProperty: "value",
    defaultEvent: "onChange",
    defaultMethod: ""
});

UI.SelectBox.prototype.designerType = "UI.SelectBox_Designer";
MetaHub.register(UI.SelectBox_Designer.prototype.meta);
