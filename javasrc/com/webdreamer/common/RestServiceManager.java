package com.webdreamer.common;

import java.io.File;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.webdreamer.common.file.FileUtil;

public class RestServiceManager {
    private static final Logger logger = Logger.getLogger(RestServiceManager.class);

    private String servicePath;

    private Map<String, List<RestServiceBean>> services;

    private static final SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public RestServiceManager(String servicePath) {
        this.servicePath = servicePath;
        reset();
    }

    /**
     * get a clone of services map that is unmodifiable.
     */
    public Map<String, List<RestServiceBean>> getAllServices() {
        if (services.size() == 0) {
            load(servicePath);
        }
        return Collections.unmodifiableMap(services);
    }

    public List<RestServiceBean> getServicesByType(String type) {
        if (services.size() == 0) {
            load(servicePath);
        }
        List<RestServiceBean> servicesByType = services.get(type);
        if (servicesByType == null) {
            return null;
        }
        return Collections.unmodifiableList(servicesByType);
    }

    public RestServiceBean getServiceByName(String serviceName) {
        String serviceMetadataFilePath = servicePath + File.separator + serviceName + File.separator + "metadata.json";
        String serviceMetadataStr = FileUtil.readFile(serviceMetadataFilePath);
        if (serviceMetadataStr == null || serviceMetadataStr.trim().equals("")) {
            return null;
        }
        RestServiceBean service = null;
        try {
            JSONObject serviceJson = new JSONObject(serviceMetadataStr);
            service = parseSingleService(serviceJson);
        } catch (JSONException e) {
            logger.error("parse json error: " + e.toString());
            return null;
        }
        return service;
    }

    public boolean register(RestServiceBean service) {
        if (isContain(service.serviceName)) {
            return false;
        }

        return createService(service);
    }

    public boolean unregister(String serviceName) {
        return removeService(serviceName);
    }

    public boolean update(RestServiceBean service) {
        if (!isContain(service.serviceName)) {
            return false;
        }
        String serviceDir = servicePath + File.separator + service.serviceName;
        String serviceMetadataPath = serviceDir + File.separator + "metadata.json";
        try {
            JSONObject serviceMetadataJson = convertSingleService(service);
            FileUtil.saveToFile(serviceMetadataPath, serviceMetadataJson.toString());
        } catch (JSONException e) {
            removeService(service.serviceName);
            return false;
        }

        return true;
    }

    public boolean remove(String serviceName) {
        return removeService(serviceName);
    }

    /**
     * @param serviceName
     * @param from
     * @param to
     * @return {boolean} move icon success or not
     */
    public boolean moveServiceIcon(String serviceName, String from, String to) {
        try {
            File oldIconFile = new File(from);
            if (!oldIconFile.exists()) {
                removeService(serviceName);
                return false;
            }
            if (!oldIconFile.renameTo(new File(to))) {
                removeService(serviceName);
                return false;
            }
            File dir = oldIconFile.getParentFile();
            FileUtil.deleteDirectory(dir.getAbsolutePath());
        } catch (Exception e) {
            removeService(serviceName);
            return false;
        }
        return true;
    }

    public boolean load(String serviceDataPath) {
        reset();

        JSONArray serviceDirList = FileUtil.getSubDirList(servicePath);
        for (int i = 0; i < serviceDirList.length(); i++) {
            try {
                JSONObject serviceDirJson = serviceDirList.getJSONObject(i);
                String name = serviceDirJson.getString("name");
                String serviceMetadataFilePath = servicePath + File.separator + name + File.separator + "metadata.json";
                String serviceMetadataStr = FileUtil.readFile(serviceMetadataFilePath);
                if (serviceMetadataStr != "") {
                    JSONObject serviceJson = new JSONObject(serviceMetadataStr);
                    RestServiceBean service = parseSingleService(serviceJson);

                    List<RestServiceBean> servicesByType = services.get(service.type);
                    if (servicesByType == null) {
                        servicesByType = new ArrayList<RestServiceBean>();
                        services.put(service.type, servicesByType);
                    }
                    servicesByType.add(service);
                }

            } catch (JSONException e) {
                logger.error("parse json error: " + e.toString());
                return false;
            }
        }
        return true;
    }

    private boolean createService(RestServiceBean service) {
        String serviceDir = servicePath + File.separator + service.serviceName;
        // create service root dir
        if (!FileUtil.makeDir(serviceDir)) {
            return false;
        }
        // create service icon dir and move the icon here
        if (!FileUtil.makeDir(serviceDir + File.separator + "icon")) {
            removeService(service.serviceName);
            return false;
        }

        //
        String serviceMetadataPath = serviceDir + File.separator + "metadata.json";
        try {
            JSONObject serviceMetadataJson = convertSingleService(service);
            FileUtil.saveToFile(serviceMetadataPath, serviceMetadataJson.toString());
        } catch (JSONException e) {
            removeService(service.serviceName);
            return false;
        }

        //
        String serviceJsCode = serviceDir + File.separator + service.serviceName + ".js";
        if (!FileUtil.saveToFile(serviceJsCode, service.generateJsCode())) {
            removeService(service.serviceName);
            return false;
        }

        return true;
    }

