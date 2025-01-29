const firebaseConfig = {
  apiKey: "AIzaSyD_o-Qd7QmQ9oWICIfWBuHphhP1Am7C0fQ",
  authDomain: "virya-fleet-management.firebaseapp.com",
  databaseURL: "https://virya-fleet-management-default-rtdb.firebaseio.com",
  projectId: "virya-fleet-management",
  storageBucket: "virya-fleet-management.appspot.com",
  messagingSenderId: "863119745777",
  appId: "1:863119745777:web:813640a13729144a143f50",
  measurementId: "G-ZMG5L2FX4F"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', function() {
  // Leaflet map setup
  const map = L.map('map').setView([12.782285, 77.419241], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

 // Create a custom icon
const myIcon = L.icon({
  iconUrl: 'assets/AMR_icon.png', // Replace with the path to your icon image
  iconSize: [50, 50],
  iconAnchor: [12, 12],
  popupAnchor: [0, -35]
});

// Create a static marker with the custom icon
const staticMarker = L.marker([12.782285, 77.419241], {icon: myIcon}).addTo(map); // Example coordinates
staticMarker.bindPopup("This is a static marker");

});

const database = firebase.database();
const amrsRef = database.ref('TKM/amrs');

/*Flash suppressor button */
const flashSuppressorButton = document.getElementById('flashSuppressor');
let flashingEnabled = true; // Flag to track flashing status

flashSuppressorButton.addEventListener('click', () => {
  flashingEnabled = !flashingEnabled; // Toggle the flag

  if (flashingEnabled) {
    flashSuppressorButton.textContent = 'Suppress Flashing';
  } else {
    flashSuppressorButton.textContent = 'Enable Flashing';
  }
});

/* states from realtime database */
amrsRef.on('value', (snapshot) => {
  const amrs = snapshot.val();
  const amrList = document.getElementById('amr-list');
  const bodyContainer = document.getElementById('bodyContainer');
  const alarmSound = document.getElementById('alarmSound');

  amrList.innerHTML = ''; // Clear previous data

  for (const amrId in amrs) {
    const amr = amrs[amrId];
    const amrItem = document.createElement('div');
    amrItem.innerHTML = `
      <h3>AMR ${amrId}</h3>
      <p>X: ${amr.location.x}, Y: ${amr.location.y}</p>
        <p>loc_status: ${amr.localization_status}</p>
      
      
    `;
    amrList.appendChild(amrItem);

    //Alert flashing
    if (amr.localization_status === 'ok' && flashingEnabled) {
      bodyContainer.classList.add('flashing-red');
  /*     alarmSound.play(); // Play the alarm sound */
      
    } else {
      bodyContainer.classList.remove('flashing-red');
    /*   alarmSound.pause(); // Pause the alarm sound
      alarmSound.currentTime = 0; // Reset the audio to the beginning */
    }
   
    // Update state indicators
    const loc_statusIndicator = document.querySelector(`.stateIndicator.loc_status`);
    const priorityIndicator = document.querySelector(`.stateIndicator.priority`);
    const auto_modeIndicator = document.querySelector(`.stateIndicator.auto_mode`);

    // Example logic for updating state indicators based on AMR data
    // You'll need to adjust this based on your actual AMR state values
    if (amr.localization_status === 'ok') {
      loc_statusIndicator.classList.add('good');
    } else if (amr.localization_status === 'null') {
      loc_statusIndicator.classList.add('intermediate');
    } else if (amr.localization_status === 'notOK') {
      loc_statusIndicator.classList.add('bad');
    }

    if (amr.priority === '1') {
      priorityIndicator.classList.add('high');
    } else if (amr.priority === 'null') {
      priorityIndicator.classList.add('medium');
    } else if (amr.priority === '0') {
      priorityIndicator.classList.add('low');
    }

    if (amr.auto_mode === '1') {
      auto_modeIndicator.classList.add('on');
    } else if (amr.auto_mode === '0') {
      auto_modeIndicator.classList.add('off');
    }
  
  }

/* // Clear previous markers (if any)
if (markers) {
  markers.forEach(marker => marker.remove());
}
markers = []; // Reset the markers array */

for (const amrId in amrs) {
  const amr = amrs[amrId];
  const marker = L.marker([12.782285, 77.419241]).addTo(map); // Note: Leaflet uses [latitude, longitude]
  marker.bindPopup(`<h3>AMR ${amrId}</h3><p>Status: ${amr.status}</p>`);
  markers.push(marker);
}
});

