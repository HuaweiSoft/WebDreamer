/**
 * UI.IconList Designer
 * @supperClass UI.ThumList_Designer
 */
UI.IconList_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.IconList_Designer, UI.ThumbList_Designer, {
   /* defaultWidth: 295,*/
   /* defaultHeight: 125*/
});

UI.IconList_Designer.prototype.meta = UI.extendMeta(UI.IconList_Designer.prototype.meta, {
    type: "UI.IconList",
    props: { },
    events: { },
    methods: {
        _getDetail: {alias: "getDetail", params: [], output: true},
        _setDetail: {alias: "setDetail", params: [
            {name: "detail", alias: "text"}
        ]},
        _updateDetail: {alias: "updateDetail", params: [
            {name: "myindex", alias: "序列号(index)"},
            {name: "mytext", alias: "detail"}
        ]},
        _getSubText: {alias: "getSubTitle", showable: false, params: [], output: true},
        _setSubText: {alias: "setSubTitle", showable: false, params: [
            {name: "subText", alias: "text"}
        ]},
        _updateSubText: {alias: "updateSubTitle", showable: false, params: [
            {name: "myindex", alias: "序列号(index)"},
            {name: "mytext", alias: "subText"}
        ]}
    },

    dataFormat: [{"imgUrl":"","name":"","url":"","detail":""}],

    defaultProperty: "",
    defaultEvent: "",
    defaultMethod: ""

});

UI.IconList.prototype.designerType = "UI.IconList_Designer";
MetaHub.register(UI.IconList_Designer.prototype.meta);