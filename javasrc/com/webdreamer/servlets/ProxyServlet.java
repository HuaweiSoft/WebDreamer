package com.webdreamer.servlets;

import java.io.File;
import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

import com.webdreamer.serviceInvoker.NetConnectionConfiguration;

@WebServlet(name = "ProxyServlet", urlPatterns = "/rest/setting/proxy")
public class ProxyServlet extends BaseServlet {
    private static final Logger logger = Logger.getLogger(ProxyServlet.class);
    
    private static final String PROXY_CONFIGURATION_FILE = "WEB-INF/classes/proxy.json";
    
    /*parameter*/
    private static final String PROXY = "proxy";
    
    /*json key*/
    private static final String PROXY_ENABLE = "enable";
    private static final String PROXY_HOST = "host";
    private static final String PROXY_PORT = "port";
    private static final String PROXY_USERNAME = "username";
    private static final String PROXY_PASSWORD = "password";
    private static final String NON_PROXY_HOST = "nonProxyHost";
    
    public ProxyServlet() {
        super();
    }
    
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("utf-8");
        response.setCharacterEncoding("utf-8");
        
        String configFile = this.getRootPath() + File.separator + PROXY_CONFIGURATION_FILE;
        NetConnectionConfiguration config = NetConnectionConfiguration.getConfiguration(configFile);
        JSONObject configJson = toJsonObject(config);
        if(configJson == null) {
            echoError(response, HttpServletResponse.SC_BAD_GATEWAY, "read proxy failed.");
            return;
        }
        
        outputJsonResult(response, configJson);
    }
    
    public  void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("utf-8");
        response.setCharacterEncoding("utf-8");
        
        String proxyStr = request.getParameter(PROXY);
        try {
            JSONObject configJson = new JSONObject(proxyStr);
            String configFile = this.getRootPath() + File.separator + PROXY_CONFIGURATION_FILE;
            boolean success = NetConnectionConfiguration.saveConfiguration(configFile, configJson);
            if(success) {
                outputJsonResult(response, configJson);
            } else {
                echoError(response, HttpServletResponse.SC_BAD_GATEWAY, "save proxy failed.");
                return;
            }
            
        } catch (JSONException e) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "invalid proxy setting");
            return;
        }
        
    }
 
    private JSONObject toJsonObject(NetConnectionConfiguration config) {
        JSONObject configJson = new JSONObject();
        try {
            configJson.put(PROXY_ENABLE, config.getproxyEnable());
            configJson.put(PROXY_HOST, config.getProxyHost());
            configJson.put(PROXY_PORT, config.getProxyPort());
            configJson.put(PROXY_USERNAME, config.getProxyUsername());
            configJson.put(PROXY_PASSWORD, config.getProxyPassword());
            configJson.put(NON_PROXY_HOST, config.getNonProxyHost());
            
            return configJson;
            
        } catch (JSONException e) {
            logger.error(e.toString());
            return null;
        }
    }
}
