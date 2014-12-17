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

/*******************************************************************************
 * Web Dreamer starts with this
 * Define the dependency relations of all modules in requireJS model
 ******************************************************************************/

requirejs.config({
    baseUrl: '.',
    paths: {
        "jquery": 'jslibs/jquery/jquery-2.1.0.min',
        "underscore": "jslibs/underscore/underscore.1.5.0-min",
        "backbone": "jslibs/backbone/backbone1.0.0-min",
        "domReady": "jslibs/domready/domReady.2.0.1.min",
        "text": "jslibs/text/text.2.0.10.min",
        "css": "jslibs/requirecss/css.0.1.4.min",
        "arbiter": "jslibs/arbiter/Arbiter1.0",
        "json": "jslibs/json/json2",
        "wireit": "jslibs/wireit/0.6.0/wireit",
        "wireit_excanvas": "jslibs/wireit/0.6.0/excanvas",
        "xml2json": "jslibs/xml2json/jquery.xml2json",

        "yahoo": "jslibs/yui/2.8.1/yahoo/yahoo-min",
        "yahoo_event": "jslibs/yui/2.8.1/event/event-min",
        "yahoo_dom": "jslibs/yui/2.8.1/dom/dom-min",
        "yahoo_dom_event": "jslibs/yui/2.8.1/yahoo-dom-event/yahoo-dom-event",
        "yahoo_dragdrop": "jslibs/yui/2.8.1/dragdrop/dragdrop-min",
        "yahoo_element": "jslibs/yui/2.8.1/element/element-min",
        "yahoo_resize": "jslibs/yui/2.8.1/resize/resize-min",
        "yahoo_layout": "jslibs/yui/2.8.1/layout/layout-min",
        "yahoo_treeview": "jslibs/yui/2.8.1/treeview/treeview-min",
        "yahoo_yuiloader": "jslibs/yui/2.8.1/yuiloader/yuiloader-min",
        "yahoo_utilities": "jslibs/yui/2.8.1/utilities/utilities",
        "yahoo_datasource": "jslibs/yui/2.8.1/datasource/datasource-min",
        "yahoo_datatable": "jslibs/yui/2.8.1/datatable/datatable-min",
        "jquery_filedrop": "jslibs/filedrop/filedrop",

        "common": "controls/lib/common",
        "define": "modules/define",
        "util": "modules/utils/util",
        "jqueryCommon": "modules/utils/jqueryCommon",
        "HashMap": "modules/utils/HashMap",
        "controlBean": "modules/projectManager/ControlBean",
        "metaHub": "modules/metadata/metaHub",

        "logger": "modules/log/logger",
        "localstorage": "modules/localstorage/localstorage",
        "config": "modules/config/config",
        "initiation": "modules/initiation/initiation",
        "mask": "modules/mask/mask",
        "layout": "modules/layout/layout",
        "menu": "modules/menu/menu",
        "toolbar": "modules/toolbar/toolbar",
        "servicesManager": "modules/serviceManager/serviceManager",
        "controlManager": "modules/controlManager/controlManager",
        "formdesigner": "modules/formDesigner/formDesigner",
        "flowDesigner": "modules/flowDesigner/flowDesigner",

        "outline": "modules/outline/outline",
        "propertyEditor": "modules/propertyEditor/propertyEditor",
        "projectManager": "modules/projectManager/projectManager",
        "modelManager": "modules/projectManager/modelManager",

        "userManager": "modules/userManager/userManager",
        "simulator": "modules/simulator/simulator",
        "uploader": "modules/uploader/uploader",
        "imagesWall": "modules/imagesWall/imageWall",

        "setting": "modules/setting/setting",
        "deploy": "modules/deploy/deploy"
    },

    shim: {
        'jquery': {
            exports: 'jQuery'
        },
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: [ 'underscore', 'jquery' ],
            exports: 'Backbone'
        },
        'arbiter': {
            deps: [ 'define'],
            exports: 'Arbiter'
        },
        'xml2json': {
            deps: [ 'jquery'],
            exports: 'jQuery'
        },
        "yahoo_event": {
            deps: [ 'yahoo' ],
            exports: 'YAHOO'
        },
        "yahoo_dom": {
            deps: [ 'yahoo' ],
            exports: 'YAHOO'
        },
        "yahoo_element": {
            deps: [ 'yahoo', 'yahoo_dom', 'yahoo_event' ],
            exports: 'YAHOO'
        },
        "yahoo_resize": {
            deps: [ 'yahoo', 'yahoo_dom', 'yahoo_event', 'yahoo_dragdrop', 'yahoo_element' ],
            exports: 'YAHOO'
        },
        "yahoo_dragdrop": {
            deps: [ 'yahoo', 'yahoo_dom', 'yahoo_event' ],
            exports: 'YAHOO'
        },
        "yahoo_layout": {
            deps: [ 'yahoo', 'yahoo_event', 'yahoo_dom', 'yahoo_dragdrop', 'yahoo_element', 'yahoo_resize' ],
            exports: 'YAHOO'
        },
        "yahoo_utilities": {
            deps: [ 'yahoo' ],
            exports: 'YAHOO'
        },
        "yahoo_treeview": {
            deps: [ 'yahoo', 'yahoo_dom', 'yahoo_event' ],
            exports: 'YAHOO'
        },
        "yahoo_yuiloader": {
            deps: [ 'yahoo' ],
            exports: 'YAHOO'
        },
        "yahoo_datasource": {
            deps: [ 'yahoo' ],
            exports: 'YAHOO'
        },
        "yahoo_datatable": {
            deps: [ 'yahoo', 'yahoo_datasource' ],
            exports: 'YAHOO'
        },

        "wireit": {
            deps: [ 'yahoo_utilities', 'wireit_excanvas', 'css!jslibs/wireit/0.6.0/assets/WireIt.css' ],
            exports: 'WireIt'
        },

        "jquery_filedrop": {
            deps: [ "jquery" ],
            exports: "filedrop"
        },
        "config": {
            deps: [ 'text' ]
        },
        "initiation": {
            deps: [ 'domReady!', 'css', 'text', 'backbone', 'arbiter', 'define' ]
        },
        "mask": {
            deps: [ 'domReady!', 'text', 'backbone', 'arbiter' ]
        },
        "layout": {
            deps: [ 'css', 'text', 'yahoo_layout', 'backbone', 'arbiter' ]
        },
        "menu": {
            deps: [ 'css', 'text', 'backbone', 'arbiter' ]
        },
        "toolbar": {
            deps: [ 'css', 'text', 'backbone', 'arbiter' ]
        },
        "servicesManager": {
            deps: [ 'css', 'text', 'backbone', 'arbiter', 'yahoo_dragdrop' ]
        },
        "controlManager": {
            deps: [ 'css', 'text', 'backbone', 'arbiter', 'common' ]
        },
        "formdesigner": {
            deps: [ 'css', 'text', 'backbone', 'arbiter' ]
        },
        "flowDesigner": {
            deps: [ 'css', 'text', 'backbone', 'arbiter', 'yahoo_dragdrop', 'json', "wireit" ]
        },
        "outline": {
            deps: [ 'css', 'text', 'backbone', 'arbiter', 'yahoo', 'yahoo_event', 'yahoo_dom', 'yahoo_element',
                    'yahoo_yuiloader', 'yahoo_treeview' ]
        },
        "propertyEditor": {
            deps: [ 'css', 'text', 'backbone', 'arbiter', 'yahoo_datatable', 'yahoo_datasource', 'yahoo_yuiloader',
                    'modelManager' ]
        },
        "modelManager": {
            deps: [ 'arbiter' ]
        },

        "userManager": {
            deps: [ 'css', 'text', 'backbone', 'arbiter' ]
        },
        "projectManager": {
            deps: [ 'css', 'text', 'backbone', 'arbiter' ]
        },
        "simulator": {
            deps: [ 'css', 'text', 'backbone', 'arbiter' ]
        },
        "uploader": {
            deps: [ 'css', 'text', 'jquery', 'backbone', 'arbiter', 'jquery_filedrop' ]
        },
        "imagesWall": {
            deps: [ 'css', 'text', 'jquery', 'backbone', 'arbiter' ]
        },

        "setting": {
            deps: [ 'css', 'text', 'jquery', 'backbone', 'arbiter' ]
        },

        "deploy": {
            deps: [ 'css', 'text', 'jquery', 'backbone', 'arbiter' ]
        }
    },

    waitSeconds: 15
});

