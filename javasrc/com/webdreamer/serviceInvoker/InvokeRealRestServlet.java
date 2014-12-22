package com.webdreamer.serviceInvoker;

import org.apache.log4j.Logger;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.HttpURLConnection;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@WebServlet(name = "InvokeRealRestServlet", urlPatterns = "/rest/invokerealrest")
public class InvokeRealRestServlet extends HttpServlet {
    private static final Logger logger = Logger.getLogger(InvokeRealRestServlet.class);

    // parameter
    private static final String HTTP_METHOD = "httpMethod";
    private static final String PARAMETER_FORMAT = "parameterType";
    private static final String PARAMETERS = "parameters";
    private static final String REQUEST_URL = "url";
    private static final String RESPONSE_FORMAT = "outputType";

    //
    private static final String NET_CONFIGURATION_FILE = "WEB-INF/classes/proxy.json";

    public InvokeRealRestServlet() {
        super();
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        this.doPost(request, response);
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("utf-8");
        response.setCharacterEncoding("utf-8");

        String httpMethod = request.getParameter(HTTP_METHOD);
        String parameters = request.getParameter(PARAMETERS);
        String parameterFormat = request.getParameter(PARAMETER_FORMAT);
        String requestUrl = request.getParameter(REQUEST_URL);
        String responseFormat = request.getParameter(RESPONSE_FORMAT);

        if (!validateParameters(httpMethod, parameters, parameterFormat, requestUrl, responseFormat)) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "invalid parameters");
            return;
        }

        // add parameters to request url if request method is GET
        if (httpMethod.equalsIgnoreCase("GET") && !isStringEmpty(parameters)) {
            if (parameterFormat.equals("normal")) {
                int idx = requestUrl.lastIndexOf("/");
                idx = requestUrl.indexOf("?", idx);
                requestUrl += (idx == -1) ? "?" : "&";
                requestUrl += parameters;
            } else {
                if (!requestUrl.endsWith("/")) {
                    requestUrl += "/";
                }
                requestUrl += parameters;
            }
        }

        // set url connection
        NetConnectionConfiguration config = NetConnectionConfiguration.getConfiguration(this.getServletContext()
                .getRealPath("/") + File.separator + NET_CONFIGURATION_FILE);
        HttpURLConnection httpConn = (HttpURLConnection) NetConnection.getConnection(requestUrl, config);
        httpConn.setDefaultUseCaches(false);
        httpConn.setDoInput(true);
        httpConn.setDoOutput(true);
        httpConn.setUseCaches(false);
        httpConn.setRequestMethod(httpMethod);

        try {
            if (httpMethod.equalsIgnoreCase("POST") && !isStringEmpty(parameters)) {
                httpConn.addRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                OutputStream ostream = httpConn.getOutputStream();
                ostream.write(parameters.getBytes("utf-8"));
                ostream.flush();
                ostream.close();
            }

            // get response
            int statusCode = httpConn.getResponseCode();
            response.setStatus(statusCode);

            if (statusCode >= 200 && statusCode <= 206) {
                forwardResponse(httpConn, response, responseFormat);
            } else {
                String errorMsg = getErrorMessage(httpConn);
                response.setContentType(httpConn.getContentType());
                response.getWriter().print(errorMsg);
                response.getWriter().close();
                //echoError(response, HttpServletResponse.SC_BAD_REQUEST, errorMsg);
            }
            httpConn.disconnect();

        } catch (IOException ioe) {
            logger.debug("Service proxy error", ioe);
            echoError(response, HttpServletResponse.SC_BAD_GATEWAY, "");
        }
    }


    private void forwardResponse(HttpURLConnection httpConn, HttpServletResponse response, String responseFormat)
            throws IOException {

        response.setCharacterEncoding("utf-8");
        if (httpConn.getContentType() != null) {
            response.setContentType(httpConn.getContentType());
        } else {
            if (responseFormat.equals("json")) {
                response.setContentType("text/json;charset=utf-8");
            } else if (responseFormat.equals("xml")) {
                response.setContentType("text/xml;charset=utf-8");
            } else {
                response.setContentType("text/plain;charset=utf-8");
            }
        }

        // set original headers
        Map<String, List<String>> headerFields = httpConn.getHeaderFields();
        for (String key : headerFields.keySet()) {
            if (key == null) {
                continue;
            }
            List<String> values = headerFields.get(key);
            if (values == null) {
                continue;
            }
            String valueStr = "";
            for (String value : values) {
                valueStr += value + ", ";
            }
            if (valueStr.length() > 0) {
                valueStr = valueStr.substring(0, valueStr.length() - 2);
            }
            response.setHeader(key, valueStr);
        }

        InputStream istream = httpConn.getInputStream();
        OutputStream ostream = response.getOutputStream();
        byte[] buffer = new byte[1024];
        int length = 0;
        while ((length = istream.read(buffer)) > 0) {
            ostream.write(buffer, 0, length);
        }
        istream.close();
        ostream.flush();
        ostream.close();

        // String responseContent = getResponse(httpConn);
        // response.getWriter().print(responseContent);
        // response.getWriter().close();
    }

    private String getResponse(HttpURLConnection httpConn) throws IOException {
        InputStream istream = httpConn.getInputStream();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];

        int length = 0;
        while ((length = istream.read(buffer)) > 0) {
            output.write(buffer, 0, length);
        }
        istream.close();

        String encodeType = "UTF-8";
        String contentType = httpConn.getContentType();
        if (contentType != null) {
            Matcher matcher = Pattern.compile("charset\\s*=\\s*([\\w-]+)($|;|\\s)").matcher(contentType.toLowerCase());
            if (matcher.find())
                encodeType = matcher.group(1).toUpperCase();
        }
        String response = "";
        if (contentType != null && contentType.indexOf("image/") == 0) {
            response = (new sun.misc.BASE64Encoder()).encode(output.toByteArray());
        } else if (encodeType.equals("UTF-8")) {
            response = output.toString("UTF-8");
        } else {
            try {
                response = output.toString(encodeType);
            } catch (UnsupportedEncodingException e) {
                logger.warn("Unsupport decoding " + encodeType + " content, try to decode with UTF-8.");
                response = output.toString("UTF-8");
            }
        }
        output.flush();
        output.close();
        return response;
    }

    private String getErrorMessage(HttpURLConnection httpConn) throws IOException {
        InputStream istream = httpConn.getErrorStream();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];

        int length = 0;
        while ((length = istream.read(buffer)) > 0) {
            baos.write(buffer, 0, length);
        }
        istream.close();

        byte[] responseByte = baos.toByteArray();
        String contentType = httpConn.getContentType();
        String encoding = "utf-8";
        if (contentType != null) {
            int idx = contentType.indexOf("charset=");
            if (idx != -1) {
                encoding = contentType.substring(idx + 8);
            }
        }
        String errorMsg = new String(responseByte, encoding);
        return errorMsg;
    }

    private boolean validateParameters(String httpMethod, String parameters, String parameterFormat, String requestUrl,
                                       String responseFormat) {

        if (isStringEmpty(httpMethod)) {
            return false;
        }
        if (isStringEmpty(parameterFormat)) {
            return false;
        }
        if (isStringEmpty(requestUrl)) {
            return false;
        }
        if (isStringEmpty(responseFormat)) {
            return false;
        }

        if (!httpMethod.equalsIgnoreCase("GET") && !httpMethod.equalsIgnoreCase("POST")) {
            return false;
        }

        return true;
    }

    private boolean isStringEmpty(String str) {
        if (str == null || str.trim().equals("")) {
            return true;
        }
        return false;
    }

    private static void echoError(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("text/plain");
        response.getWriter().print(message);
        response.getWriter().close();
    }

}
