package com.webdreamer.common;

import java.util.List;

public class ControlMetadata {
    public String name;
    public List<String> runtimeJs;
    public List<String> css;
    public List<String> dependControls;
    public String dir;

    public ControlMetadata(String name, List<String> runtimeJs, List<String> css, List<String> dependControls,
            String dir) {
        this.name = name;
        this.runtimeJs = runtimeJs;
        this.css = css;
        this.dependControls = dependControls;
        this.dir = dir;
    }
}
