package com.webdreamer.servlets;

import java.io.File;
import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.webdreamer.Utils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.webdreamer.builder.HtmlGenerator;
import com.webdreamer.Constant;
import com.webdreamer.common.file.FileUtil;

@WebServlet(name = "ProjectServlet", urlPatterns = "/rest/project")
public class ProjectServlet extends BaseServlet {

    private static final Logger logger = Logger.getLogger(ProjectServlet.class);
    private static final String ACTION_SAVE = "save";
    private static final String ACTION_GET = "get";
    private static final String ACTION_GET_UI_MODEL = "getUiModel";
    private static final String ACTION_GET_FLOW_DATA = "getFlowData";
    public static final String[] EXCLUDE_USER_NAME = new String[]{ "tmpl", "CVS"};

    public ProjectServlet() {
        super();
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        this.doPost(request, response);
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");

        String userId = request.getParameter("userId");
        String projectName = request.getParameter("projectName");
        String action = request.getParameter("action");
        if (userId == null || projectName == null || action == null) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "Parameter error.");
            return;
        }
        else if(Utils.inArray(EXCLUDE_USER_NAME, userId)){
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "Parameter 'userId' error.");
            return;
        }

        try {
            if (action.equals(ACTION_SAVE)) {
                saveProject(request, response, userId, projectName);
            } else if (action.equals(ACTION_GET_UI_MODEL)) {
                getUiModel(request, response, userId, projectName);
            } else if (action.equals(ACTION_GET_FLOW_DATA)) {
                getFlowData(request, response, userId, projectName);
            } else {
                echoError(response, HttpServletResponse.SC_BAD_REQUEST);
            }
        } catch (JSONException e) {
            logger.error("Json error", e);
            echoError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }

    }

    private void saveProject(HttpServletRequest request, HttpServletResponse response, String userId, String projectName)
            throws IOException, JSONException {
        String ui = request.getParameter("ui");
        if (ui == null) {
            echoError(response, HttpServletResponse.SC_BAD_REQUEST, "Parameter error.");
            return;
        }
        String projectPath = getProjectPath(userId, projectName);
        if (!FileUtil.exists(projectPath))
            FileUtil.makeDir(projectPath);
        String projectFilePath = projectPath + File.separator + Constant.UI_FILE_NAME;
        boolean success = FileUtil.saveToFile(projectFilePath, ui);
        if (!success) {
            echoError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Save project file error.");
            return;
        }
        String flow = request.getParameter("flow");
        if (flow != null) {
            String flowFilePath = projectPath + File.separator + Constant.FLOW_FILE_NAME;
            success = FileUtil.saveToFile(flowFilePath, flow);
            if (!success) {
                echoError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Save project file error.");
                return;
            }
        }
        String flowUiThumbs = request.getParameter("uiThumbs");
        if (flowUiThumbs != null) {
            String thumbFilePath = projectPath + File.separator + Constant.FLOW_HTML_THUMB_FILE_NAME;
            success = FileUtil.saveToFile(thumbFilePath, flowUiThumbs);
            if (!success) {
                logger.warn("Can't write flow ui thumb data to file : " + thumbFilePath);
            }
        }
        boolean generateCodeResult = true;
        HtmlGenerator htmlGenerator = new HtmlGenerator();
        String rootPath = getRootPath();
        if (!htmlGenerator.generate(userId, projectName, rootPath, true,null)) {
            logger.warn("App code generator failed, project: "  + projectName);
            generateCodeResult = false;
        }
        JSONObject result = new JSONObject();
        result.put("result", generateCodeResult);
        outputJsonResult(response, result);
    }

    private void getUiModel(HttpServletRequest request, HttpServletResponse response, String userId, String projectName)
            throws IOException {
        String projectPath = getProjectPath(userId, projectName);
        if (!FileUtil.exists(projectPath)) {
            echoError(response, HttpServletResponse.SC_NOT_FOUND, "Project not found.");
            return;
        }
        String projectFilePath = projectPath + File.separator + Constant.UI_FILE_NAME;
        if (!FileUtil.exists(projectFilePath)) {
            FileUtil.deleteFile(projectPath + File.separator + Constant.FLOW_FILE_NAME);
            FileUtil.deleteFile(projectPath + File.separator + Constant.FLOW_HTML_THUMB_FILE_NAME);
            // return empty result
            outputJsonResult(response, "null");
            return;
        }
        String str = FileUtil.readFile(projectFilePath);
        if (str == null || str.isEmpty()) {
            echoError(response, HttpServletResponse.SC_NOT_FOUND, "Read project error.");
            return;
        }
        outputJsonResult(response, str);
    }

    private void getFlowData(HttpServletRequest request, HttpServletResponse response, String userId, String projectName)
            throws IOException, JSONException {

        String projectPath = getProjectPath(userId, projectName);
        if (!FileUtil.exists(projectPath)) {
            echoError(response, HttpServletResponse.SC_NOT_FOUND, "Project not found.");
            return;
        }

        JSONObject result = null;
        String flowFilePath = projectPath + File.separator + Constant.FLOW_FILE_NAME;
        String thumbFilePath = projectPath + File.separator + Constant.FLOW_HTML_THUMB_FILE_NAME;
        boolean isFlowDataEmpty = false;
        if (!FileUtil.exists(flowFilePath)) {
            FileUtil.deleteFile(thumbFilePath);
            isFlowDataEmpty = true;
        } else {
            String flows = FileUtil.readFile(flowFilePath);
            try {
                result = new JSONObject(flows);
            } catch (JSONException e) {
                logger.warn("Invalid json string: " + flows + "\n\t in file  " + flowFilePath, e);
            }
            if (flows == null || result == null) {
                FileUtil.deleteFile(flowFilePath);
                FileUtil.deleteFile(thumbFilePath);
                isFlowDataEmpty = true;
            } else {
                if (!FileUtil.exists(thumbFilePath)) {
                    result.put("uiThumbs", JSONObject.NULL);
                } else {
                    String thumbs = FileUtil.readFile(thumbFilePath);
                    JSONObject thumbObj = null;
                    try {
                        thumbObj = new JSONObject(thumbs);
                    } catch (JSONException e) {
                        logger.warn("Invalid json string: " + thumbs + "\n\t in file  " + thumbFilePath, e);
                    }
                    result.put("uiThumbs", thumbObj);
                }
            }
        }

        if (isFlowDataEmpty) {
            JSONObject emptyResult = new JSONObject();
            emptyResult.put("pages", new JSONArray());
            emptyResult.put("flows", new JSONArray());
            emptyResult.put("apiMetas", new JSONArray());
            emptyResult.put("assets", new JSONObject());
            emptyResult.put("uiThumbs", JSONObject.NULL);
            outputJsonResult(response, emptyResult);
        } else
            outputJsonResult(response, result);

    }

}
