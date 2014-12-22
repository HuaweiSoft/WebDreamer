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
/**
 * @module define global constant variables in this file.
 */

/** ********************************************************************* */
/* Model out bound events */
/** ********************************************************************* */
/**
 * Event parameters: {id, bean}
 */
EVENT_CONTROL_ADD = "control/add";

/**
 * Event parameters: {id, bean}
 */
EVENT_CONTROL_REMOVE = "control/remove";

/**
 * Event parameters: {id, propName, propValue, bean}
 */
EVENT_CONTROL_UPDATE = "control/update";

/**
 * Event parameters: {id, oldId, newId, bean}
 */
EVENT_CONTROL_RENAME = "control/rename";

/**
 * Event parameters: {id, newPageIndex, bean}
 */
EVENT_CONTROL_REORDER = "control/reorder";

/**
 * Event parameters: {newPageNo, pageNumber}
 */
EVENT_CONTROL_ADD_PAGE = "control/addPage";

/**
 * Event parameters: {pageNo, removedBeans}
 */
EVENT_CONTROL_REMOVE_PAGE = "control/removePage";

/**
 * Event parameters: {pageNumber, beans}
 */
EVENT_CONTROL_LOAD = "control/load";

/**
 * Event parameters: {}
 */
EVENT_CONTROL_CLEAR = "control/clear";

/** ********************************************************************* */
/* Model in bound events */
/** ********************************************************************* */
/**
 * Event parameters: {id, bean}
 */
EVENT_MODEL_ADD = "model/add";

/**
 * Event parameters: {id}
 */
EVENT_MODEL_REMOVE = "model/remove";

/**
 * Event parameters: {id, propName, propValue}
 */
EVENT_MODEL_UPDATE = "model/update";

/**
 * Event parameters: {oldId, newId}
 */
EVENT_MODEL_RENAME = "model/rename";

/**
 * Event parameters: {id, newPageIndex}
 */
EVENT_MODEL_REORDER = "model/reorder";

/**
 * Event parameters: {}
 */
EVENT_MODEL_ADD_PAGE = "model/addPage";

/**
 * Event parameters: {pageNo}
 */
EVENT_MODEL_REMOVE_PAGE = "model/removePage";

/**
 * 
 */
EVENT_MODEL_SAVE = "model/save";

/**
 * 
 */
EVENT_MODEL_OPEN = "model/open";

/**
 * 
 *Event parameter{name:name} 
 */
EVENT_MODEL_SET_PROJECT_NAME = "model/setProjectName";

/**
 * 
 */
EVENT_MODEL_RUN = "model/run";

/**
 * Other modules publish this event to request model module to back-end save project model
 * event parameter {triggerId:""}
 */
EVENT_MODEL_TO_BACK_SAVED = "model/toBackSave";

/**
 *When project has been saved successfully will publish the event
 *event parameter{"user":"guest","project":"test",triggerId:""} 
 */
EVENT_MODEL_BACK_SAVED = "model/backSaved";

/**
 * When model module save project fail will publish the event
 */
EVENT_MODEL_BACK_SAVED_ERROR = "model/backSaveError";

/**
 * 
 */
EVENT_MODEL_NEW = "model/new";

/** ********************************************************************* */
/* initiation module events name */
/** ********************************************************************* */

/**
 * notify other modules that the index.html and other resources have bean loaded. 
 */
EVENT_INITIATION_PUBLISH_PAGE_LOADED = "page/body/finished";

/**
 *Receive other modules notify to close loading view. 
 */
EVENT_INITIATION_SUBSCRIPE_LOADINGVIEW_CLOSE = "page/loadingpanel/close";

/** ********************************************************************* */
/* mask module events name */
/** ********************************************************************* */

/**
 * Receive opening mask notify from other modules to open mask base parameters
 * Event parameters:{"showText":true,"showGif":true,"opacity":".5","text":"text","zindex":"100"}
 */
EVENT_MASK_SUBSCRIPE_OPEN = "mask/open";

/**
 * Receive close mask notify from other modules to close mask
 */
EVENT_MASK_SUBSCRIPE_CLOSE = "mask/close";

