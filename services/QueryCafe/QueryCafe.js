wd_service.QueryCafe = function() {
};
wd_service.QueryCafe.prototype = {
    requestUrl: 'http://api.map.baidu.com/place/v2/search?output=json&ak=3XXfRm1QwBxQRsCuyiTOKGcrq=饭店',
    httpMethod: 'GET',
    request: function(successHandler, errorHandler, p, region) {
        var parameters = 'q=' + p + '&' + 'region=' + region;
        RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "json", "normal",
                parameters);
    }
}