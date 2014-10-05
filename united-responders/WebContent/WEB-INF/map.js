/**
 * Script to generate the maps
 */

/*
 * Globals
 */

var map;

//TODO: Get from DB
//TODO: Create enums for the emergency types
var ambulances = [new Ambulance ("Edhi-01", getLatLng(24.826887, 67.034962), ["Trauma", "Emergency", "Non-Emergency"]),
                  new Ambulance ("Aman-A1", getLatLng(24.856965, 67.003505), ["Cardiac", "Respiratory", "Trauma", "Emergency", "Non-Emergency"]),
                  new Ambulance ("Edhi-02", getLatLng(24.868876, 66.995163), ["Emergency", "Non-Emergency"]),
                  new Ambulance ("Chhipa-A", getLatLng(24.900126, 67.046660), ["Trauma", "Emergency", "Non-Emergency"]),
                  new Ambulance ("Chhipa-B", getLatLng(24.912341, 67.031768), ["Emergency", "Non-Emergency"]),
                  new Ambulance ("Aman-A2", getLatLng(24.939248, 67.100722), ["Cardiac", "Respiratory", "Trauma", "Emergency", "Non-Emergency"]),
                  new Ambulance ("Edhi-03", getLatLng(24.837417, 67.134429), ["Cardiac", "Respiratory", "Trauma", "Emergency", "Non-Emergency"]),
                  new Ambulance ("RedCresent-R1", getLatLng(24.794554, 67.059873), ["Cardiac", "Respiratory", "Trauma", "Emergency", "Non-Emergency"]),
                  new Ambulance ("AghaKhan-AK", getLatLng(24.890603, 67.075064), ["Cardiac", "Trauma", "Emergency", "Non-Emergency"])
				  ];

var responders = [new Responder ("Javed Shiekh", getLatLng(24.870825, 67.015910), ["Cardiac", "Respiratory"]),
				  new Responder ("Sohaib Sajid", getLatLng(24.820963, 67.026403), ["Cardiac", "Respiratory", "Emergency", "Non-Emergency"]),
				  new Responder ("Bilal Sikander", getLatLng(24.806341, 67.061046), ["Emergency", "Non-Emergency"]),
				  new Responder ("Ali Jamal", getLatLng(24.830233, 67.131728), ["Cardiac", "Trauma"]),
				  new Responder ("Hasnain Barkhurdari", getLatLng(24.830233, 67.131728), ["Respiratory", "Trauma"]),
				  new Responder ("Noor Jalal", getLatLng(24.927589, 67.033162), ["Non-Emergency"]),
				  new Responder ("Haniyyah Khan", getLatLng(24.877886, 67.065735), ["Cardiac", "Respiratory", "Trauma", "Emergency", "Non-Emergency"])
                  ];

var emergency;

/*
 * Classes
 */

function Ambulance(code, location, emergencyTypes) {
	this.code = code;
	this.location = location;
	this.emergencyTypes = emergencyTypes;
}

function Emergency(location){
	this.location = location;
	this.types = [];
}

//TODO: Inheritance
function AmbulanceRoute(ambulance, ambulanceLocationText, routeDistance, routeDuration){
	this.ambulanceCode = ambulance.code;
	this.ambulanceLocation = ambulance.location;
	this.ambulanceLocationText = ambulanceLocationText;
	this.routeDistance = routeDistance;
	this.routeDuration = routeDuration;
}

function Responder(name, location, emergencyTypes){
	this.name = name;
	this.location = location;
	this.emergencyTypes = emergencyTypes;
}

