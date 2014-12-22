UI.BaiduMap_Designer = function(control) {
    arguments.callee.superClass.constructor.apply(this, arguments);

    this.defaultWidth = 0;
    this.defaultHeight = 370;
    this.displayMode = UI.DisplayMode.Image;
    this.displayImage = convertPath(control.resourceDir + "ui.baidumap.ef.png");
};

extend(UI.BaiduMap_Designer, UI.Designer);

UI.BaiduMap_Designer.prototype.meta = UI.extendMeta(UI.Designer.prototype.meta, {
    type: "UI.BaiduMap",
    props: {
        center: {
            datatype: "String",
            readOnly: false,
            designable: true
        },
        longitude: {
            datatype: "Float",
            readOnly: false,
            designable: true
        },
        latitude: {
            datatype: "Float",
            readOnly: false,
            designable: true
        },
        zoom: {
            datatype: "Int",
            readOnly: false,
            designable: true
        }
    },
    events: {},
    methods: {
        driving: {
            alias: "drivingLine",
            params: [ {
                name: "fromLong"
            }, {
                name: "fromLat"
            }, {
                name: "toLong"
            }, {
                name: "toLat"
            } ]
        },
        getCenter: {
            params: [],
            output: true
        },
        setCenter: {
            params: [ {
                name: "longitude"
            }, {
                name: "latitude"
            } ]
        },
        addMarker: {
            alias: "addMarker",
            params: [ {
                name: "longitude"
            }, {
                name: "latitude"
            }, {
                name: "text"
            } ]
        },
        getLatitude: {
            params: [],
            output: true
        },
        setLatitude: {
            params: [ {
                name: "latitude"
            } ]
        },

        getLongitude: {
            params: [],
            output: true
        },
        setLongitude: {
            params: [ {
                name: "longitude"
            } ]
        },

        getZoom: {
            params: [],
            output: true
        },
        setZoom: {
            params: [ {
                name: "zoom"
            } ]
        },
    },
    defaultProperty: "center",
    defaultEvent: "",
    defaultMethod: "driving"
});

UI.BaiduMap.prototype.designerType = "UI.BaiduMap_Designer";
MetaHub.register(UI.BaiduMap_Designer.prototype.meta);