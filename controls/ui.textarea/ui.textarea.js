/**
 * UI.TextArea Control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Text
 */
UI.TextArea = function (container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.TextArea, UI.Text, {
    type: "UI.TextArea",

    _html : '<div><textarea type="text" style="width:100%;height:100%;padding:0em;" ' +
        'class="ui-input-text ui-body-null ui-corner-all ui-shadow-inset ui-body-d"></textarea></div>',
});
