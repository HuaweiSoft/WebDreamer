package com.webdreamer.servlets;

import java.io.File;
import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

import com.webdreamer.common.setting.CFSetting;

@WebServlet(name = "CFSettingServlet", urlPatterns = "/rest/setting/cf")
public class CFSettingServlet extends BaseServlet {
    private static final Logger logger = Logger.getLogger(CFSettingServlet.class);
    
    private static final String CF_CONFIG_FILE = "WEB-INF/classes/config.json"; 
    
    private static final String CF_CONFIG = "config";
    
    public CFSettingServlet() {
        super();
    }
    
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("utf-8");
        response.setCharacterEncoding("utf-8");
        
        String configFile = getRootPath() + File.separator + CF_CONFIG_FILE;
        CFSetting config = CFSetting.getCFSetting(configFile);
        if(config == null) {
            echoError(response, HttpServletResponse.SC_BAD_GATEWAY, "read config file failed.");
            return;
        }
        
        JSONObject configJson = config.toJson();
        if(configJson == null) {
            echoError(response, HttpServletResponse.SC_BAD_GATEWAY, "read config file failed.");
        }
        
        outputJsonResult(response, configJson);
    }
    
    
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("utf-8");
        response.setCharacterEncoding("utf-8");
        
        String configStr = request.getParameter(CF_CONFIG);
        
        try {
            JSONObject configJson = new JSONObject(configStr);
            String configFile = this.getRootPath() + File.separator + CF_CONFIG_FILE;
            boolean success = CFSetting.saveCFSetting(configFile, configJson);
            if(success) {
                outputJsonResult(response, configJson);
            } else {
                echoError(response, HttpServletResponse.SC_BAD_GATEWAY, "save cf setting failed.");
                return;
            }
            
        } catch (JSONException e) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "invalid cf setting");
            return;
        }       
        
    }
}