    private boolean removeService(String serviceName) {
        String serviceDir = servicePath + File.separator + serviceName;
        return FileUtil.deleteDirectory(serviceDir);
    }

    /**
     * Check the specified service has been used by all user project,the main steps as fellow :
     * 1、Get all project used services from the flow.json file from all user's project directories
     * 2、If all used services contains the specified service return true otherwise return false
     * 
     * @param serviceName
     * @return {@link JSONObject}
     */
    public JSONObject checkServiceBeenUsed(String serviceName) {
        boolean isUsed = false;
        boolean isImported = false;
        JSONObject obj = new JSONObject();
        if (serviceName == null || serviceName.equals("")) {

            try {
                obj.put("isUsed", isUsed);
                obj.put("isImported", isImported);
            } catch (Exception e) {
                logger.error(e);
            }
            return obj;
        }
        File file = new File(servicePath).getParentFile();
        String dataDirPath = file.getAbsolutePath() + File.separator + "data" + File.separator;
        JSONArray userArray = FileUtil.getSubDirList(dataDirPath);
        for (int i = 0; i < userArray.length(); i++) {
            try {
                String userName = userArray.getJSONObject(i).getString("name");

                if (!userName.equals("tmpl")) {
                    JSONArray projects = FileUtil.getSubDirList(dataDirPath + userName);
                    if (projects.length() > 0) {
                        for (int j = 0; j < projects.length(); j++) {
                            String flowJson = FileUtil.readFile(dataDirPath + userName + File.separator
                                    + projects.getJSONObject(j).getString("name") + File.separator + "flow.json");
                            if (!flowJson.equals("")) {

                                JSONObject flowModel = new JSONObject(flowJson);
                                if (flowModel.getJSONObject("apiMetas").has(serviceName)) {
                                    isUsed = true;
                                    break;
                                }

                            }
                        }
                    }
                    if (!isUsed) {
                        String userInfo = FileUtil.readFile(dataDirPath + userName + File.separator + "userinfo.json");
                        JSONObject userInfoObject = new JSONObject(userInfo);
                        JSONArray userSubServices = userInfoObject.getJSONArray("subscribeServices");
                        for (int p = 0; p < userSubServices.length(); p++) {
                            if (userSubServices.getString(p).equals(serviceName)) {
                                isImported = true;
                                break;
                            }
                        }
                    }
                    if (isUsed || isImported) {
                        break;
                    }
                }

            } catch (Exception e) {
                logger.error(e);
            }
        }
        try {
            obj.put("isUsed", isUsed);
            obj.put("isImported", isImported);
        } catch (Exception e) {
            logger.error(e);
        }
        return obj;
    }

    public boolean isContain(String serviceName) {
        String serviceDir = servicePath + File.separator + serviceName;
        return FileUtil.exists(serviceDir);
    }

    private JSONArray generateServiceJsonInfo() throws JSONException {
        JSONArray servicesJson = convertServiceMap(services);
        return servicesJson;
    }

    private RestServiceBean parseSingleService(JSONObject serviceJson) throws JSONException {
        String serviceName = serviceJson.getString("serviceName");
        String createdBy = serviceJson.getString("createdBy");
        Date createdAt = null;
        try {
            createdAt = df.parse(serviceJson.getString("createdAt"));
        } catch (ParseException e) {
            return null;
        }
        String type = serviceJson.getString("type");
        String methodType = serviceJson.getString("methodType");
        String parameterFormatType = serviceJson.getString("parameterFormatType");
        String url = serviceJson.getString("url");

        JSONArray parametersJson = serviceJson.getJSONArray("parameterList");
        List<ServiceParameter> parameterList = new ArrayList<ServiceParameter>();
        for (int j = 0; j < parametersJson.length(); j++) {
            JSONObject parameterJson = parametersJson.getJSONObject(j);
            String name = parameterJson.getString("name");
            String alias = parameterJson.optString("alias", name);
            String fixedValue = parameterJson.optString("fixedValue", null);
            String parameterType = parameterJson.optString("type", "string");
            String defaultValue = parameterJson.optString("defaultValue", null);
            ServiceParameter param = new ServiceParameter(name, alias, parameterType, defaultValue, fixedValue);
            parameterList.add(param);
        }

        boolean isPrivate = serviceJson.getBoolean("isPrivate");
        String outputParameterType = serviceJson.getString("outputParameterType");
        String outputParameterFormat = serviceJson.getString("outputParameterFormat");
        String description = serviceJson.getString("description");
        String icon = serviceJson.getString("icon");
        boolean isJsApi = serviceJson.optBoolean("isJsApi", false);
        JSONObject jsApiInfo = serviceJson.optJSONObject("jsApiInfo");

        RestServiceBean service = new RestServiceBean(serviceName, createdBy, createdAt, type, url, methodType,
                parameterFormatType, parameterList, isPrivate, outputParameterType, outputParameterFormat, description,
                icon, isJsApi, jsApiInfo);
        return service;
    }

