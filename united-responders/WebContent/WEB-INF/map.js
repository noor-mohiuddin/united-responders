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
		var marker = new google.maps.Marker({
		    position: ambulance.location,
		    title:ambulance.code
		});
		marker.setMap(map);
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
			
			populateAmbulanceTable (ambulanceRoutes);
			
			routeAmbulancesToEmergency (emergency, closestAmbulanceRoutes);
			
			//routeHospital
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

function addEmergencyMarker(emergency){
	var pinColor = "FF8000";
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34));
	var marker = new google.maps.Marker({
	    position: emergency.location,
	    icon:pinImage
	});
	marker.setMap(map);
}

function routeAmbulancesToEmergency (emergency, ambulanceRoutes){
	var directionsDisplay;
	var request;
	var directionsService;
	
	for (var i=0; i<ambulanceRoutes.length; i++){
		
		directionsService = new google.maps.DirectionsService();
	
		request = {
			    origin:ambulanceRoutes[i].ambulanceLocation,
			    destination:emergency.location,
			    travelMode: google.maps.TravelMode.DRIVING,
				unitSystem : google.maps.UnitSystem.METRIC,
			  };
	
		directionsService.route(request, function(result, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				//directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true, polylineOptions: new google.maps.Polyline({strokeColor:"#FFA000"})});
				directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
				directionsDisplay.setMap(map);
				directionsDisplay.setDirections(result);
			}
		});
	}
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
	
	addEmergencyMarker(emergency);
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