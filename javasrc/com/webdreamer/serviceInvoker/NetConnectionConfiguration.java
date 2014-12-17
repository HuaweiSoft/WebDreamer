package com.webdreamer.serviceInvoker;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

public class NetConnectionConfiguration {
    private static final Logger logger = Logger.getLogger(NetConnectionConfiguration.class);

    private boolean proxyEnable;

    private String proxyHost;

    private int proxyPort;

    private String proxyUsername;

    private String proxyPassword;

    private String nonProxyHost;

    public boolean getproxyEnable() {
        return proxyEnable;
    }

    public String getProxyHost() {
        return proxyHost;
    }

    public int getProxyPort() {
        return proxyPort;
    }

    public String getProxyUsername() {
        return proxyUsername;
    }

    public String getProxyPassword() {
        return proxyPassword;
    }

    public String getNonProxyHost() {
        return nonProxyHost;
    }

    private NetConnectionConfiguration(boolean proxyEnable, String proxyHost, int proxyPort, String proxyUsername,
            String proxyPassword, String nonProxyHost) {
        this.proxyEnable = proxyEnable;
        this.proxyHost = proxyHost;
        this.proxyPort = proxyPort;
        this.proxyUsername = proxyUsername;
        this.proxyPassword = proxyPassword;
        this.nonProxyHost = nonProxyHost;
    }

    public static NetConnectionConfiguration getConfiguration(String configFile) {
        String configStr = readFile(configFile);
        if (configStr == null || configStr.trim().equals("")) {
            return null;
        }

        try {
            JSONObject configJson = new JSONObject(configStr);
            boolean proxyEnable = configJson.optBoolean("enable", false);
            String proxyHost = configJson.getString("host");
            int proxyPort = configJson.optInt("port", 80);
            String proxyUsername = configJson.optString("username", "");
            String proxyPassword = configJson.optString("password", "");
            String nonProxyHost = configJson.optString("nonProxyHost", "localhost,127.0.0.1");

            NetConnectionConfiguration config = new NetConnectionConfiguration(proxyEnable, proxyHost, proxyPort,
                    proxyUsername, proxyPassword, nonProxyHost);
            return config;

        } catch (JSONException e) {
            logger.error("parse config file failed: " + e.toString());
            return null;
        }

    }

    public static boolean saveConfiguration(String configFile, JSONObject config) {
        String configStr = config.toString();
        return saveToFile(configFile, configStr);
    }

    
    private static String readFile(String filePath) {
        if (filePath == null || filePath.trim().equals("")) {
            logger.error("File path is be null or empty");
            return "";

        } else {
            File file = new File(filePath);
            BufferedReader br = null;
            InputStreamReader isr = null;
            FileInputStream fs = null;
            StringBuffer sb = new StringBuffer();
            if (file.exists() && file.isFile()) {
                try {
                    fs = new FileInputStream(file);
                    isr = new InputStreamReader(fs, "UTF-8");
                    br = new BufferedReader(isr);

                    String record = new String();
                    sb = new StringBuffer();
                    while ((record = br.readLine()) != null) {
                        sb.append(record + "\n");
                    }
                    return sb.toString();
                } catch (Exception e) {
                    logger.error("Read file error [" + e.getMessage() + "]");
                    return "";

                } finally {

                    if (fs != null) {

                        try {
                            fs.close();
                        } catch (final Exception e) {
                            logger.error(e);
                        }
                        fs = null;
                    }
                    if (isr != null) {

                        try {
                            isr.close();
                        } catch (final Exception e) {
                            logger.error(e);
                        }
                        isr = null;
                    }
                    if (br != null) {

                        try {
                            br.close();
                        } catch (final Exception e) {
                            logger.error(e);
                        }
                        br = null;
                    }

                }
            } else {
                logger.error("[" + filePath + "] file not exist.");
                return "";
            }
        }

    }

    public static boolean saveToFile(String filePath, String content) {
        if (filePath == null || filePath.trim().equals("")) {
            logger.error("unamed file path");
            return false;
        }
        if (content == null) {
            logger.error("not defined file content");
            return false;
        }
        boolean hasError = false;
        FileOutputStream fos = null;
        OutputStreamWriter osw = null;
        try {
            fos = new FileOutputStream(filePath);
            osw = new OutputStreamWriter(fos, "UTF-8");
            osw.write(content);
            osw.flush();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
            hasError = true;
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            hasError = true;
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
            hasError = true;
        } finally {
            if (osw != null) {
                try {
                    osw.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                osw = null;
            }

            if (fos != null) {
                try {
                    fos.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                fos = null;
            }
        }
        return !hasError;
    }
}
