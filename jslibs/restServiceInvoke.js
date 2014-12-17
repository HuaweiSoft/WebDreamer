var wd_service = {};

//var serviceInvokeUrl = "http://localhost:8080/webdreamer/rest/invokerealrest";

function RMI(serviceInvokeUrl) {
    
    /**
     * @params successHandler
     * @params errorHandler
     * @params request url
     * @params http method, get or post
     * @params output type of the request url original response content type.[string, json, xml]
     *         For convenience, we will convert content type xml to json before sending response
     * @params parameter type, [normal, SlashWithP, SlashWithPV]
     * @params parameters in form of parameter type above, or null
     */
    this.sendRealRESTRequest = function(successHandler, errorHandler, requestUrl, httpMethod, outputType, parameterType, parameters) {
        var dataType;
        if (outputType == "json")
            dataType = "json";
        else if (outputType == "xml")
            dataType = "text";
        else
            dataType = "text";
        UI.showLoading();
        $.ajax({
            type: "POST",
            url: serviceInvokeUrl,
            async: true,
            /*contentType: "application/x-www-form-urlencoded",*/
            data: {
                httpMethod: httpMethod,
                url: requestUrl,
                outputType: outputType,
                parameterType: parameterType,
                parameters: parameters == null ? null : parameters
            },
            dataType: dataType,
            success: function(data, textStatus, jqXHR) {
                UI.hideLoading();
                if(outputType == "xml" && typeof data == "string"){
                    try{
                        data = $.xml2json(data);
                    }catch (e){
                       console.error("Service result is not a valid xml content: \n"+data);
                        return;
                    }
                }
                successHandler(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                UI.hideLoading();
                errorHandler(textStatus);
            },
            timeout: 600000 // 600s
        });
    }
}

var RMI = new RMI(serviceInvokeUrl);