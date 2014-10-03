/**
 * Script to generate the maps
 */

/*
 * Globals
 */

var map;

/*
 * Classes
 */

function Ambulance(code, location) {
	this.code = code;
	this.location = location;
}

function Emergency(location){
	this.location = location;
}

function AmbulanceRoute(ambulance, ambulanceLocationText, routeDistance, routeDuration){
	this.ambulanceCode = ambulance.code;
	this.ambulanceLocation = ambulance.location;
	this.ambulanceLocationText = ambulanceLocationText;
	this.routeDistance = routeDistance;
	this.routeDuration = routeDuration;
}

/*
 * Methods
 */

function getLatLng(lat, lng){
	return new google.maps.LatLng(lat, lng);
}

function addAmbulanceMarkers(ambulances){
	ambulances.forEach(function (ambulance) {
		/*var marker = new google.maps.Marker({
		    position: ambulance.location,
		    title:ambulance.code
		});
		marker.setMap(map);*/
		createMarker(ambulance.location, ambulance.code, "d_simple_text_icon_below&chld=" + ambulance.code + "|12|FF0000|medical|12|FF0000|FFF");
		//&chld=Hospital|12|00F|medical|12|F88|FFF
		//"FE2E2E" use this as the color for the directions
	});
}

function populateAmbulanceRoutes (emergency, ambulances) {
	var service = new google.maps.DistanceMatrixService();
	
	service.getDistanceMatrix({
		origins : getLatLngArray(ambulances),
		destinations : [emergency.location],
		travelMode : google.maps.TravelMode.DRIVING,
		unitSystem : google.maps.UnitSystem.METRIC,
		durationInTraffic : true,
		avoidHighways : false,
		avoidTolls : false
	}, callback);

	function callback(response, status) {
		if (status == google.maps.DistanceMatrixStatus.OK) {
			var origins = response.originAddresses;
			var destinations = response.destinationAddresses;
			var ambulanceRoutes = [];
			
			for (var i = 0; i < origins.length; i++) {
				var results = response.rows[i].elements;
				for (var j = 0; j < results.length; j++) {
					var element = results[j];
					ambulanceRoutes.push(new AmbulanceRoute(
												ambulances[i],
												response.originAddresses[i],
												element.distance,
												element.duration
										));
				}
			}
			
			var closestAmbulanceRoutes = getClosestAmbulanceRoutes(ambulanceRoutes, 5);
			
			populateAmbulanceTable (closestAmbulanceRoutes);
			
			routeAmbulancesToEmergency (emergency, closestAmbulanceRoutes);
			
			routeToHospital (emergency);
		}
	}
}

function compareRoutes(amb1, amb2){
	if (amb1.routeDuration.value < amb2.routeDuration.value)
	     return -1;
	  if (amb1.routeDuration.value > amb2.routeDuration.value)
	    return 1;
	  return 0;
}

//Will return the top max ambulance routes
function getClosestAmbulanceRoutes(ambulanceRoutes, max){
	var returnRoutes = [];
	ambulanceRoutes = ambulanceRoutes.sort(compareRoutes);
	
	//TODO: what if ambulanceRoutes count is less than max
	for (var i = 0; i < max; i++){
		returnRoutes.push(ambulanceRoutes[i]);
	}
	
	return returnRoutes;
}

function populateAmbulanceTable (ambulanceRoutes){
	var ambulanceTable = document.getElementById("ambulanceList");
	for (var i = 0; i < ambulanceRoutes.length; i++) {
		var row = ambulanceTable.insertRow(i+1);
		row.insertCell(0).innerHTML=ambulanceRoutes[i].ambulanceCode;
		row.insertCell(1).innerHTML=ambulanceRoutes[i].ambulanceLocationText;
		row.insertCell(2).innerHTML=ambulanceRoutes[i].routeDistance.text;
		row.insertCell(3).innerHTML=ambulanceRoutes[i].routeDuration.text;
	}
}

function getLatLngArray(list){
	var returnArray = [];
	list.forEach(function (obj){
		returnArray.push(obj.location);
	});
	return returnArray;
}

