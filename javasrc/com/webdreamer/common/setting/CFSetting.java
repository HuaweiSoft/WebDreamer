package com.webdreamer.common.setting;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

import com.webdreamer.common.file.FileUtil;

public class CFSetting {
    private static final Logger logger = Logger.getLogger(CFSetting.class);
    
    private static final String CF_USERNAME = "username";
    private static final String CF_PASSWORD = "password";
    private static final String CF_URL = "url";
    private static final String CF_SPACE = "space";

    private String username;

    private String password;

    private String url;

    private String space;

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getUrl() {
        return url;
    }

    public String getSpace() {
        return space;
    }

    private CFSetting(String username, String password, String url, String space) {
        this.username = username;
        this.password = password;
        this.url = url;
        this.space = space;
    }

    public static CFSetting getCFSetting(String configFile) {
        String configStr = FileUtil.readFile(configFile);
        if (configStr == null || configStr.trim().equals("")) {
            return null;
        }

        try {
            JSONObject configJson = new JSONObject(configStr);

            String username = configJson.getString("username");
            String password = configJson.getString("password");
            String url = configJson.getString("url");
            String space = configJson.getString("space");

            return new CFSetting(username, password, url, space);

        } catch (JSONException e) {
            logger.error("parse config file error: " + e.toString());
            return null;
        }
    }

    public static boolean saveCFSetting(String configFile, JSONObject configJson) {
        String configStr = configJson.toString();
        return FileUtil.saveToFile(configFile, configStr);
    }
    
    public JSONObject toJson() {
        JSONObject configJson = new JSONObject();
        
        try {
            configJson.put(CF_USERNAME, username);
            configJson.put(CF_PASSWORD, password);
            configJson.put(CF_URL, url);
            configJson.put(CF_SPACE, space);
            
            return configJson;
            
        } catch (JSONException e) {
            
            logger.error("parse config error: " + e.toString());
            return null;
        }
    }
}
