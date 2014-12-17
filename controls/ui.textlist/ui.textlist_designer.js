/**
 * UI.TextList Designer
 */
UI.TextList_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.TextList_Designer, UI.Designer, {
        // defaultWidth : 295,
        defaultHeight: 120
    }
);

UI.TextList_Designer.prototype.meta = UI.extendMeta(UI.TextList_Designer.prototype.meta, {
    type: "UI.TextList",
    props: {
        "height": {
            datatype: "String",
            readOnly: true,
            designable: false,
            category: "Common",
            description: "the height of UI component",
            serializable: false
        },
        lstText: {//列表数据
            datatype: "TextList",
            readOnly: false,
            designable: true,
            serializable: true
        },
        filterable: {//是否能过滤数据
            datatype: "Boolean",
            readOnly: false,
            designable: true,
            defaultValue: false
        },
        pageSize: {
            datatype: "Int",
            readOnly: false,
            designable: true,
            defaultValue: 20
        }
    },

    events: {
        onClick: {params: [], icon: "controls/eventicon/click.png", alias: "click"}
    },

    methods: {
        _getItems: {alias: "getItems", params: [], output: true}, _setItems: {alias: "setItems", params: [
            {name: "items", alias: "items"}
        ]},
        _updateText: {alias: "updateTextOfIndex", params: [
            {name: "text", alias: "text"},
            {name: "index", alias: "index"}
        ]},
        _getText: {alias: "getText", params: [], output: true}, _setText: {alias: "setText", params: [
            {name: "text", alias: "text"}
        ]},
        _getUrl: {alias: "getUrl", params: [], output: true}, _setUrl: {alias: "setUrl", params: [
            {name: "url", alias: "url"}
        ]}
    },

    dataFormat: [
        {"title": "meapalias|文本", "url": "meapalias|链接路径"}
    ],

    defaultProperty: "lstText",
    defaultEvent: "onClick",
    defaultMethod: ""
});

UI.TextList.prototype.designerType = "UI.TextList_Designer";
MetaHub.register(UI.TextList_Designer.prototype.meta);