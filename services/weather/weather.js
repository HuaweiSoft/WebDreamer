wd_service.weather = function() {};
wd_service.weather.prototype = {
	requestUrl: 'http://apistore.baidu.com/microservice/weather',
	httpMethod: 'GET',
	request: function(successHandler, errorHandler, cityid) {
		var parameters = 'cityid=' + cityid;
		RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "json", "normal", parameters);
	}
}