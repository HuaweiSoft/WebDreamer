/**
 * TextButton control class
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 */
UI.TextButton = function (container) {

     arguments.callee.superClass.constructor.apply(this, arguments);

    this._html = '<div><a class="ui-btn ui-shadow ui-btn-corner-all ui-btn-inline ui-btn-up-c" style="width:100%;height:100%;">'
    			+'<span class="ui-btn-inner ui-btn-corner-all" style="height:20px;padding-top:8px"><span class="ui-btn-text">Button</span></span></a></div>';

    this._buttontext = null;

    /**
     * @property onclick callback function
     * @type {Function}
     */
    this.onClick = null;
};

extend(UI.TextButton, UI.Control);
UI.TextButton.prototype.type = "UI.TextButton";
UI.TextButton.prototype.designerType = "UI.TextButton_Designer";

UI.TextButton.prototype._supportTypes = ["button"];

UI.TextButton.prototype._getValue = function () {
    return this._buttontext.value!= null ? this._buttontext.value : "";
};

UI.TextButton.prototype._setValue = function (value) {
    if (!value)
        value = "";
    if (this._buttontext) {
        this._buttontext.value = value;
        $($(this._buttontext).find("span")[1]).text(value);
    }
};

UI.TextButton.prototype._getButtontheme = function () {
    return this._buttontext.buttontheme != null ? this._buttontext.buttontheme : "";
};

UI.TextButton.prototype._setButtontheme = function (value) {
   if (!value)
        return;
    if (this._buttontext) {
        this._buttontext.buttontheme = value;
        if(value == "D" ){
        	value = "C";
        } else if(value == "C"){
        	value = "D";
        }
        $(this._buttontext).attr("class","ui-btn ui-shadow ui-btn-corner-all ui-btn-inline ui-btn-up-"+value.toLowerCase());
    }
};

UI.TextButton.prototype.__defineGetter__('value', UI.TextButton.prototype._getValue);
UI.TextButton.prototype.__defineSetter__('value', UI.TextButton.prototype._setValue);
UI.TextButton.prototype.__defineGetter__('buttontheme', UI.TextButton.prototype._getButtontheme);
UI.TextButton.prototype.__defineSetter__('buttontheme', UI.TextButton.prototype._setButtontheme);


UI.TextButton.prototype.render = function () {
    if (!this._renderBase())
        return false;
    this._buttontext = this._element.children[0];
    var self = this;
    $(this._buttontext).bind("click",function (){
    	//$(this).toggleClass('ui-btn-active');
    	if(self.onClick){
    	  self.onClick();
    	}
    });

    this._rendered = true;
    return true;
};
