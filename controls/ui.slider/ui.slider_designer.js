/**
 * UI.Slider Designer
 *
 */
UI.Slider_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
    //    this.defaultWidth = 0;
    this.defaultHeight = 36;
};

extend(UI.Slider_Designer, UI.Designer);
UI.Slider_Designer.prototype.meta = UI.extendMeta(UI.Slider_Designer.prototype.meta, {
    type: "UI.Slider",
    props: {

        "height": {
            datatype: "String",
            readOnly: true,
            designable: false,
        },

        "width": {
            datatype: "String",
            readOnly: true,
            designable: false,
        },

        theme: {
            datatype: "String",
            editType: "Theme",
            designable: false,
            defaultValue: "C",
            valueRange: UI.THEMES
        },

        "min": {
            datatype: "Int",
            defaultValue: 0
        },

        "max": {
            datatype: "Int",
            defaultValue: 100
        },

        "value": {
            datatype: "Float",
            defaultValue: 50
        }
    },

    events: {
        onChange: {
            params: [ "value" ],
            icon: "controls/eventicon/change.png",
            alias: "onChange"
        }
    },

    methods: {

        _getValue: {alias: "getValue", params: [], output: true},
        _setValue: {alias: "setValue", params: [
            {name: "value", alias: "value"}
        ]},
        _getMin: {alias: "getMin", params: [], output: true}, _setMin: {alias: "setMin", params: [
            {name: "minValue", alias: "minValue"}
        ]},
        _getMax: {alias: "getMax", params: [], output: true}, _setMax: {alias: "setMax", params: [
            {name: "maxValue", alias: "maxValue"}
        ]}

    },

    defaultProperty: "value",
    defaultEvent: "onChange"
});

//register
UI.Slider.prototype.designerType = "UI.Slider_Designer";
MetaHub.register(UI.Slider_Designer.prototype.meta);
