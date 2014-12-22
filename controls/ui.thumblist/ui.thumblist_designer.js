/**
 * UI.ThumbList  Designer
 * @param control
 */
UI.ThumbList_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.ThumbList_Designer, UI.Designer, {
    /*defaultWidth: 295,*/
    defaultHeight: 0
});

UI.ThumbList_Designer.prototype.meta = UI.extendMeta(UI.ThumbList_Designer.prototype.meta, {
    type: "UI.ThumbList", //UI.ThumbList.property.type
    props: {
        "align": {
            datatype: "String",
            readOnly: true,
            designable: false,
            browsable: false
        },
        "height": {
            datatype: "String",
            readOnly: true,
            designable: false,
            browsable: true,
            defaultValue: "auto"
        },
        search: {
            datatype: "Boolean",
            readOnly: false,
            designable: true,
            defaultValue: false
        },
        pageSize: {
            datatype: "Int",
            readOnly: false,
            designable: true,
            defaultValue: "5"
        },

        dataspanel: {
            datatype: "Object",
            readOnly: false,
            designable: true,
            serializable: true
        }
    },

    dataFormat: [{"imgUrl":"","title":" ","subtitle":"","url":"","tmp1":"","tmp2":"","tmp3":"","tmp4":""}],

    events: {
        onClick: {params: [], icon: "controls/eventicon/click.png", alias: "click"}
    },

    methods: {
        //_getDataspanel:{alias:"getDatas",params: [],output:true},_setDataspanel:{alias:"setDatas",params: [{name:"dataspanel",alias:"jsonArrayText"}]},
        _getText: {alias: "getTitle", params: [], output: true},
        _getSubText: {alias: "getSubTitle", params: [], output: true},
        _getUrl: {alias: "getOpenUrl", params: [], output: true},
        _getPicUrl: {alias: "getPicUrl", params: [], output: true},
        _getPicUrl: {alias: "getPicUrl", params: [], output: true},
        _getTextTmp1: {alias: "getHidTxt1", params: [], output: true},
        _getTextTmp2: {alias: "getHidTxt2", params: [], output: true},
        _getTextTmp3: {alias: "getHidTxt3", params: [], output: true},
        _getTextTmp4: {alias: "getHidTxt4", params: [], output: true}
    },

    defaultProperty: "dataspanel",
    defaultEvent: "onClick",
    defaultMethod: ""
});

//register
UI.ThumbList.prototype.designerType = "UI.ThumbList_Designer";
MetaHub.register(UI.ThumbList_Designer.prototype.meta);