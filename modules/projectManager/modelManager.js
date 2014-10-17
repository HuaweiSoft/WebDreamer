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
 * ModelManager module, provide manager features of project data model, such as
 * control/component properties.
 * 
 * @module modelManager
 * @events use Arbiter.subscribe() to bind model event.
 *          Out bound event:          EVENT_CONTROL_***
 *          In bound event: EVENT_MODEL_***
 *          See define.js for  more details.
 */
define([ "HashMap", "controlBean" ], function(HashMap, Bean) {

    var _beans = [];
    var _idMap = new HashMap(); // map of id => index in _beans array
    var _pageNumber = 1;

    var modelManager = {
	NAME : "ModelManager",

	projectName : "",
	projectType : "mobile",
	userName : "",

	load : function(data, pageNumber) {
	    _beans = data || [];
	    _pageNumber = pageNumber;
	    genIdIndexMap();
	    Arbiter.publish(EVENT_CONTROL_LOAD, {
		pageNumber : pageNumber,
		beans : _beans
	    });
	},

	clear : function() {
	    _beans = [];
	    _idMap.clear();
	    _pageNumber = 1;
	    Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPNE, {
		"showText" : true,
		"text" : "Please waiting..."
	    });
	    setTimeout(function() {
		Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE, null, {
		    async : true
		});
	    }, 2000);

	    Arbiter.publish(EVENT_CONTROL_CLEAR, {
		async : true
	    });

	},

	/**
	 * assign new control id
	 * 
	 * @param controlType
	 */
	assignNewId : function(controlType) {
	    var prefix;
	    var lastIndex = controlType.lastIndexOf(".");
	    if (lastIndex == -1)
		prefix = controlType[0].toLowerCase()
			+ controlType[0].substring(1);
	    else
		prefix = controlType[lastIndex + 1].toLowerCase()
			+ controlType.substring(lastIndex + 2);
	    var suffix = 0;
	    while (true) {
		suffix++;
		var id = prefix + "" + suffix;
		if (!this.get(id))
		    return id;
	    }
	},

	/**
	 * get control model
	 * 
	 * @param {String} id control id
	 * @returns {Bean} control model
	 */
	get : function(id) {
	    if (!_idMap.containsKey(id)) {
		for ( var i = 0; i < _beans.length; i++) {
		    var bean = _beans[i];
		    if (bean.id == id)
			return bean;
		}
		return null;
	    }
	    var index = _idMap.get(id);
	    if (typeof index != "number")
		return null;
	    return _beans[index];
	},

	/**
	 * get the control property value in model
	 * 
	 * @param {String} id control id
	 * @param propName
	 * @returns {*}
	 */
	getPropValue : function(id, propName) {
	    var bean = this.get(id);
	    if (!bean)
		return null;
	    return bean.props[propName];
	},

	/**
	 * get the control property array object
	 * 
	 * @param id
	 * @returns {Object}
	 */
	getPropArrayObj : function(id) {
	    var bean = this.get(id);
	    if (!bean)
		return null;
	    return bean.props || {};
	},

	/**
	 * get all control modes of the specified page.
	 * 
	 * @param pageNo
	 * @returns {Array}
	 */
	getBeansByPage : function(pageNo) {
	    var result = [];
	    for ( var i = 0; i < _beans.length; i++) {
		var bean = _beans[i];
		if (bean.pageNo == pageNo)
		    result.push(bean);
	    }
	    result.sort(function(b1, b2) {
		return b1.pIndex - b2.pIndex;
	    });
	    return result;
	},

	getPageNumber : function() {
	    return _pageNumber;
	},

	/**
	 * set control property value
	 * 
	 * @param {String}   id
	 * @param {String}  propName
	 * @param {*}   propValue
	 * @param {String} [trigger] trigger module name
	 */
	setPropValue : function(id, propName, propValue, trigger) {
	    var bean = this.get(id);
	    if (!bean)
		return;
	    bean.props[propName] = propValue;
	    Arbiter.publish(EVENT_CONTROL_UPDATE, {
		id : id,
		bean : bean,
		propName : propName,
		propValue : propValue,
		trigger : trigger
	    });
	},

	/**
	 * batch setting control property value
	 * 
	 * @param id
	 * @param {Object}	  props
	 * @param {String} [trigger] trigger module name
	 */
	setMultiPropValues : function(id, props, trigger) {
	    var bean = this.get(id);
	    if (!bean)
		return;
	    var changed = false;
	    for ( var propName in props) {
		if (props.hasOwnProperty(propName)) {
		    bean.props[propName] = props[propName];
		    changed = true;
		}
	    }
	    if (changed) {
		Arbiter.publish(EVENT_CONTROL_UPDATE, {
		    id : id,
		    bean : bean,
		    propName : "*",
		    trigger : trigger
		});
	    }
	},

	/**
	 * add a control model
	 * 
	 * @param {Bean}  bean
	 * @param {String} [trigger] trigger module name
	 * @returns {boolean}
	 */
	add : function(bean, trigger) {
	    var id = this.assignNewId(bean.type);// auto assign id
	    if (bean.pageNo == null || bean.pageNo <= 0
		    || bean.pageNo > _pageNumber) {
		console.warn("Invalid page no '%s'.", bean.pageNo);
		return false;
	    }

	    bean.id = id;
	    bean.props = bean.props || {};

	    // TODO consider container controls
	    var maxIndex = getMaxPageIndex(bean.pageNo);
	    if (bean.pIndex == null || bean.pIndex < 0
		    || bean.pIndex > maxIndex) {
		bean.pIndex = maxIndex + 1;
	    } else {
		// adjuse pageIndex of other controls
		for ( var i = 0; i < _beans.length; i++) {
		    var obj = _beans[i];
		    if (obj.pageNo == bean.pageNo && obj.pIndex >= bean.pIndex)
			obj.pIndex++;
		}
	    }
	    _beans.push(bean);
	    _idMap.put(id, _beans.length - 1);
	    Arbiter.publish(EVENT_CONTROL_ADD, {
		id : id,
		bean : bean,
		trigger : trigger
	    });
	    return true;
	},

	/**
	 * remove a control model
	 * 
	 * @param id
	 * @param trigger
	 * @returns {boolean}
	 */
	remove : function(id, trigger) {
	    var bean, index;
	    if (_idMap.containsKey(id)) {
		index = _idMap.get(id);
		bean = _beans[index];
	    } else {
		for ( var i = 0; i < _beans.length; i++) {
		    if (_beans[i].id == id) {
			bean = _beans[i];
			index = i;
			break;
		    }
		}
	    }
	    if (!bean || index == null)
		return false;
	    _beans.splice(index, 1);
	    genIdIndexMap();
	    Arbiter.publish(EVENT_CONTROL_REMOVE, {
		id : id,
		bean : bean,
		trigger : trigger
	    });
	    return true;
	},

	/**
	 * add a new empty page
	 */
	addPage : function() {
	    _pageNumber++;
	    Arbiter.publish(EVENT_CONTROL_ADD_PAGE, {
		newPageNo : _pageNumber,
		pageNumber : _pageNumber
	    });
	},

	/**
	 * remove the specified page and all controls in the specified page
	 * 
	 * @param pageNo
	 * @param {String}   [trigger] trigger module name
	 * @returns {number} -1 false >=0 deleted controls number
	 */
	removePage : function(pageNo, trigger) {
	    if (pageNo == null || pageNo <= 0 || pageNo > _pageNumber)
		return -1;
	    var deleted = 0;
	    var deletedBeans = [];
	    for ( var i = 0; i < _beans.length - deleted; i++) {
		var bean = _beans[i];
		if (bean.pageNo == pageNo) {
		    deleted++;
		    deletedBeans.push(bean);
		    _beans.splice(i, 1);
		    i--;
		    Arbiter.publish(EVENT_CONTROL_REMOVE, {
			id : bean.id,
			bean : bean,
			trigger : trigger
		    });
		} else if (bean.pageNo > pageNo) {
		    // update page no for other controls
		    bean.pageNo--;
		}
	    }
	    _pageNumber--;
	    if (deleted > 0)
		genIdIndexMap();

	    Arbiter.publish(EVENT_CONTROL_REMOVE_PAGE, {
		pageNo : pageNo,
		removedBeans : deletedBeans,
		trigger : trigger
	    });

	    return deleted;
	},

	/**
	 * rename control id
	 * 
	 * @param oldId
	 * @param newId
	 * @param trigger
	 * @returns {boolean}
	 */
	rename : function(oldId, newId, trigger) {
	    if (!oldId || !newId || oldId == newId)
		return false;
	    var bean = this.get(oldId);
	    if (!bean || this.get(newId))
		return false;
	    // TODO: valid newId format

	    bean.id = newId;
	    var index = _idMap.get(oldId);
	    _idMap.put(newId, index);
	    _idMap.remove(oldId);

	    Arbiter.publish(EVENT_CONTROL_RENAME, {
		id : newId,
		bean : bean,
		oldId : oldId,
		newId : newId,
		trigger : trigger
	    });
	    return true;
	},

	reorder : function(id, newPageIndex) {
	    var bean = this.get(id);
	    if (!bean)
		return false;
	    var maxIndex = getMaxPageIndex(bean.pageNo);
	    if (newPageIndex < 0 || newPageIndex > maxIndex)
		return false;
	    var currentIndex = bean.pIndex;
	    if (currentIndex == newPageIndex)
		return true;
	    this.forEach(function(obj) {
		if (obj != bean && obj.pageNo == bean.pageNo) {
		    if (currentIndex > newPageIndex) {
			if (obj.pIndex >= newPageIndex
				&& obj.pIndex < currentIndex)
			    obj.pIndex++;
		    } else if (currentIndex < newPageIndex) {
			if (obj.pIndex > currentIndex
				&& obj.pIndex <= newPageIndex)
			    obj.pIndex--;
		    }
		}
	    });
	    bean.pIndex = newPageIndex;
	    return true;
	},

	forEach : function(callback, thisObj) {
	    for ( var i = 0; i < _beans.length; i++) {
		var bean = _beans[i];
		var interrupted = false;
		if (thisObj)
		    interrupted = callback.call(this, bean, i);
		else
		    interrupted = callback(bean, i);
		if (interrupted == true)
		    break;
	    }
	},

	/**
	 * get all control _beans
	 * 
	 * @returns {Array} warning： do not change the returned array, just use
	 *          it for reading data
	 */
	getBeans : function() {
	    return _beans;
	},

	toArray : function() {
	    var data = [];
	    for ( var i = 0; i < arguments.length; i++) {
		data.push(_beans[i]);
	    }
	    return data;
	},

	toStructure : function() {

	}

    };

    function genIdIndexMap() {
	_idMap.clear();
	for ( var i = 0; i < _beans.length; i++) {
	    var bean = _beans[i];
	    _idMap.push(bean.id, i);
	}
    }

    function getMaxPageIndex(pageNo) {
	var maxIndex = -1;
	for ( var i = 0; i < _beans.length; i++) {
	    var bean = _beans[i];
	    if (bean.pageNo == pageNo && bean.pIndex > maxIndex)
		maxIndex = bean.pIndex;
	}
	return maxIndex;
    }

    function init() {
	Arbiter.subscribe(EVENT_MODEL_ADD, function(params) {
	    modelManager.add(params.bean, modelManager.NAME);
	});

	Arbiter.subscribe(EVENT_MODEL_REMOVE, function(params) {
	    modelManager.remove(params.id, modelManager.NAME);
	});

	Arbiter.subscribe(EVENT_MODEL_UPDATE, function(params) {
	    modelManager.setPropValue(params.id, params.propName,
		    params.propValue, modelManager.NAME);
	});

	Arbiter.subscribe(EVENT_MODEL_RENAME, function(params) {
	    modelManager.rename(params.oldId, params.newId, modelManager.NAME);
	});

	Arbiter.subscribe(EVENT_MODEL_REORDER, function(params) {
	    modelManager.reorder(params.id, params.newPageIndex,
		    modelManager.NAME);
	});

	Arbiter.subscribe(EVENT_MODEL_ADD_PAGE, function(params) {
	    modelManager.addPage();
	});

	Arbiter.subscribe(EVENT_MODEL_REMOVE_PAGE, function(params) {
	    modelManager.removePage(params.pageNo, modelManager.NAME);
	});
	Arbiter.subscribe(EVENT_MODEL_NEW, function() {
	    modelManager.clear();
	});
    }

    init();

    return modelManager;
});