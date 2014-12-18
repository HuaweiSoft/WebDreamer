var controls = [];
var i = 0;
$(document).ready(init);

function init() {
	var control0 = new UI.Label();
	control0.id = "label6";
	control0.pageNo = 1;
	control0.setContainer("PAGE1");
	control0.render();
	control0.setStyle({"position":"relative","height":"22px","zIndex":"","visibility":"visible","width":"98%","textAlign":"center","left":"","top":""});
	control0.borderStyle = "";
	control0.borderColor = "rgb(0, 0, 0)";
	control0.backgroundColor = "";
	control0.backgroundImage = "";
	control0.color = "black";
	control0.borderWidth = "0px";
	control0.textValue = "图片浏览";
	controls[0] = control0;
	i++;
	
	var control1 = new UI.Div();
	control1.id = "div1";
	control1.pageNo = 1;
	control1.setContainer("PAGE1");
	control1.render();
	control1.setStyle({"position":"relative","height":"80px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control1.borderStyle = "dashed";
	control1.borderColor = "rgb(0, 0, 0)";
	control1.backgroundColor = "";
	control1.backgroundImage = "";
	control1.color = "black";
	control1.borderWidth = "0px";
	controls[1] = control1;
	i++;
	
	var control2 = new UI.TextButton();
	control2.id = "textButton1";
	control2.pageNo = 1;
	control2.setContainer("PAGE1");
	control2.render();
	control2.setStyle({"position":"relative","height":"38px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control2.value = "自然风光";
	control2.buttontheme = "B";
	controls[2] = control2;
	i++;
	
	var control3 = new UI.Div();
	control3.id = "div2";
	control3.pageNo = 1;
	control3.setContainer("PAGE1");
	control3.render();
	control3.setStyle({"position":"relative","height":"80px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control3.borderStyle = "dashed";
	control3.borderColor = "rgb(0, 0, 0)";
	control3.backgroundColor = "";
	control3.backgroundImage = "";
	control3.color = "black";
	control3.borderWidth = "0px";
	controls[3] = control3;
	i++;
	
	var control4 = new UI.TextButton();
	control4.id = "textButton2";
	control4.pageNo = 1;
	control4.setContainer("PAGE1");
	control4.render();
	control4.setStyle({"position":"relative","height":"38px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control4.value = "生活掠影";
	control4.buttontheme = "F";
	controls[4] = control4;
	i++;
	
	var control5 = new UI.TextButton();
	control5.id = "textButton3";
	control5.pageNo = 2;
	control5.setContainer("PAGE2");
	control5.render();
	control5.setStyle({"position":"relative","height":"38px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control5.value = "自然风光";
	control5.buttontheme = "B";
	controls[5] = control5;
	i++;
	
	var control6 = new UI.Label();
	control6.id = "label1";
	control6.pageNo = 2;
	control6.setContainer("PAGE2");
	control6.render();
	control6.setStyle({"position":"relative","height":"20px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control6.borderStyle = "dashed";
	control6.borderColor = "rgb(0, 0, 0)";
	control6.backgroundColor = "";
	control6.backgroundImage = "";
	control6.color = "black";
	control6.borderWidth = "0px";
	control6.textValue = "";
	controls[6] = control6;
	i++;
	
	var control7 = new UI.Image();
	control7.id = "image1";
	control7.pageNo = 2;
	control7.setContainer("PAGE2");
	control7.render();
	control7.setStyle({"position":"relative","height":"200px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control7.src = "resources/maerdaifu.jpg";
	controls[7] = control7;
	i++;
	
	var control8 = new UI.Label();
	control8.id = "label2";
	control8.pageNo = 2;
	control8.setContainer("PAGE2");
	control8.render();
	control8.setStyle({"position":"relative","height":"auto","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control8.borderStyle = "dashed";
	control8.borderColor = "rgb(0, 0, 0)";
	control8.backgroundColor = "";
	control8.backgroundImage = "";
	control8.color = "gray";
	control8.borderWidth = "0px";
	control8.textValue = "被称为“人间天堂”的马尔代夫，一直以来都是国人旅游的胜地，被誉为上帝抛洒在人间的项链，全景网高清呈现马尔代夫的胜景，带你领略人间天堂的每个角落。]<p></p>";
	controls[8] = control8;
	i++;
	
	var control9 = new UI.Image();
	control9.id = "image2";
	control9.pageNo = 2;
	control9.setContainer("PAGE2");
	control9.render();
	control9.setStyle({"position":"relative","height":"200px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control9.src = "resources/image2.jpg";
	controls[9] = control9;
	i++;
	
	var control10 = new UI.Label();
	control10.id = "label3";
	control10.pageNo = 2;
	control10.setContainer("PAGE2");
	control10.render();
	control10.setStyle({"position":"relative","height":"60px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control10.borderStyle = "dashed";
	control10.borderColor = "rgb(0, 0, 0)";
	control10.backgroundColor = "";
	control10.backgroundImage = "";
	control10.color = "gray";
	control10.borderWidth = "0px";
	control10.textValue = "日暮帝国，那份英国人特有的历史自豪感依旧伴随着大本钟精准的报时世代延续。";
	controls[10] = control10;
	i++;
	
	var control11 = new UI.TextButton();
	control11.id = "textButton5";
	control11.pageNo = 2;
	control11.setContainer("PAGE2");
	control11.render();
	control11.setStyle({"position":"relative","height":"38px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control11.value = "更多...";
	control11.buttontheme = "D";
	controls[11] = control11;
	i++;
	
	var control12 = new UI.TextButton();
	control12.id = "textButton4";
	control12.pageNo = 3;
	control12.setContainer("PAGE3");
	control12.render();
	control12.setStyle({"position":"relative","height":"38px","zIndex":"1","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control12.value = "生活掠影";
	control12.buttontheme = "F";
	controls[12] = control12;
	i++;
	
	var control13 = new UI.Image();
	control13.id = "image3";
	control13.pageNo = 3;
	control13.setContainer("PAGE3");
	control13.render();
	control13.setStyle({"position":"relative","height":"200px","zIndex":"","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control13.src = "resources/image3.jpg";
	controls[13] = control13;
	i++;
	
	var control14 = new UI.Label();
	control14.id = "label4";
	control14.pageNo = 3;
	control14.setContainer("PAGE3");
	control14.render();
	control14.setStyle({"position":"relative","height":"40px","zIndex":"","visibility":"visible","width":"98%","textAlign":"center","left":"auto","top":"auto"});
	control14.borderStyle = "";
	control14.borderColor = "rgb(0, 0, 0)";
	control14.backgroundColor = "";
	control14.backgroundImage = "";
	control14.color = "gray";
	control14.borderWidth = "0px";
	control14.textValue = "在草地上躺着的幸福的一家人";
	controls[14] = control14;
	i++;
	
	var control15 = new UI.Image();
	control15.id = "image4";
	control15.pageNo = 3;
	control15.setContainer("PAGE3");
	control15.render();
	control15.setStyle({"position":"relative","height":"200px","zIndex":"","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control15.src = "resources/image4.jpg";
	controls[15] = control15;
	i++;
	
	var control16 = new UI.Label();
	control16.id = "label5";
	control16.pageNo = 3;
	control16.setContainer("PAGE3");
	control16.render();
	control16.setStyle({"position":"relative","height":"40px","zIndex":"","visibility":"visible","width":"98%","textAlign":"center","left":"auto","top":"auto"});
	control16.borderStyle = "";
	control16.borderColor = "rgb(0, 0, 0)";
	control16.backgroundColor = "";
	control16.backgroundImage = "";
	control16.color = "gray";
	control16.borderWidth = "0px";
	control16.textValue = "草地上头对头的一家人";
	controls[16] = control16;
	i++;
	
	var control17 = new UI.TextButton();
	control17.id = "textButton6";
	control17.pageNo = 3;
	control17.setContainer("PAGE3");
	control17.render();
	control17.setStyle({"position":"relative","height":"38px","zIndex":"","visibility":"visible","width":"98%","textAlign":"left","left":"auto","top":"auto"});
	control17.value = "更多...";
	control17.buttontheme = "D";
	controls[17] = control17;
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
	var textButton1 = getControl("textButton1");
	textButton1.onClick = function(){
		changePage(2);
	}
		
	var textButton2 = getControl("textButton2");
	textButton2.onClick = function(){
		changePage(3);
	}
		
	var textButton3 = getControl("textButton3");
	textButton3.onClick = function(){
		goBack();
	}
		
	var textButton4 = getControl("textButton4");
	textButton4.onClick = function(){
		goBack();
	}
		
}

