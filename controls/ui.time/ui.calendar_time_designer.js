/**
 * UI.Calendar_Time Designer
 *
 */
UI.Calendar_Time_Designer = function (control) {
    arguments.callee.superClass.constructor.apply(this, arguments);
    this.defaultWidth = 0;
    this.defaultHeight = 40;
};

extend(UI.Calendar_Time_Designer, UI.Designer);

UI.Calendar_Time_Designer.prototype.meta = UI.extendMeta(UI.Calendar_Time_Designer.prototype.meta, {
    type:"UI.Calendar_Time",
    props:{
		"width":{
			readOnly : true,
			designable: false,
		    browsable: false
		},
		"height":{
			readOnly : true,
			designable: false,
		    browsable: false
		},
		"align": {
		    readOnly: true,
		    designable: false,
		    browsable: false
		},

        time:{
            datatype:"String",
            readOnly:true,
            designable:true
        },
        title :{
        	
            datatype:"String",
            readOnly:false,
            designable:true
        }
    },

    events:{
//        onDateChanged:{params:["newDateString"], icon:"controls/eventicon/change.png" },
        onClick: {params: [], icon:"controls/eventicon/click.png", alias: "click"}
    },

    methods:{_getTime:{alias:"getTime",params:[],output:true},_setTime:{alias:"setTime",params:[{name:"time",alias:"time"}]} },

    defaultProperty:"time",
    defaultEvent:"",
    defaultMethod:""
});


UI.Calendar_Time.prototype.designerType = "UI.Calendar_Time_Designer";
MetaHub.register(UI.Calendar_Time_Designer.prototype.meta);