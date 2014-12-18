package com.webdreamer.builder;

import com.webdreamer.Constant;
import com.webdreamer.Utils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class FlowCodeGenerator extends FlowHelper {

    private static final Logger logger = Logger.getLogger(FlowCodeGenerator.class);

    private static final String INTENT = "\t";

    private static final String LOAD_EVENT_NAME = "onload";
    private static final String ORIENTATION_CHANGE_EVENT_NAME = "onorientationchange";
    private static final String APP_ANCHOR_CONTROL_ID = "APP";
    private static final String APP_ANCHOR_CONTROL_TYPE = "APP";
    private static final String GET_CONTROL_FUNCTION_NAME = "getControl";
    private static final String EVENT_BINDER_FUNCTION_NAME = "bindEventHandlers";
    private static final String DATA_MAPPING_FUNCTION_NAME = "setData";

    private static final String MAPPING_RESULT_ROOT_NAME = "result";
    private static final String MAPPING_UI_DATA_ROOT_NAME = "data";
    private static final String MAPPING_UI_PROP_ROOT_NAME = "ui";

    private static final String[] EXCLUDE_VARIABLES = new String[]{
            "break", "case", "catch", "continue", "default", "delete", "do", "else", "finally", "for", "function", "if", "in",
            "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with",
            "class", "const", "debugger", "enum", "export", "extends", "import",
            "window", "jQuery", "$", "alert", "UI", "wd", "WD", "controls", "extend"};

    private HashMap<String, HashMap<String, CodeItem>> codeMap; // controlId -> eventName -> {funcName, code}
    private boolean compiled = false;
    private JSONArray flows;
    private JSONObject apiMetas;
    private JSONObject uiDataMetas;
    private Scope rootScope;

    public FlowCodeGenerator(String flowJsonString) throws JSONException {
        JSONObject obj;
        obj = new JSONObject(flowJsonString);
        init(obj);
    }

    public FlowCodeGenerator(JSONObject obj) throws JSONException {
        init(obj);
    }

    private void init(JSONObject obj) throws JSONException {
        codeMap = new HashMap<String, HashMap<String, CodeItem>>();
        flows = obj.getJSONArray("flows");
        apiMetas = obj.optJSONObject("apiMetas");
        if (apiMetas == null)
            apiMetas = new JSONObject();
        JSONObject assets = obj.optJSONObject("assets");
        if(assets != null ){
            uiDataMetas = assets.optJSONObject("uiDataMetas");
        }
        if(uiDataMetas == null)
            uiDataMetas = new JSONObject();
        compiled = false;
        rootScope = new Scope("", null);
    }

    public boolean isCompiled() {
        return compiled;
    }

    public String compile() throws JSONException {
        if (compiled) {
            clear();
        }
        for (int i = 0; i < flows.length(); i++) {
            JSONObject tree = flows.optJSONObject(i);
            if (tree == null)
                continue;
            JSONObject[] uiUnits = getAll3rdUiUnits(tree);
            for (JSONObject uiUnit : uiUnits) {
                JSONObject[] eventUnits = getChildUnits(tree, uiUnit.getString("id"));
                if (eventUnits.length == 0)
                    continue;
                String controlId = uiUnit.getString("controlId");
                if (controlId == null || controlId.isEmpty())
                    continue;
                for (JSONObject eventUnit : eventUnits) {
                    this.generateEventCode(tree, eventUnit, controlId, "");
                }
            }
            JSONObject appUnit = getAppAnchorUnit(tree);
            if (appUnit != null) {
                JSONObject[] eventUnits = getChildUnits(tree, appUnit.getString("id"));
                if (eventUnits.length > 0) {
                    for (JSONObject eventUnit : eventUnits) {
                        this.generateEventCode(tree, eventUnit, APP_ANCHOR_CONTROL_ID, "");
                    }
                }
            }
        }
        compiled = true;
        return output("");
    }

    public void clear() {
        codeMap.clear();
        rootScope.variables.clear();
        rootScope.cidMap.clear();
        rootScope.childScopes.clear();
        compiled = false;
    }

    public JSONObject getApiMetas() {
        return apiMetas;
    }

    public String output(final String intent) {
        StringBuilder code = new StringBuilder();
        code.append(intent + "function " + EVENT_BINDER_FUNCTION_NAME + "(){\n");
        final String innerIntent = intent + INTENT;
        for (Map.Entry<String, HashMap<String, CodeItem>> entry : codeMap.entrySet()) {
            String controlId = entry.getKey();
            HashMap<String, CodeItem> eventMap = entry.getValue();
            if (controlId.equals(APP_ANCHOR_CONTROL_ID) || eventMap.size() == 0)
                continue;
            AssignResult assignResult = rootScope.assignControlVariable(controlId);
            if (assignResult.newAssigned)
                code.append(innerIntent + assignResult.code);
            String controlVar = assignResult.controlVarName;
            for (Map.Entry<String, CodeItem> codeEntry : eventMap.entrySet()) {
                String eventName = codeEntry.getKey();
                CodeItem codeItem = codeEntry.getValue();
                String funcCode = Utils.insertBeforeEachLine(codeItem.code, innerIntent);
                code.append(innerIntent + controlVar + "." + eventName + " = " + funcCode);
            }
            code.append(innerIntent + "\n");
        }
        //app global event
        if (codeMap.containsKey(APP_ANCHOR_CONTROL_ID)) {
            HashMap<String, CodeItem> eventMap = codeMap.get(APP_ANCHOR_CONTROL_ID);
            if (eventMap.containsKey(ORIENTATION_CHANGE_EVENT_NAME)) {
                CodeItem orientationItem = eventMap.get(LOAD_EVENT_NAME);
                String funcCode = Utils.insertBeforeEachLine(orientationItem.code, innerIntent);
                code.append(innerIntent + "if");
                code.append(innerIntent + "var app_orientation_change = " + funcCode);
                code.append(innerIntent + "\n");
                code.append(String.format("%sif(window.addEventListener)\n%s\twindow.addEventListener" +
                        "(\"orientationchange\", app_orientation_change); \n", innerIntent, innerIntent));
                code.append(innerIntent + "\n");
            }
            if (eventMap.containsKey(LOAD_EVENT_NAME)) {
                CodeItem initItem = eventMap.get(LOAD_EVENT_NAME);
                code.append(innerIntent + "var app_load = " + Utils.insertBeforeEachLine(initItem.code, innerIntent));
                code.append("\n" + innerIntent + "app_load();\n\n");
            }
        }
        code.append(intent + "}\n");
        return code.toString();
    }

    public String output() {
        return output("");
    }

    public String getBindFunctionName() {
        return EVENT_BINDER_FUNCTION_NAME;
    }


    private boolean generateEventCode(JSONObject tree, JSONObject eventUnit, String controlId,
                                      String intent) throws JSONException {
        String eventName = eventUnit.getString("name");
        if (eventName == null || !eventUnit.getString("type").equals(TYPE_EVENT))
            return false;

        String eventFuncName;
        if (controlId.equals(APP_ANCHOR_CONTROL_ID))
            eventFuncName = "app_" + eventName;
        else
            eventFuncName = format(controlId) + "_" + eventName;

        String[] params = FlowHelper.getParamNames(eventUnit.optJSONArray("params"));
        Scope scope = new Scope(eventFuncName, rootScope);
        for (String param : params) {
            scope.addVariable(param);
        }

        String headCode = "function(" + Utils.join(params, ", ") + "){\n";
        String endCode = intent + "}\n";
        StringBuilder code = new StringBuilder();

        JSONObject[] childUnits = getChildUnits(tree, eventUnit.getString("id"));
        for (JSONObject childUnit : childUnits) {
            String childType = childUnit.getString("type");
            if (TYPE_UI.equalsIgnoreCase(childType)) {
                JSONObject[] methodUnits = getChildUnits(tree, childUnit.getString("id"));
                if (methodUnits.length > 0) {
                    String myControlId = childUnit.getString("controlId");
                    for (JSONObject methodUnit : methodUnits) {
                        code.append(buildMethodUnitCode(tree, methodUnit, myControlId, scope, intent + INTENT));
                    }
                }
            } else if (TYPE_API.equalsIgnoreCase(childType)) {
                code.append(buildApiUnitCode(tree, childUnit, scope, intent + INTENT));
            }
        }

        HashMap<String, CodeItem> eventMap = codeMap.get(controlId);
        if (eventMap == null) {
            eventMap = new HashMap<String, CodeItem>();
            eventMap.put(eventName, new CodeItem(eventFuncName, headCode + code.toString() + endCode));
            codeMap.put(controlId, eventMap);
        } else {
            CodeItem codeItem = eventMap.get(eventName);
            if (codeItem != null) {
                //append code
                int lastIndex = codeItem.code.lastIndexOf(endCode);
                if (lastIndex == -1) {
                    lastIndex = codeItem.code.lastIndexOf("}");
                }
                if (lastIndex == -1)
                    throw new JSONException("Code content error for  '" + eventFuncName
                            + "' function:\n" + codeItem.code);
                codeItem.code = codeItem.code.substring(0, lastIndex - 1) + code.toString() + endCode;
            } else {
                eventMap.put(eventName, new CodeItem(eventFuncName, headCode + code.toString() + endCode));
            }
        }
        return true;
    }


    private String buildMethodUnitCode(JSONObject tree, JSONObject methodUnit, String controlId,
                                       Scope scope, String intent) throws JSONException {
        String methodName = methodUnit.getString("name");
        if (methodName == null)
            return "";
        String code = "";

        AssignResult assignResult = scope.assignControlVariable(controlId);
        if (assignResult.newAssigned)
            code += intent + assignResult.code;
        String controlVar = assignResult.controlVarName;
        JSONObject[] childUnits = getChildUnits(tree, methodUnit.getString("id"));
        JSONObject inputUnit = getInputUnit(childUnits);
        JSONObject outputUnit = getOutputUnit(childUnits);
        String invokeCode = null;
        if (inputUnit != null) {
            JSONArray paramNameArray = methodUnit.getJSONArray("params");
            InputCodeResult inputResult = buildInputCode(tree, inputUnit, paramNameArray, scope, intent);
            if (inputResult != null) {
                code += inputResult.code;
                invokeCode = String.format("%s.%s(%s);\n", controlVar, methodName,
                        Utils.join(inputResult.paramVars, ", "));
            }
        }
        if (invokeCode == null) {
            invokeCode = String.format("%s.%s();\n", controlVar, methodName);
        }
        if (outputUnit != null) {
            String resultVarName = scope.assign(methodName + "_result");
            scope.addVariable(resultVarName);
            code += intent + "var " + resultVarName + " = " + invokeCode;
            code += buildOutputCode(tree, outputUnit, resultVarName, scope, intent);
        } else {
            code += intent + invokeCode;
        }
        return code;
    }


    private String buildApiUnitCode(JSONObject tree, JSONObject apiUnit, Scope scope, String intent) throws JSONException {
        String apiName = apiUnit.optString("name");
        if (apiName == null)
            return "";
        else if (apiName.equals(Constant.CHANGE_PAGE_API_NAME))
            return buildChangePageApiCode(tree, apiUnit, scope, intent);
        JSONObject apiMeta = this.apiMetas.optJSONObject(apiName);
        if (apiMeta == null)
            throw new JSONException("Can't found metadata of api '" + apiName + "'.");
        String code = "";
        String className = apiMeta.getString("className");
        String functionName = apiMeta.getString("functionName");
        JSONArray params = apiMeta.getJSONArray("params");
        boolean hasCallback = apiMeta.optBoolean("hasCallback", true);
        if (apiName.equals(Constant.CHANGE_PAGE_API_NAME))
            hasCallback = false;
        if (Utils.isNullOrTrimEmpty(functionName))
            functionName = apiName;

        String classVarCode = "";
        String callFuncName;
        if (!Utils.isNullOrTrimEmpty(className)) {
            String classBaseName = className.lastIndexOf(".") > 0 ? className.substring(className.lastIndexOf(".") + 1)
                    : className;
            String instanceVarName = scope.assign(classBaseName);
            scope.addVariable(instanceVarName);
            classVarCode = intent + "var " + instanceVarName + " =  new " + className + "();\n";
            callFuncName = instanceVarName + "." + functionName;
        } else {
            callFuncName = functionName;
        }

        JSONObject[] childUnits = getChildUnits(tree, apiUnit.getString("id"));
        JSONObject inputUnit = getInputUnit(childUnits);
        JSONObject outputUnit = getOutputUnit(childUnits);

        if (!hasCallback) {
            String invokeCode = null;
            if (inputUnit != null) {
                InputCodeResult inputResult = buildInputCode(tree, inputUnit, params, scope, intent);
                if (inputResult != null) {
                    code += inputResult.code;
                    invokeCode = String.format("%s(%s);\n", callFuncName,
                            Utils.join(inputResult.paramVars, ", "));
                }
            }
            if (invokeCode == null) {
                invokeCode = callFuncName + "();\n";
            }
            if (outputUnit != null) {
                String resultVarName = scope.assign(functionName + "_result");
                scope.addVariable(resultVarName);
                code += classVarCode;
                code += intent + "var " + resultVarName + " = " + invokeCode;
                code += buildOutputCode(tree, outputUnit, resultVarName, scope, intent);
            } else {
                code += classVarCode;
                code += intent + invokeCode;
            }
        } else {//hasCallback api with success callback and error callback
            InputCodeResult inputResult = null;
            if (inputUnit != null) {
                inputResult = buildInputCode(tree, inputUnit, params, scope, intent);
            }
            code += "\n";
            if (inputResult != null) {
                code += inputResult.code;
            }
            String successFuncName = scope.assign(format(functionName) + "_success");
            String resultVarName = "result";
            code += intent + String.format("var %s = function(%s){\n", successFuncName, resultVarName);
            scope.addVariable(successFuncName);
            Scope successScope = new Scope(successFuncName, scope);
            successScope.addVariable(resultVarName);
            code += buildOutputCode(tree, outputUnit, resultVarName, successScope, intent + INTENT);
            code += intent + "};\n";
             /* error callback*/
            String errorFuncName = scope.assign(format(functionName) + "_error");
            code += intent + String.format("var %s = function(error){\n", errorFuncName);
            scope.addVariable(errorFuncName);
            Scope errorScope = new Scope(errorFuncName, scope);
            errorScope.addVariable("error");
            code += intent + INTENT + "console.error('Function \"" + functionName + "\" return error: %o', error);\n";
            code += intent + "};\n";
            code += "\n";

            code += classVarCode;
            if (inputResult != null) {
                //use another input parameter type
                String paramStr = Utils.join(inputResult.paramVars, ", ");
                if (!paramStr.isEmpty())
                    code += intent + String.format("%s(%s, %s, %s);\n", callFuncName, successFuncName,
                            errorFuncName, paramStr);
                else
                    code += intent + String.format("%s(%s, %s);\n", callFuncName, successFuncName, errorFuncName);
            } else {
                code += intent + String.format("%s(%s, %s);\n", callFuncName, successFuncName, errorFuncName);
            }
        }
        return code;
    }

    private String buildChangePageApiCode(JSONObject tree, JSONObject apiUnit, Scope scope, String intent) {
        JSONObject inputUnit = getInputUnit(getChildUnits(tree, apiUnit.optString("id")));
        if (inputUnit == null)
            return null;
        JSONObject[] paramUnits = getChildUnits(tree, inputUnit.optString("id"));
        if (paramUnits.length == 0)
            return "";
        JSONObject pageUnit = paramUnits[0];
        String value = pageUnit.optString("value");
        if (value == null)
            return "";
        if (!value.matches("^\\d+$"))
            value = "\"" + value + "\"";
        return intent + String.format("%s(%s);\n", Constant.CHANGE_PAGE_API_NAME, value);
    }

    private JSONObject[] sortParamUnits(JSONObject[] paramUnits, JSONArray paramNames) throws JSONException {
        if (paramNames == null || paramNames.length() == 0 || paramUnits.length == 0)
            return paramUnits;
        if (paramUnits.length != paramNames.length()) {
            logger.warn("Inconsistent length between param units and param name declaring array.");
        }
        HashMap<String, Integer> map = new HashMap<String, Integer>(paramUnits.length);
        for (int i = 0; i < paramUnits.length; i++) {
            String name = paramUnits[i].optString("name");
            if (name == null)
                throw new JSONException("Param unit name must not be null.");
            map.put(name, i);
        }
        boolean[] used = new boolean[paramUnits.length];
        for (int i = 0; i < used.length; i++) {
            used[i] = false;
        }
        JSONObject[] sortedUnits = new JSONObject[paramUnits.length];
        for (int i = 0; i < paramNames.length() && i < paramUnits.length; i++) {
            String name = paramNames.optString(i);
            if (name == null)
                throw new JSONException("Invalid parameter name array: " + paramNames.toString());
            if (!map.containsKey(name)) {
                //mock a new empty unit
                JSONObject obj = new JSONObject();
                obj.put("type", TYPE_PARAM);
                obj.put("name", name);
                obj.put("valueType", (Object) null);
                obj.put("value", (Object) null);
                sortedUnits[i] = obj;
            } else {
                int index = map.get(name);
                sortedUnits[i] = paramUnits[index];
                used[index] = true;
            }
        }
        if (paramNames.length() < sortedUnits.length) {
            //append the unused params
            int index = 0;
            for (int i = paramNames.length(); i < sortedUnits.length; i++) {
                while (index < paramUnits.length) {
                    if (!used[index]) {
                        sortedUnits[i] = paramUnits[index];
                        index++;
                        break;
                    } else
                        index++;
                }
            }
        }
        return sortedUnits;
    }


    private InputCodeResult buildInputCode(JSONObject tree, JSONObject inputUnit, JSONArray orderedParamNames,
                                           Scope scope, String intent) throws JSONException {
        JSONObject[] paramChildUnits = getChildUnits(tree, inputUnit.optString("id"));

        if (paramChildUnits == null || paramChildUnits.length == 0) {
            if (orderedParamNames == null || orderedParamNames.length() == 0)
                return null;
            else {
                int length = orderedParamNames.length();
                InputCodeResult result = new InputCodeResult();
                result.paramNames = new String[length];
                result.paramVars = new String[length];
                result.code = "";
                for (int i = 0; i < length; i++) {
                    String name = orderedParamNames.getString(i);
                    if (name == null)
                        throw new JSONException("Invalid parameter name array: " + orderedParamNames.toString());
                    String varName = scope.assign(name);
                    scope.addVariable(varName);
                    String code = intent + "var " + varName + " = null;\n";
                    result.paramNames[i] = name;
                    result.paramVars[i] = varName;
                    result.code += code;
                }
                return result;
            }
        }
        JSONObject[] paramUnits = sortParamUnits(paramChildUnits, orderedParamNames);
        InputCodeResult result = new InputCodeResult();
        result.paramNames = new String[paramUnits.length];
        result.paramVars = new String[paramUnits.length];
        result.code = "";
        for (int i = 0; i < paramUnits.length; i++) {
            JSONObject unit = paramUnits[i];
            String name = unit.getString("name");
            if (name == null)
                throw new JSONException("Param unit name must not be null.");
            String varName = scope.assign(name);
            scope.addVariable(varName);
            String code = buildParamValueAssignCode(unit, varName, scope, intent);
            result.paramNames[i] = name;
            result.paramVars[i] = varName;
            result.code += code;
        }
        return result;
    }


    private String buildParamValueAssignCode(JSONObject paramUnit, String assignedVarName, Scope scope,
                                             String intent) {
        String code = "";
        String valueType = paramUnit.optString("valueType");
        boolean isNull = false;
        if (valueType == null || valueType.isEmpty()) {
            isNull = true;
        } else if (valueType.equalsIgnoreCase("UI")) {
            String controlId = paramUnit.optString("controlId");
            String propName = paramUnit.optString("propName");
            if (controlId == null || Utils.isNullOrTrimEmpty(propName)) {
                isNull = true;
            } else {
                AssignResult assignResult = scope.assignControlVariable(controlId);
                if (assignResult.newAssigned)
                    code += intent + assignResult.code;
                String controlVar = assignResult.controlVarName;
                code += intent + String.format("var %s = %s.%s;\n", assignedVarName, controlVar, propName);
            }
        } else if (valueType.equalsIgnoreCase("VALUE")) {
            Object value = paramUnit.opt("value");
            String valueString;
            if (value == null || JSONObject.NULL.equals(value))
                valueString = "null";
            else if (value instanceof String)
                valueString = "\"" + value + "\"";
            else
                valueString = value.toString();
            code += intent + String.format("var %s = %s;\n", assignedVarName, valueString);
        } else if (valueType.equalsIgnoreCase("PAGE")) {
            int pageNo = paramUnit.optInt("value", 1);
            code += intent + String.format("var %s = %d;\n", assignedVarName, pageNo);
        } else {
            isNull = true;
        }

        if (isNull)
            code = intent + " var " + assignedVarName + " = null;\n";
        return code;
    }

    private String buildOutputCode(JSONObject tree, JSONObject outputUnit, String resultVarName,
                                   Scope scope, String intent) {
        JSONObject[] resultUnits = getChildUnits(tree, outputUnit.optString("id"));
        if (resultUnits.length == 0)
            return "";
        String code = "";
        for (JSONObject unit : resultUnits) {
            String controlId = unit.optString("controlId");
            String propName = unit.optString("propName");
            String mappingType = unit.optString("mappingType");
            JSONArray mapping = unit.optJSONArray("mapping");
            if (Utils.isNullOrTrimEmpty(controlId)) {
                logger.warn("Empty control id value for result unit: " + unit.toString());
                continue;
            }
            AssignResult assignResult = scope.assignControlVariable(controlId);
            if (assignResult.newAssigned)
                code += intent + assignResult.code;
            String controlVar = assignResult.controlVarName;
            if (Utils.isNullOrTrimEmpty(mappingType) || mappingType.equalsIgnoreCase(MAPPING_TYPE_SINGLE)) {
                if (controlId == null || Utils.isNullOrTrimEmpty(propName)) {
                    logger.warn("Invalid data for result unit: " + unit.toString());
                    continue;
                }
                code += intent + String.format("%s.%s = %s;\n", controlVar, propName, resultVarName);
            } else if (mappingType.equalsIgnoreCase(MAPPING_TYPE_PROPERTY)) {
                code += buildPropertyMappingCode(resultVarName, controlVar, mapping, scope, intent);
            } else if (mappingType.equalsIgnoreCase(MAPPING_TYPE_DATA)) {
                code += buildDataMappingCode(resultVarName, controlVar, unit.optString("controlType"), mapping, scope, intent);
            } else {
                logger.warn("Invalid mapping type: " + mappingType);
            }
        }
        return code;
    }

    private String buildPropertyMappingCode(String resultVarName, String controlVarName, JSONArray mapping, Scope scope, String intent) {
        if (mapping == null || mapping.length() == 0)
            return "";
        String code = "";
        for (int i = 0; i < mapping.length(); i++) {
            JSONObject obj = mapping.optJSONObject(i);
            if (obj == null)
                continue;
            String source = obj.optString("source");
            String target = obj.optString("target");
            boolean isArray = obj.optBoolean("isArray", false);
            JSONArray items = obj.optJSONArray("items");
            if (source == null || source.isEmpty()) {
                logger.warn("Null source value in mapping item for control [" + controlVarName + "];");
                continue;
            } else if (!source.equals(MAPPING_RESULT_ROOT_NAME) && !beginWith(source, MAPPING_RESULT_ROOT_NAME)) {
                logger.warn("Source value in mapping item must begin with '" + MAPPING_RESULT_ROOT_NAME + ".' :\t'" + obj.toString() + "'");
                continue;
            }
            String path = "";
            if (source.equals(MAPPING_RESULT_ROOT_NAME))
                path = resultVarName;
            else
                path = resultVarName + "." + source.substring(MAPPING_RESULT_ROOT_NAME.length() + 1);
            if (!Utils.isNullOrTrimEmpty(target)) {
                if (beginWith(target, MAPPING_UI_PROP_ROOT_NAME + "."))
                    target = target.substring(MAPPING_UI_PROP_ROOT_NAME.length() + 1);
                code += intent + String.format("%s.%s = %s;\n", controlVarName, target, path);
            }
            if (isArray && items != null && items.length() > 0) {
                code += intent + String.format("if(%s != null && %s.length > 0 && %s[0]){\n", path, path, path);
                String objVarName;
                if (path.lastIndexOf('.') == -1 || items.length() == 1) {
                    objVarName = path + "[0]";
                } else {
                    objVarName = path.substring(path.lastIndexOf('.') + 1);
                    if (objVarName.charAt(0) >= '0' && objVarName.charAt(0) >= '9')
                        objVarName = "v" + objVarName;
                    objVarName = scope.assign(objVarName, true, false);
                    scope.addVariable(objVarName);
                    code += intent + String.format("var %s = %s[0];\n", objVarName, path);
                }
                code += drillPropMappingItemsCode(items, objVarName, controlVarName, scope, intent + INTENT);
                code += intent + "}\n";
            }
        }
        if(hasMoreLines(code, 4))
            code += "\n";
        return code;
    }

    private String drillPropMappingItemsCode(JSONArray mappingItems, String objVarPath, String controlVarName, Scope scope, String intent) {
        String code = "";
        for (int i = 0; i < mappingItems.length(); i++) {
            JSONObject obj = mappingItems.optJSONObject(i);
            if (obj == null)
                continue;
            String source = obj.optString("source");
            String target = obj.optString("target");
            boolean isArray = obj.optBoolean("isArray", false);
            JSONArray items = obj.optJSONArray("items");
            if (source == null || source.isEmpty()) {
                continue;
            }
            String path = objVarPath + "." + source;
            if (!Utils.isNullOrTrimEmpty(target)) {
                if (beginWith(target, MAPPING_UI_PROP_ROOT_NAME + "."))
                    target = target.substring(MAPPING_UI_PROP_ROOT_NAME.length() + 1);
                code += intent + String.format("%s.%s = %s;\n", controlVarName, target, path);
            }
            if (isArray && items != null && items.length() > 0) {
                code += intent + String.format("if(%s != null && %s.length > 0 && %s[0]){\n", path, path, path);
                String objVarName;
                if (source.lastIndexOf('.') == -1) {
                    objVarName = path + "[0]";
                } else {
                    objVarName = path.substring(path.lastIndexOf('.') + 1);
                    if (objVarName.charAt(0) >= '0' && objVarName.charAt(0) >= '9')
                        objVarName = "v" + objVarName;
                    objVarName = scope.assign(objVarName, true, false);
                    scope.addVariable(objVarName);
                    code += intent + String.format("var %s = %s[0];\n", objVarName, path);
                }
                code += drillPropMappingItemsCode(items, objVarName, controlVarName, scope, intent + INTENT);
                code += intent + "}\n";
            }
        }
        return code;
    }

    private String buildDataMappingCode(String resultVarName, String controlVarName, String controlType,
                                        JSONArray mapping, Scope scope, String intent) {
        if (mapping == null || mapping.length() == 0)
            return "";
        String code = "";

        try {
            String dataFormat = uiDataMetas.optString(controlType);
            if(dataFormat == null || dataFormat.isEmpty())
                dataFormat = "null";
            String strMapping  = "";
            if(mapping.length() == 1)
            {
                strMapping = mapping.toString();
                if(strMapping.length()> 80)
                    strMapping = Utils.insertBeforeEachLine(mapping.toString(4), intent +INTENT) ;
            }
            else
                strMapping = Utils.insertBeforeEachLine(mapping.toString(4), intent +INTENT) ;
            code = intent +  String.format("doDataMapping(%s, %s, %s, %s);\n", resultVarName, controlVarName, dataFormat, strMapping);
        } catch (JSONException e) {
            logger.error("[buildDataMappingCode] error" , e);
        }
        return code;
    }



    //***********************************************************************
    //   Static classes
    //***********************************************************************

    private static class CodeItem {
        public String funcName = "";
        public String code = "";

        public CodeItem(String funcName, String code) {
            this.funcName = funcName;
            this.code = code;
        }
    }

    /**
     * Javascript variable scope
     */
    private static class Scope {

        public String funcName;
        public ArrayList<String> variables;
        public HashMap<String, String> cidMap;      // controlId -> variable
        public Scope parentScope;
        public ArrayList<Scope> childScopes;

        public Scope(String functionName, Scope parentScope) {
            funcName = functionName;
            variables = new ArrayList<String>();
            cidMap = new HashMap<String, String>();
            this.parentScope = parentScope;
            childScopes = new ArrayList<Scope>();

            if (parentScope != null) {
                parentScope.childScopes.add(this);
            }
        }


        public boolean addVariable(String variable) {
            if (variable == null || variable.isEmpty())
                return false;
            if (this.variables.contains(variable)) {
                logger.debug("Duplicated variable name: " + variable);
                return false;
            }
            if (Utils.inArray(EXCLUDE_VARIABLES, variable)) {
                logger.debug("Variable name '" + variable + "' is a preserved symbol.");
                return false;
            }
            this.variables.add(variable);
            return true;
        }

        public void removeVariable(String variable) {
            int index = variables.indexOf(variable);
            if (index >= 0)
                variables.remove(index);
        }

        public boolean hasLocalVariable(String variable) {
            return variables.contains(variable);
        }

        public Scope getVariableScope(String variable) {
            if (variable == null)
                return null;
            Scope scope = this;
            while (scope != null) {
                if (scope.hasLocalVariable(variable))
                    return scope;
                scope = scope.parentScope;
            }
            return null;
        }

        /**
         * check the variable name exists in the whole scope chain or not
         */
        public boolean isVariableExists(String variable) {
            return getVariableScope(variable) != null;
        }

        /**
         * assign new variable name by append digital suffix if conflict
         */
        public String assign(String baseName, boolean onlyLocalScope, boolean reformat) {
            if (reformat)
                baseName = format(baseName);
            if (onlyLocalScope) {
                if (!this.hasLocalVariable(baseName))
                    return baseName;
            } else if (!this.isVariableExists(baseName))
                return baseName;
            String changedBaseName = baseName;
            int begin = 1, end = 9;
            if (baseName.length() >= 2) {
                char ch = baseName.charAt(baseName.length() - 1);
                if (ch >= '0' && ch <= '9') {
                    begin = ((int) ch) - ((int) '0') + 1;
                    changedBaseName = baseName.substring(0, baseName.length() - 1);
                }
            }
            for (int num = begin; num <= end; num++) {
                String name = changedBaseName + String.valueOf(num);
                if (onlyLocalScope) {
                    if (!this.hasLocalVariable(name))
                        return name;
                } else if (!this.isVariableExists(name))
                    return name;
            }
            return this.assign(baseName + "_", onlyLocalScope, false);
        }

        public String assign(String baseName) {
            return assign(baseName, false, true);
        }

        public AssignResult assignControlVariable(String controlId) {
            AssignResult result = new AssignResult();
            String varName = this.cidMap.get(controlId);
            // String varName = this.getControlVariableFromChain(controlId);  //closed loop
            if (varName == null) {
                String baseName = format(controlId);
                varName = this.assign(baseName, true, false);
                result.newAssigned = true;
                result.controlVarName = varName;
                result.code = String.format("var %s = %s(\"%s\");\n",
                        varName, GET_CONTROL_FUNCTION_NAME, controlId);
                this.cidMap.put(controlId, varName);
                this.addVariable(varName);
            } else {
                result.controlVarName = varName;
                result.newAssigned = false;
                result.code = "";
            }
            return result;
        }

        public String getControlVariableFromChain(String controlId) {
            if (controlId == null)
                return null;
            String name = this.cidMap.get(controlId);
            if (name != null)
                return name;
            else if (this.parentScope == null)
                return null;
            else return this.parentScope.getControlVariableFromChain(controlId);
        }
    }

    private static class AssignResult {
        public boolean newAssigned = false;
        public String controlVarName;
        public String code;
    }

    private static class InputCodeResult {
        public String[] paramNames;
        public String[] paramVars;
        public String code;
    }

    //***********************************************************************
    //   Static functions
    //***********************************************************************

    /**
     * format base name as a valid variable name
     *
     * @param baseName
     * @return
     */
    private static String format(String baseName) {
        int lastIndex = baseName.lastIndexOf(".");
        if (lastIndex >= 0) {
            if (lastIndex == baseName.length() - 1)
                baseName = baseName.replaceAll("\\.", "");
            else
                baseName = baseName.substring(lastIndex + 1);
        }
        if (baseName.charAt(0) == '_' && baseName.length() > 1)
            baseName = baseName.substring(1);
        String str = baseName.replaceAll("\\s+", "").replaceAll("\\-", "_");
        StringBuilder builder = new StringBuilder();
        int i;
        for (i = 0; i < str.length(); i++) {
            char ch = str.charAt(i);
            if (ch >= 'A' && ch <= 'Z') {
                builder.append((char) (ch + 32));
            } else
                break;
        }
        if (i < str.length()) {
            builder.append(str.substring(i));
        }
        return builder.toString();
    }

    private static boolean hasMoreLines(String str, int lineNumber) {
        if (lineNumber < 0)
            return true;
        int length = str.length();
        if (length == 0)
            return lineNumber == 0;
        int lineNo = 1;
        for (int i = 0; i < length - 1; i++) {
            if (str.charAt(i) == '\n') {
                lineNo++;
                if (lineNo >= lineNumber)
                    return true;
            }
        }
        return lineNo >= lineNumber;
    }

    /**
     * check whether the string content begin with the specified words, and has more content
     *
     * @param str
     * @param header
     * @return
     */
    private static boolean beginWith(String str, String header) {
        if (str == null || str.isEmpty())
            return false;
        return str.indexOf(header) == 0 && str.length() > header.length();
    }

}
