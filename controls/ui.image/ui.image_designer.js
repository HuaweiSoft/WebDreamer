/**
 * UI.Image 设计器
 * @dependency  stdfunc.js、metadata.js、ui.image.js
 */

UI.Image_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

};

extend(UI.Image_Designer, UI.Designer,{
    defaultWidth: 60,
    defaultHeight: 60
});

UI.Image_Designer.prototype.meta = UI.extendMeta(UI.Image_Designer.prototype.meta, {
    type: "UI.Image",
    props: {
        src: {
            datatype: "ImageUrl",
            designable: true
        }
    },
    events: { },
    methods: {
        getSrc: {
            alias: "getSrc",
            params: [],
            output: true
        },
        setSrc: {
            alias: "setSrc",
            params: [ {
                name: "src",
                alias: "src"
            } ]
        }
    },

    /**
     * describe the data structure of setData(data) function parameter,
     * normally use a data example to represent here.
     */
    dataFormat: {
        "src": "http://images/pic.png"
    },

    defaultProperty: "src",
    defaultEvent: "onClick",
    defaultMethod: ""
});

//register
UI.Image.prototype.designerType = "UI.Image_Designer";
MetaHub.register(UI.Image_Designer.prototype.meta);