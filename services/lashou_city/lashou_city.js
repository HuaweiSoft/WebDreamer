wd_service.lashou_city = function() {};
wd_service.lashou_city.prototype = {
	requestUrl: 'http://open.lashou.com/opendeals/lashou/city.xml',
	httpMethod: 'GET',
	request: function(successHandler, errorHandler) {
		var parameters = "";
		RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "xml", "normal", parameters);
	}
}