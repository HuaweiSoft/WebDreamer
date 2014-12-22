/**
 *    jquery calendar data control
 * @param container   {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 * @dependency calendar2013.js
 */
UI.Calendar_Date = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
    var strDate = formatDateString( new Date(),"-", false, false);
    this._html =  '<div>'
        + '	<div param="date" name="Set date" class="ui_time ui_shadow_out ui_corner_all">'
        + '			<span class="ui_time_icon time_icon_date"></span>'
        + '				<span class="time_text">'+strDate+'</span>'
        + '	</div></div>';
};

extend(UI.Calendar_Date, UI.Control, {
        type: "UI.Calendar_Date",


        _date_div: null,
        _cal2013: null,  //jquery object

        /*
         *  @type: function(newDateString)
         *  @param newDateString {string}
         */
        onDateChanged: null,
        onClick: null,

        render: function() {
            if (!this._renderBase())
                return false;
            this._date_div = this._element.children[0];
            this._cal2013 = $(this._date_div).calendar();

            var self = this;
            $("#" + self.id).find("div.ui_time").bind("click", function() {
                if (self.onClick)
                    self.onClick();
            });
            this._rendered = true;
            return true;
        },

        destroy: function() {
            UI.Calendar_Date.superClass.destroy.call(this);
            this._cal2013 = null;
        },


        _getDate: function() {
            return this._date_div != null ? $(this._date_div).find('.time_text').html() : "";
        },

        _setDate: function(value) {
            if (!value)
                return;
            if (this._date_div) {
                if (typeof value == "string" && !isNaN(Date.parse(value))) {
                    this._date_div.date = value;

                }
                else if (value instanceof Date) {
                    this._date_div.date = formatDateString(value);
                }
                $(this._date_div).find('.time_text').html(this._date_div.date);
                //value  = popCalendar.parseDate(value);
                if (this.onDateChanged)
                    this.onDateChanged(this._date_div.date);
            }
        },

        getTitle: function() {
            return $(this._date_div).attr('name') || "";
        },

        setTitle: function(value) {
            if (!value)
                value = "";
            if (this._date_div) {
                $(this._date_div).attr('name', value);
            }
        }
    }
);


UI.Calendar_Date.prototype.__defineGetter__('date', UI.Calendar_Date.prototype._getDate);
UI.Calendar_Date.prototype.__defineSetter__('date', UI.Calendar_Date.prototype._setDate);
UI.Calendar_Date.prototype.__defineGetter__('title', UI.Calendar_Date.prototype.getTitle);
UI.Calendar_Date.prototype.__defineSetter__('title', UI.Calendar_Date.prototype.setTitle);
