/**
 * Script to generate the maps
 */
function Ambulance(code, location) {
	this.code = code;
	this.location = location;
}

function getLatLng(lat, lng){
	return new google.maps.LatLng(lat, lng);
}

function addAmbulanceMarkers(ambulances, map){
	ambulances.forEach(function (ambulance) {
		var marker = new google.maps.Marker({
		    position: ambulance.location,
		    title:ambulance.code
		});
		marker.setMap(map);
	});
}

function initialize() {
	var karachiLatLng = getLatLng(24.866859, 67.013189);
	
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
		center : karachiLatLng,
		zoom : 13
	};
	var map = new google.maps.Map(document.getElementById('map'), mapOptions);
	
	addAmbulanceMarkers(ambulances, map);
}

//Initialize
google.maps.event.addDomListener(window, 'load', initialize);
