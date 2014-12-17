/**
 *  UI.IconList Control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass  UI.ThumList
 */
UI.IconList = function(container) {
	arguments.callee.superClass.constructor.apply(this, arguments);

	var dir = "controls/ui.thumblist/resources/";
	this._html = '<div class="" >	<ul data-role="" class="" style="padding-left: 0px"> ' +
		'	<li data-corners="false"  data-iconshadow="true"  data-icon="arrow-r" style="padding:0px;min-height:40px;" data-iconpos="right" ' +
		'	 class="ui-btn ui-btn-icon-right ui-li ui-btn-up-c">' +
		'		<div class="ui-btn-inner ui-li"  style="height: 100%;">' +
		'			<div class="ui-btn-text">' +
		' 				<a  class="ui-link-inherit" style="padding:0px;min-height:40px;">  ' +
		'					<img src="' + convertPath(dir + 'album-ag.jpg') + '" style="padding:4px 2px 0px;height:30px;width:30px;border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 4px; border-bottom-left-radius: 4px;">  ' +
		' 					<h3 class="ui-li-heading" style="margin-left:55px;margin-top:-25px;">Icon List</h3>' +
		'				</a></div> ' +
		'			<span class="ui-text" style="right:35px;position: absolute;top: 50%;margin-top: -9px;height:16px;max-width:85px;overflow: hidden;"></span>' +
		'			<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>' +
		'		</div>' +
		'	</li>' +
		'	<li data-corners="false"  data-iconshadow="true"  data-icon="arrow-r" style="padding:0px;min-height:40px;" data-iconpos="right" ' +
		'	 class="ui-btn ui-btn-icon-right ui-li ui-btn-up-c">' +
		'		<div class="ui-btn-inner ui-li"  style="height: 100%;">' +
		'			<div class="ui-btn-text" style="">' +
		' 				<a  class="ui-link-inherit" style="padding:0px;min-height:40px;">  ' +
		'					<img src="' + convertPath(dir + 'album-af.jpg') + '"  style="padding:4px 2px 0px;height:30px;width:30px;border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 4px; border-bottom-left-radius: 4px;">  ' +
		' 					<h3 class="ui-li-heading" style="margin-left:55px;margin-top:-25px;hieght:20px;overflow: hidden;">Cars Club</h3>' +
		'				</a></div> ' +
		'			<span class="ui-text" style="right:35px;position: absolute;top: 50%;margin-top: -9px;height:16px;max-width:85px;overflow: hidden;"></span>' +
		'			<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>' +
		'		</div>' +
		'	</li>' +
		'	<li data-corners="false"  data-iconshadow="true"  data-icon="arrow-r" style="padding:0px;min-height:40px;" data-iconpos="right" ' +
		'	 class="ui-btn ui-btn-icon-right ui-li ui-btn-up-c">' +
		'		<div class="ui-btn-inner ui-li"  style="height: 100%;">' +
		'			<div class="ui-btn-text" style="">' +
		' 				<a  class="ui-link-inherit" style="padding:0px;min-height:40px;">  ' +
		'					<img src="' + convertPath(dir + 'album-ws.jpg') + '"  style="padding:4px 2px 0px;height:30px;width:30px;border-top-left-radius: 5px; border-top-right-radius: 6px; border-bottom-right-radius: 4px; border-bottom-left-radius: 4px;">  ' +
		' 					<h3 class="ui-li-heading" style="margin-left:55px;margin-top:-25px;height:16px;max-width:85px;overflow: hidden;">Girl Club</h3>' +
		'				</a></div> ' +
		'			<span class="ui-text" style="right:35px;position: absolute;top: 50%;margin-top: -9px;"></span>' +
		'			<span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span>' +
		'		</div>' +
		'	</li>' +
		'</ul></div>';

	this._iconlist = null;
};


extend(UI.IconList, UI.ThumbList, {
	type: "UI.IconList",


	/**
	 * 获取选中项 detail 文本方法
	 * @return
	 */
	_getDetail: function() {
		var o = $(this._thumlist).find('.ui-btn-active a');
		return o.length != 0 ? o.parent('div').parent('div').find('span.ui-text').html() : "";
	},
	/**
	 * 根据传入的detail，设置存在相等detail属性的li为当前选中状态
	 * @param text
	 */
	_setDetail: function(text) {
		if (!text) return;
		var txt = $.trim($('.ui-btn-active a').parent('div').parent('div').find('span.ui-text').html());
		if (text == txt) return;

		var colle = $(this._thumlist).find('li');
		//移除所有的选中样式
		colle.removeClass('ui-btn-active');
		$.each(colle, function() {
			if (text == $.trim($(this).find('span.ui-text').html())) {
				$(this).addClass('ui-btn-active');
				return false;
			}
		});
	},

	/**
	 *  运行后更新detail入口
	 *  */
	_updateDetail: function(index, text) {
		text = text || "";
		index = index || "";
		var obj = {};
		obj.number = index;
		obj.detail = text;

		this._setOnceData(stringifyToJsonText(obj));
	}

});


//IconList 专属属性
UI.IconList.prototype.__defineGetter__('detail', UI.IconList.prototype._getDetail);
UI.IconList.prototype.__defineSetter__('detail', UI.IconList.prototype._setDetail);