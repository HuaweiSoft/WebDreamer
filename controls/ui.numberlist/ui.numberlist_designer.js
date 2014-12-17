/**
 * UI.NumberList Designer
 * @param control
 * @constructor
 * @superClass  UI.TextList_Designer
 */
UI.NumberList_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.NumberList_Designer, UI.TextList_Designer, {
    //defaultWidth: 295,
   /* defaultHeight: 126*/
});

UI.NumberList_Designer.prototype.meta = UI.extendMeta(UI.NumberList_Designer.prototype.meta, {
    type: "UI.NumberList",
    props: {},
    events: {
    },
    dataFormat:[{"title":"Button","url":""},{"title":"Button","url":""}],
    methods: {},
    defaultProperty: "",
    defaultEvent: "onClick",
    defaultMethod: ""
});

UI.NumberList.prototype.designerType = "UI.NumberList_Designer";
MetaHub.register(UI.NumberList_Designer.prototype.meta);