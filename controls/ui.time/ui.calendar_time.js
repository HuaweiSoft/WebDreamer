/**
 *  calendar time control
 * @param container   {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 * @dependency calendar2013.js
 */
UI.Calendar_Time = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.Calendar_Time, UI.Control, {
    type: "UI.Calendar_Time",

    _html: '<div>'
        + '	<div param="time" name="Set Time" class="ui_time ui_shadow_out ui_corner_all">'
        + '			<span class="ui_time_icon time_icon_clock"></span>'
        + '				<span class="time_text">08:30AM</span>'
        + '	</div></div>',

    _time_div: null,
    _cal2013: null, //jquery object

    /*
     *  @type: function(newDateString)
     *  		  @param newDateString {string}
     */
    onClick: null,


    render: function() {
        if (!this._renderBase())
            return false;
        this._time_div = this._element.children[0];
        this._cal2013 = $(this._time_div).calendar();

        var self = this;
        /*    attachInputValueListener(this._time_div, function () {
         var txt = self._time_div.value.trim();
         if (!isNaN(Date.parse(txt))) {
         if (self.onDateChanged)
         self.onDateChanged(txt);
         }
         });*/

        this.find("div.ui_time").bind("click", function() {
            if (self.onClick)
                self.onClick();
        });
        this._rendered = true;
        return true;
    },

    destroy: function() {
        UI.Calendar_Time.superClass.destroy.call(this);
        this._cal2013 = null;
    },


    _getTime: function() {
        return this._time_div != null ? $(this._time_div).find('.time_text').html() : "";
    },

    _setTime: function(value) {
        if (!value)
            return;
        if (this._time_div) {
            if (typeof value == "string" && !isNaN(Date.parse(value))) {
                this._time_div.date = value;

            }
            else if (value instanceof Date) {
                this._time_div.date = formatDateString(value);
            }
            $(this._time_div).find('.time_text').html(this._time_div.date);
            //value  = popCalendar.parseDate(value);
        }
    },

    getTitle: function() {
        return $(this._time_div).attr('name') || "";
    },

    setTitle: function(value) {
        if (!value)
            value = "";
        if (this._time_div) {
            $(this._time_div).attr('name', value);
        }
    }
});


UI.Calendar_Time.prototype.__defineGetter__('time', UI.Calendar_Time.prototype._getTime);
UI.Calendar_Time.prototype.__defineSetter__('time', UI.Calendar_Time.prototype._setTime);
UI.Calendar_Date.prototype.__defineGetter__('title', UI.Calendar_Time.prototype.getTitle);
UI.Calendar_Date.prototype.__defineSetter__('title', UI.Calendar_Time.prototype.setTitle);