    private Map<String, List<RestServiceBean>> parseServices(JSONObject servicesJson) throws JSONException {
        Map<String, List<RestServiceBean>> services = new HashMap<String, List<RestServiceBean>>();

        Iterator iter = servicesJson.keys();
        while (iter.hasNext()) {
            String type = (String) iter.next();
            List<RestServiceBean> servicesByType = new ArrayList<RestServiceBean>();
            JSONArray servicesByTypeJson = servicesJson.getJSONArray(type);
            for (int i = 0; i < servicesByTypeJson.length(); i++) {
                RestServiceBean service = parseSingleService(servicesByTypeJson.getJSONObject(i));
                servicesByType.add(service);
            }
            services.put(type, servicesByType);
        }

        return services;
    }

    private void reset() {
        if (services != null) {
            services.clear();
            return;
        }
        services = new HashMap<String, List<RestServiceBean>>();
    }

    public static JSONObject convertSingleService(RestServiceBean service) throws JSONException {
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        JSONObject serviceJson = new JSONObject();
        serviceJson.put("serviceName", service.serviceName);
        serviceJson.put("createdBy", service.createdBy);
        serviceJson.put("createdAt", df.format(service.createdAt));
        serviceJson.put("type", service.type);
        serviceJson.put("methodType", service.methodType);
        serviceJson.put("parameterFormatType", service.parameterFormatType);
        serviceJson.put("url", service.url);

        JSONArray parametersJson = new JSONArray();
        for (ServiceParameter param : service.parameterList) {
            JSONObject parameterJson = new JSONObject();
            parameterJson.put("name", param.name);
            parameterJson.put("alias", param.alias);
            parameterJson.put("fixedValue", param.fixedValue);
            parameterJson.put("type", param.type);
            parameterJson.put("defaultValue", param.defaultValue);

            parametersJson.put(parameterJson);
        }
        serviceJson.put("parameterList", parametersJson);
        serviceJson.put("isPrivate", service.isPrivate);
        serviceJson.put("outputParameterType", service.outputParameterType);
        serviceJson.put("outputParameterFormat", service.outputParameterFormat);
        serviceJson.put("description", service.description);
        serviceJson.put("icon", service.icon);
        serviceJson.put("isJsApi", service.isJsApi);
        serviceJson.put("jsApiInfo", service.jsApiInfo);

        return serviceJson;
    }

    public static JSONArray convertServiceList(List<RestServiceBean> services) throws JSONException {
        JSONArray servicesJson = new JSONArray();
        for (RestServiceBean service : services) {
            servicesJson.put(convertSingleService(service));
        }
        return servicesJson;
    }

    public static JSONArray convertServiceMap(Map<String, List<RestServiceBean>> services) throws JSONException {

        JSONArray array = new JSONArray();
        for (String type : services.keySet()) {
            JSONObject servicesJson = new JSONObject();
            List<RestServiceBean> servicesByType = services.get(type);
            JSONArray servicesByTypeJson = convertServiceList(servicesByType);
            servicesJson.put("group", type);
            servicesJson.put("services", servicesByTypeJson);
            array.put(servicesJson);

        }
        return array;
    }

    public static void main(String[] args) {
        // String path = "d:/a.dat";
        // RestServiceManager sm = new RestServiceManager();

        // String serviceName = "cyl";
        // String url = "http://localhost:8080";
        // String createdBy = "caiyunlong";
        // Date createdAt = new Date();
        // String type = "IM";
        // String methodType = "GET";
        // String parameterFormatType = "slashwithP";
        // List<ServiceParameter> params = new ArrayList<ServiceParameter>();
        // ServiceParameter p1 = new ServiceParameter("n1", "a1", 0, null);
        // ServiceParameter p2 = new ServiceParameter("n2", "a2", 0, "default");
        // ServiceParameter p3 = new ServiceParameter("n3", "a3", 0, "KKK");
        // params.add(p1);
        // params.add(p2);
        // params.add(p3);
        //
        // boolean isPrivate = false;
        // String outputParameterType = "json";
        // String outputParameterFormat = "[{a:\"string\",b:\"number\"}]";
        // String description = "test service bean ";
        //
        // RestServiceBean sb = new RestServiceBean(serviceName, createdBy, createdAt, type, url,
        // methodType,
        // parameterFormatType, params, isPrivate, outputParameterType, outputParameterFormat,
        // description);
        //
        // sm.register(sb);
        // sm.save(path);

        // sm.load(path);
        // List<RestServiceBean> services = sm.getAllServices();
        // for (RestServiceBean sb : services) {
        // System.out.println(sb.serviceName);
        // System.out.println(sb.isPrivate);
        // }

    }
}
