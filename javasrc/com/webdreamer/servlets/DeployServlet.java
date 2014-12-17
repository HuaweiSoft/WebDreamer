/*******************************************************************************
 *     Web Dreamer
 *     Copyright (c) Huawei Technologies Co., Ltd. 1998-2014. All Rights Reserved.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *          http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *******************************************************************************/
package com.webdreamer.servlets;

import com.webdreamer.deploy.PublishAppToCfUtil;
import org.apache.log4j.Logger;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;

@WebServlet(name = "DeployServlet", urlPatterns = "/rest/deploy")
public class DeployServlet extends BaseServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger(ProjectServlet.class);
    private static final String EXPORT_AS_WAR = "exportAsWar";
    private static final String PUBLISH_CF_RUNTIME = "publishToCf";
    private static final String PUBLISH_CF_RUNTIME_GET_STATUS = "queryStatus";
    private static final String PUBLISH_CF_RUNTIME_CLEAR_UUID = "clear";

    public DeployServlet() {
        super();
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        this.doPost(request, response);
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");

        try {
            if (action.equals(EXPORT_AS_WAR)) {
                outputJsonResult(response, exportAsWar(request, response));
            } else if (action.equals(PUBLISH_CF_RUNTIME)) {
                outputJsonResult(response, publishToCF(request, response));
            } else if (action.equals(PUBLISH_CF_RUNTIME_CLEAR_UUID)) {
                PublishAppToCfUtil.clearMsg(request.getParameter("uuid"));
            } else if (action.equals(PUBLISH_CF_RUNTIME_GET_STATUS)) {
                String uuid = request.getParameter("uuid");
                outputJsonResult(response, PublishAppToCfUtil.getMsg(uuid));
            } else {
                echoError(response, HttpServletResponse.SC_BAD_REQUEST);
            }
        } catch (Exception e) {
            logger.error(e);
            echoError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }

    }

    private String publishToCF(HttpServletRequest request, HttpServletResponse response) {
        final String userName = request.getParameter("userName");
        final String projectName = request.getParameter("project");
        final String uuid = request.getParameter("uuid");
        final String proxy = request.getParameter("proxy");
        final String appName = request.getParameter("appName");
        final String appURL = request.getParameter("accessURL");
        final String cfUserName = request.getParameter("cfUserName");
        final String cfUserPassword = request.getParameter("cfPassword");
        final String cfSpace = request.getParameter("space");
        final String cfURL = request.getParameter("cfurl");
        final String memory = request.getParameter("memory");
        final String disk = request.getParameter("disk");
        final String rootPath = this.getRootPath();
        String result = "";

        if (userName == null || userName.trim().equals("") || projectName.trim() == null
                || projectName.trim().equals("") || appName == null || appName.equals("") || appURL == null
                || appURL.equals("") || cfSpace == null || cfSpace.trim().equals("") || cfURL == null
                || cfURL.trim().equals("") || uuid == null || uuid.trim().equals("")) {
            result = "{\"status\":\"error\",\"detail\":\"parameters error\"}";
        } else {
            try {

                PublishAppToCfUtil.putMsg(uuid, "Start...");
                Thread t = new Thread(new Runnable() {
                    public void run() {
                        boolean makeWar = PublishAppToCfUtil
                                .makeWar(rootPath, userName, projectName, uuid, proxy, true);
                        if (makeWar) {
                            PublishAppToCfUtil.putMsg(uuid, "Making war has finished.");
                            String warPath = getRootPath() + File.separator + "data" + File.separator + userName
                                    + File.separator + projectName + ".war";
                            PublishAppToCfUtil.deploy(warPath, uuid, cfUserName, cfUserPassword, cfURL, cfSpace,
                                    appURL, appName);
                        }
                    }
                });
                t.start();
                result = "{\"status\":\"start\"}";

            } catch (Exception e) {
                logger.error(e);
                result = "{\"status\":\"error\",\"detail\":\"make war error\"}";
            }

        }

        return result;

    }

    private JSONObject exportAsWar(HttpServletRequest request, HttpServletResponse response) {
        String userName = request.getParameter("userName");
        String projectName = request.getParameter("project");
        String uuid = request.getParameter("uuid");
        String proxy = request.getParameter("proxy");
        boolean result = PublishAppToCfUtil.makeWar(this.getRootPath(), userName, projectName, uuid, proxy, false);
        JSONObject obj = new JSONObject();
        try {
            obj.put("result", result);
            obj.put("war", "/data/" + userName + "/" + projectName + ".war");
        } catch (Exception e) {
            logger.error(e);
        }
        return obj;
    }

}
