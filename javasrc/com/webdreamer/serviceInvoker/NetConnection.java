package com.webdreamer.serviceInvoker;

import java.io.IOException;
import java.net.Authenticator;
import java.net.InetSocketAddress;
import java.net.MalformedURLException;
import java.net.PasswordAuthentication;
import java.net.Proxy;
import java.net.URL;
import java.net.URLConnection;

import com.webdreamer.Utils;
import org.apache.log4j.Logger;

public class NetConnection {
    private static final Logger logger = Logger.getLogger(NetConnection.class);

    public static URLConnection getConnection(String urlStr, NetConnectionConfiguration config) {
        URL url;
        try {
            url = new URL(urlStr);
            return getConnection(url, config);
        } catch (MalformedURLException e) {
            logger.error("parse url failed:" + urlStr);
            return null;
        }
    }

    public static URLConnection getConnection(URL url, final NetConnectionConfiguration config) {
        URLConnection conn = null;
        try {
            if (config == null || !config.getproxyEnable() || isCovered(url.getHost(), config.getNonProxyHost(), ",")) {
                conn = url.openConnection();
            } else {
                if (!Utils.isNullOrTrimEmpty(config.getProxyUsername())) {
                    Authenticator.setDefault(new Authenticator() {
                        protected PasswordAuthentication getPasswordAuthentication() {
                            return new PasswordAuthentication(config.getProxyUsername(), config.getProxyPassword().toCharArray());
                        }
                    });
                }else
                    Authenticator.setDefault(null);

                Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(config.getProxyHost(), config.getProxyPort()));
                conn = url.openConnection(proxy);
            }
            return conn;

        } catch (IOException e) {
            logger.error("open connection failed: " + e.toString());
            return null;
        }
    }

    /**
     * is host covered by the proxies
     *
     * @param host
     * @param proxyStr
     * @param delimieter
     * @return
     */
    private static boolean isCovered(String host, String proxyStr, String delimieter) {
        if (proxyStr == null || proxyStr.trim().equals("")) {
            return false;
        }

        String[] proxies = proxyStr.split(delimieter);
        for (int i = 0; i < proxies.length; i++) {
            String proxy = proxies[i].trim();
            if (proxy.length() == 0) {
                continue;
            }

            if (proxy.equals("*") || proxy.equals("*.*") || proxy.equals(host)) {
                return true;
            }

            if (proxy.endsWith(".*") && host.startsWith(proxy.substring(0, proxy.length() - 1))) {
                return true;
            }
            if (proxy.endsWith(".") && host.startsWith(proxy.substring(0, proxy.length()))) {
                return true;
            }
            if (proxy.startsWith("*.") && host.endsWith(proxy.substring(1))) {
                return true;
            }
            if (proxy.startsWith(".") && host.endsWith(proxy)) {
                return true;
            }
        }

        return false;
    }
}
