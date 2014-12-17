/**
 * @module ValueEditor  show a dialog to configure value
 */
define(["css!modules/flowDesigner/flowDesigner", "text!modules/flowDesigner/dialogs/value_edit_tmpl.html",
    "jqueryCommon", "util", "underscore"],
    function(css, tmpl, $, util, _) {

        /**
         * ValueEditor class, used to configure data mapping between service result and ui properties/binding data
         * @param options
         * @param options.container
         * @param options.value
         * @param options.callback  function(value, returnType){}  returnType : 1 OK 0 cancel
         * @param [options.title]
         * @param [options.auto=true] {Boolean}   do not display ok/cancel buttons if set to true
         * @constructor
         */
        var ValueEditor = function(options) {
            this.options = options;
            if (typeof options.container == "String")
                this.container = document.getElementById(options.container);
            else
                this.container = options.container;

            this.value = options.value;
            if (options.auto == false)
                this.autoSave = false;
            else
                this.autoSave = true;

        };

        ValueEditor.prototype = {
            $el: null,
            container: null,
            value: null,
            autoSave: true,
            valueChanged: false,
            options: null,


            $: function(selector) {
                if (this.$el)
                    return this.$el.find(selector);
                else
                    return null;
            },

            show: function() {
                if (this.$el != null) {
                    this.$el.show();
                    return;
                }
                var id = "fve_" + util.uuid(8);
                //var html = _.template(tmpl)({id: id});
                this.$el = $(tmpl);
                this.$el.attr("id", id);

                if(this.options.title)
                    this.$(".modal-title").text(this.options.title );
                var str = this.value == null ? "" : JSON.stringify(this.value);
                this.$("#my_value_input").val(str);
                this.$(".modal-header .close").xbind("click", this.close, this);
                this.$("#my_value_input").xbind("change", function() {
                    this.valueChanged = true;
                }, this);


                $(this.container).append(this.$el);
                this.$el.show();

            },

            close: function() {
                if (this.$el != null) {
                    if (this.valueChanged) {
                        var str = $.trim(this.$("#my_value_input").val());
                        var value = null;
                        if (str)
                            try {
                                value = JSON.parse(str);
                            } catch (e) {
                                value = str;
                            }
                        this.value = value;
                        this.$el.remove();
                        if (typeof  this.options.callback == "function")
                            this.options.callback(value);
                    }
                    else {
                        this.$el.remove();
                    }

                    this.$el = null;
                }
            }

        };

        return ValueEditor;
    });