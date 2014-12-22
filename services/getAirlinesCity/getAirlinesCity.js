wd_service.getAirlinesCity = function() {};
wd_service.getAirlinesCity.prototype = {
	requestUrl: 'http://webservice.webxml.com.cn/webservices/DomesticAirline.asmx/getDomesticCity',
	httpMethod: 'GET',
	request: function(successHandler, errorHandler) {
		var parameters = "";
		RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "xml", "normal", parameters);
	}
}