/** ********************************************************************* */
/* layout module events name */
/** ********************************************************************* */

/** ********************************************************************* */
/* menu module events name */
/** ********************************************************************* */

/**
 *Receive opening left menu notify from other modules to open left menu 
 */
EVENT_LEFTMENU_SUBSCRIBE_OPEN = "menu/leftmenu/open";

/**
 * Receive closing left menu notify from other modules to open left menu 
 */
EVENT_LEFTMENU_SUBSCRIBE_CLOSE = "menu/leftmenu/close";

/**
 * Receive switching left menu notify from other modules to switch left menu 
 */
EVENT_LEFTMENU_SUBSCRIBE_SWITCH = "menu/leftmenu/switch";

/** ********************************************************************* */
/* outline module events */
/** ********************************************************************* */

/**
 * Notify other modules outline view has bean rendered
 * Event parameters:{id : "outline_body"}
 */
EVENT_OUTLINE_PUBLISH_RENDERED = "outline/render/finished";

/**
 * Event parameters: {page:pageNumber}
 */
EVENT_OUTLINE_PUBLISH_CLICK_PAGE = "outline/click/page";

/**
 * Event parameters: {id:String,pageNo:Number}
 */
EVENT_OUTLINE_PUBLISH_CLICK_CONTROL = "outline/click/control";

/**
 * Receive open outline notify to open it 
 */
EVENT_OUTLINE_SUBSCRIBE_OPEN = "outline/open";

/**
 * Receive close outline notify to close it 
 */
EVENT_OUTLINE_SUBSCRIBE_CLOSE = "outline/close";

/** ********************************************************************* */
/* control manager module bound events */
/** ********************************************************************* */

/**
 * Event parameters {"controls":[]}
 */
EVENT_CONTROLS_LOAD_METADATA = "controls/metadata";

/** ********************************************************************* */
/* form designer module bound events */
/** ********************************************************************* */

/**
 * Event parameters {page:2}
 */
EVENT_FORMDESIGNER_PAGEMANAGER_SWITCH_PAGE = "pagbar/toPage";

/**
 * Event parameters {triggerId:"UUID"}
 */
EVENT_FORMDESIGNER_SUB_VIEW_ALL_PAGE = "pagbar/viewAllPages";

/**
 * Event parameters {triggerId:"UUID",pageNo:1}
 */
EVENT_FORMDESIGNER_PUB_VIEW_ALL_PAGE_SELECTED = "pagbar/viewAllPages/selected";

/**
 * Event parameters {id: control id}
 */
EVENT_FORMDEISGNER_CONTROL_CLICK = "formdesigner/click/control";

/**
 * ui component dragging begin event in formdesigner
 * 
 * @params: {cid, time}
 */
EVENT_FORMDESIGNER_CONTROL_DRAG_BEGIN = "formdesigner/control_drag_begin";

/**
 * ui component dragging end event in formdesigner
 * 
 * @params: {cid, time}
 */
EVENT_FORMDESIGNER_CONTROL_DRAG_END = "formdesigner/control_drag_end";

/**
 * call form designer to set current control
 *
 * @params: {cid}
 */
EVENT_FORMDESIGNER_CALL_SET_CURRENT_CONTROL = "formdesigner.setCurrentControl";

/** ********************************************************************* */
/* toolbar module events */
/** ********************************************************************* */

/**
 * Notify other modules boolbar has been rendered
 */
EVENT_TOOLBAR_PUBLISH_RENDERED = "toolbar/container/finished";
/**
 * Event parameters {page:2}
 */
EVENT_TOOLBAR_PUBLISH_DELETE = "toolbar/delete";

/**
 * Event paremeters {x: left, y: top, controlTpye: control type}
 */
EVENT_TOOLBAR_DRAG_DROP = "toolbar/drapdrop";

/**
 * service component dragging begin event in toolbar
 * 
 * @params: {apiName, time}
 */
EVENT_TOOLBAR_SERVICE_DRAG_BEGIN = "toolbar/service_drag_begin";

/**
 * service component dragging end event in toolbar
 * 
 * @params: {apiName, time}
 */
