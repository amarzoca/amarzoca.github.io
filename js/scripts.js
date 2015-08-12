var map;
var geocoder = new google.maps.Geocoder();
var autocomplete, places;

var directionsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer({
	suppressMarkers: true
});

var mid = null;
var markers, resArray = new Array();
var submit = false, done = true, small = false;

$(document).ready(function () {
	if($(window).width() < 992) {
		small = true;
	}
});

google.maps.LatLng.prototype.dist = function (point) {
	return google.maps.geometry.spherical.computeDistanceBetween(this,point);
}

google.maps.Marker.prototype.init = function () {
	this.setMap(map);

	var m=this;
	google.maps.event.addListener(m, 'click', function() {
			m.info.open(map, this);
			map.panTo(this.getPosition());
		});
};

google.maps.Marker.prototype.setMarker = function (loc, which) {

	if(this.getPosition() != loc) {
		this.setPosition(loc);
	}

	var m=this;
	geocoder.geocode({'location': loc}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
				if (results[0]) {

				if(which == 0) 
					$('#here').val(results[0].formatted_address);
		
				if(which == 1) 
					$('#there').val(results[0].formatted_address);

				if(small)
					m.info.setContent(m.message);
				else
					m.info.setContent(m.message + results[0].formatted_address);

				m.info.open(map, m);

				} else {
				window.alert('No results found');
				}
	    } else {
	      window.alert('Could not pinpoint location');
	  	}
	});
}

function getCoord() {
  	var lat = 51.513, lng = -0.11;
  	var here = new google.maps.LatLng(lat, lng);

  	initialize(here);
  	if (navigator.geolocation) {
    	navigator.geolocation.getCurrentPosition(function (res) {
    		lat = res.coords.latitude;
    		lng = res.coords.longitude;
    		here = new google.maps.LatLng(lat, lng);

    		markers[0].setMarker(here, 0);
    		markers[1].setMarker(initFriend(here), 1);
    		map.setCenter(here);
    	});
	} 
	}

	function initFriend(here) {
		return new google.maps.LatLng(here.lat()-0.01, here.lng()-0.04);
	}

function initialize(here) {

	var there = initFriend(here);

    var mapOptions = {
    	center: here,
      	zoom: 13,
      	scaleControl: true
    };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    directionsDisplay.setMap(map);

    var marker = new google.maps.Marker({
  		position: here,
  		draggable:true,
  		icon:'./blue.png',
  		form: new google.maps.places.Autocomplete(document.getElementById('here')),
  		info: new google.maps.InfoWindow({zIndex:1})
	});

	var marker2 = new google.maps.Marker({
  		position: there,
  		draggable:true,
  		icon:'./green.png',
  		form: new google.maps.places.Autocomplete(document.getElementById('there')),
  		info: new google.maps.InfoWindow({zIndex:1})
	});

	markers = new Array(marker,marker2);

		markers.forEach(function(m,i) {

			m.message = ( i==0 ? "You are here" : "Friend is there");
			m.message = "<strong>" + m.message +  "</strong>";
			if(!small)
				m.message += "<strong>:</strong> <small class='pull-right'> (drag marker) </small> <br>";

			m.init();
			m.setMarker(m.getPosition(), i);

    	google.maps.event.addListener(m, 'dragend', function() {
    		this.setMarker(this.getPosition(), i);
    		if(submit) calcRoute(marker, marker2);
  		});

			google.maps.event.addListener(m.form, 'place_changed', function () {
  			var res=m.form.getPlace();
        	m.setPosition(res.geometry.location);
        	map.panTo(m.getPosition());
        	if(submit) calcRoute(marker, marker2);

        	m.info.setContent(m.message + res.formatted_address);
    	});

		});
		map.setCenter(here);


	$('.route').click(function () { 
		if(done) calcRoute(marker,marker2);
		submit=true;
	});

	$('select, input[type="checkbox"]').change(function() {
		if(submit && done) calcRoute(marker,marker2);
	});
}

function clear() {
	resArray.forEach(function (m) {
		m.setMap(null);
	});
	resArray = [];
}

function calcRoute(m1, m2) {

	clear();

	var travel_op=['DRIVING','BICYCLING','WALKING','TRANSIT'];

		var start = m1.getPosition();
	var end = m2.getPosition();
	var request = {
	    origin:start,
	    destination:end,
	    travelMode: google.maps.TravelMode[travel_op[$('select').val()]]
	};
	directionsService.route(request, function(response, status) {
	    if (status == google.maps.DirectionsStatus.OK) {
	    	var m = getMidPoint(response);

	    	if(mid != null) {
	    		mid.setMap(null);
	    		mid.info.close();
	    		mid=null;
	    	}

	    	mid = new google.maps.Marker({
  				draggable: false,
  				icon: './grey.png',
  				position: m,
  				zIndex: 5
			});

			mid.info = new google.maps.InfoWindow({zIndex:5});
	    	mid.message = "<strong> Meet around here </strong> <br>";
	    	mid.init(); 

	    	var len = totalLength(response.routes[0]);
	    	if(small) {
	  				markers.forEach(function(m) {
	  					m.info.close();
	  				});
	  			}

	  		mid.setMarker(m, -1);
	    	directionsDisplay.setDirections(response);
	    	startSearch(m, len);	    		
	    	
		}
	});
}


