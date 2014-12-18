
var popCalendar = {
		
	selectedDay: 0,							// 选中的日
	selectedMonth: 0, 						// 选中的月
	selectedYear: 0,  						// 选中的年 
	
	selectedHour:0,							// 选中的小时
	selectedMinute:0,						// 选中的分钟
	buttonImage: '',  
	buttonImageOnly: false,  				// 按钮图片 可扩展属性
	
	dayNames: ['Su','Mo','Tu','We','Th','Fr','Sa'],  	// 星期显示，暂无扩展使用
	//monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'], // Names of months
	monthNames: ['1','2','3','4','5','6','7','8','9','10','11','12'], // Names of months
	minYear : 1980,							// 最低可选择年限
	maxYear : 2030,							// 最高可使用年限
	popCalType : 'date',					// 控件的类型 date ：日期显示，time : 时间显示
	PM_AM: 'AM',  							// 上午/下午
	title : '',								// 控件的标题
	timeRole : '24H',						// 时间显示格式
	
	dateFormat: 'YMD-', 					//  日期显示格式
	yearRange: '-10:+10', 
	
	minDate: null,  
	maxDate: null,  
	speed: 'medium',  
	autoPopUp: 'click',  					// 控制组件出现的事件
	closeAtTop: false,  
	customDate: null,  
	fieldSettings: null,  
	timeSeparators:[' ',':'],
	
	/** Format and display the given date. */
	formatDate: function(day, month, year, hour, minute) {
		//month++; // adjust javascript month
		var dateString = '';
		for (var i = 2; i >= 0; i--) {
			dateString += this.dateFormat.charAt(3) + 
				(this.dateFormat.charAt(i) == 'D' ? (day < 10 ? '0' : '') + day : 
				(this.dateFormat.charAt(i) == 'M' ? (month < 10 ? '0' : '') + month : 
				(this.dateFormat.charAt(i) == 'Y' ? year : '?')));
		}
		
		return dateString.substring(1);
	},
	
	/**Parses a string and returns a Date object*/
	parseDate: function(Text) {
		var currentYear, currentMonth, currentDay, currentHour, currentMinute,validDate;
	
		if (this.timeSeparators && this.timeSeparators.length > 1) {
			var currentTimeAndDate = Text.split(this.timeSeparators[0]);
			var index = 0;
			while (index < currentTimeAndDate.length) if (currentTimeAndDate[index]) index++; else currentTimeAndDate.splice(index, 1);
			if (currentTimeAndDate.length > 0) var currentDate = currentTimeAndDate[0].split(this.dateFormat.charAt(3)); else var currentDate = [];
			if (currentTimeAndDate.length > 1) var currentTime = currentTimeAndDate[1].split(this.timeSeparators[1]); else var currentTime = [];
		}
		else {
			var currentDate = Text.split(this.dateFormat.charAt(3));
			var currentTime = null;
		}
		
		if (currentDate.length == 3) {
			currentDay = parseInt(currentDate[this.dateFormat.indexOf('D')],10);
			if (isNaN(currentDay)) {currentDay = new Date().getDate(); validDate = false;}
			currentMonth = parseInt(currentDate[this.dateFormat.indexOf('M')],10) - 1;
			if (isNaN(currentMonth)) {currentMonth = new Date().getMonth(); validDate = false;}
			currentYear= parseInt(currentDate[this.dateFormat.indexOf('Y')],10);
			if (isNaN(currentYear)) {currentYear = new Date().getFullYear(); validDate = false;}
		} else {
			currentDay = new Date().getDate();
			currentMonth = new Date().getMonth();
			currentYear= new Date().getFullYear();
			validDate = false;
		}
		
		if (this.timeSeparators && this.timeSeparators.length > 1 && this.timeSeparators[0]) {
			if (currentTime != null && currentTime.length == 2) {
				currentHour = parseInt(currentTime[0],10);
				if (isNaN(currentHour)) {currentHour = new Date().getHours(); validDate = false;}

				if (this.timeSeparators.length > 2) {
						if (currentTime[1].toLowerCase().indexOf(this.timeSeparators[2].toLowerCase()) == currentTime[1].length - this.timeSeparators[2].length) {
						if (currentHour == 12) currentHour = 0;
						currentMinute = parseInt(currentTime[1].substring(0, currentTime[1].length - this.timeSeparators[2].length),10);
					} else if (currentTime[1].toLowerCase().indexOf(this.timeSeparators[3].toLowerCase()) == currentTime[1].length - this.timeSeparators[2].length) {
						if (currentHour < 12) currentHour += 12;
						currentMinute = parseInt(currentTime[1].substring(0, currentTime[1].length - this.timeSeparators[1].length),10);
					}
					else {
						currentMinute = new Date().getMinutes();
						validDate = false;
					}
				}
				else currentMinute = parseInt(currentTime[1],10);
			} else {
				currentHour = new Date().getHours();
				currentMinute = new Date().getMinutes();
				validDate = false;
			}
			if (isNaN(currentMinute)) {currentMinute = new Date().getMinutes(); validDate = false;}
			var returnValue = new Date(currentYear, currentMonth, currentDay, currentHour, currentMinute);
			if (!validDate) returnValue.textInvalid = true;
			return returnValue;
		}
		else {
			if (isNaN(currentMinute)) {currentMinute = new Date().getMinutes(); validDate = false;}
			var returnValue = new Date(currentYear, currentMonth, currentDay);
			if (!validDate) returnValue.textInvalid = true;
			return returnValue;
		}
	},
	
	
	/** 初始值. */
	setDateFromField: function() {
		var currentDate  = $.trim($(this.input).find('.time_text').html());
		if(!currentDate) return;
		if(this.popCalType == "time"){
			this.currentHour = parseFloat(currentDate.split(':')[0]);
			this.currentMinute = parseInt(currentDate.split(':')[1].slice(0,2));
			//currentDate
			this.selectedHour = this.currentHour;
			this.selectedMinute = this.currentMinute;
			PM_AM = currentDate.split(':')[1].slice(2).toUpperCase() || this.PM_AM;
			/*if(this.currentMinute > 12){
				PM_AM = "PM";
			}*/
		}else{
			currentDate = this.parseDate(currentDate) || new Date();
			
			 this.currentDay = currentDate.getDate();
			 this.currentMonth = currentDate.getMonth() + 1;
			 this.currentYear = currentDate.getFullYear();
			 
			 this.selectedDay = this.currentDay;
			 this.selectedMonth = this.currentMonth;
			 this.selectedYear = this.currentYear;
		}
			
			
		
		
	},
	
	/*Translates this hour into the AM/PM number if neccessary*/
	hourString: function(Hour) {
		if (this.timeSeparators.length == 4) {
			if (Hour == 0) return '' + 12;
			else if (Hour > 12) return '' + (Hour - 12);
			else return '' + Hour;
		} 
		else return '' + Hour;
	},
	
	/** 获取当前选中的时间信息 */
	selectDate: function(Input) {
		if (!Input) var Input = this.input;
		
		if(popCalendar.popCalType == "time")
			$(Input).find('span.time_text').html(this.selectedHour+":"+ this.selectedMinute +""+ this.PM_AM);
		else
			$(Input).find('span.time_text').html(this.formatDate(this.selectedDay, this.selectedMonth, this.selectedYear));
	},
	
	/** 控件显示html生成 */
	showCalendar: function() {
		this.popUpShowing = true;
		// build the calendar HTML
		
		var ul_l = 'years',ul_m = 'months',ul_r = 'days';
		var val_l = this.currentYear, val_m = this.currentMonth, val_r = this.currentDay;
		if(this.popCalType == 'time'){
			
			 ul_l = 'hours',ul_m = 'menitues',ul_r = 'pm';
			 val_l = this.currentHour, val_m = this.currentMinute, val_r = this.currentMinute;
		}

		var html = '<div class="ui_time_body ui_shadow_out ui_corner_all"> '
			+'<div class="time_body_title">'
	    	+'	<span id="popcal_text" class="title_text">'+this.title+'</span>'
		    +'</div>';
       
		html+='<div class="time_body_main">';
			
			if(this.popCalType == 'time'){
				html +=' <div class="list">'
					+'	<span class="scroll_top" id="top_hours"></span>'
					+'	<div class="scroll_mid">' 
					+'		<span class="li_selected"></span>' 
					+'		<ul id="ul_hours"><li>'+(val_l -1<0?23:val_l -1)+'</li><li class="selected">'+(val_l)+'</li><li>'+(val_l+1)+'</li> </ul>' 
					+'	</div> '
					+'  <span class="scroll_bot" id="bot_hours"></span>'
					+' </div>';
				
				html +=' <div class="list">'
					+'	<span class="scroll_top" id="top_menitues"></span>'
					+'	<div class="scroll_mid">' 
					+'		<span class="li_selected"></span>' 
					+'		<ul id="ul_menitues"><li>'+(val_m -1>=0?val_m -1:59)+'</li><li class="selected">'+(val_m)+'</li><li>'+(val_m+1)+'</li> </ul>' 
					+'	</div> '
					+'  <span class="scroll_bot" id="bot_menitues"></span>'
					+' </div>';
				
				html +=' <div class="list">'
					+'		<span class="scroll_top" id="top_pm"></span>'
					+'		<div class="scroll_mid">' 
					+'			<span class="li_selected"></span>' 
					+'			<ul id="ul_pm"><li></li><li class="selected">'+PM_AM+'</li><li></li> </ul>'
					+'		</div> '
					+'  	<span class="scroll_bot" id="bot_pm"></span>'
					+' 	</div>';
				
			}else{
				html +=' <div class="list">'
					+'		<span class="scroll_top" id="top_years"></span>'
					+'		<div class="scroll_mid">' 
					+'			<span class="li_selected"></span>' 
					+'			<ul id="ul_years"><li>'+(val_l -1)+'</li><li class="selected">'+(val_l)+'</li><li>'+(val_l+1)+'</li> </ul>' 
					+'		</div> '
					+'  	<span class="scroll_bot" id="bot_years"></span>'
					+' </div>';
				
				html +=' <div class="list">'
					+'	<span class="scroll_top" id="top_months"></span>'
					+'	<div class="scroll_mid">' 
					+'		<span class="li_selected"></span>' 
					+'		<ul id="ul_months"><li>'+(val_m -1>1?val_m -1:12)+'</li><li class="selected">'+(val_m)+'</li><li>'+(val_m+1)+'</li> </ul>' 
					+'	</div> '
					+'  <span class="scroll_bot" id="bot_months"></span>'
					+' </div>';
				
				var _tempdays = this.getDaysByMonth(val_m,val_l);
				html +=' <div class="list">'
					+'	<span class="scroll_top" id="top_days"></span>'
					+'	<div class="scroll_mid">' 
					+'		<span class="li_selected"></span>' 
					+'		<ul id="ul_days"><li>'+(val_r-1>0?val_r-1:_tempdays[1])+'</li><li class="selected">'+(val_r)+'</li><li>'+(val_r+1)+'</li> </ul>'
					+'	</div> '
					+'  <span class="scroll_bot" id="bot_days"></span>'
					+' </div>';
				
			}
			
		html+='</div>';

		html +=' <div class="time_body_foot">'
				+' <div class="ui_btn ui_btn_red">'
				+'		<span class="btn_inner">' 
				+'			<span class="ui_btn_text ui_btn_text_white">Cancel</span>' 
				+'  	</span>' 
				+'	</div>'
				+'  <div class="ui_btn ui_btn_blue">'
				+'		<span class="btn_inner">'
				+'			<span class="ui_btn_text ui_btn_text_white">Set</span>'
				+'		</span>'
				+'	</div>'
				+'</div>';
					
		
			html+='</div>';
			
		$('#calendar_bg').show();
		$('#calendar_div').empty().append(html).show(this.speed);
		//this.input[0].focus();
		this.setupActions();
	}, // end showCalendar
	/** 取消控件显示*/
	cancel : function(event){
		popCalendar.hideCalendar(popCalendar.speed);
		
	},
	/** 保存时间信息*/
	saveDate : function(event){
		
		
		var _DIV = $(this).parent().parent().find('div.time_body_main');
		
			//var currentDate = $.trim($(this.input).find('.time_text').html());
			//if(!currentDate) return;
			if(popCalendar.popCalType == "time"){
				//currentDate
				popCalendar.selectedHour = parseFloat(_DIV.find('#ul_hours .selected').html());
				popCalendar.selectedMinute = parseInt(_DIV.find('#ul_menitues .selected').html());
				popCalendar.PM_AM =_DIV.find('#ul_pm .selected').html();
				/*if(this.currentMinute > 12){
					PM_AM = "PM";
				}*/
			}
			
			if(popCalendar.popCalType == 'date'){
				currentDate =  new Date();
				
				popCalendar.selectedDay = parseFloat(_DIV.find('#ul_years .selected').html());
				popCalendar.selectedMonth = parseFloat(_DIV.find('#ul_months .selected').html());
				popCalendar.selectedYear = parseFloat(_DIV.find('#ul_days .selected').html());
				
			}
			
			popCalendar.selectDate(popCalendar.input);
		
			popCalendar.hideCalendar(popCalendar.speed);
	},
	
	/** 当箭头点击后事件 */
	topClick : function(event){
		var _targetId = event.target.id;
		var val = _targetId.split('_')[1];
		var t4b = _targetId.split('_')[0];
		var _updateLi,_dependLi,_liVal,_minVal,_maxVal,_selectOne;
		var ismonths = false,isChangePM = false,_days, _pm_am;
		
		// 获得被点击的li表
		//var _updateUL = $(event.target).parent().find('.scroll_mid ul');
		var _arr = $(event.target).parent().find('#ul_'+val+' li');
		if(!_arr)return false;
		
		
		var _selctYear = parseInt($(event.target).parent().parent().find('#ul_years .selected').html());
		var _selctMonth  = parseInt($(event.target).parent().parent().find('#ul_months .selected').html());
		
		// 正常情况下，最小判断值都为0
		switch(val){
		case 'years':{
			_minVal = popCalendar.minYear;
			_maxVal = popCalendar.maxYear;
		}
		break;
		case 'months':{
			_minVal = 1;
			_maxVal = 12;
			ismonths = true;
		}
		break;
		case 'days':{
			
			_days = popCalendar.getDaysByMonth(_selctMonth ,_selctYear);
			_minVal = _days[0];
			_maxVal = _days[1];
			
		}
		break;
		case 'hours':{
			_minVal = 0;
			_maxVal = 23;
			
			if(popCalendar.timeRole == '24H'){
				isChangePM = true;
			}
		}
		break;
		case 'menitues':{
			_minVal = 0;
			_maxVal = 59;
		}
		break;
		case 'pm':{
			//_minVal = 0;
			//_maxVal = 59;
			
			if(popCalendar.timeRole == '12H'){
				_pm_am = $.trim($(event.target).parent().parent().find('#ul_pm .selected').html());
				if(_pm_am == "PM")
					$(event.target).parent().parent().find('#ul_pm .selected').html('AM');
				else
					$(event.target).parent().parent().find('#ul_pm .selected').html('PM');
			}
			return false;
		}
		break;
		default:
			 break;
		
		}
		
		// 要操作修改的 li
		_updateLi = t4b=='top'?_arr[0]:_arr[(_arr.length-1)];
		
		// 依赖计算数值 li
		_dependLi = t4b!='top'?_arr[0]:_arr[(_arr.length-1)];
		_selectOne = parseInt((_arr.length+1)/2);
		
		_liVal = parseInt($.trim($(_dependLi).html()));
		 if(t4b=='top'){
			 
			 // 往上
			 if( _liVal+1 <= _maxVal)
				 _liVal+=1;
			 else
				 _liVal = _minVal;
			 
			 $(_updateLi).html(_liVal);
			 $(_updateLi).insertAfter(_arr[_arr.length-1]);
			 
		 }else{
			 
			 // 往下
			 if( _liVal-1 >= _minVal)
				 _liVal-=1;
			 else 
				 _liVal = _maxVal;
			 
			 $(_updateLi).html(_liVal);
			 $(_updateLi).insertBefore(_arr[0]);
			 
		 }
		 $(event.target).parent().find('#ul_'+val+' li').each(function(ind,ele){
			 if(ind == (_selectOne-1)){
				 $(ele).addClass('selected');
				 _liVal = parseFloat($(ele).html());
			 }
			 else
				 $(ele).removeClass('selected');
			 
		 });
		 
		 if(ismonths){
			// var _selctDay  = parseInt($(event.target).parent().parent().find('#ul_days .selected').html());
			 var valLine = 1;
			 _days = popCalendar.getDaysByMonth(_liVal ,_selctYear);
			// if(_selctDay >= valLine || _selctDay == 1){
				// valLine = 1;
				 $(event.target).parent().parent().find('#ul_days li').each(function(ind,ele){
					 if(ind ==0)
						 $(this).html(_days[1]);
					 else
						 $(this).html(valLine++);
					 
				 });
			// }
			 
		 }
		 
		 // 是否24H制，是自动变换PM/AM,只有当小时的数值变动时才会存在判断
		 if(isChangePM){
			_pm_am = $.trim($(event.target).parent().parent().find('#ul_pm .selected').html());
			
			// _liVal当前选中的小时数
			if(_liVal <12 && _pm_am == "PM")
				$(event.target).parent().parent().find('#ul_pm .selected').html('AM');
			else if(_liVal >=12 && _pm_am == "AM")
				$(event.target).parent().parent().find('#ul_pm .selected').html('PM');
			
		 }
		
	},
	botClick : function(event){
		
		var _targetId = event.target.id;
		
	},
	/* Initialisation. */
	init: function() {
		this.popUpShowing = false;
		this.lastInput = null;
		this.disabledInputs = [];
		$('body').append('<div id="calendar_bg" class="ui_calender_bg" style="border:none;display:none;"></div>');
		$('body').append('<div id="calendar_div" style="border:none;z-index:9999;"></div>');
		$(document).mousedown(popCalendar.checkExternalClick);
	},
	
//	 Pop-up the calendar for a given input field. 
	showFor: function(target) {
		var _target = (target.nodeName && target.nodeName.toLowerCase() == 'input' ? target : this);
		if (_target.nodeName.toLowerCase() != 'input') { // find from button/image trigger
			_target = (target.nodeName && target.nodeName.toLowerCase() == 'div' ? target : this);
			//input = $('../input', input)[0];
		}
		
		// 设置绑定类型属性 param
		popCalendar.popCalType = $(this).attr('param');
		
		// 设置面板的标题
		popCalendar.title = $(this).attr('name') || "Setting";
		if (popCalendar.lastInput == _target) { // already here
			return;
		}
		for (var i = 0; i < popCalendar.disabledInputs.length; i++) {  // check not disabled
			if (popCalendar.disabledInputs[i] == _target) {
				return;
			}
		}
		popCalendar.input = $(_target);
		popCalendar.hideCalendar();
		popCalendar.lastInput = _target;
		popCalendar.setDateFromField();
		popCalendar.setPos(_target, $('#calendar_div'));
		$.extend(popCalendar, (popCalendar.fieldSettings ? popCalendar.fieldSettings(input) : {}));
		popCalendar.showCalendar(); 
	},
	
	/* Attach the calendar to an input field. */
	connectCalendar: function(target) {
		var $target = $(target);
		if (this.autoPopUp == 'focus' || this.autoPopUp == 'both') { // pop-up calendar when in the marked fields
			$target.focus(this.showFor);
		}
		
		if (this.autoPopUp == 'click' ) {
			$target.click(this.showFor);
		}
		
		//$target.keydown(this.doKeyDown).keypress(this.doKeyPress);
	},
	
	/* Enable the input field(s) for entry. */
	enableFor: function(inputs) {
		inputs = (inputs.jquery ? inputs : $(inputs));
		inputs.each(function() {
			this.disabled = false;
			$('../button.calendar_trigger', this).each(function() { this.disabled = false; });
			$('../img.calendar_trigger', this).each(function() { $(this).css('opacity', '1.0'); });
			var $this = this;
			popCalendar.disabledInputs = $.map(popCalendar.disabledInputs, 
				function(value) { return (value == $this ? null : value); }); // delete entry
		});
		return false;
	},
	
	/* Disable the input field(s) from entry. */
	disableFor: function(inputs) {
		inputs = (inputs.jquery ? inputs : $(inputs));
		inputs.each(function() {
			this.disabled = true;
			$('../button.calendar_trigger', this).each(function() { this.disabled = true; });
			$('../img.calendar_trigger', this).each(function() { $(this).css('opacity', '0.5'); });
			var $this = this;
			popCalendar.disabledInputs = $.map(popCalendar.disabledInputs, 
				function(value) { return (value == $this ? null : value); }); // delete entry
			popCalendar.disabledInputs[popCalendar.disabledInputs.length] = this;
		});
		return false;
	},
	
	/**设置监听函数 */
	setupActions: function() {
		
		$('#calendar_div').find('span[id^="top"]').click(this.topClick);
		$('#calendar_div').find('span[id^="bot"]').click(this.topClick);
		
		$('#calendar_div').find('.ui_btn_blue').click(this.saveDate);
		$('#calendar_div').find('.ui_btn_red').click(this.cancel);
		
	},
	
	/* Hide the calendar from view. */
	hideCalendar: function(speed) {
		if (this.popUpShowing) {
			$('#calendar_bg').hide();
			$('#calendar_div').hide(speed);
			this.popUpShowing = false;
			this.lastInput = null;
		}
	},
	



	/* Restore input focus after not changing month/year. */
	selectMonthYear: function() { 
		if (popCalendar.selecting) {
			popCalendar.input[0].focus(); 
		}
		popCalendar.selecting = !popCalendar.selecting;
	},
	
	/* Erase the input field and hide the calendar. */
	clearDate: function() {
		this.hideCalendar(this.speed);
		this.input.val('');		
	},
	
	/* Close calendar if clicked elsewhere. */
	checkExternalClick: function(event) {
		if (popCalendar.popUpShowing) {
			var node = event.target;
			var cal = $('#calendar_div')[0];
			while (node && node != cal && node.className != 'calendar_trigger') {
				node = node.parentNode;
			}
			if (!node) {
				popCalendar.hideCalendar();
			}
		}
	},
	
	getDaysByMonth : function(month,year){
		
		var firstDay , lastDay;
		
		switch(month){
		case 1:
		case 3:
		case 5:
		case 7:
		case 8:
		case 10:
		case 12:{
			firstDay = 1;
			lastDay = 31;
		}
		break;
		case 4:
		case 6:
		case 9:
		case 11:{
			firstDay = 1;
			lastDay = 30;
		}
		break;
		case 2:
		{
			firstDay = 1;
			lastDay = 28;
			if(year%400==0 || (year%4==0 && year%100 !=0)){
				
				// 闰年
				lastDay = 29;
			}
			
		}
		break;
		}
		return [firstDay,lastDay];
		
	},
	
	/* Set as customDate function to prevent selection of weekends. */
	noWeekends: function(date) {
		var day = date.getDay();
		return [(day > 0 && day < 6), ''];
	},
	
	getDaysInMonth: function(year, month) {
		return 32 - new Date(year, month, 32).getDate();
	},
	
	/** 获取year年month月的第一天 */
	getFirstDayOfMonth: function(year, month) {
		return new Date(year, month, 1).getDay();
	},
	
	/** 设置时间控件显示位置 */
	setPos: function(targetObj, moveObj) {
		var coords = this.findPos(targetObj);
		var screenObj = moveObj.parent();
		if(moveObj.width() <= 0 ||  moveObj.height()<=0){
			popCalendar.showCalendar();
			popCalendar.hideCalendar();
		}
		var _top = parseInt((screenObj.height() - moveObj.height())/2);
		var _left = parseInt((screenObj.width() - moveObj.width())/2);
		moveObj.css('position', 'absolute').css('left', _left + 'px').
			css('top',  _top+ 'px');
		//(coords[1] + targetObj.offsetHeight)_top
	},
	
	/** 获取绑定时间空间的对象位置 */
	findPos: function(obj) {
		var curleft = curtop = 0;
		if (obj.offsetParent) {
			curleft = obj.offsetLeft;
			curtop = obj.offsetTop;
			while (obj = obj.offsetParent) {
				var origcurleft = curleft;
				curleft += obj.offsetLeft;
				if (curleft < 0) { 
					curleft = origcurleft;
				}
				curtop += obj.offsetTop;
			}
		}
		return [curleft,curtop];
	}
};

/** 绑定控件入口*/ 
$.fn.calendar = function(settings) {
	$.extend(popCalendar, settings || {});
	return this.each(function() {
		if (this.nodeName.toLowerCase() == 'input'
				||this.nodeName.toLowerCase() == 'div'){
			popCalendar.connectCalendar(this);
		}
	});
};

/* Initialise the calendar. */
$(document).ready(function() {
   popCalendar.init();
});