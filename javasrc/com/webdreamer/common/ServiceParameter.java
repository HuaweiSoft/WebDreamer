package com.webdreamer.common;

public class ServiceParameter {
    public String name;
    public String alias;
    public String type;
    public String defaultValue;
    public String fixedValue;

    public ServiceParameter(String name, String alias, String type, String defaultValue, String fixedValue) {
        this.name = name;
        this.alias = alias;
        this.type = type;
        this.defaultValue = defaultValue;
        this.fixedValue = fixedValue;
    }

    public static String convertTypeInt2Str(int type) {
        String typeStr = "";
        switch (type) {
        case 0:
            typeStr = "string";
            break;
        case 1:
            typeStr = "int";
            break;
        case 2:
            typeStr = "json";
            break;
        case 3:
            typeStr = "xml";
            break;
        default:
            break;
        }
        return typeStr;
    }

    public static int convertTypeStr2Int(String typeStr) {
        if (typeStr == null) {
            return -1;
        }
        int type = -1;
        typeStr = typeStr.trim().toLowerCase();
        if (typeStr.equals("string")) {
            type = 0;
        } else if (typeStr.equals("int")) {
            type = 1;
        } else if (typeStr.equals("json")) {
            type = 2;
        } else if (typeStr.equals("xml")) {
            type = 3;
        } else {
            type = -1;
        }
        return type;
    }
    
}