function routeAmbulancesToEmergency (emergency, ambulanceRoutes){
	var directionsDisplay;
	var request;
	var directionsService;
	
	for (var i=0; i<ambulanceRoutes.length; i++){
		addDirection(ambulanceRoutes[i].ambulanceLocation, emergency.location, "#FE2E2E");
	}
}

//TODO: Cache the result
function routeToHospital (emergency){
	var placesService = new google.maps.places.PlacesService(map);
	var request = {
		    location: emergency.location,
		    radius: '10000',
		    types: ['hospital']
		  };
	
	placesService.nearbySearch(request, function callback(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			//TODO:if no hospitals are returned then expand search
			addDirection(emergency.location, results[0].geometry.location, "#0080FF");
			
			
			//Add marker: 
			//TODO: Find a way to highlight existing one
			createMarker(results[0].geometry.location, "Hospital", "d_map_pin_letter&chld=H|81BEF7");
		}
	});
}

function addDirection(start, end, color){
	var directionsService = new google.maps.DirectionsService();
	
	var request = {
		    origin:start,
		    destination:end,
		    travelMode: google.maps.TravelMode.DRIVING,
			unitSystem : google.maps.UnitSystem.METRIC,
		  };

	directionsService.route(request, function(result, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true, preserveViewport: true, polylineOptions: new google.maps.Polyline({strokeColor:color})});
			//directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
			directionsDisplay.setMap(map);
			directionsDisplay.setDirections(result);
		}
	});
}

function createMarker(location, tooltip, mapsAPIURL){
	var marker = new google.maps.Marker({
	    position: location,
	    title: tooltip,
	    icon:new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst="+ mapsAPIURL,
	            new google.maps.Size(100, 40),
	            new google.maps.Point(0,0),
	            new google.maps.Point(20, 30))//left, up
	});
	marker.setMap(map);
}

function initialize() {
	initializeGUIElements();
	var karachiLatLng = getLatLng(24.866859, 67.013189);
	
	//TODO: Get this from the UI
	var emergency = new Emergency(getLatLng(24.873025, 67.036442));
	
	//TODO: Get from DB
	var ambulances = [new Ambulance ("Edhi-01", getLatLng(24.826887, 67.034962)),
	                  new Ambulance ("Aman-A1", getLatLng(24.856965, 67.003505)),
	                  new Ambulance ("Edhi-02", getLatLng(24.868876, 66.995163)),
	                  new Ambulance ("Chhipa-A", getLatLng(24.900126, 67.046660)),
	                  new Ambulance ("Chhipa-B", getLatLng(24.912341, 67.031768)),
	                  new Ambulance ("Aman-A2", getLatLng(24.939248, 67.100722)),
	                  new Ambulance ("Edhi-03", getLatLng(24.837417, 67.134429)),
	                  new Ambulance ("RedCresent-R1", getLatLng(24.794554, 67.059873)),
	                  new Ambulance ("AghaKhan-AK", getLatLng(24.890603, 67.075064))
					 ];
	
	var mapOptions = {
		center : emergency.location,
		zoom : 13
	};
	map = new google.maps.Map(document.getElementById('map'), mapOptions);
	
	
	addAmbulanceMarkers(ambulances);
	
	populateAmbulanceRoutes (emergency, ambulances);
	
	//Create emergency marker
	//TODO: use an enum
	//TODO: use the location address in the tooltip
	createMarker(emergency.location, "Emergency", "d_map_pin_letter&chld=E|FF8000");
}

function initializeGUIElements(){
	
	//First find all checkboxes.
	for(var i = 1; i<=5 ; i++){
		document.getElementById("emergencyType"+i).addEventListener('change',checkboxChange)
	}
	
}

function checkboxChange(){
	var emergencyArray = [];
	
	for(var i = 1; i<=5 ; i++){
		var theBox = document.getElementById("emergencyType"+i);
		if(theBox.checked){
			emergencyArray.push(theBox.value)
		}
	}
	
	updateAmbulances(emergencyArray)
}

function updateAmbulances(emergencyArray){
	document.getElementById("emergencyNotes").value = "";
	for(var i = 0 ; i < emergencyArray.length ; i++){
		document.getElementById("emergencyNotes").value = document.getElementById("emergencyNotes").value + " " + emergencyArray[i];
	}
}

//Initialize
google.maps.event.addDomListener(window, 'load', initialize);