function totalLength(r) {
	var len = 0;

	for (var i = 0; i < r.legs.length; i++) 
			len += r.legs[i].distance.value;

		console.log(len);
		return len;
}
/*
function solveLargeRoutes(req) {
	var request = {
		location: mid.getPosition(),
		types: ['city_hall'],
		rankBy: google.maps.places.RankBy.DISTANCE
	};

	var service = new google.maps.places.PlacesService(map);
		service.nearbySearch(request, function(res, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				console.log(res[0].geometry.location.lat());
				req.waypoints=[{
					location: res[0].geometry.location,
					stopover:true
				}];
	
			directionsService.route(req, function(response, status) {
	    		if (status == google.maps.DirectionsStatus.OK) {
	    			mid.setPosition(res[0].geometry.location);
	    			mid.info.setContent(mid.message + res[0].name);
	    			mid.info.open(map, mid);

	    			directionsDisplay.setDirections(response);
	    			startSearch(mid.getPosition(), 50000);
	    			return true;
	    		}
	    		else return false;
	    	});
		}
			else 
			{
				alert(status);
				return false;
			}
		});
}*/


function getMidPoint(e) {

	var distance = totalLength(e.routes[0]);
	var route = e.routes[0].overview_path;

	var halfDist = distance/2;
	if (halfDist == 0) return route[0];

	var t = 0, prev=0;
	for(var i = 0; i < route.length-1 && t < halfDist; i++) {
		prev = t;
		t += route[i].dist(route[i+1]);
	}

	if(t == halfDist) return route[i];

	var ratio = (halfDist - prev)/(t - prev);
	return google.maps.geometry.spherical.interpolate(route[i-1], route[i], ratio);

}


function startSearch(x, len) {

	map.setCenter(x);

	var request = {
    	location: x,
    	types: getOptions()
  	};

  	if(len < 10000)
  		request.rankBy = google.maps.places.RankBy.DISTANCE;
  	else 
  		request.radius = len/10;

  	var service = new google.maps.places.PlacesService(map);
  	service.nearbySearch(request, function (results, status) {
  		if (status == google.maps.places.PlacesServiceStatus.OK) {
	    	for (var i = 0; i < results.length && i < 15; i++) {
	      		createMarker(results[i]);
	    	}
	 	}
  	});

}

function getOptions()
{
	var opt = [];

	if($('#r').is(":checked"))
		opt.push('restaurant', 'cafe');

	if($('#h').is(":checked"))
		opt.push('lodging');

	if($('#n').is(":checked"))
		opt.push('night_club','bar');

	if($('#m').is(":checked"))
		opt.push('museum','art_gallery');

	if($('#s').is(":checked"))
		opt.push('shopping_mall', 'clothing_store');

	return opt;
}


var infoRes = new google.maps.InfoWindow({
	zIndex: 10
});

function createMarker(place) {

	var marker = new google.maps.Marker({
    	map: map,
    	position: place.geometry.location,
    	icon: './yellow.png',
    	placeRes: place
  	});

	google.maps.event.addListener(marker, 'click', function() {
  		mid.info.close();

  		if(small) {
	  		markers.forEach(function(m) {
	  			m.info.close();
	  		});
	  	}

		getDetails(this);
  	});

	resArray.push(marker);
  	marker.setMap(map);
}

function getDetails(marker) {
	var request = {
			placeId: marker.placeRes.place_id
	};

	var content = "";

	var service = new google.maps.places.PlacesService(map);
	service.getDetails(request, function (res, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) 
			content = getContent(res);		
		else 
			content = marker.placeRes.name;	

		infoRes.setContent(content);
   		infoRes.open(map, marker);
	});		
	
}

function getContent(e) {

	var cont = "";
	cont += "<strong> " + e.name + "</strong> <br>";
	if(typeof e.vicinity != "undefined") cont += e.vicinity + "<br>";
	if(typeof e.website != "undefined") cont += "<a href='"+e.website+ "' target='_blank'>" + e.website + "</a> <br>";
	if(typeof e.url != "undefined") cont +=  "<a href='"+e.url+ "' target='_blank'> more info </a> <br>";

	return cont;
}					

google.maps.event.addDomListener(window, 'load', getCoord);



