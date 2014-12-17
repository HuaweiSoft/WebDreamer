package com.webdreamer.builder;

import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import java.util.ArrayList;
import java.util.Iterator;

public class FlowHelper {

    public static final String TYPE_ROOT = "ROOT";
    public static final String TYPE_USER_ANCHOR = "USER_ANCHOR";
    public static final String TYPE_APP_ANCHOR = "APP_ANCHOR";
    public static final String TYPE_UI = "UI";
    public static final String TYPE_EVENT = "EVENT";
    public static final String TYPE_METHOD = "METHOD";
    public static final String TYPE_API = "API";
    public static final String TYPE_INPUT = "INPUT";
    public static final String TYPE_OUTPUT = "OUTPUT";
    public static final String TYPE_PARAM = "PARAM";
    public static final String TYPE_RESULT_UI = "RESULT_UI";
    public static final String TYPE_PAGE = "PAGE";

    public static final String REGION_USER = "USER";
    public static final String REGION_APP = "APP";

    public static final String  MAPPING_TYPE_PROPERTY = "PROPERTY";
    public static final String MAPPING_TYPE_DATA = "DATA";
    public static final String MAPPING_TYPE_SINGLE = "SINGLE";

    private static final Logger logger = Logger.getLogger(FlowHelper.class);

    private static JSONObject[] toEmptyArray() {
        return new JSONObject[0];
    }

    public static JSONObject getRootUnit(JSONObject tree) {
        Iterator iterator = tree.keys();
        while (iterator.hasNext()) {
            JSONObject node = tree.optJSONObject((String) iterator.next());
            if (node == null)
                continue;
            String parentId = node.optString("parent", "");
            int depth = node.optInt("depth", 0);
            if (parentId.isEmpty() && depth == 1)
                return node.optJSONObject("obj");
        }
        return null;
    }

    public static JSONObject getAppAnchorUnit(JSONObject tree) {
        Iterator iterator = tree.keys();
        while (iterator.hasNext()) {
            JSONObject node = tree.optJSONObject((String) iterator.next());
            if (node == null)
                continue;
            int depth = node.optInt("depth", 0);
            if (depth == 2) {
                JSONObject unit = null;
                try {
                    unit = node.getJSONObject("obj");
                    String type = unit.getString("type");
                    if (TYPE_APP_ANCHOR.equalsIgnoreCase(type))
                        return unit;
                } catch (JSONException e) {
                    logger.error("Invalid flow node data: \n\t" + node.toString(), e);
                }
            }
        }
        return null;
    }

    public static JSONObject[] getAll3rdUiUnits(JSONObject tree) {
        ArrayList<JSONObject> list = new ArrayList<JSONObject>();
        Iterator iterator = tree.keys();
        while (iterator.hasNext()) {
            String key = (String) iterator.next();
            JSONObject node = tree.optJSONObject(key);
            if (node == null)
                continue;
            try {
                JSONObject unit = node.getJSONObject("obj");
                String type = unit.getString("type");
                int depth = unit.getInt("depth");
                String region = unit.getString("region");
                if (TYPE_UI.equalsIgnoreCase(type) && depth == 3 && REGION_USER.equalsIgnoreCase(region)) {
                    list.add(unit);
                }
            } catch (JSONException e) {
                logger.error("Invalid flow node data: \n\t" + node.toString(), e);
            }
        }
        JSONObject[] result = new JSONObject[list.size()];
        list.toArray(result);
        return result;
    }


    public static JSONObject getUnit(JSONObject tree, String id) {
        JSONObject node = tree.optJSONObject(id);
        return node == null ? null : node.optJSONObject("obj");
    }

    public static JSONObject[] getChildUnits(JSONObject tree, String id) {
        JSONObject node = tree.optJSONObject(id);
        if (node == null)
            return toEmptyArray();
        JSONArray array = node.optJSONArray("children");
        if (array == null || array.length() == 0)
            return toEmptyArray();
        ArrayList<JSONObject> list = new ArrayList<JSONObject>();
        for (int i = 0; i < array.length(); i++) {
            String childId = array.optString(i);
            if (childId == null)
                continue;
            JSONObject unit = getUnit(tree, childId);
            list.add(unit);
        }
        JSONObject[] children = new JSONObject[list.size()];
        list.toArray(children);
        return children;
    }

    public static JSONObject getParentUnit(JSONObject tree, String id) {
        JSONObject node = tree.optJSONObject(id);
        if (node == null)
            return null;
        return getUnit(tree, node.optString("parent"));
    }


    public static JSONObject getGrandfatherUnit(JSONObject tree, String id) {
        JSONObject node = tree.optJSONObject(id);
        if (node == null)
            return null;
        return getParentUnit(tree, node.optString("parent"));
    }

    public static String[] getParamNames(JSONArray params) {
        if (params == null || params.length() == 0)
            return new String[0];
        ArrayList<String> list = new ArrayList<String>();
        for (int i = 0; i < params.length(); i++) {
            String paramName = params.optString(i);
            if (paramName != null && !paramName.isEmpty()) {
                list.add(paramName);
            }
        }
        String[] result = new String[list.size()];
        list.toArray(result);
        return result;
    }

    public static JSONObject getInputUnit(JSONObject[] units) {
        for (JSONObject unit : units) {
            String type = unit.optString("type");
            if (TYPE_INPUT.equalsIgnoreCase(type))
                return unit;
        }
        return null;
    }

    public static JSONObject getOutputUnit(JSONObject[] units) {
        for (JSONObject unit : units) {
            String type = unit.optString("type");
            if (TYPE_OUTPUT.equalsIgnoreCase(type))
                return unit;
        }
        return null;
    }

    public static int getUnitSiblingIndex(JSONObject tree, String id) {
        JSONObject node = tree.optJSONObject(id);
        if (node == null || node.optString("parent") == null)
            return -1;
        JSONObject parent = tree.optJSONObject(node.optString("parent"));
        if (parent == null)
            return -1;
        JSONArray children = parent.optJSONArray("children");
        if (children == null || children.length() == 0)
            return -1;
        for (int i = 0; i < children.length(); i++) {
            String name = children.optString(i);
            if (id.equals(name))
                return i;
        }
        return -1;
    }
}
