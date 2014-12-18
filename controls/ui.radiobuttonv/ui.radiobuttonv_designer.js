/**
 * UI.RadioButtonV_Designer Designer
 * @param control
 * @subClass UI.RadioButtonH_Designer
 */
UI.RadioButtonV_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    this.defaultWidth = 0;
    this.defaultHeight = 115;
};

extend(UI.RadioButtonV_Designer, UI.RadioButtonH_Designer);

UI.RadioButtonH_Designer.prototype.meta = UI.extendMeta(UI.RadioButtonH_Designer.prototype.meta, {
    type: "UI.RadioButtonV",

    props: {
    },

    events: {
    },

    methods: {
        _setValue: {alias: "setValue", params: [
            {name: "value", alias: "text"}
        ]},
        _getValue: {alias: "getValue", params: [], output: true},
        _getText: {alias: "getText", params: [], output: true},
        _setText: {alias: "setText", params: [
            {name: "text", alias: "text"}
        ]} }

});

UI.RadioButtonV.prototype.designerType = "UI.RadioButtonV_Designer";
MetaHub.register(UI.RadioButtonV_Designer.prototype.meta);