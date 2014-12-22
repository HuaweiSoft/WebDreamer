wd_service.getAirlinesTime = function() {
};
wd_service.getAirlinesTime.prototype = {
    requestUrl: 'http://webservice.webxml.com.cn/webservices/DomesticAirline.asmx/getDomesticAirlinesTime',
    httpMethod: 'GET',
    request: function(successHandler, errorHandler, startCity, lastCity, theDate, userID) {
        var parameters = 'startCity=' + encodeURIComponent(startCity) + '&' + 'lastCity=' + encodeURIComponent(lastCity)
            + '&' + 'theDate=' + encodeURIComponent(theDate) + '&' + 'userID=' + encodeURIComponent(userID);
        RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "xml", "normal", parameters);
    }
}