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
 * canvas for design and display UI of apps
 */
define([ "css!modules/formDesigner/formCanvas/formCanvas", "text!modules/formDesigner/formCanvas/model.json",
    "text!modules/formDesigner/formCanvas/formCanvas_tmpl.xml", "controlBean", "util" , "metaHub" , "modelManager"],
    function(css, model, tmpl, Bean, util, metaHub, modelManager) {

    var STYLE_PROPERTIES = [ 'position', 'width', 'height', 'margin', 'left', 'top', 'zIndex', 'visibility' ];


    var init = function() {

        Arbiter.subscribe("layout/center/rendered", {
            async: true
        }, function(data) {
            var view = new FormDesignerView({
                el: $("#" + data.body)
            });
            view.render();
            view.publishMsg();
            view.initSubscription();
        });

    };
    var FormDesignerView = Backbone.View.extend({


        controls: [],
        currentSelectedControlId: "",

        // record the position and index of dragged control
        // before dragging
        draggedControlPos: null,
        draggedControlIndex: -1,

        // page management about, page no ranges from
        curPageIndex: 1, // current page showed
        pageIdNumber: 1, // page id, auto increment
        _isFlowDesignerOpened: false,

        render: function() {
            this.$el.append(tmpl);
        },
        publishMsg: function() {
            Arbiter.publish("layout/center/open", null, {
                async: true
            });
        },

        /**
         * init subscription
         */
        initSubscription: function() {
            var _this = this;

            // load pages and controls
            Arbiter.subscribe(EVENT_CONTROL_LOAD, function(data) {
                _this.load(data.pageNumber, data.beans);
            });

            // toolbar
            Arbiter.subscribe(EVENT_TOOLBAR_DRAG_DROP, function(data) {
                _this.controlDropFromToolbar(data);
            });
            Arbiter.subscribe(EVENT_TOOLBAR_PUBLISH_DELETE, function() {
                _this.toolbarDelete();
            });

            // control
            Arbiter.subscribe(EVENT_CONTROL_ADD, function(data) {
                _this.controlAdd(data.bean, true);
            });

            Arbiter.subscribe(EVENT_CONTROL_REMOVE, function(data) {
                _this.controlRemove(data);
            });

            Arbiter.subscribe(EVENT_CONTROL_RENAME, function(data) {
                _this.controlRename(data);
            });

            Arbiter.subscribe(EVENT_CONTROL_UPDATE, function(data) {
                _this.controlUpdate(data);
            });

            // page
            Arbiter.subscribe(EVENT_CONTROL_ADD_PAGE, function(data) {
                _this.pageAdd(data.newPageNo);
            });

            Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE, function(data) {
                _this.pageRemove(data);
            });

            Arbiter.subscribe(EVENT_FORMDESIGNER_PAGEMANAGER_SWITCH_PAGE, function(data) {
                _this.pageSwitch(data);
            });

            // outline
            Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_CLICK_PAGE, function(data) {
                _this.outlinePageClick(data);
            });

            Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_CLICK_CONTROL, function(data) {
                _this.outlineControlClick(data);
            });

            // configurator
            Arbiter.subscribe(EVENT_PROPERTTY_EDITOR_UPDATE_PROPERTY, function(data) {
                _this.updateProperty(data);
            });

            // clear
            Arbiter.subscribe(EVENT_CONTROL_CLEAR, function() {
                _this.controlClear();
            });
            Arbiter.subscribe(EVENT_FLOW_OPEN, function() {
                _this._isFlowDesignerOpened = true;
            });
            Arbiter.subscribe(EVENT_FLOW_CLOSE, function() {
                _this._isFlowDesignerOpened = false;
            });

            Arbiter.subscribe(EVENT_FORMDESIGNER_CALL_SET_CURRENT_CONTROL, {async: true}, function(data) {
                _this.setCurrentControl(data.cid);
            });
        },

        /**
         * generate control of type {UI.control} with id defined by Bean
         *
         * @param {Bean} bean
         */
        generateControl: function(bean, newAdded) {
            var controlType = bean.type;
            var controlCreator = util.getObjValueByJPath(window, controlType);
            if (typeof controlCreator != "function") {
                console.error("Control [%s] create failed, because can't find the creator function of control type [%s].", bean.id, controlType);
                return null;
            }
            // TODO, set the parent of new control
            var containerId = bean.parentId || "controlContainer";
            var control = new controlCreator(containerId);
            control.id = bean.id;

            var designerCreator = util.getObjValueByJPath(window, control.designerType);
            if (typeof designerCreator != "function") {
                console.warn("Can't find the creator function of control designer [%s], use the base designer instead.",
                    control.designerType);
                designerCreator = UI.Designer;
            }
            var designer = new designerCreator(control);
            control.designer = designer;
            designer.render();
            control.setStyle({"position": "relative" });
            //set width  and height
            if (newAdded) {
                //set the default width and height
                if (designer.defaultWidth)
                    designer.setPropValue("width", designer.defaultWidth + "px");
                else
                    designer.setPropValue("width", "98%");
                if (designer.defaultHeight)
                    designer.setPropValue("height", designer.defaultHeight + "px");
                else
                    designer.setPropValue("height",  "auto");
            }

            // add control to array
            this.controls.push(control);

            // add event handler
            var _this = this;
            var el = control.element;
            var isContainerControl = false;     //control instanceof UI.Table
            if (!isContainerControl) {
                //bind event handlers with event capture but not event bubble
                el.addEventListener("click", function(e) {
                    _this.controlClicked(control.id);
                    e.stopPropagation();
                }, true);
                el.addEventListener("keydown", function(e) {
                    e.stopPropagation();
                }, true);
                el.addEventListener("keypress", function(e) {
                    e.stopPropagation();
                }, true);
                el.addEventListener("dblclick", function(e) {
                    e.stopPropagation();
                }, true);
            }
            else {
                el.addEventListener("click", function(e) {
                    _this.controlClicked(control.id);
                    e.stopPropagation();
                }, false);
                el.addEventListener("dblclick", function(e) {
                    e.stopPropagation();
                }, false);
            }
            this.setDragEventHandler(control.id);

            control.bind(UI.Event.Resized, function(){
                _this.handleControlResized(this);
            });
            return control;
        },

        /**
         * update control properties and broadcast the changes
         *
         * @param {Bean} update property of UI.control according to bean
         * @param {newAdded}
         */
        updateControlProperties: function(bean, newAdded) {
            var control = this.getControlByControlId(bean.id);
            if (!control) {
                return;
            }

            var designer = control.designer;
            var propMetas = designer.meta.props;

            if (newAdded) {
                //update beans props value by reading from control
                for (var propName in bean.props) {
                    if (!bean.props.hasOwnProperty(propName) || !(propName in propMetas))
                        continue;
                    var defaultValue = propMetas[propName].defaultValue;
                    if (defaultValue || defaultValue == false) {
                        designer.setPropValue(propName, defaultValue);
                    }
                    bean.props[propName] = designer.getPropValue(propName);
                }
            }
            else {
                for (var propName in bean.props) {
                    if (!bean.props.hasOwnProperty(propName))
                        continue;
                    var propValue = bean.props[propName];
                    if (util.inArray(STYLE_PROPERTIES, propName)) {
                        //styles
                        if (propValue)
                            designer.setPropValue(propName, propValue);
                    }
                    else {
                        designer.setPropValue(propName, propValue);
                    }
                }
            }

            //add properties new declared in metadata
            for (var propName in propMetas) {
                if (propName == "id" || propName == "type" || propName in bean.props)
                    continue;
                bean.props[propName] = designer.getPropValue(propName); // || propMetas[propName].defaultValue || "";
            }
            //remove the deprecated properties undeclared in metadata
            var deleted = [];
            for (var propName in bean.props) {
                if (!(propName in propMetas ))
                    deleted.push(propName);
            }
            for (var i = 0; i < deleted.length; i++) {
                delete  bean.props [ deleted[i]];
            }
        },

        /**
         * insert the control to certain index of the form
         *
         * @param {String} control id
         * @param {Number} index
         * @param {Number} page number
         */
        insertControlToIndex: function(controlId, index, pageNo, isNew) {
            var $control = this.getControlObjectByControlId(controlId);
            if (!isNew) {
                $control.remove();
            }

            var pageId = this.getPageIdByIndex(pageNo);
            var $page = $("#" + pageId);
            var $controls = this.getControlsByPageId(pageId);
            if (index == 0) {
                $page.prepend($control);
                return;
            }
            if (index >= $controls.length) {
                $page.append($control);
                return;
            }
            var $nextControl = $($controls[index]);
            if ($nextControl.attr('id') == $control.attr('id')) {
                $nextControl = $($controls[index + 1]);
            }
            $control.insertBefore($nextControl);
        },

        /**
         * calculate the index of control(new or existing) in
         * control container according to coordinate.
         *
         * @param {Number} left relative to the canvas
         * @param {Number} top relative to the canvas
         * @returns {Number} index
         */
        calculateIndex: function(left, top) {
            var index;
            var pageId = this.getPageIdByIndex(this.curPageIndex);
            var $controls = this.getControlsByPageId(pageId);

            if (top <= 0) {
                return 0;
            }

            var i;
            for (i = 0; i < $controls.length; i++) {
                var $curControl = $($controls[i]);
                var curControlId = $curControl.attr('id');

                var pos = $curControl.position();
                var curLeft = pos.left;
                var curTop = pos.top;
                var curBottom = pos.top + $curControl.outerHeight();

                if (top >= curTop && top <= curBottom) {
                    index = i + 1;
                    break;
                }
            }
            if (i == $controls.length) {
                index = i;
            }

            return index;
        },

        /**
         * get index of control by control id, -1 for not found.
         *
         * @param {String} control id
         * @returns {Number} index
         */
        getControlIndex: function(controlId) {
            var pageId = this.getPageIdByIndex(this.curPageIndex);
            var $controls = this.getControlsByPageId(pageId);
            for (var i = 0; i < $controls.length; i++) {
                var $curControl = $($controls[i]);
                if (controlId == $curControl.attr('id')) {
                    return i;
                }
            }
            return -1;
        },

        /**
         * get index of control by position and control id
         *
         * @param {Number} left
         * @param {Number} top
         * @param {String} control id
         * @returns {Number} index
         */
        getControlIndexAfterDragged: function(left, top, controlId) {
            var index;
            var $control = this.getControlObjectByControlId(controlId);
            var pageId = this.getPageIdByIndex(this.curPageIndex);
            var $controls = this.getControlsByPageId(pageId);

            if (top <= 0) {
                return 0;
            }

            var i;
            for (i = 0; i < $controls.length; i++) {
                var $curControl = $($controls[i]);
                var curControlId = $curControl.attr('id');
                if (curControlId == controlId) {
                    var oldTop = this.draggedControlPos.top;
                    var oldBottom = this.draggedControlPos.top + $control.outerHeight();
                    if (top >= oldTop && top <= oldBottom) {
                        index = i;
                        break;
                    }
                    continue;
                }

                var pos = $curControl.position();
                var curLeft = pos.left;
                var curTop = pos.top;
                var curBottom = pos.top + $curControl.outerHeight();

                if (top >= curTop && top <= curBottom) {
                    index = i;
                    break;
                }
            }

            if (i == $controls.length) {
                index = i - 1;
            }

            // console.log("control id: " + controlId + " [left: " + left + " top: " + top + "]
            // index: " + index);
            return index;
        },

        /**
         * get jquery object by control id, BE CAUTIOUS! It looks like the function "getControlByControlId".
         *
         * @param {String} control id
         * @returns {Jquery Object}
         */

        getControlObjectByControlId: function(controlId) {
            $control = $("#controlContainer [id=" + controlId + "]");
            return $control ? $control : null;
        },

        /*
         * operation on controls array.
         */

        /**
         * get UI.control by control id
         *
         * @param {String} control id
         * @returns {UI.control}
         */
        getControlByControlId: function(controlId) {
            for (var i = 0; i < this.controls.length; i++) {
                if (this.controls[i].id == controlId) {
                    return this.controls[i];
                }
            }
            return null;
        },

        /**
         * remove control from controls array
         *
         * @param {String} control id
         */
        removeControlByControlId: function(controlId) {
            for (var i = 0; i < this.controls.length; i++) {
                var control = this.controls[i];
                if (control.id == controlId) {
                    this.controls.splice(i, 1);
                    return;
                }
            }
        },

        /**
         * remove controls belong to given page no
         *
         * @param {Number} page number
         */
        removeControlsByPageIndex: function(pageNo) {
            var pageId = this.getPageIdByPageNo(pageNo);
            var $controls = this.getControlsByPageId(pageId);
            for (var i = 0; i < $controls.length; i++) {
                this.removeControlByControlId($($controls[i]).attr('id'));
            }
        },

        /**
         * clear controls array
         */
        clearControlsArray: function() {
            this.controls = [];
        },

        /*
         * control clicked
         */
        controlClicked: function(controlId) {
            $("#controlContainer").find("#controlHighlight").hide();
            this.highlightSelectedControl(controlId);
            Arbiter.publish(EVENT_FORMDEISGNER_CONTROL_CLICK, {
                id: controlId
            }, {
                async: true
            });
        },

        controlDblClicked: function(controlId) {
            this.highlightSelectedControl(controlId);
        },

        handleControlResized: function(control){
            this.highlightSelectedControl(this.currentSelectedControlId);
        },

        highlightSelectedControl: function(controlId) {

            if (controlId == "") {
                return;
            }
            var $currentSelectedControl;
            if (this.currentSelectedControlId != "") {
                $currentSelectedControl = this.getControlObjectByControlId(this.currentSelectedControlId);
                $currentSelectedControl.css('opacity', "1");
            }

            var $controlSelected = $("#controlSelected");
            var $control = $("#" + controlId);
            $control.css('opacity', "0.7");

            var pos = $control.position();
            var left = pos.left = 2;
            var top = pos.top;
            if ($("#canvasDesign").scrollTop() > 0) {
                top += $("#canvasDesign").scrollTop();
            }
            $controlSelected.css('left', left + "px");
            $controlSelected.css('top', top + "px");
            $controlSelected.css('width', $control.outerWidth());
            $controlSelected.css('height', $control.outerHeight());
            $controlSelected.css('display', 'block');

            this.currentSelectedControlId = controlId;
        },

        unhighlight: function() {
            this.currentSelectedControlId = "";
            var $controlSelected = $("#controlSelected");
            $controlSelected.css('display', 'none');
        },

        /**
         * get controlId by index, index starts from 0.
         */
        getControlIdByIndex: function(index) {
            var pageId = this.getPageIdByIndex(this.curPageIndex);
            var $controls = this.getControlsByPageId(pageId);
            if (index < 0 || index >= $controls.length) {
                return null;
            }
            return $($controls[index]).attr('id');
        },

        /**
         * get page id by index, index starts from 0
         */
        getPageIdByIndex: function(index) {
            var $pages = $("#controlContainer > [id^=page_]");
            if (index <= 0 || index > $pages.length) {
                return null;
            }
            return $($pages[index - 1]).attr('id');
        },

        /**
         * get page id by pageNo
         */
        getPageIdByPageNo: function(pageNo) {
            return "page_" + pageNo;
        },

        /**
         * get controls by page id
         *
         * @param {String} page id
         * @returns {Array[Jquery Object]} array of jquery object
         */
        getControlsByPageId: function(pageId) {
            var $controls = $("#" + pageId + " > [id!=controlSelected]");
            return $controls;
        },

        /**
         * show page
         */
        showPageByIndex: function(index) {
            var curPageId = this.getPageIdByIndex(this.curPageIndex);
            $("#" + curPageId).hide();
            var pageId = this.getPageIdByIndex(index);
            if (pageId == null) {
                return;
            }

            $("#" + pageId).show();
            this.curPageIndex = index;
            this.unhighlight();
            var $page = $("#" + pageId);
            if ($page.children().length > 0) {
                var firstControlId = $($page.children()[0]).attr("id");
                this.controlClicked(firstControlId);
            }
            else {
                this.controlClicked("");
            }
        },

        /**
         * set drag event for control
         */
        setDragEventHandler: function(controlId) {
            var _this = this;
            var $controlEl = this.getControlObjectByControlId(controlId);
            var controlEl = $controlEl[0];
            var objleft = "";
            var objtop = "";
            var distanceX = 0;
            var distanceY = 0;

            var dragControl = new YAHOO.util.DD(controlId);
            dragControl.subscribe('dragEvent', dragEvent); // draging
            dragControl.subscribe('startDragEvent', startDragEvent); // start drag
            dragControl.subscribe('endDragEvent', endDragEvent); // end drag

            function dragEvent(event) {
                if (!_this._isFlowDesignerOpened) {

                }
                else {
                    $controlEl.css("left", objleft);
                    $controlEl.css("top", objtop);
                    var left = event.e.pageX - $("#layout_center_container").offset().left - distanceX;
                    var top = event.e.pageY - $("#layout_center_container").offset().top - distanceY;
                    $("#flow_ui_moving").css("left", left + "px");
                    $("#flow_ui_moving").css("top", top + "px");
                }
            }

            function startDragEvent(event) {
                if (!_this._isFlowDesignerOpened) {
                    _this.draggedControlIndex = _this.getControlIndex(controlId);
                    _this.draggedControlPos = $("#" + controlId).position();
                }
                else {
                    Arbiter.publish(EVENT_FORMDESIGNER_CONTROL_DRAG_BEGIN, {
                        cid: controlId,
                        time: (new Date()).getTime()
                    });
                    var objOffset = $controlEl.offset();
                    objleft = $controlEl.css("left");
                    objtop = $controlEl.css("top");
                    distanceX = event.x - objOffset.left;
                    distanceY = event.y - objOffset.top;
                    var $uiMoving = $("#flow_ui_moving");
                    $uiMoving.hide();
                    var objLeft = objOffset.left - $("#layout_center_container").offset().left;
                    var objTop = objOffset.top - $("#layout_center_container").offset().top;

                    $uiMoving.width($controlEl.width());
                    $uiMoving.height($controlEl.height());

                    $uiMoving.css("left", objLeft + "px");
                    $uiMoving.css("top", objTop + "px");
                    $uiMoving.css("z-index", 2000);
                    var html = util.buildThumbnailHtml(controlEl);
                    if ($uiMoving.html() != html) {
                        $uiMoving.html(html);
                    }
                    $uiMoving.show();
                }
            }

            function endDragEvent(event) {
                if (!_this._isFlowDesignerOpened) {
                    var $control = $("#" + controlId);
                    var x = $control.position().left;
                    var y = $control.position().top;

                    var index = _this.getControlIndexAfterDragged(x, y, controlId);
                    _this.insertControlToIndex(controlId, index, _this.curPageIndex, false);
                    $control.css('left', 'auto');
                    $control.css('top', 'auto');
                    _this.highlightSelectedControl(controlId);

                    if (index != _this.draggedControlIndex) {
                        Arbiter.publish(EVENT_MODEL_REORDER, {
                            'id': controlId,
                            'newPageIndex': index
                        }, {
                            async: true
                        });
                    }
                    _this.draggedControlIndex = -1;
                    _this.draggedControlPos = null;
                }
                else {
                    Arbiter.publish(EVENT_FORMDESIGNER_CONTROL_DRAG_END, {
                        cid: controlId,
                        time: (new Date()).getTime()
                    });
                    distanceX = 0;
                    distanceY = 0;
                    objleft = "";
                    objtop = "";
                    $("#flow_ui_moving").hide();
                }
            }
        },

        /*
         * subscription response function
         */

        /*
         * toolbar about
         */
        controlDropFromToolbar: function(data) {
            var x = data.x;
            var y = data.y;
            var controlType = data.controlType;


            var canvasDesignRect = $('#canvasDesign')[0].getBoundingClientRect();
            var left = canvasDesignRect.left;
            var right = canvasDesignRect.right;
            var top = canvasDesignRect.top;
            var bottom = canvasDesignRect.bottom;

            if (x < left || x > right || y < top || y > bottom) {
                console.info("dropping control out of range.");
                return;
            }

            x = x - left;
            y = y - top;

            var index = this.calculateIndex(x, y);

            var newBean = new Bean();
            newBean.pIndex = index;
            newBean.type = controlType;
            newBean.pageNo = this.curPageIndex;
            newBean.props = newBean.props || {};
            var meta = metaHub.getUiMetadata(controlType);
            if (meta && meta.props) {
                for (var propName in meta.props) {
                    if (propName == "id" || propName == "type")
                        continue;
                    var propMeta = meta.props[propName];
                    newBean.props[propName] =  propMeta.defaultValue ;
                }
            }

            Arbiter.publish(EVENT_MODEL_ADD, {
                'bean': newBean
            }, {
                async: true
            });
        },

        toolbarDelete: function() {
            if (this.currentSelectedControlId != "") {
                Arbiter.publish(EVENT_MODEL_REMOVE, {
                    'id': this.currentSelectedControlId
                }, {
                    async: true
                });
            }
        },

        /*
         * control about
         */
        controlAdd: function(bean, newAdded) {
            this.generateControl(bean, newAdded);
            this.insertControlToIndex(bean.id, bean.pIndex, bean.pageNo, true);
            this.updateControlProperties(bean, newAdded);
            this.controlClicked(bean.id);
        },

        controlRemove: function(data) {

            console.log("form: remove control: [" + data.id + "]");

            var controlId = data.id;
            var $control = this.getControlObjectByControlId(controlId);
            if ($control == null) {
                return;
            }
            // reset the current selected control
            var removedControlIndex = this.getControlIndex(controlId);
            var nextControlId = this.getControlIdByIndex(removedControlIndex + 1);
            var preControlId = this.getControlIdByIndex(removedControlIndex - 1);

            this.removeControlByControlId(controlId);
            $control.remove();

            if (nextControlId != null) {
                this.highlightSelectedControl(nextControlId);
                this.controlClicked(nextControlId);
            }
            else if (preControlId != null) {
                this.highlightSelectedControl(preControlId);
                this.controlClicked(preControlId);
            }
            else {
                this.unhighlight();
            }

        },

        controlRename: function(data) {
            var controlId = data.oldId;
            var $control = this.getControlObjectByControlId(controlId);
            if ($control == null) {
                return;
            }
            $control.attr('id', data.newId);
        },

        controlUpdate: function(data) {
            var controlId = data.id;
            var propName = data.propName;
            var propValue = data.propValue;
            var $control = $("#" + controlId);
            if ($control == null) {
                return;
            }
            if(propName in STYLE_PROPERTIES)
                $control.css(propName, propValue);
        },

        /*
         * page about
         */
        pageAdd: function(newPageNo) {
            var pageNo = newPageNo;
            var $controlContainer = $("#controlContainer");
            this.pageIdNumber += 1;
            var pageId = "page_" + this.pageIdNumber;
            var pageHmtl = "<div id='" + pageId + "' class='page_view' ></div>";
            $controlContainer.append(pageHmtl);
            $("#" + pageId).hide();
            this.showPageByIndex(pageNo);
        },

        pageRemove: function(data) {
            var pageNo = data.pageNo;
            var pageId = this.getPageIdByIndex(pageNo);
            if (pageId == null) {
                return;
            }
            this.removeControlsByPageIndex(pageNo);
            $("#" + pageId).remove();
            // show next page
            pageId = this.getPageIdByIndex(pageNo);
            if (pageId == null) {
                pageId = this.getPageIdByIndex(pageNo);
            }
            $("#" + pageId).show();
        },

        pageSwitch: function(data) {
            var pageNo = data.page;
            if (pageNo == this.curPageIndex) {
                return;
            }
            this.showPageByIndex(pageNo);
        },

        outlinePageClick: function(data) {
            var pageNo = data.page;
            if (pageNo == this.curPageIndex) {
                return;
            }
            this.showPageByIndex(pageNo);
        },

        outlineControlClick: function(data) {
            var controlId = data.id;
            var pageNo = data.pageNo;
            this.showPageByIndex(pageNo);
            this.controlClicked(controlId);
        },

        /*
         * configurator about
         */

        updateProperty: function(data) {
            var controlId = data.id;
            var propName = data.propName;
            var value = data.value;

            var control = this.getControlByControlId(controlId);
            var designer = control.designer;
            var oldValue = designer.getPropValue(propName);
            designer.setPropValue(propName, value);
            var newValue = designer.getPropValue(propName);
            if (oldValue != newValue) {
                //we use a hack way to async property value between control and model
                var bean = modelManager.get(controlId);
                if(bean && bean.props){
                    for (var key in bean.props) {
                        bean.props[key] = designer.getPropValue(key);
                    }
                }

                Arbiter.publish(EVENT_MODEL_UPDATE, {
                    id: controlId,
                    propName: propName,
                    propValue: newValue
                }, {
                    async: true
                });
            }
            this.controlClicked(controlId);
        },

        /*
         * reload pages and controls
         */
        load: function(pageNumber, beans) {
            this.controlClear();
            var i;
            for (i = 2; i <= pageNumber; i++) {
                this.pageAdd(i);
            }
            beans = beans || [];

            // sort beans by page and index
            beans.sort(function(a, b) {
                if (a.pageNo == b.pageNo) {
                    return a.pIndex - b.pIndex;
                }
                else {
                    return a.pageNo - b.pageNo;
                }
            });
            for (i = 0; i < beans.length; i++) {
                this.controlAdd(beans[i], false);
            }
            this.pageSwitch({
                page: 1
            });
        },

        /*
         * clear
         */
        controlClear: function() {
            // unhighlight
            this.unhighlight();

            // remove all pages and control in it.
            var $pages = $("#controlContainer > [id^=page]");
            for (var i = 0; i < $pages.length; i++) {
                var pageId = $($pages[i]).attr('id');
                $("#" + pageId).remove();
            }

            // reset some variables
            this.curPageIndex = 1;
            this.pageIdNumber = 1;

            // add a default page
            var pageHtml = "<div id='page_1' class='page_view'></div>";
            $("#controlContainer").append(pageHtml);

            this.clearControlsArray();
        },

        setCurrentControl: function(controlId) {
            if (!this.getControlByControlId(controlId))
                return;
            var $pages = $("#controlContainer").children(".page_view");
            var $myPage = $("#controlContainer").find("#" + controlId).parents(".page_view").first();
            if ($myPage.length == 0)
                return;
            var pageNo = 0;
            for (var i = 0; i < $pages.length; i++) {
                if ($pages[i] == $myPage[0]) {
                    pageNo = i + 1;
                    break;
                }
            }
            if (pageNo == 0)
                return;
            if (this.curPageIndex != pageNo)
                this.showPageByIndex(pageNo);
            this.controlClicked(controlId);
        }

    });
    return {

        init: init,

        getOffsetWidth: function() {
            return $("#form_designer_container")[0].offsetWidth;
        },

        getControlHtml: function(controlId) {
            var el = $("#canvasDesign").find("#" + controlId)[0];
            if (!el)
                return null;
            return   util.buildThumbnailHtml(el);
        },

        getControlSize: function(controlId) {
            var $el = $("#canvasDesign").find("#" + controlId);
            var width = $el.width();
            var cssWidth = $el.css("width") || "%";
            if (cssWidth.indexOf("%") > 0 && width == parseInt(width)) {
                width = parseInt($("#canvasDesign").width() * parseInt(width) / 100);
            }
            return {
                width: width,
                height: $el.height()
            };
        },

        getPageThumbHtml: function(pageNo) {
            var html = $("#controlContainer").children(".page_view").eq(pageNo - 1).html();
            html = ( html || "").replace(/ id="/g, " thumb-id=\"").replace(/ id='/g, " thumb-id='");
            return html;
        },

        highlightUiControl: function(controlId) {
            var $highlight = $("#controlContainer").find("#controlHighlight");
            var $control = $("#controlContainer").find("#" + controlId);
            if ($control.length == 0)
                return;
            var $page = $control.parents(".page_view").first();
            if ($page.css("display") == "none") {
                $highlight.hide();
                return;
            }
            var pos = $control.position();
            var left = pos.left;
            var top = pos.top - 1;
            if ($("#canvasDesign").scrollTop() > 0) {
                top += $("#canvasDesign").scrollTop();
            }
            $highlight.css('left', left + "px");
            $highlight.css('top', top + "px");
            $highlight.width($control.outerWidth() + 3);
            $highlight.height($control.outerHeight() + 2);
            $highlight.show();
        },

        clearUiControlHighlight: function() {
            $("#controlContainer").find("#controlHighlight").hide();
        }
    };

});