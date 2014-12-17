package com.webdreamer.common;

import java.util.Map;

public class ControlBean {
    public String id;
    public String type;
    public int pageNo;
    public int pIndex;
    public String parentId;
    public Map<String, Object> properties;

    public ControlBean(String id, String type, int pageNo, int pIndex, String parentId, Map<String, Object> properties) {
        this.id = id;
        this.type = type;
        this.pageNo = pageNo;
        this.pIndex = pIndex;
        this.parentId = parentId;
        this.properties = properties;
    }
}
