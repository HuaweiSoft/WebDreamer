package com.webdreamer.common;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class RestServiceBean {

    private static final String WD_SERVICE_NAMESPACE = "wd_service";

    /**
     * service name
     */
    public String serviceName;
    /**
     * created by
     */
    public String createdBy;
    /**
     * created at
     */
    public Date createdAt;
    /**
     * type of service
     */
    public String type;
    /**
     * url of the service
     */
    public String url;
    /**
     * method type, include GET & POST
     */
    public String methodType;
    /**
     * parameter format type, include:
     * <p/>
     * normal: p1=v1&p2=v2 slashwithPV: p1/v1/p2/v2 slashwithP: v1/v2
     */
    public String parameterFormatType;
    /**
     * parameter list
     */
    public List<ServiceParameter> parameterList;
    /**
     * is the service private, if private, can only be seen by owner.
     */
    public boolean isPrivate;
    /**
     * type of return value after calling the service, include
     * <p/>
     * [int, string, json, xml]
     */
    public String outputParameterType;
    /**
     * format of return value, described as json
     */
    public String outputParameterFormat;
    /**
     * description of service
     */
    public String description;
    /**
     * path of icon
     */
    public String icon;

    public boolean isJsApi;
    public JSONObject jsApiInfo;

    public RestServiceBean(String serviceName, String createdBy, Date createdAt, String type, String url,
                           String methodType, String parameterFormatType, List<ServiceParameter> parameterList, boolean isPrivate,
                           String outputParameterType, String outputParameterFormat, String description, String icon, boolean isJsApi,
                           JSONObject jsApiInfo) {
        this.serviceName = serviceName;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.type = type;
        this.url = url;
        this.methodType = methodType;
        this.parameterFormatType = parameterFormatType;
        this.parameterList = parameterList;
        this.isPrivate = isPrivate;
        this.outputParameterType = outputParameterType;
        this.outputParameterFormat = outputParameterFormat;
        this.description = description;
        this.icon = icon;
        this.isJsApi = isJsApi;
        this.jsApiInfo = jsApiInfo;
    }

    public String generateJsCode() {
        String jsCode = "";
        String functionParameterList = "";
        String parameterStr = "";
        String requestUrl =  url;
        String pft = outputParameterType;
        String buildUrl  = url;

        int parameterLen = parameterList.size();
        if (parameterFormatType.equalsIgnoreCase("normal")) {
            // p1=v1&p2=v2
            for (int i = 0; i < parameterLen; i++) {
                ServiceParameter sp = parameterList.get(i);
                parameterStr += "'" + sp.name + "=' + ";
                if (sp.fixedValue == null || sp.fixedValue.length() == 0) {
                    parameterStr += "encodeURIComponent(" + sp.name + ")";
                    functionParameterList += sp.name + ",";
                } else {
                    parameterStr += "encodeURIComponent('" + sp.fixedValue + "')";
                }
                if (i < parameterLen - 1)
                    parameterStr += "+ '&' +";
            }
            if (parameterStr.equals("")) {
                parameterStr = "''";
            }

        } else if (parameterFormatType.equalsIgnoreCase("SlashWithPV")) {
            // p1/v1/p2/v2
            for (int i = 0; i < parameterLen; i++) {
                ServiceParameter sp = parameterList.get(i);
                parameterStr += "\'" + sp.name + "/\' + ";
                if (sp.fixedValue == null || sp.fixedValue.length() == 0) {
                    parameterStr += sp.name;
                    functionParameterList += sp.name + ",";
                } else {
                    parameterStr += "\'" + sp.fixedValue + "\'";
                }
                if (i < parameterLen - 1)
                    parameterStr += "+ \'/\' +";
            }

        } else if (parameterFormatType.equalsIgnoreCase("SlashWithP")) {
            // v1/v2
            for (int i = 0; i < parameterLen; i++) {
                ServiceParameter sp = parameterList.get(i);
                if (sp.fixedValue == null || sp.fixedValue.length() == 0) {
                    parameterStr += sp.name;
                    functionParameterList += sp.name + ",";
                } else {
                    parameterStr += "\'" + sp.fixedValue + "\'";
                }
                if (i < parameterLen - 1)
                    parameterStr += "+ \'/\' +";
            }

        } else if (parameterFormatType.equalsIgnoreCase("ParameterPath")) {
            // path/{p1}/{p2}
            parameterStr = "";
            requestUrl = "";
            pft = "normal";
            for (int i = 0; i < parameterLen; i++) {
                ServiceParameter sp = parameterList.get(i);
                String paramName =  sp.name;
                functionParameterList += paramName+ ",";
                while(buildUrl.contains("{"+ paramName +"}")){
                    buildUrl = buildUrl.replace("{"+ paramName +"}","' + encodeURIComponent('"+ paramName +"') + '");
                }
            }
        } else {
            return null;
        }
        if (parameterStr.equals("")) {
            parameterStr = "''";
        }
    /*
    //example
   wd_service.Abc = function() {
        };
        wd_service.Abc.prototype = {
                requestUrl: 'http://10.75.174.45:8080/cfportal/caas?action=conference',
                httpMethod: 'GET',
                request: function(successHandler, errorHandler, phone_nums) {
                    var parameters = 'phone_nums=' + phone_nums;
                    RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "string", "normal", parameters);
                }
        }*/

        //String functionName = serviceName.substring(0, 1).toUpperCase() + serviceName.substring(1);
        String functionName = serviceName;
        jsCode += String.format("%s.%s = function() {};\n", WD_SERVICE_NAMESPACE, functionName);
        jsCode += String.format("%s.%s.prototype = {\n", WD_SERVICE_NAMESPACE, functionName);
        jsCode += String.format("\t requestUrl: '%s',\n\t httpMethod: '%s',\n", requestUrl, methodType);

        jsCode += "\t request: function(successHandler, errorHandler";
        if (!functionParameterList.equals("")) {
            jsCode += ", " + functionParameterList.substring(0, functionParameterList.length() - 1);
        }
        jsCode += ") {\n";
        jsCode += "\t\tvar parameters = " + parameterStr + ";\n";
        if( parameterFormatType.equalsIgnoreCase("ParameterPath")){
            jsCode += "\t\tthis.requestUrl = '" + buildUrl + "';\n";
        }
        jsCode += String.format("\t\tRMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, \"%s\", \"%s\", parameters);\n",
                outputParameterType, pft);
        jsCode += "\t}\n";

        jsCode += "}";
        return jsCode;
    }

    public static void main(String[] args) {
        String serviceName = "cyl";
        String url = "http://open.lashou.com/opendeals/lashou/{cityid}.xml";
        String createdBy = "caiyunlong";
        Date createdAt = null;
        String type = "IM";
        String methodType = "GET";
        String parameterFormatType = "ParameterPath";
        List<ServiceParameter> params = new ArrayList<ServiceParameter>();
        ServiceParameter p1 = new ServiceParameter("cityid", "cityid", "string", null, "");
        ServiceParameter p2 = new ServiceParameter("n2", "a2", "string", "default", null);
        ServiceParameter p3 = new ServiceParameter("n3", "a3", "string", "KKK", "c");
        params.add(p1);
        params.add(p2);
        params.add(p3);
        boolean isPrivate = false;
        String outputParameterType = "json";
        String outputParameterFormat = "[{a:\"string\",b:\"number\"}]";
        String description = "test service bean ";
        String icon = "path/to/icon";

        RestServiceBean sb = new RestServiceBean(serviceName, createdBy, createdAt, type, url, methodType,
                parameterFormatType, params, isPrivate, outputParameterType, outputParameterFormat, description, icon
                , false, null);
        String ret = sb.generateJsCode();
        System.out.println(ret);

    }

}
