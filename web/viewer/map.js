var init_lat = 40.441427;
var init_lng = -80.010069;
var init_zoom = 16;
if(window.location.href.indexOf("#map=") > -1){
  var spot = window.location.href.split("#map=")[1].split("/");
  init_zoom = spot[0] * 1 || init_zoom;
  init_lat = spot[1] * 1 || init_lat;
  spot[2] = spot[2].replace(/[A-z]+/,"").replace("&","");
  init_lng = spot[2] * 1 || init_lng;
}

var map = L.mapbox.map("map")
  .setView([init_lat, init_lng], init_zoom)
  .addControl(L.mapbox.geocoderControl('mapmeld.map-x20zuxfw'))
  .addControl(L.mapbox.shareControl());

map.on('moveend', function(){
  parent.location.hash = "map="
    + map.getZoom()
    + "/" + map.getCenter().lat.toFixed(6)
    + "/" + map.getCenter().lng.toFixed(6);
});

$("#map").append($("<div>").css({ position: "fixed", background: "#ccc", opacity: 0.85, bottom: 0, right: 0 }).html("Data &copy 2016 OpenStreetMap contributors - Vector Tiles from MapZen - Crayonized by <a href='https://twitter.com/mapmeld'>@mapmeld</a>"));

var canvasLand = L.tileLayer.canvas();
canvasLand.drawTile = function(canvas, tilePoint, zoom) {
  $.getJSON("https://tile.nextzen.org/tilezen/vector/v1/256/all/{z}/{x}/{y}.json?api_key=fgUyV10ySEuZkdmyOjGWTA"
      .replace("{z}", zoom)
      .replace("{x}", tilePoint.x)
      .replace("{y}", tilePoint.y), function(tileData){
    if(!tileData){
      return;
    }

    var bounds = getTileBounds(tilePoint.x, tilePoint.y, zoom);
    var south = bounds[0];
    var west = bounds[1];
    var north = bounds[2];
    var east = bounds[3];

    var lltoxy = function(latlng){
	  // convert a lat/lng to the canvas's x/y format
	  var lat = latlng[1];
	  var lng = latlng[0];
	  return [ Math.round(256 * (lng - west) / (east - west)), Math.round(256 * (north - lat) / (north - south)) ];
    };
    var xyify = function(gpsline){
	  // convert a whole array of lat/lngs to the canvas's x/y format
	  var drawline = [];
	  for(var pt=0;pt<gpsline.length;pt++){
		drawline.push(lltoxy(gpsline[pt]));
	  }
	  return drawline;
	};

    var ctx = canvas.getContext("2d");

    $.each(tileData.water.features, function(f, feature){
      drawShape(ctx, xyify( feature.geometry.coordinates[0] ),"#00f","#33f");
    });

    $.each(tileData.landuse.features, function(f, feature){
      // determine colorset for this line
      var colorset = [];
      var amenity = feature["properties"]["amenity"] || "";
      var landuse = feature["properties"]["landuse"] || "";
      var leisure = feature["properties"]["leisure"] || "";
      var natural = feature["properties"]["natural"] || "";
      var kind = feature["properties"]["kind"] || "";

      if(amenity == "parking"){
        colorset = ["#444", "#444"];
      }
      if(natural || kind == "park" || kind == "forest" || landuse == "conservation" || leisure == "park" || landuse == "farm" || landuse == "farmland"){
        colorset = ["#050", "#050"];
      }
      if(leisure == "recreation_ground" || kind == "golf_course" || kind == "playground" || amenity == "school" || kind == "school"){
        colorset = ["#6f6", "#6f6"];
      }
      if(leisure == "pitch" || kind == "pitch" || kind == "recreation" || kind == "sports" ){
        colorset = ["#f5f", "#f5f"];
      }
      if(landuse == "residential" || kind == "residential"){
        colorset = ["#777", "#777"];
      }

      if(colorset.length){
        drawShape(ctx, xyify( feature.geometry.coordinates[0] ),colorset[0], colorset[1]);
      }
    });

    $.each(tileData.roads.features, function(f, feature){
      // determine colorset for this line
      var colorset = ["#f00", "#f33", null];
      var highway = feature["properties"]["highway"];
      if(highway == "track" || highway == "cycleway" || highway == "footway"){
        // smaller path
        colorset = ["#fa0", "#fa0", null];
      }
      else if(highway == "motorway"){
        // larger highway
        colorset = ["#f00", "#f33", "big"];
      }

      var coords = feature.geometry.coordinates;
      for(var pt=1;pt<coords.length;pt++){
    var firstpt = lltoxy(coords[pt-1]);
    var nextpt = lltoxy(coords[pt]);
    drawLine(ctx, firstpt[0], firstpt[1], nextpt[0], nextpt[1], colorset[0], colorset[1], colorset[2]);
    }
    });


    $.each(tileData.buildings.features, function(f, feature){
      drawShape(ctx, xyify( feature.geometry.coordinates[0] ),"#C0C0C0","#C0C0C0");
    });

  });
};
canvasLand.addTo(map);


function getTileBounds(tx,ty,zoom){
  var originShift = 2 * Math.PI * 6378137 / 2;

  var pixelsToMeters = function(px, py, zoom){
    var res = (2 * Math.PI * 6378137 / 256) / Math.pow(2, zoom);
    var mx = px * res - originShift;
    var my = py * res - originShift;
    return [mx, my];
  }

  var minMeters = pixelsToMeters(tx*256, ty*256, zoom);
  var maxMeters = pixelsToMeters((tx+1)*256, (ty+1)*256, zoom);
  bounds = [minMeters[0], minMeters[1], maxMeters[0], maxMeters[1]];

  var metersToLatLng = function(mx, my){
    var lng = (mx / originShift) * 180.0;
    var lat = (my / originShift) * 180.0;
    lat = -180 / Math.PI * (2 * Math.atan( Math.exp( lat * Math.PI / 180.0)) - Math.PI / 2.0);
    return new L.LatLng(lat, lng);
  };

  var sw = metersToLatLng(bounds[0], bounds[1]);
  var ne = metersToLatLng(bounds[2], bounds[3]);

  return [ne.lat, sw.lng, sw.lat, ne.lng];
}
