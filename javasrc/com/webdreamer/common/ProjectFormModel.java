package com.webdreamer.common;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.webdreamer.Constant;
import com.webdreamer.builder.HtmlGenerator;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.webdreamer.common.file.FileUtil;

public class ProjectFormModel {
    /**
     * user name
     */
    private String user;
    /**
     * project name
     */
    private String project;
    /**
     * project total page number
     */
    private int pageNumber;
    /**
     * control bean
     */
    private List<ControlBean> controlBeanList;
    /**
     * js referred
     */
    private List<String> jsList;
    /**
     * css referred
     */
    private List<String> cssList;

    private List<String> controlBaseJs;
    private List<String> controlBaseCss;

    private List<String> commonJs;
    private List<String> commonCss;
    private HashMap<String, String> jsLibPaths;

    private String[] usedServices = new String[] {};

    public String[] getUsedServices() {
        return usedServices;
    }

    public void setUsedServices(String[] usedServices) {
        this.usedServices = usedServices;
    }

    /**
     * UI.Control metadata list that is used or is depended by other UI.Control in topological
     * sequence
     */
    private List<ControlMetadata> usedControlMetadataList;

    /**
     * service list
     */
    private List<String> serviceList;

    private ProjectFormModel(String user, String project) {
        this.user = user;
        this.project = project;
    }

    public String getUser() {
        return user;
    }

    public String getProjec() {
        return project;
    }

    public int getPageNumber() {
        return pageNumber;
    }

    public List<ControlBean> getControlBeanList() {
        return controlBeanList;
    }

    public List<String> getJs() {
        return jsList;
    }

    public List<String> getCss() {
        return cssList;
    }

    public List<ControlMetadata> getUsedControlMetadataList() {
        return usedControlMetadataList;
    }

    public static ProjectFormModel generateProjectFormModel(String user, String project, String rootPath) {
        ProjectFormModel model = new ProjectFormModel(user, project);

        String controlsMetadataPath = rootPath + Constant.WEB_DREAMER_CONTROLS_MEATADATA_PATH;
        String commonJsCssFilePath = rootPath + Constant.WEB_DREAMER_COMMON_JS_CSS_FILE_PATH;
        String projectPath = rootPath + "data" + File.separator + user + File.separator + project + File.separator;
        String projectControlBeanPath = projectPath + Constant.UI_FILE_NAME;

        // real control bean is use
        boolean ret = model.parseControlBeanList(projectControlBeanPath);
        if (!ret) {
            return null;
        }

        // control metadata
        ret = model.parseControlsMetadata(controlsMetadataPath);
        if (!ret) {
            return null;
        }

        // common js and css
        ret = model.parseCommonJsCssFile(commonJsCssFilePath);
        if (!ret) {
            return null;
        }

        model.assembleJsAndCss();

        return model;
    }

    private boolean parseControlBeanList(String projectControlBeanPath) {
        String controlBeansStr = FileUtil.readFile(projectControlBeanPath);
        JSONObject controlBeanJson;
        try {
            controlBeanJson = new JSONObject(controlBeansStr);
            this.pageNumber = controlBeanJson.getInt("pageNumber");
            this.controlBeanList = generateControlBeanList(controlBeanJson.getJSONArray("beans"));
        } catch (JSONException e) {
            LOG.error("parseControlBeanList error", e );
            return false;
        }
        return true;
    }

