wd_service.lashou = function() {};
wd_service.lashou.prototype = {
	 requestUrl: '',
	 httpMethod: 'GET',
	 request: function(successHandler, errorHandler, cityid) {
		var parameters = '';
		this.requestUrl = 'http://open.lashou.com/opendeals/lashou/' + cityid + '.xml';
		RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "xml", "normal", parameters);
	}
}