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
     * 
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
     * 
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
        int parameterLen = parameterList.size();
        if (parameterFormatType.equalsIgnoreCase("normal")) {
            // p1=v1&p2=v2
            for (int i = 0; i < parameterLen; i++) {
                ServiceParameter sp = parameterList.get(i);
                parameterStr += "\'" + sp.name + "=\' + ";
                if (sp.fixedValue == null || sp.fixedValue.length() == 0) {
                    parameterStr += sp.name;
                    functionParameterList += sp.name + ",";
                } else {
                    parameterStr += "\'" + sp.fixedValue + "\'";
                }
                parameterStr += "+ \'&\' +";
            }
            if (!parameterStr.equals("")) {
                parameterStr = parameterStr.substring(0, parameterStr.length() - "+ \'&\' +".length());
            } else {
                parameterStr = "\"\"";
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
                parameterStr += "+ \'/\' +";
            }
            if (!parameterStr.equals("")) {
                parameterStr = parameterStr.substring(0, parameterStr.length() - "+ \'/\' +".length());
            } else {
                parameterStr = "\"\"";
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
                parameterStr += "+ \'/\' +";
            }
            if (!parameterStr.equals("")) {
                parameterStr = parameterStr.substring(0, parameterStr.length() - "+ \'/\' +".length());
            } else {
                parameterStr = "\"\"";
            }

        } else {
            return null;
        }

//        wd_service.Abc = function() {
//        };
//        wd_service.Abc.prototype = {
//                requestUrl: 'http://10.75.174.45:8080/cfportal/caas?action=conference',
//                httpMethod: 'GET',
//                request: function(successHandler, errorHandler, phone_nums) {
//                    var parameters = 'phone_nums=' + phone_nums;
//                    RMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, "string", "normal", parameters);
//                }
//        }
        
        //String functionName = serviceName.substring(0, 1).toUpperCase() + serviceName.substring(1);
        String functionName = serviceName;
        jsCode += WD_SERVICE_NAMESPACE + "." + functionName + " = function() {};\n";
        jsCode += WD_SERVICE_NAMESPACE + "." + functionName + ".prototype = {\n";
        jsCode += "\trequestUrl: \'" + url + "\',\n";
        jsCode += "\thttpMethod: \'" + methodType + "\',\n";
        
        jsCode += "\trequest: function(successHandler, errorHandler";
        if(!functionParameterList.equals("")) {
            jsCode += ", " + functionParameterList.substring(0, functionParameterList.length() - 1);
        }
        jsCode += ") {\n";
        jsCode += "\t\tvar parameters = " + parameterStr + ";\n";
        jsCode += "\t\tRMI.sendRealRESTRequest(successHandler, errorHandler, this.requestUrl, this.httpMethod, \"" + outputParameterType + "\", \"" + parameterFormatType + "\", parameters);\n";
        jsCode += "\t}\n";
        
        jsCode += "}";
        return jsCode;
    }

    public static void main(String[] args) {
        String serviceName = "cyl";
        String url = "http://localhost:8080";
        String createdBy = "caiyunlong";
        Date createdAt = null;
        String type = "IM";
        String methodType = "GET";
        String parameterFormatType = "normal";
        List<ServiceParameter> params = new ArrayList<ServiceParameter>();
        ServiceParameter p1 = new ServiceParameter("n1", "a1", "string", null, "");
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
        ,false, null);
        String ret = sb.generateJsCode();
        System.out.println(ret);

    }

}
