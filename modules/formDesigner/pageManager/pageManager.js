define([ "css!modules/formDesigner/pageManager/pageManager",
	"text!modules/formDesigner/pageManager/model.json",
	"text!modules/formDesigner/pageManager/page_manager_tmpl.xml",
	"text!modules/formDesigner/pageManager/page_item_tmpl.xml" ], function(
	css, model, tmpl, itemTmpl) {

    var init = function() {

	Arbiter.subscribe("layout/center/rendered", {
	    async : true
	}, function(data) {
	    var pageBarView = new PageBarView({
		el : $("#" + data.body)
	    });
	    pageBarView.render();

	});

    };
    var PageBarView = Backbone.View.extend({
	currentPage : 1,
	totalPage : 1,
	maxPage : 10,
	render : function() {
	    this.$el.append(tmpl);
	    this.subscribe();
	},
	addPageEvent : function() {
	    if (this.totalPage < this.maxPage) {
		Arbiter.publish(EVENT_MODEL_ADD_PAGE, null, {
		    async : true
		});
	    }
	},
	toPageEvent : function(e) {
	    var $pageItem = $(e.target);
	    var toPageNo = parseInt($pageItem.attr("page"), 10);
	    if (this.currentPage != toPageNo) {
		this.toPage(toPageNo, true);
	    }

	},
	removePageEvent : function() {
	    var _this = this;
	    if (_this.currentPage > 1) {
		Arbiter.publish(EVENT_MODEL_REMOVE_PAGE, {
		    pageNo : _this.currentPage
		}, {
		    async : true
		});
	    }
	},
	upPageEvent : function() {
	    if (this.currentPage > 1) {
		this.toPage(this.currentPage - 1, true);
	    }
	},
	nextPageEvent : function() {
	    if (this.currentPage < this.totalPage) {
		this.toPage(this.currentPage + 1, true);
	    }
	},
	viewAll : function(e) {
	    console.info("view all to do");
	},
	addPage : function(page) {
	    this.currentPage = page;
	    var itemHTML = _.template(itemTmpl, {
		pageNo : page
	    });
	    $("#page_nav_container_ul").append(itemHTML);
	    this.toPage(page);
	},
	removePage : function(pageNo) {
	    var pages = $("#page_nav_container_ul").find("div");
	    for ( var i = 0; i < pages.length; i++) {
		var $page = $(pages[i]);
		if (parseInt($page.attr("page"), 10) == pageNo) {
		    $($page.parent()).remove();
		} else if (parseInt($page.attr("page"), 10) > pageNo) {
		    $page.attr("page", parseInt($page.attr("page"), 10) - 1);
		}
	    }
	    if (pageNo == this.totalPage) {
		this.currentPage = this.currentPage - 1;
	    }
	    this.totalPage = this.totalPage - 1;
	    this.toPage(this.currentPage, true);
	},
	toPage : function(pageNo, publish) {
	    this.currentPage = pageNo;
	    var pages = $("#page_nav_container_ul").find("div");
	    for ( var i = 0; i < pages.length; i++) {
		var $page = $(pages[i]);
		if ($page.attr("page") == pageNo) {
		    $page.attr("class", "page_nav_item_selected");
		} else {
		    $page.attr("class", "page_nav_item_unselected");
		}
	    }
	    if (publish) {
		Arbiter.publish(EVENT_FORMDESIGNER_PAGEMANAGER_SWITCH_PAGE, {
		    page : pageNo
		}, {
		    persist : true,
		    async : true
		});
	    }
	},
	refresh : function() {
	    this.currentPage = 1;
	    this.totalPage = 1;
	    var pages = $("#page_nav_container_ul").find("div");
	    for ( var i = 0; i < pages.length; i++) {
		var $page = $(pages[i]);
		if ($page.attr("page") == "1") {
		    $page.attr("class", "page_nav_item_selected");
		} else {
		    $page.remove();
		}
	    }

	},
	subscribe : function() {
	    var _this = this;
	    Arbiter.subscribe(EVENT_CONTROL_ADD_PAGE, {
		async : true
	    }, function(data) {
		_this.totalPage = data.pageNumber;
		_this.addPage(data.newPageNo);
	    });
	    Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE, {
		async : true
	    }, function(data) {
		var removePageNo = data.pageNo;
		_this.removePage(removePageNo);
	    });

	    Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_CLICK_PAGE, {
		async : true
	    }, function(data) {
		var clickpage = data.page;
		_this.toPage(clickpage);
	    });

	    Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_CLICK_CONTROL, {
		async : true
	    }, function(data) {
		_this.toPage(data.pageNo);
	    });

	    Arbiter.subscribe(EVENT_CONTROL_CLEAR, function() {
		_this.refresh();
	    });

	},
	events : {
	    "click #page_manage_add" : "addPageEvent",
	    "click #page_manage_delete" : "removePageEvent",
	    "click #page_manage_up" : "upPageEvent",
	    "click #page_manage_next" : "nextPageEvent",
	    "click #page_manage_view_all" : "viewAll",
	    "click #page_nav_container_ul div" : "toPageEvent"
	}
    });
    return {

	init : init,
    };

});