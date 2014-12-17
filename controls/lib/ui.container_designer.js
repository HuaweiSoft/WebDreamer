/**
 * @file designer implement of  UI.Container
 * @dependency  ui.container.js, ui.designer.js
 */
UI.Container_Designer = function (control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};
extend(UI.Container_Designer, UI.Designer);

UI.Container_Designer.prototype.meta = UI.extendMeta(UI.Container_Designer.prototype.meta, {
    type:"UI.Container",
    props:{
    }
});


UI.Container_Designer.prototype.render = function(){
    var rendered = UI.Container_Designer.superClass.render.apply(this, arguments);
    if(rendered){
        $(this._control).addClass("ns-container");
    }
    return rendered;
};

//register
UI.Container.prototype.designerType="UI.Container_Designer";
MetaHub.register(UI.Container_Designer.prototype.meta);