    private boolean parseControlsMetadata(String controlsMetadataPath) {
        String controlsMetadataStr = FileUtil.readFile(controlsMetadataPath);
        try {
            JSONObject controlsMetadata = new JSONObject(controlsMetadataStr);

            // control base part, including js or css all control should depend on
            JSONObject controlBase = controlsMetadata.getJSONObject("controlBase");
            this.controlBaseJs = new ArrayList<String>();
            JSONArray controlBaseJsArray = controlBase.getJSONObject("runtime").getJSONArray("js");
            for (int i = 0; i < controlBaseJsArray.length(); i++) {
                controlBaseJs.add(controlBaseJsArray.getString(i));
            }
            this.controlBaseCss = new ArrayList<String>();
            if (controlBase.getJSONObject("runtime").has("css")) {
                JSONArray controlBaseCssArray = controlBase.getJSONObject("runtime").getJSONArray("css");
                for (int i = 0; i < controlBaseCssArray.length(); i++) {
                    controlBaseCss.add(controlBaseCssArray.getString(i) );
                }
            }

            // control metadata part, including js or css and other controls that a control should
            // depend on
            JSONArray categories = controlsMetadata.getJSONArray("categories");
            JSONArray controlMetadata = new JSONArray();
            for (int i = 0; i < categories.length(); i++) {
                JSONArray controls = categories.getJSONObject(i).getJSONArray("controls");
                for (int j = 0; j < controls.length(); j++) {
                    controlMetadata.put(controls.getJSONObject(j));
                }
            }
            Map<String, ControlMetadata> controlMetadataMap = generateControlMetadataMap(controlMetadata);
            Set<String> controlBeanNameSet = new HashSet<String>();
            for (ControlBean controlBean : this.controlBeanList) {
                controlBeanNameSet.add(controlBean.type);
            }
            this.usedControlMetadataList = generateControlMetadataList(controlMetadataMap, controlBeanNameSet);
        } catch (JSONException e) {
            return false;
        }
        return true;
    }

    private boolean parseCommonJsCssFile(String commonJsCssFilePath) {
        String commonJsCssStr = FileUtil.readFile(commonJsCssFilePath);
        JSONObject root;
        try {
            root = new JSONObject(commonJsCssStr);

            this.commonCss = new ArrayList<String>();
            if (root.has("css")) {
                JSONArray cssArray = root.getJSONArray("css");
                for (int i = 0; i < cssArray.length(); i++) {
                    this.commonCss.add(cssArray.getString(i));
                }
            }

            this.commonJs = new ArrayList<String>();
            if (root.has("js")) {
                JSONArray jsArray = root.getJSONArray("js");
                for (int i = 0; i < jsArray.length(); i++) {
                    this.commonJs.add(jsArray.getString(i));
                }
            }
            this.jsLibPaths = new HashMap<String, String>();
            JSONObject libs = root.optJSONObject("libs");
            if (libs != null) {
                Iterator iterator = libs.keys();
                while (iterator.hasNext()) {
                    String key = (String) iterator.next();
                    this.jsLibPaths.put(key, libs.getString(key));
                }
            }
        } catch (JSONException e) {
            LOG.error("parseCommonJsCssFile error", e);
            return false;
        }
        return true;
    }

    private void assembleJsAndCss() {
        this.jsList = new ArrayList<String>();
        this.jsList.addAll(this.commonJs);
        this.jsList.addAll(this.controlBaseJs);
        this.cssList = new ArrayList<String>();
        this.cssList.addAll(this.commonCss);
        this.cssList.addAll(this.controlBaseCss);

        for (ControlMetadata controlMetadata : this.usedControlMetadataList) {
            this.jsList.addAll(controlMetadata.runtimeJs);
            this.cssList.addAll(controlMetadata.css);
        }
    }

    /**
     * generate control bean list and resort
     * 
     * @throws JSONException
     */
    private List<ControlBean> generateControlBeanList(JSONArray beansJson) throws JSONException {
        List<ControlBean> beans = new ArrayList<ControlBean>();

        for (int i = 0; i < beansJson.length(); i++) {
            JSONObject beanJson = beansJson.getJSONObject(i);

            String id = beanJson.getString("id");
            String type = beanJson.getString("type");
            int pageNo = beanJson.getInt("pageNo");
            int pIndex = beanJson.getInt("pIndex");
            String parentId = beanJson.getString("parentId");
            JSONObject propertyArray = beanJson.getJSONObject("props");
            Map<String, Object> properties = new HashMap<String, Object>();
            Iterator<String> iter = propertyArray.keys();
            while (iter.hasNext()) {
                String key = iter.next();
                properties.put(key, propertyArray.get(key));
            }

            ControlBean bean = new ControlBean(id, type, pageNo, pIndex, parentId, properties);
            beans.add(bean);
        }

        // sort the bean by pageNo and pIndex
        Comparator<ControlBean> beanComparator = new Comparator<ControlBean>() {
            @Override
            public int compare(ControlBean o1, ControlBean o2) {
                if (o1.pageNo == o2.pageNo) {
                    return o1.pIndex - o2.pIndex;
                } else {
                    return o1.pageNo - o2.pageNo;
                }
            }
        };
        Collections.sort(beans, beanComparator);

        return beans;
    }