requirejs([ 'initiation', 'metaHub', 'logger', 'localstorage', 'config', 'mask', 'layout', 'menu', 'toolbar',
        'servicesManager', 'controlManager', 'formdesigner', 'flowDesigner', 'outline', 'propertyEditor',
        "userManager", "projectManager", "simulator", "uploader", "imagesWall", "setting", "deploy" ], function(
        initiation, metaHub, logger, localstorage, config, mask, layout, menu, toolbar, servicesManager,
        controlManager, formdesigner, flowDesigner, outline, propertyEditor, userManager, projectManager, simulator,
        uploader, imagesWall, setting, deploy) {
    // to compatible with the 'MetaHub' variable in control designer js code
    window.MetaHub = metaHub;
    // do not ignore the exceptions thrown in yui event
    if (YAHOO && YAHOO.util && YAHOO.util.Event)
        YAHOO.util.Event.throwErrors = true;
    initiation.process();
    config.init();
    mask.init();
    layout.init();
    menu.init();
    toolbar.init();
    servicesManager.init();
    controlManager.init();
    formdesigner.init();
    flowDesigner.init();
    outline.init();
    propertyEditor.init();
    userManager.init();
    projectManager.init();
    simulator.init();
    uploader.init();
    imagesWall.init();
    setting.init();
    deploy.init();
});
