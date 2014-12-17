/**
 * UI.NumberList control
 * @param container
 * @constructor
 * @superClass UI.
 */
UI.NumberList = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.NumberList, UI.TextList, {
    type: "UI.NumberList",

    _html: '<div><ol class="ui-listview">'
        + '<li class="ui-btn-icon-right ui-btn-up-c" style="cursor:pointer;min-height:40px;"><div class="ui-btn-inner" style="margin-top:4px"><div class="ui-btn-text"><a href="javascript:void(0);" class="ui-link-inherit">Acura</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>'
        + '<li class="ui-btn-icon-right ui-btn-up-c" style="cursor:pointer;min-height:40px;"><div class="ui-btn-inner" style="margin-top:4px"><div class="ui-btn-text"><a href="javascript:void(0);" class="ui-link-inherit">Buffer</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>'
        + '<li class="ui-btn-icon-right ui-btn-up-c" style="cursor:pointer;min-height:40px;"><div class="ui-btn-inner" style="margin-top:4px"><div class="ui-btn-text"><a href="javascript:void(0);" class="ui-link-inherit">Coffee</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>'
        + '</ol></div>',

    _numlist: null
});
