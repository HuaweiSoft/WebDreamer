/**
 *  URLViewer Container
 * @dependency ui.container.js
 */

/**
 * 容器控件
 * @param container
 * @constructor
 */
UI.URLViewer = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(
        UI.URLViewer,
        UI.Container,
        {
            type: "UI.URLViewer",
            designerType: "UI.URLViewer_Designer",

            _html: "<div style='background-color:#ff3300'><div  style='background-color:#DF512D;width:100%;height:100%'><span style='line-height: 100px;color:#ffffff;font-size: x-large;'>http://www.xxx.?</span></div></div>",

            _getURL: function() {
                return "";
            },
            _setURL: function(url) {
                if (this._element && url && (url.indexOf("http://") == 0 || url.indexOf("https://") == 0)) {
                    $($(this._element)[0]).css("background-color", "#fff");
                    $($(this._element)[0]).html("<iframe src='" + url + "' style='width:100%;height:100%'/>");
                }
            },
            _setHTML: function(html) {
                $($(this._element)[0]).css("background-color", "#fff");
                $($(this._element)[0]).html(html);
            }
        });

/**
 * 设置click事件
 **/
UI.URLViewer.prototype.__defineGetter__('onClick', function() {
    return this._element ? this._element.onclick : null;
});

/**
 * 设置click事件
 **/
UI.URLViewer.prototype.__defineSetter__('onClick', function(value) {
    if (this._element) {
        this._element.onclick = value;
    }
});