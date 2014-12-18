/**
 * UI.CheckBox Vertical Control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.RadioButtonV
 */
UI.CheckBoxV = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);

};

extend(UI.CheckBoxV, UI.RadioButtonV, {
    type: "UI.CheckBoxV",

    _html: '<div> <fieldset data-role="controlgroup" class="ui-corner-all ui-controlgroup ui-controlgroup-vertical">' +
        ' <div role="heading" class="ui-controlgroup-label" >Choose anything:</div>' +
        ' <div class="ui-controlgroup-controls">' +
        ' <div class="ui-checkbox">' +
        ' <input type="checkbox" style="margin-top:7px;" class="custom" name="radio-choice-1" id="" value="Radio tea">' +
        ' <label  class="ui-btn ui-btn-up-d ui-btn-icon-left ui-corner-top  ui-checkbox-off">' +
        ' <span class="ui-btn-inner" style="min-height:28px"><span class="ui-btn-text">One</span>' +
        ' <span class="ui-icon ui-icon-shadow ui-icon-checkbox-off">&nbsp;</span>' +
        ' </span></label></div>' +
        ' <div class="ui-checkbox">' +
        ' <input type="checkbox" style="margin-top:7px;" name="checkbox-choice-1" id="" value="checkbox cofee">' +
        ' <label  class="ui-btn ui-btn-up-d ui-btn-icon-left ui-corner-bottom ui-controlgroup-last ui-checkbox-on ">' +
        ' <span class="ui-btn-inner">' +
        ' <span class="ui-btn-text">Two</span>' +
        ' <span class="ui-icon ui-icon-shadow ui-icon-checkbox-on">&nbsp;</span>' +
        ' </span>' +
        ' </label>' +
        ' </div>' +

        ' </div>' +
        ' </fieldset> </div>',

    _checkbox: null,

});
