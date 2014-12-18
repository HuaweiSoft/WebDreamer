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
package com.webdreamer.builder;

import java.io.File;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import com.webdreamer.Utils;
import com.webdreamer.Constant;
import com.webdreamer.common.ControlBean;
import com.webdreamer.common.ProjectFormModel;
import org.apache.log4j.Logger;

import com.webdreamer.common.file.FileUtil;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class HtmlGenerator {
    private static final Logger LOG = Logger.getLogger(HtmlGenerator.class);

    private static final String INTENT = "\t";

    private ProjectFormModel projectFormModel;

    private FlowCodeGenerator flowCodeGenerator;

    public HtmlGenerator() {
    }

    public ProjectFormModel getProjectFormModel() {
        return projectFormModel;
    }

    /**
     * generate html code, including js & css references, body base structure and js code that
     * render the body.
     * 
     * @param {String} user name
     * @param {String} project name
     * @param {String} root path
     * @param {boolean} is preview mode on or not
     * 
     * @returns {boolean} generate successfully or not
     */
    public boolean generate(String user, String project, String rootPath, boolean previewMode, String saveDir) {
        this.projectFormModel = ProjectFormModel.generateProjectFormModel(user, project, rootPath);
        String projectPath = rootPath + "data" + File.separator + user + File.separator + project + File.separator;
        if (previewMode && (saveDir == null || saveDir.equals(""))) {
            saveDir = projectPath;
        }

        if (projectFormModel == null) {
            return false;
        }
        String flowFilePath = rootPath + "data" + File.separator + user + File.separator + project + File.separator
                + Constant.FLOW_FILE_NAME;
        if (!FileUtil.exists(flowFilePath)) {
            flowCodeGenerator = null;
        } else {
            String flowContent = FileUtil.readFile(flowFilePath);
            if (flowContent != null && !flowContent.isEmpty()) {
                try {
                    flowCodeGenerator = new FlowCodeGenerator(flowContent);
                    this.projectFormModel.setUsedServices(JSONObject.getNames(flowCodeGenerator.getApiMetas()));
                } catch (JSONException e) {
                    LOG.error("Invalid flow model data as json format: \n\t" + flowContent);
                    flowCodeGenerator = null;
                }
            } else {
                flowCodeGenerator = null;
            }
        }

        String html = "";
        String htmlTemplatePath = rootPath + Constant.WEB_DREAMER_HTML_TEMPLATE_PATH;
        String renderJsTmplPath = rootPath + Constant.WEB_DREAMER_RENDER_JS_TEMPLATE_PATH;
        // get html template
        String htmlTmpl = FileUtil.readFile(htmlTemplatePath);
        if (htmlTmpl == null || htmlTmpl.trim().equals("")) {
            LOG.error("missing html template file：[" + htmlTemplatePath + "]");
            return false;
        }
        // set basic page structure
        String pageDiv = generatePageDiv(projectFormModel.getPageNumber());

        // generate js code to render all controls
        String renderJsPath = saveDir + File.separator + project + ".js";
        generateJsCode(projectFormModel.getControlBeanList(), renderJsTmplPath, renderJsPath);

        String baseUrl = previewMode ? "../../../" : "";

        // get css file references
        String cssReferences = generateCssReferences(projectFormModel.getCss(), baseUrl);

        // get js file references
        String jsReferences = generateJsReferences(projectFormModel.getJs(), baseUrl);

        htmlTmpl = htmlTmpl.replace("${PROJECTTITLE}", projectFormModel.getProjec());
        htmlTmpl = htmlTmpl.replace("${JSFILES}", jsReferences);
        htmlTmpl = htmlTmpl.replace("${CSSFILES}", cssReferences);
        htmlTmpl = htmlTmpl.replace("${PAGEDIV}", pageDiv);
        htmlTmpl = htmlTmpl.replace("${RENDERJSFILEPATH}", project + ".js?" + System.currentTimeMillis());
        htmlTmpl = htmlTmpl.replace("${SERVICEINVOKEURL}", baseUrl);

        html = htmlTmpl;
        // save to project directory
        return FileUtil.saveToFile(saveDir + File.separator + project + ".html", html);
    }

    /**
     * generate css file references
     * 
     * @return {String} html css reference statement
     */
    private String generateCssReferences(List<String> cssList, String baseUrl) {
        String ret = "";

        for (String css : cssList) {
            ret += "<link rel=\"stylesheet\" type=\"text/css\" href=\"" + baseUrl + css + "\" >\n";
        }

        return ret;
    }

    /**
     * generate js file references
     * 
     * @return {String} html js reference statement
     */
    private String generateJsReferences(List<String> jsList, String baseUrl) {
        String ret = "";

        for (int i = 0; i < jsList.size(); i++) {
            String jsPath = jsList.get(i);
            if (jsPath.indexOf("http://") == 0 || jsPath.indexOf("https://") == 0)
            ret += "<script type=\"text/javascript\" src=\"" +  jsPath + "\"></script>\n";
            else
            ret += "<script type=\"text/javascript\" src=\"" + baseUrl + jsPath + "\"></script>\n";
        }
        HashMap<String, Boolean> contained = new HashMap<String, Boolean>();
        if (flowCodeGenerator != null && flowCodeGenerator.getApiMetas() != null) {
            JSONObject apiMetas = flowCodeGenerator.getApiMetas();
            Iterator iterator = apiMetas.keys();
            while (iterator.hasNext()) {
                String apiName = (String) iterator.next();
                JSONObject meta = apiMetas.optJSONObject(apiName);
                if (meta == null)
                    continue;
                String dir = meta.optString("name");
                String jsFileName = meta.optString("jsFileName");
                JSONArray dependJS = meta.optJSONArray("dependJS");
                if (Utils.isNullOrTrimEmpty(dir))
                    continue;
                if (Utils.isNullOrTrimEmpty(jsFileName))
                    jsFileName = apiName + ".js";
                String jsPath = baseUrl + "services/" + dir + "/" + jsFileName;
                if (contained.containsKey(jsPath))
                    continue;
                // System.out.println(dependJS.toString());

                if (dependJS != null && dependJS.length() > 0 && projectFormModel.getJsLibPaths() != null) {
                    HashMap<String, String> libs = projectFormModel.getJsLibPaths();
                    for (int i = 0; i < dependJS.length(); i++) {
                        String libName = dependJS.optString(i);
                        System.out.println(libName);
                        if (Utils.isNullOrTrimEmpty(libName) || !libs.containsKey(libName))
                            continue;
                        String libPath = baseUrl + libs.get(libName);
                        System.out.println(libPath);

                        if (!ret.contains(libPath))
                            ret += "<script type=\"text/javascript\" src=\"" + libPath + "\"></script>\n";
                    }
                }
                ret += "<script type=\"text/javascript\" src=\"" + jsPath + "\"></script>\n";
                contained.put(jsPath, true);
            }
        }
        return ret;
    }

    /**
     * generate page structure
     */
    private String generatePageDiv(int pageNumber) {
        String pageDiv = "";

        for (int i = 1; i <= pageNumber; i++) {
            pageDiv += "<div id=\"PAGE" + i + "\" data-role=\"page\"></div>\n";
        }

        return pageDiv;
    }

    /**
     * generate js code to generate ui.controls and write it to file.
     * 
     * @param beans
     */
    private void generateJsCode(List<ControlBean> beans, String renderJsTmplPath, String jsFilePath) {
        String jsCode = "";
        jsCode = FileUtil.readFile(renderJsTmplPath);

        String code = "";
        for (int i = 0; i < beans.size(); i++) {
            ControlBean bean = beans.get(i);

            String control = "control" + i;
            String render = "var " + control + " = new " + bean.type + "();\n"; // new one
            render += control + ".id = \"" + bean.id + "\";\n"; // set id
            render += control + ".pageNo = " + bean.pageNo + ";\n"; // set page no
            render += control + ".setContainer(\"PAGE" + bean.pageNo + "\");\n"; // set container
            render += control + ".render();\n"; // render

            String[] styleArray = { "position", "left", "top", "zIndex", "width", "height", "textAlign", "visibility" };
            JSONObject styleJsonObj = new JSONObject();
            for (String style : styleArray) {
                // some style name is different between control and control designer
                // here just adjust it in hard-code way
                String styleKey = style;

                if (style.equals("textAlign")) {
                    styleKey = "align";
                }
                Object styleValue = bean.properties.get(styleKey);
                if (styleValue != null) {
                    try {
                        styleJsonObj.put(style, styleValue);
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }
            }
            render += control + ".setStyle(" + styleJsonObj.toString() + ");\n"; // set style about properties

            for (String key : bean.properties.keySet()) {
                if (Utils.inArray( styleArray, key) ||  key.equals("align")) {
                    continue;
                }

                String value = bean.properties.get(key).toString().replaceAll("\"", "\\\\\"");

                render += control + "." + key + " = \"" + value + "\";\n";
            }
            render += "controls[" + i + "] = " + control + ";\n";
            render += "i++;\n";

            code += render + "\n";

        }
        code += "\n";
        code = Utils.insertBeforeEachLine(code, INTENT);
        jsCode = jsCode.replace("${CONTROLS_RENDER}", code);

        // insert event binder code
        String flowCode = null;
        if (flowCodeGenerator != null) {
            try {
                flowCode = flowCodeGenerator.compile();
            } catch (JSONException e) {
                LOG.error("Generate flow code error", e);
            }
        }
        if (flowCode != null) {
            jsCode = jsCode.replace("${EVENT_BINDER}", flowCode);
            jsCode = jsCode.replace("${CALL_EVENT_BINDER}", flowCodeGenerator.getBindFunctionName() + "();");

        } else {
            jsCode = jsCode.replace("${EVENT_BINDER}", "");
            jsCode = jsCode.replace("${CALL_EVENT_BINDER}", "");
        }

        FileUtil.saveToFile(jsFilePath, jsCode);
    }
}