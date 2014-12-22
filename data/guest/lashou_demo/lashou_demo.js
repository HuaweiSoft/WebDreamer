var controls = [];
var i = 0;
$(document).ready(init);

function init() {
	var control0 = new UI.TextButton();
	control0.id = "textButton1";
	control0.pageNo = 1;
	control0.setContainer("PAGE1");
	control0.render();
	control0.setStyle({"position":"relative","height":"38px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control0.value = "拉手团购";
	control0.buttontheme = "G";
	controls[0] = control0;
	i++;
	
	var control1 = new UI.SelectBox();
	control1.id = "selectBox1";
	control1.pageNo = 1;
	control1.setContainer("PAGE1");
	control1.render();
	control1.setStyle({"position":"relative","height":"39px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"center","left":"auto","top":"auto"});
	control1.selectedIndex = "0";
	control1.text = "深圳";
	control1.theme = "F";
	control1.data = "[{\"name\":\"深圳\",\"value\":\"value1\"},{\"name\":\"北京\",\"value\":\"value2\"},{\"name\":\"DisplayName3\",\"value\":\"value3\"}]";
	control1.value = "value1";
	controls[1] = control1;
	i++;
	
	var control2 = new UI.ThumbList();
	control2.id = "thumbList1";
	control2.pageNo = 1;
	control2.setContainer("PAGE1");
	control2.render();
	control2.setStyle({"position":"relative","height":"auto","zIndex":"auto","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control2.search = "false";
	control2.dataspanel = "[{\"imgUrl\":\"controls/ui.thumblist/resources/album-bb.jpg\",\"title\":\"Broken Bells\",\"subtitle\":\"Broken Bells\",\"url\":\"#\"},{\"imgUrl\":\"controls/ui.thumblist/resources/album-af.jpg\",\"title\":\"Cars Benchi\",\"subtitle\":\"Fore Lunzi\",\"url\":\"#\"},{\"imgUrl\":\"controls/ui.thumblist/resources/album-bk.jpg\",\"title\":\"Lines\",\"subtitle\":\"Line Pit\",\"url\":\"#\"}]";
	control2.pageSize = "5";
	controls[2] = control2;
	i++;
	
	var control3 = new UI.TextButton();
	control3.id = "textButton2";
	control3.pageNo = 2;
	control3.setContainer("PAGE2");
	control3.render();
	control3.setStyle({"position":"relative","height":"38px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control3.value = "团购详情";
	control3.buttontheme = "G";
	controls[3] = control3;
	i++;
	
	var control4 = new UI.TextButton();
	control4.id = "textButton3";
	control4.pageNo = 2;
	control4.setContainer("PAGE2");
	control4.render();
	control4.setStyle({"position":"relative","height":"38px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control4.value = "上一页";
	control4.buttontheme = "F";
	controls[4] = control4;
	i++;
	
	var control5 = new UI.TextButton();
	control5.id = "textButton4";
	control5.pageNo = 2;
	control5.setContainer("PAGE2");
	control5.render();
	control5.setStyle({"position":"relative","height":"38px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control5.value = "地图";
	control5.buttontheme = "A";
	controls[5] = control5;
	i++;
	
	var control6 = new UI.URLViewer();
	control6.id = "uRLViewer1";
	control6.pageNo = 2;
	control6.setContainer("PAGE2");
	control6.render();
	control6.setStyle({"position":"relative","height":"400px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"center","left":"auto","top":"auto"});
	controls[6] = control6;
	i++;
	
	var control7 = new UI.TextButton();
	control7.id = "textButton5";
	control7.pageNo = 3;
	control7.setContainer("PAGE3");
	control7.render();
	control7.setStyle({"position":"relative","height":"38px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control7.value = "实体店地址";
	control7.buttontheme = "G";
	controls[7] = control7;
	i++;
	
	var control8 = new UI.BaiduMap();
	control8.id = "baiduMap1";
	control8.pageNo = 3;
	control8.setContainer("PAGE3");
	control8.render();
	control8.setStyle({"position":"relative","height":"340px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control8.center = "114.08248, 22.53705";
	control8.zoom = "14";
	control8.longitude = "114.08248";
	control8.latitude = "22.53705";
	controls[8] = control8;
	i++;
	
	var control9 = new UI.TextButton();
	control9.id = "textButton7";
	control9.pageNo = 3;
	control9.setContainer("PAGE3");
	control9.render();
	control9.setStyle({"position":"relative","height":"38px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control9.value = "上一页";
	control9.buttontheme = "A";
	controls[9] = control9;
	i++;
	
	var control10 = new UI.TextButton();
	control10.id = "textButton6";
	control10.pageNo = 3;
	control10.setContainer("PAGE3");
	control10.render();
	control10.setStyle({"position":"relative","height":"38px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control10.value = "首页";
	control10.buttontheme = "F";
	controls[10] = control10;
	i++;
	
	var control11 = new UI.Text();
	control11.id = "text2";
	control11.pageNo = 4;
	control11.setContainer("PAGE4");
	control11.render();
	control11.setStyle({"position":"relative","height":"30px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control11.placeholder = "long";
	control11.readOnly = "false";
	control11.inputType = "text";
	control11.value = "";
	control11.disabled = "false";
	controls[11] = control11;
	i++;
	
	var control12 = new UI.Text();
	control12.id = "text3";
	control12.pageNo = 4;
	control12.setContainer("PAGE4");
	control12.render();
	control12.setStyle({"position":"relative","height":"30px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control12.placeholder = "latu";
	control12.readOnly = "false";
	control12.inputType = "text";
	control12.value = "";
	control12.disabled = "false";
	controls[12] = control12;
	i++;
	
	var control13 = new UI.Text();
	control13.id = "text1";
	control13.pageNo = 4;
	control13.setContainer("PAGE4");
	control13.render();
	control13.setStyle({"position":"relative","height":"30px","zIndex":"0","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control13.placeholder = "detail";
	control13.readOnly = "false";
	control13.inputType = "text";
	control13.value = "";
	control13.disabled = "false";
	controls[13] = control13;
	i++;
	
	
		
	$("#PAGE1").show();	
	bindEventHandlers();
}

function getControl(id) {
	for(var i = 0; i < controls.length; i++) {
		if(controls[i].id == id) {
			return controls[i];
		}
	}
	return null;
}

function bindEventHandlers(){
	var thumbList1 = getControl("thumbList1");
	thumbList1.onClick = function(){
		var thumbList1 = getControl("thumbList1");
		var getTextTmp1_result = thumbList1._getTextTmp1();
		var text1 = getControl("text1");
		text1.value = getTextTmp1_result;
		var getTextTmp2_result = thumbList1._getTextTmp2();
		var text2 = getControl("text2");
		text2.value = getTextTmp2_result;
		var getTextTmp3_result = thumbList1._getTextTmp3();
		var text3 = getControl("text3");
		text3.value = getTextTmp3_result;
		changePage(2);
		var uRLViewer1 = getControl("uRLViewer1");
		var html = text1.value;
		uRLViewer1._setHTML(html);
	}
		
	var textButton3 = getControl("textButton3");
	textButton3.onClick = function(){
		goBack();
	}
		
	var textButton4 = getControl("textButton4");
	textButton4.onClick = function(){
		changePage(3);
		var baiduMap1 = getControl("baiduMap1");
		var text2 = getControl("text2");
		var longitude = text2.value;
		var text3 = getControl("text3");
		var latitude = text3.value;
		var text = "欢迎团购";
		baiduMap1.addMarker(longitude, latitude, text);
	}
		
	var textButton6 = getControl("textButton6");
	textButton6.onClick = function(){
		changePage(1);
	}
		
	var selectBox1 = getControl("selectBox1");
	selectBox1.onChange = function(value){
	
		var selectBox1 = getControl("selectBox1");
		var cityid = selectBox1.value;
		var request_success = function(result){
			var thumbList1 = getControl("thumbList1");
			doDataMapping(result, thumbList1, [{"imgUrl":"","tmp2":"","title":" ","tmp1":"","tmp4":"","tmp3":"","subtitle":"","url":""}], [{
				    "isArray": true,
				    "items": [
				        {
				            "isArray": false,
				            "source": "data.display.image",
				            "target": "imgUrl"
				        },
				        {
				            "isArray": false,
				            "source": "data.display.title",
				            "target": "title"
				        },
				        {
				            "isArray": false,
				            "source": "data.display.shortTitle",
				            "target": "subtitle"
				        },
				        {
				            "isArray": false,
				            "source": "data.shops.shop.longitude",
				            "target": "tmp2"
				        },
				        {
				            "isArray": false,
				            "source": "data.shops.shop.latitude",
				            "target": "tmp3"
				        },
				        {
				            "isArray": "",
				            "source": "data.display.detail",
				            "target": "tmp1"
				        }
				    ],
				    "source": "result.url",
				    "target": "data"
				}]);
		};
		var request_error = function(error){
			console.error('Function "request" return error: %o', error);
		};
	
		var lashou =  new wd_service.lashou();
		lashou.request(request_success, request_error, cityid);
	}
		
	var textButton7 = getControl("textButton7");
	textButton7.onClick = function(){
		goBack();
	}
		
	var app_load = function(){
	
		var request_success = function(result){
			var selectBox1 = getControl("selectBox1");
			doDataMapping(result, selectBox1, [{"name":"meapalias|显示文本","value":"meapalias|选项值"}], [{
				    "isArray": true,
				    "items": [
				        {
				            "isArray": false,
				            "source": "city_name",
				            "target": "name"
				        },
				        {
				            "isArray": false,
				            "source": "city_id",
				            "target": "value"
				        }
				    ],
				    "source": "result.url",
				    "target": "data"
				}]);
		};
		var request_error = function(error){
			console.error('Function "request" return error: %o', error);
		};
	
		var lashou_city =  new wd_service.lashou_city();
		lashou_city.request(request_success, request_error);
	}
	
	app_load();

}

