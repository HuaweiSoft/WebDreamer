/**
 * UI.Calendar_Date  designer
 */
UI.Calendar_Date_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    this.defaultWidth = 0;
    this.defaultHeight = 40;
};

extend(UI.Calendar_Date_Designer, UI.Designer);

UI.Calendar_Date_Designer.prototype.meta = UI.extendMeta(UI.Calendar_Date_Designer.prototype.meta, {
    type: "UI.Calendar_Date",
    props: {
        "width": {
            readOnly: true,
            designable: false,
            browsable: false
        },
        "height": {
            readOnly: true,
            designable: false,
            browsable: false
        },
        "align": {
            readOnly: true,
            designable: false,
            browsable: false
        },

        date: {
            datatype: "String",
            editType: "Date",
            readOnly: true
        },

        title: {
            datatype: "String",
            readOnly: false
        }
    },

    events: {
        //        onDateChanged:{params:["newDateString"], icon:"controls/eventicon/change.png" },
    },

    methods: {
        _getDate: {alias: "getDate", params: [], output: true}, _setDate: {alias: "setDate", params: [
            {name: "date", alias: "date"}
        ]}

    },
    defaultProperty: "date",
    defaultEvent: "onDateChanged",
    defaultMethod: ""
});

UI.Calendar_Date.prototype.designerType = "UI.Calendar_Date_Designer";
MetaHub.register(UI.Calendar_Date_Designer.prototype.meta);