/**
 * UI.BaiduMap Control
 * @param container {string}/{HTMLElement} element
 * @constructor
 * @superClass UI.Control
 * @dependency  http://api.map.baidu.com/api?v=1.5&ak=yourkey
 */
UI.BaiduMap = function(container) {
    arguments.callee.superClass.constructor.apply(this, arguments);
};

extend(UI.BaiduMap, UI.Control, {
    type: "UI.BaiduMap",
    _html: '<div></div>',
    _longitude: 114.08248,
    _latitude: 22.53705,

    _zoom: 13,
    _map: null,

    render: function() {
        if (!this._renderBase())
            return false;
        this._map = new BMap.Map(this._element);
        this.centerAndZoom();
        this._map.addControl(new BMap.NavigationControl());
        // this._map.addControl(new BMap.GeolocationControl());
        this._rendered = true;
        return true;
    },

    getLatitude: function() {
        return this._latitude;
    },

    setLatitude: function(latitude) {
        if (typeof latitude == "string")
            latitude = parseFloat(latitude);
        if (typeof latitude !== "number")
            return;
        this._latitude = latitude;
        this.centerAndZoom();
    },

    getLongitude: function() {
        return this._longitude;
    },

    setLongitude: function(longitude) {
        if (typeof longitude == "string")
            longitude = parseFloat(longitude);
        if (typeof longitude != "number")
            return;
        this._longitude = longitude;
        this.centerAndZoom();
    },

    getCenter: function() {
        return this._longitude + ", " + this._latitude;
    },

    setCenter: function(longitude, latitude) {
        var center = longitude + "," + latitude;
        var array = this.parseLongLat(center);
        if (!array)
            return;
        this._longitude = array[0];
        this._latitude = array[1];
        this.centerAndZoom();
    },

    getZoom: function() {
        return this._zoom;
    },

    setZoom: function(zoom) {
        if (typeof zoom == "string")
            zoom = parseInt(zoom);
        if (typeof zoom != "number")
            return;
        this._zoom = zoom;
        this.centerAndZoom();
    },

    centerAndZoom: function() {
        if (!this._map)
            return;
        var point = new BMap.Point(this._longitude, this._latitude);
        this._map.centerAndZoom(point, this._zoom);
    },

    setCenterAndZoom: function(center, zoom) {
        this._zoom = zoom || this._zoom;
        this.setCenter(center);
    },

    addMarker: function(longitude, latitude, text) {
        if (!longitude || longitude == "") {
            longitude = "116.358222";
            latitude = "39.898884";
        }
        this.setCenter(longitude, latitude);
        if (!text) {
            text = "";
        }
        var marker1 = new BMap.Marker(new BMap.Point(longitude, latitude)); // 创建标注
        this._map.addOverlay(marker1);
        if (text != "") {
            var infoWindow1 = new BMap.InfoWindow(text);
            marker1.addEventListener("click", function() {
                this.openInfoWindow(infoWindow1);
            });
        }
    },

    /**
     *  驾车路线搜索
     * @param from  起始点，地点名或 经纬度字符串
     * @param to     终止点，地点名或 经纬度字符串
     * @example
     *        this.driving("四季花城", "华为基地");
     *        this.driving("114.08248, 22.53705", "114.060538, 22.626434");
     */
    driving: function(fromLong, fromLat, toLong, toLat) {
        if (!this._map)
            return;
        var driving = new BMap.DrivingRoute(this._map, {
            renderOptions: {
                map: this._map,
                /* panel : this._element.id, */
                autoViewport: true
            }
        });
        var from = fromLong + "," + fromLat;
        var to = toLong + "," + toLat;
        this._map.clearOverlays();
        var reg = /^\d+\.?\d*\s*\,\s*\d+\.?\d*$/;
        if (from.match(reg) && to.match(reg)) {
            var fa = this.parseLongLat(from);
            var ta = this.parseLongLat(to);
            var fromPoint = new BMap.Point(fa[0], fa[1]);
            var toPoint = new BMap.Point(ta[0], ta[1]);
            driving.search(fromPoint, toPoint);
        } else {
            driving.search(from, to);
        }
    },

    /**
     * 显示当前我的位置，有可能定位失败
     */
    locate: function() {

    },

    parseLongLat: function(str) {
        if (typeof str !== "string")
            return null;
        var array = str.split(",");
        if (array.length < 2)
            return null;
        var long = parseFloat(array[0].trim());
        var lat = parseFloat(array[1].trim());
        if (isNaN(lat) || isNaN(long))
            return null;
        return [ long, lat ];
    }
});

UI.BaiduMap.prototype.__defineGetter__('latitude', UI.BaiduMap.prototype.getLatitude);
UI.BaiduMap.prototype.__defineSetter__('latitude', UI.BaiduMap.prototype.setLatitude);
UI.BaiduMap.prototype.__defineGetter__('longitude', UI.BaiduMap.prototype.getLongitude);
UI.BaiduMap.prototype.__defineSetter__('longitude', UI.BaiduMap.prototype.setLongitude);
UI.BaiduMap.prototype.__defineGetter__('center', UI.BaiduMap.prototype.getCenter);
UI.BaiduMap.prototype.__defineSetter__('center', UI.BaiduMap.prototype.setCenter);
UI.BaiduMap.prototype.__defineGetter__('zoom', UI.BaiduMap.prototype.getZoom);
UI.BaiduMap.prototype.__defineSetter__('zoom', UI.BaiduMap.prototype.setZoom);
