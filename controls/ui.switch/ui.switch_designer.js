/**
 * UI.TextBox 设计器
 * @dependency  stdfunc.js、metadata.js、ui.textbox.js
 */

UI.Switch_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

// 声明继承自基本设计器 UI.Designer
extend(UI.Switch_Designer, UI.Designer, {
    defaultWidth: 0,
    defaultHeight: 32
});

// 声明元信息，也保持元信息的继承
UI.Switch_Designer.prototype.meta = UI.extendMeta(UI.Switch_Designer.prototype.meta, {
    type: "UI.Switch", // UI.Switch.prototype.type
    props: {
        "width": {
            datatype: "String",
            readOnly: true,
            designable: false,
            browseable: false
        },
        "height": {
            datatype: "String",
            readOnly: true,
            designable: false,
            browseable: false
        },
        value: {
            datatype: "String",
            readOnly: false,
            browseable: false,
            designable: true
        },
        titleText: {
            datatype: "String",
            readOnly: false,
            browseable: true,
            designable: true,
            defaultValue: "Title Text"
        },
        /*
         * theme:{ datatype : "Theme", readOnly : false, browseable : false, designable : true,
         * defaultValue: "c" },
         */
        datas: {
            datatype: "Object",
            readOnly: false,
            browseable: true,
            designable: true
        }
    },

    events: {
        onClick: {
            alias: "switch",
            icon: "controls/eventicon/click.png",
            params: []
        }
    },
    methods: {
        _setValue: {
            alias: "setValue",
            params: [
                {
                    name: "value",
                    alias: "text"
                }
            ]
        },
        _getValue: {
            alias: "getValue",
            params: [],
            output: true
        },
        _getText: {
            alias: "getText",
            params: [],
            output: true
        },
        _setText: {
            alias: "setText",
            params: [
                {
                    name: "text",
                    alias: "text"
                }
            ]
        },
        _getTitleText: {
            alias: "getTitle",
            params: [],
            output: true
        },
        _setTitleText: {
            alias: "setTitle",
            params: [
                {
                    name: "titleText",
                    alias: "text"
                }
            ]
        }
    },

    dataFormat: {'titleText': '', 'datas': [
        {'value': 'On', 'text': 'On'},
        {'value': 'Off', 'text': 'Off'}
    ]},

    defaultProperty: "",
    defaultEvent: "onClick",
    defaultMethod: ""
});

UI.Switch.prototype.designerType = "UI.Switch_Designer";
MetaHub.register(UI.Switch_Designer.prototype.meta);