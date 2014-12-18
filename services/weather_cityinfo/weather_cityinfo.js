wd_service.weather_cityinfo = function() {};
wd_service.weather_cityinfo.prototype = {
	requestUrl: 'http://apistore.baidu.com/microservice/cityinfo',
	httpMethod: 'GET',
	request: function(successHandler, errorHandler, cityname) {
		var parameters = 'cityname=' + cityname;
		RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "json", "normal", parameters);
	}
}