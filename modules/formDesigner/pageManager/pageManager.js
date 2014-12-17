define([ "css!modules/formDesigner/pageManager/pageManager", "text!modules/formDesigner/pageManager/model.json",
        "text!modules/formDesigner/pageManager/page_manager_tmpl.xml",
        "text!modules/formDesigner/pageManager/page_item_tmpl.xml", "util",
        "text!modules/formDesigner/pageManager/page_manager_viewall_tmpl.xml",
        "text!modules/formDesigner/pageManager/page_manager_viewall_page_tmpl.xml" ], function(css, model, tmpl,
        itemTmpl, util, viewAllPageTmpl, pageViewTmpl) {

    var init = function() {

        Arbiter.subscribe("layout/center/rendered", {
            async: true
        }, function(data) {
            var pageBarView = new PageBarView({
                el: $("#" + data.body)
            });
            pageBarView.render();

        });

    };
    var PageBarView = Backbone.View.extend({
        triggerId: "",
        currentPage: 1,
        totalPage: 1,
        maxPage: 12,
        render: function() {
            this.$el.append(tmpl);
            this.subscribe();
        },
        addPageEvent: function() {
            if (this.totalPage < this.maxPage) {
                Arbiter.publish(EVENT_MODEL_ADD_PAGE, null, {
                    async: true
                });
            }
        },
        toPageEvent: function(e) {
            var $pageItem = $(e.target);
            var toPageNo = parseInt($pageItem.attr("page"), 10);
            if (this.currentPage != toPageNo) {
                this.toPage(toPageNo, true);
            }

        },
        viewAllSelectedPageEvent: function(event) {
            var page = $(event.target).attr("name");
            console.info("selected page " + page);
        },
        viewAllPagesEvent: function() {
            this.triggerId = util.uuid(16);
            Arbiter.publish(EVENT_FORMDESIGNER_SUB_VIEW_ALL_PAGE, {
                triggerId: this.triggerId
            });

        },
        removePageEvent: function() {
            var _this = this;
            if (_this.currentPage > 1) {
                Arbiter.publish(EVENT_MODEL_REMOVE_PAGE, {
                    pageNo: _this.currentPage
                }, {
                    async: true
                });
            }
        },
        upPageEvent: function() {
            if (this.currentPage > 1) {
                this.toPage(this.currentPage - 1, true);
            }
        },
        nextPageEvent: function() {
            if (this.currentPage < this.totalPage) {
                this.toPage(this.currentPage + 1, true);
            }
        },
        runEvent: function() {
            Arbiter.publish(EVENT_MODEL_RUN, null, {
                async: true
            });

        },
        addPage: function(page) {
            this.currentPage = page;
            var itemHTML = _.template(itemTmpl, {
                pageNo: page
            });
            $("#page_nav_container_ul").append(itemHTML);
            this.toPage(page);
        },
        removePage: function(pageNo) {
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
        toPage: function(pageNo, publish) {
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
                    page: pageNo
                }, {
                    persist: true,
                    async: true
                });
            }
        },
        viewAllPages: function(triggerId) {
            var _this = this;
            var $view = $("#page_mgr_view_all_panel");
            if ($view.length == 0) {
                $("body").append(viewAllPageTmpl);
            }
            $view = $("#page_mgr_view_all_panel");
            var dataList = [];
            for ( var i = 1; i <= this.totalPage; i++) {
                dataList.push({
                    "name": i,
                    "triggerId": triggerId,
                    "html": this.getPageThumbHtml(i)
                });
            }
            var viewPagesHTML = _.template(pageViewTmpl, {
                datas: dataList
            });
            $view.html(viewPagesHTML);
            $("#page_mgr_view_all_panel .thumbpagediv").click(function(event) {
                Arbiter.publish(EVENT_MASK_SUBSCRIPE_CLOSE);
                _this.closeAllPageView();
                _this.notifySelectedPageFrommPageWall($(event.target));
            });
            Arbiter.publish(EVENT_MASK_SUBSCRIPE_OPEN, {
                "showText": false,
                "showGif": false,
                "zindex": 5
            });
            $view.show();
        },
        closeAllPageView: function() {
            $("#page_mgr_view_all_panel").hide();
        },
        notifySelectedPageFrommPageWall: function($domNode) {
            if ($domNode.attr("class") == "thumbpagediv") {
                var pageNo = parseInt($domNode.attr("name"), 10);
                var triggerId = $domNode.attr("triggerId");
                Arbiter.publish(EVENT_FORMDESIGNER_PUB_VIEW_ALL_PAGE_SELECTED, {
                    "triggerId": triggerId,
                    "pageNo": pageNo
                });
                return;
            } else {
                this.notifySelectedPageFrommPageWall($($domNode.parent()));
            }
        },
        getPageThumbHtml: function(pageNo) {
            var html = $("#controlContainer").children(".page_view").eq(pageNo - 1).html();
            html = html.replace("<div id=", "<div page_id=");
            return html;
        },
        refresh: function(data) {
            var formModel = data || {
                "pageNumber": 1,
                "beans": []
            };
            this.currentPage = 1;
            this.totalPage = formModel.pageNumber;
            $("#page_nav_container_ul").find("div").remove();
            for ( var i = 1; i <= this.totalPage; i++) {
                this.addPage(i);
            }
            this.toPage(1, false);
        },
        subscribe: function() {
            var _this = this;
            Arbiter.subscribe(EVENT_CONTROL_ADD_PAGE, {
                async: true
            }, function(data) {
                _this.totalPage = data.pageNumber;
                _this.addPage(data.newPageNo);
            });
            Arbiter.subscribe(EVENT_CONTROL_REMOVE_PAGE, {
                async: true
            }, function(data) {
                var removePageNo = data.pageNo;
                _this.removePage(removePageNo);
            });

            Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_CLICK_PAGE, {
                async: true
            }, function(data) {
                var clickpage = data.page;
                _this.toPage(clickpage);
            });

            Arbiter.subscribe(EVENT_OUTLINE_PUBLISH_CLICK_CONTROL, {
                async: true
            }, function(data) {
                _this.toPage(data.pageNo);
            });

            Arbiter.subscribe(EVENT_CONTROL_LOAD, function(data) {
                _this.refresh(data);
            });

            Arbiter.subscribe(EVENT_FORMDESIGNER_PUB_VIEW_ALL_PAGE_SELECTED, function(data) {
                if (data.triggerId == _this.triggerId) {
                    var pageNo = data.pageNo;
                    _this.toPage(pageNo, true)
                }
            });
            Arbiter.subscribe(EVENT_FORMDESIGNER_SUB_VIEW_ALL_PAGE, function(data) {
                _this.viewAllPages(data.triggerId);
            });

        },
        events: {
            "click #page_manage_add": "addPageEvent",
            "click #page_manage_delete": "removePageEvent",
            "click #page_manage_up": "upPageEvent",
            "click #page_manage_next": "nextPageEvent",
            "click #page_manage_view_all": "viewAll",
            "click #page_nav_container_ul div": "toPageEvent",
            "click #page_manage_view_all": "viewAllPagesEvent",
            "click #page_manage_run": "runEvent"
        }
    });
    return {

        init: init
    };

});