function ResponderRoute(responder, responderLocationText, routeDistance, routeDuration){
	this.responderName = responder.name;
	this.responderLocation = responder.location;
	this.responderLocationText = responderLocationText;
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

function addResponderMarkers(responderRoutes){
	responderRoutes.forEach(function (responderRoute){
		//https://chart.googleapis.com/chart?chst=d_text_outline&chld=00FF00|20|h|0B610B|_|Freshly+Made+Pie
		createMarker(responderRoute.responderLocation, responderRoute.responderName, "d_text_outline&chld=00FF00|12|h|0B610B|_|" + responderRoute.responderName);
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
			
			//TODO: Find a better place to do this
			//TODO: Populate the emergency location
			
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
	
	for (var i = 0; i < Math.min(max,ambulanceRoutes.length); i++){
		returnRoutes.push(ambulanceRoutes[i]);
	}
	
	return returnRoutes;
}

function populateAmbulanceTable (ambulanceRoutes){
	var ambulanceTable = document.getElementById("ambulanceList");
	
	while (ambulanceTable.rows.length > 1){
		ambulanceTable.deleteRow(1);
	}
	
	for (var i = 0; i < ambulanceRoutes.length; i++) {
		var row = ambulanceTable.insertRow(i+1);
		row.insertCell(0).innerHTML=ambulanceRoutes[i].ambulanceCode;
		row.insertCell(1).innerHTML=ambulanceRoutes[i].ambulanceLocationText;
		row.insertCell(2).innerHTML=ambulanceRoutes[i].routeDistance.text;
		row.insertCell(3).innerHTML=ambulanceRoutes[i].routeDuration.text;
	}
}

function populateRespondersTable (responderRoutes){
	var responderTable = document.getElementById("responderList");
	
	while (responderTable.rows.length > 1){
		responderTable.deleteRow(1);
	}
	
	for (var i = 0; i < responderRoutes.length; i++) {
		var row = responderTable.insertRow(i+1);
		row.insertCell(0).innerHTML=responderRoutes[i].responderName;
		row.insertCell(1).innerHTML=responderRoutes[i].responderLocationText;
		row.insertCell(2).innerHTML=responderRoutes[i].routeDistance.text;
		row.insertCell(3).innerHTML=responderRoutes[i].routeDuration.text;
	}
}

function resetAmbulanceTable(){
	var ambulanceTable = document.getElementById("ambulanceList");
	for (var i = 1; i < ambulanceTable.rows.length; i++) {
		ambulanceTable.deleteRow(i);
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
			//TODO: Update Hospital location
			
			
			//TODO:if no hospitals are returned then expand search
			addDirection(emergency.location, results[0].geometry.location, "#0080FF");
			
			
			//Add marker: 
			//TODO: Find a way to highlight existing one
			createMarker(results[0].geometry.location, "Hospital", "d_map_pin_letter&chld=H|81BEF7");
		}
	});
}

function populateResponderRoutes(emergency, responders) {
	var service = new google.maps.DistanceMatrixService();
	
	service.getDistanceMatrix({
		origins : getLatLngArray(responders),
		destinations : [emergency.location],
		//TODO: change this to walking?
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
			var responderRoutes = [];
			
			for (var i = 0; i < origins.length; i++) {
				var results = response.rows[i].elements;
				for (var j = 0; j < results.length; j++) {
					var element = results[j];
					responderRoutes.push(new ResponderRoute(
												responders[i],
												response.originAddresses[i],
												element.distance,
												element.duration
										));
				}
			}
			
			var closestResponderRoutes= getClosestResponderRoutes(responderRoutes, 5000);
			
			//Add to map
			addResponderMarkers(closestResponderRoutes);
			
			//Populate route table
			populateRespondersTable (closestResponderRoutes);			
		}
	}
}

//Get the closest routes. Distance in meters
function getClosestResponderRoutes(responderRoutes, maxDistance){
	var returnRoutes = [];
	responderRoutes.forEach(function (responderRoute){
		if (responderRoute.routeDistance.value <= maxDistance){
			returnRoutes.push(responderRoute);
		}
	});
	return returnRoutes;
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
	            new google.maps.Point(0, 10))//left, up (20, 30)
	});
	marker.setMap(map);
}

function filterByEmergencyTypes(col){
	if (emergency.types.length == 0){
		return col;
	} else {
		var returnCol = [];
		col.forEach(function (obj){
			var exists = true;
			for (var i=0; i<emergency.types.length; i++){
				if (obj.emergencyTypes.indexOf(emergency.types[i]) == -1){
					exists = false;
					break;
				}
			}
			if (exists==true){
				returnCol.push(obj);
			}
		});
		
		return returnCol;
	}
}

function initialize() {
	var karachiLatLng = getLatLng(24.866859, 67.013189);
	
	var mapOptions = {
		center : karachiLatLng,
		zoom : 12
	};
	map = new google.maps.Map(document.getElementById('map'), mapOptions);
	
	initializeGUIElements();
	
	addAmbulanceMarkers(ambulances);
}

function initializeGUIElements(){
	
	//First find all checkboxes.
	for(var i = 1; i<=5 ; i++){
		document.getElementById("emergencyType"+i).addEventListener('change', checkboxChange)
	}
	
}

function checkboxChange(){
	if (emergency.location != null){
		emergency.types = [];
		
		for(var i = 1; i<=5 ; i++){
			var theBox = document.getElementById("emergencyType"+i);
			if(theBox.checked){
				emergency.types.push(theBox.value);
			}
		}
				
		//TODO: Filter responders by emergency type
		loadMap(filterByEmergencyTypes(ambulances), filterByEmergencyTypes(responders));
	}
}

function newEmergency(){
	//24.873025, 67.036442
	
	//TODO: Get this from the UI
	emergency = new Emergency(getLatLng(24.820589 + (Math.random()/10), 66.979761 + (Math.random()/10)));
	
	loadMap(ambulances, responders);
}

function loadMap(ambulances, responders){
	var mapOptions = {
			center : emergency.location,
			zoom : 12
		};
	map = new google.maps.Map(document.getElementById('map'), mapOptions);
	
	addAmbulanceMarkers(ambulances);
	
	//Create emergency marker
	//TODO: use an enum
	//TODO: use the location address in the tooltip
	createMarker(emergency.location, "Emergency", "d_map_pin_letter&chld=E|FF8000");
	
	populateAmbulanceRoutes(emergency, ambulances);
	
	populateResponderRoutes(emergency, responders);
}

//Initialize
google.maps.event.addDomListener(window, 'load', initialize);