EVENT_TOOLBAR_SERVICE_DRAG_END = "toolbar/service_drag_end";

/** ********************************************************************* */
/* Events outbound from flow designer module */
/** ********************************************************************* */

/**
 * flow designer open event
 * 
 * @params {}
 */
EVENT_FLOW_OPEN = "flow/open";

/**
 * flow designer close event
 * 
 * @params {}
 */
EVENT_FLOW_CLOSE = "flow/close";

/**
 * flow designer initialized event
 *
 * @params {}
 */
EVENT_FLOW_INITIALIZED = "flow/initialized";

/** ********************************************************************* */
/* Events inbound from propertyEditor module */
/** ********************************************************************* */
EVENT_PROPERTTY_EDITOR_OPEN = "propertyEditor/open";

EVENT_PROPERTTY_EDITOR_CLOSE = "propertyEditor/close";
/** ********************************************************************* */
/* Events outbound from propertyEditor module */
/** ********************************************************************* */

/**
 * propertyEditor update property
 * 
 * @params {id: control id, propName: property name, value: value}
 */
EVENT_PROPERTTY_EDITOR_UPDATE_PROPERTY = "propertyEditor/update/property";

/** ********************************************************************* */
/* user manager module events name */
/** ********************************************************************* */
EVENT_USERM_MANAGER_SUBSCRIBE_LOGOFF = "usermanager/tologoff";

/**
 * user login event
 * @parameters: {user:userid} 
 */
EVENT_USERM_MANAGER_PUBLISH_USER_LOGIN = "usermanager/login";

EVENT_USERM_MANAGER_PUBLISH_USER_LOGOFF = "usermanager/logoff";

/**
 * @parameters: {triggerId:"","userInfo":{}} 
 */
EVENT_USERM_MANAGER_SUBSCRIBE_UPADTE_LOGINED_USER_INFO = "usermanager/toUpdateUserInfo";
/**
 * @parameters: {triggerId:"","result":true/false} 
 */
EVENT_USERM_MANAGER_PUBLISH_UPADTE_LOGINED_USER_INFO = "usermanager/notifyUpdatedInfo";

/** ********************************************************************* */
/* upload module events name */
/** ********************************************************************* */

/**
 *@suffix specified the resources can be upload,such as image can set as  [".gif",".png"] 
 *@savePath specified the path relative the root path [/{webdreamer}/] to save uploaded resources
 *@maxSize  the max size can be upload and unit is kb
 *@triggerId Uploading module notify the uploaded result through EVENT_UPLOAD_PUBLISH_UPLOADED and triggerId
 *parameter{"suffix":[],"savePath":"","maxSize":"","triggerId":"UUID"} 
 */
EVENT_UPLOAD_SUBSCRIBE_OPEN = "upload/open";

/**
 * @name the resource's name has been uploaded such as "text.png"
 * @path the resource's full path has been uploaded such as "c:\text.png"
 * @triggerId Every module call to open the upload view should set the event id as triggerId and ensure global unique.
 * parameter{"name","","path":"","type":"","size":"","triggerId":""}
 */
EVENT_UPLOAD_PUBLISH_UPLOADED = "upload/uploaded";

/** ********************************************************************* */
/* image wall module events name */
/** ********************************************************************* */

/**
 *@images {array[string]} the URL list of images URL such as http://xxx/xx.png or relative webdreamer root /webdreamer/data/test.png 
 *@triggerId {String} event id
 * parameter{"images":[],"triggerId":"UUID"}
 */
EVENT_IMAGES_WALL_SUBSCRIBE_OPEN = "imagesWall/open";

/**
 * @image {String} the  relative URL such as /webdreamer/data/test.png or start with HTTP full path 
 * @triggerId {triggerId} it's value equal the value by set when notify open image wall 
 * parameter{"image":"","triggerId":"UUID"}
 */
EVENT_IMAGES_WALL_PUBLISH_SELECTED_IMAGE = "imagesWall/selectedImage";

RUNTIME_IS_DESIGN = true;

PROJECT_PATH = "";

INGORE_PROXY_SETTING = true ;
