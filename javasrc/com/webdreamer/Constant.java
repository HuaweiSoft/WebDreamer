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
package com.webdreamer;

import java.io.File;

public class Constant {
    public static final String WEB_DREAMER_CONTROLS_MEATADATA_PATH = "controls" + File.separator + "metadata.json";
    public static final String WEB_DREAMER_SERVICES_MEATADATA_PATH = "services" + File.separator + "metadata.json";
    public static final String WEB_DREAMER_HTML_TEMPLATE_PATH = "data" + File.separator + "tmpl" + File.separator
            + "app.tmpl";
    public static final String WEB_DREAMER_RENDER_JS_TEMPLATE_PATH = "data" + File.separator + "tmpl" + File.separator
            + "renderJs.tmpl";
    public static final String WEB_DREAMER_COMMON_JS_CSS_FILE_PATH = "data" + File.separator + "tmpl" + File.separator
            + "common-js-css.json";

    public static final String UI_FILE_NAME = "project.json";
    public static final String FLOW_FILE_NAME = "flow.json";
    public static final String FLOW_HTML_THUMB_FILE_NAME = "flow_ui_html.thumb";

    public static final String WEB_DREAMER_RESOURCES_PATH = "resources";

    public static final String CHANGE_PAGE_API_NAME = "changePage";
    public static final String NAVIGATE_BACK_API_NAME = "goBack";
}