    /**
     * generate control bean map
     * 
     * @throws JSONException
     */
    private Map<String, ControlMetadata> generateControlMetadataMap(JSONArray controlsMetadata) throws JSONException {
        Map<String, ControlMetadata> beanMap = new HashMap<String, ControlMetadata>();

        int size = controlsMetadata.length();
        for (int i = 0; i < size; i++) {
            JSONObject control = controlsMetadata.getJSONObject(i);
            String name = control.getString("name");
            List<String> runtimeJs = new ArrayList<String>();
            List<String> css = new ArrayList<String>();
            List<String> dependControls = new ArrayList<String>();

            String dir = "controls/" + control.getString("dir");
            JSONObject runtime = control.getJSONObject("runtime");
            JSONArray runtimeJsArray = runtime.getJSONArray("js");
            for (int j = 0; j < runtimeJsArray.length(); j++) {
                runtimeJs.add(dir + "/" + runtimeJsArray.getString(j));
            }

            if (runtime.has("css")) {
                JSONArray cssArray = runtime.getJSONArray("css");
                for (int j = 0; j < cssArray.length(); j++) {
                    css.add(dir + "/" + cssArray.getString(j));
                }
            }
            if (control.has("dependControl")) {
                JSONArray dependControlArray = control.getJSONArray("dependControl");
                for (int j = 0; j < dependControlArray.length(); j++) {
                    dependControls.add(dependControlArray.getString(j));
                }
            }
            ControlMetadata controlBean = new ControlMetadata(name, runtimeJs, css, dependControls,
                    control.getString("dir"));
            beanMap.put(name, controlBean);
        }

        return beanMap;
    }

    /**
     * resort the control bean according to its dependency and filter controls that is not used.
     * 
     * @param {beanMap}
     * @return
     */
    private List<ControlMetadata> generateControlMetadataList(Map<String, ControlMetadata> controlMetadataMap,
            Set<String> controlBeanNameSet) {
        List<ControlMetadata> controlMetadataList = new ArrayList<ControlMetadata>();

        // topologically sort
        List<ControlMetadata> set = new ArrayList<ControlMetadata>();
        Set<String> dependedSet = new HashSet<String>();
        for (String name : controlMetadataMap.keySet()) {
            ControlMetadata bean = controlMetadataMap.get(name);
            if (bean.dependControls.size() == 0) {
                set.add(bean);
            }
        }

        while (set.size() != 0) {
            ControlMetadata bean = set.remove(0);
            controlMetadataList.add(bean);

            for (String name : controlMetadataMap.keySet()) {
                ControlMetadata b = controlMetadataMap.get(name);
                if (b.dependControls.contains(bean.name)) {
                    dependedSet.add(bean.name);
                    b.dependControls.remove(bean.name);
                    if (b.dependControls.size() == 0) {
                        set.add(b);
                    }
                }
            }
        }

        List<ControlMetadata> controlMetadataListTmp = new ArrayList<ControlMetadata>();
        for (ControlMetadata controlMetadata : controlMetadataList) {
            if (dependedSet.contains(controlMetadata.name) || controlBeanNameSet.contains(controlMetadata.name)) {
                controlMetadataListTmp.add(controlMetadata);
            }
        }

        return controlMetadataListTmp;
    }

    public HashMap<String, String> getJsLibPaths() {
        return jsLibPaths;
    }

    private static final Logger LOG = Logger.getLogger(ProjectFormModel.class);

}
