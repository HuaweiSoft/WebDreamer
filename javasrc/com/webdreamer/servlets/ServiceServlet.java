package com.webdreamer.servlets;

import java.io.File;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.webdreamer.common.RestServiceBean;
import com.webdreamer.common.RestServiceManager;
import com.webdreamer.common.ServiceParameter;
import com.webdreamer.common.file.FileUtil;

@WebServlet(name = "ServiceServlet", urlPatterns = { "/rest/services", "/rest/services/*" })
public class ServiceServlet extends BaseServlet {
    private static final Logger logger = Logger.getLogger(ServiceServlet.class);

    private static final String SERVICE_DATA_PATH = "services";

    private static final SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    private static final String SERVICE_OPERATE_FLAG = "operate";

    private static final String SERVICE_OPERATE_TYPE_CHECK_IS_USED = "isUsed";

    public ServiceServlet() {
        super();
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        this.doPost(request, response);
    }

    public void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.trim().equals("")) {
            logger.error("not support delete all services in one time");
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "not support delete all services in one time");
            return;
        }
        RestServiceManager sm = new RestServiceManager(getRootPath() + SERVICE_DATA_PATH);
        String serviceName = pathInfo.substring(1).trim();
        boolean success = sm.remove(serviceName);
        if (success) {
            outputJsonResult(response, new JSONObject());
        } else {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "remove error");
            return;
        }
    }

    public void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {

        request.setCharacterEncoding("utf-8");
        response.setCharacterEncoding("utf-8");

        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.trim().equals("")) {
            logger.error("not support update all services in one time");
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "not support update all services in one time");
            return;
        }

        String serviceName = pathInfo.substring(1).trim();
        String serviceDataStr = request.getParameter("service");
        RestServiceBean service = generateRestServiceBean(serviceDataStr);
        if (service == null) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "bad request");
            return;
        }
        if (!service.serviceName.equals(serviceName)) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "bad request");
            return;
        }

        RestServiceManager sm = new RestServiceManager(getRootPath() + SERVICE_DATA_PATH);
        boolean success = sm.update(service);
        if (!success) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "bad request");
            return;
        }
        String iconTmpPath = request.getParameter("iconTmpPath");
        if (iconTmpPath != null) {
            String from = getRootPath() + File.separator + iconTmpPath + File.separator + service.icon;
            String to = getRootPath() + File.separator + SERVICE_DATA_PATH + File.separator + service.serviceName
                    + File.separator + "icon" + File.separator + service.icon;
            success = sm.moveServiceIcon(service.serviceName, from, to);
            if (!success) {
                echoError(response, HttpServletResponse.SC_BAD_REQUEST, "duplicated service name");
                return;
            }
        }
        try {
            outputJsonResult(response, RestServiceManager.convertSingleService(service));
        } catch (JSONException e) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "duplicated service name");
            return;
        }

    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("utf-8");
        response.setCharacterEncoding("utf-8");

        RestServiceManager sm = new RestServiceManager(getRootPath() + SERVICE_DATA_PATH);
        String questType = request.getParameter(SERVICE_OPERATE_FLAG);
        if (questType != null && questType.equals(SERVICE_OPERATE_TYPE_CHECK_IS_USED)) {
            String serviceName = request.getParameter("service");
            JSONObject obj = sm.checkServiceBeenUsed(serviceName);
            response.getWriter().print(obj);
            return;
        }

        String method = request.getMethod();
        if (method.toUpperCase().equals("GET")) {

            String pathInfo = request.getPathInfo();

            if (pathInfo == null || pathInfo.trim().equals("")) {
                try {
                    Map<String, List<RestServiceBean>> services = sm.getAllServices();
                    JSONArray servicesJson = RestServiceManager.convertServiceMap(services);
                    outputJsonResult(response, servicesJson);
                } catch (JSONException e) {
                    echoError(response, HttpServletResponse.SC_BAD_GATEWAY, "load service data failed.");
                    return;
                }

            } else {
                String requestInfo = pathInfo.trim().substring(1);
                if (!requestInfo.contains("/")) {
                    String serviceName = requestInfo;
                    RestServiceBean service = sm.getServiceByName(serviceName);
                    if (service == null) {
                        echoError(response, HttpServletResponse.SC_BAD_REQUEST, "service named [" + serviceName
                                + "] does not exist.");
                        return;
                    }
                    try {
                        JSONObject serviceJson = RestServiceManager.convertSingleService(service);
                        outputJsonResult(response, serviceJson);
                    } catch (JSONException e) {
                        echoError(response, HttpServletResponse.SC_BAD_REQUEST, "service named [" + serviceName
                                + "] does not exist.");
                        return;
                    }

                } else {
                    String[] tokens = requestInfo.split("/");
                    if (tokens.length != 2 || !tokens[0].equals("type")) {
                        echoError(response, HttpServletResponse.SC_BAD_REQUEST, "unknown request path");
                        return;
                    }

                    String type = tokens[1].trim();
                    List<RestServiceBean> servicesByType = sm.getServicesByType(type);
                    if (servicesByType == null) {
                        echoError(response, HttpServletResponse.SC_BAD_REQUEST, "service type [" + type
                                + "] does not exist");
                        return;
                    }
                    try {
                        JSONArray servicesByTypeJson = RestServiceManager.convertServiceList(servicesByType);
                        JSONObject resultJson = new JSONObject();
                        resultJson.put(type, servicesByTypeJson);
                        outputJsonResult(response, resultJson);
                    } catch (JSONException e) {
                        echoError(response, HttpServletResponse.SC_BAD_GATEWAY, "unknown request path");
                        return;
                    }

                }
            }
        } else if (method.toUpperCase().equals("POST")) {

            String pathInfo = request.getPathInfo();
            // create
            if (pathInfo == null || pathInfo.trim().equals("")) {
                String serviceDataStr = request.getParameter("service");
                String iconTmpPath = request.getParameter("iconTmpPath");
                if (iconTmpPath == null || iconTmpPath.trim().equals("")) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "cannot parse service data");
                    return;
                }
                RestServiceBean service = generateRestServiceBean(serviceDataStr);
                if (service == null) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "cannot parse service data");
                    return;
                }
                boolean success = sm.register(service);
                if (!success) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "duplicated service name");
                    return;
                }
                String from = getRootPath() + File.separator + iconTmpPath + File.separator + service.icon;
                String to = getRootPath() + File.separator + SERVICE_DATA_PATH + File.separator + service.serviceName
                        + File.separator + "icon" + File.separator + service.icon;
                success = sm.moveServiceIcon(service.serviceName, from, to);
                if (!success) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "icon not set");
                    return;
                }

                JSONObject serviceJson;
                try {
                    serviceJson = RestServiceManager.convertSingleService(service);
                    outputJsonResult(response, serviceJson);
                } catch (JSONException e) {
                    echoError(response, HttpServletResponse.SC_BAD_GATEWAY, e.getLocalizedMessage());
                    return;
                }
            } else {
                // update
                String serviceName = pathInfo.substring(1).trim();
                String serviceDataStr = request.getParameter("service");
                if (serviceDataStr == null) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "bad request");
                    return;
                }
                RestServiceBean service = generateRestServiceBean(serviceDataStr);
                if (service == null) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "bad request");
                    return;
                }
                if (!service.serviceName.equals(serviceName)) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "bad request");
                    return;
                }
                String iconTmpPath = request.getParameter("iconTmpPath");
                RestServiceBean oldService = sm.getServiceByName(serviceName);
                if (oldService == null) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "no such service");
                    return;
                }

                boolean success;
                if (iconTmpPath != null && !iconTmpPath.trim().equals("")) {
                    String from = getRootPath() + File.separator + iconTmpPath + File.separator + service.icon;
                    String iconDir = getRootPath() + File.separator + SERVICE_DATA_PATH + File.separator
                            + service.serviceName + File.separator + "icon";
                    FileUtil.deleteFile(iconDir + File.separator + oldService.icon);
                    String to = iconDir + File.separator + service.icon;
                    success = sm.moveServiceIcon(service.serviceName, from, to);
                    if (!success) {
                        echoError(response, HttpServletResponse.SC_BAD_REQUEST, "duplicated service name");
                        return;
                    }
                }

                success = sm.update(service);
                if (!success) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "bad request");
                    return;
                }
                try {
                    outputJsonResult(response, RestServiceManager.convertSingleService(service));
                } catch (JSONException e) {
                    echoError(response, HttpServletResponse.SC_BAD_REQUEST, "duplicated service name");
                    return;
                }

            }
        }
    }

    private RestServiceBean generateRestServiceBean(String serviceDataStr) {
        RestServiceBean bean = null;

        try {
            JSONObject serviceJson = new JSONObject(serviceDataStr);

            String user = serviceJson.getString("user");
            String serviceName = serviceJson.getString("serviceName");
            String type = serviceJson.getString("type");
            String url = serviceJson.getString("url");
            String method = serviceJson.getString("method");
            boolean isPrivate = serviceJson.getBoolean("isPrivate");
            String parameterFormat = serviceJson.getString("parameterFormat");

            JSONArray parameterJsonArray = serviceJson.getJSONArray("parameters");
            List<ServiceParameter> parameters = new ArrayList<ServiceParameter>();
            for (int i = 0; i < parameterJsonArray.length(); i++) {
                JSONObject parameterJson = parameterJsonArray.getJSONObject(i);
                String parameterName = parameterJson.getString("name");
                String fixedValue = parameterJson.optString("fixedValue", null);
                if (fixedValue != null && fixedValue.trim().equals("")) {
                    fixedValue = null;
                }
                String parameterType = parameterJson.optString("type", "");
                String defaultValue = parameterJson.optString("defaultValue", null);
                if (defaultValue != null && defaultValue.trim().equals("")) {
                    defaultValue = null;
                }

                ServiceParameter parameter = new ServiceParameter(parameterName, parameterName, parameterType,
                        defaultValue, fixedValue);
                parameters.add(parameter);
            }

            String outputParameterType = serviceJson.getString("outputParameterType");
            String outputParameterFormat = serviceJson.getString("outputParameterFormat");
            String description = serviceJson.getString("description");
            String icon = serviceJson.getString("icon");

            String date = serviceJson.optString("createdAt", null);
            Date createdAt = date == null ? new Date() : df.parse(date);
            boolean isJsApi = serviceJson.optBoolean("isJsApi", false);
            JSONObject jsApiInfo = serviceJson.optJSONObject("jsApiInfo");

            bean = new RestServiceBean(serviceName, user, createdAt, type, url, method, parameterFormat, parameters,
                    isPrivate, outputParameterType, outputParameterFormat, description, icon,isJsApi, jsApiInfo);

        } catch (JSONException e) {
            logger.error(e.toString());
            return null;
        } catch (ParseException e) {
            logger.error(e.toString());
            return null;
        }
        return bean;
    }

}
