window.addEventListener('resize', () => {
    if (staticMap && markerContainer) {
        const scaleX = staticMap.clientWidth / staticMap.naturalWidth;
        const scaleY = staticMap.clientHeight / staticMap.naturalHeight;
        markerContainer.style.transform = `scale(${scaleX}, ${scaleY})`;
        markerContainer.style.transformOrigin = 'top left';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    mapContainer = document.getElementById('mapContainer');
    staticMap = document.getElementById('staticMap');
    markerContainer = document.createElement('div');
    markerContainer.style.position = 'absolute';
    markerContainer.style.top = '0';
    markerContainer.style.left = '0';
    markerContainer.style.width = '100%';
    markerContainer.style.height = '100%';
    mapContainer.appendChild(markerContainer);
    window.dispatchEvent(new Event('resize'));
});

document.addEventListener('DOMContentLoaded', () => {
    checkForNewDay();
});

function updateDateTime() {
    const now = new Date();
    const formattedDateTime = now.toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
    document.getElementById('dateTimeDisplay').textContent = formattedDateTime;
}
setInterval(updateDateTime, 1000);

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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const amrsRef = database.ref('TKM/amrs');
const child1Ref = amrsRef.child('amr3/position/x');
const child2Ref = amrsRef.child('amr4/position/x');
const errorChild1Ref = amrsRef.child('amr3/communication');
const errorChild2Ref = amrsRef.child('amr4/communication');

const ERROR_TIMEOUT = 10000; // Timeout for child entry

let updateTimer1 = null;
let updateTimer2 = null;

let child1Updated = false;
let child2Updated = false;

// Function to reset timer for amr3
function resetTimer1() {
    clearTimeout(updateTimer1); // to clear the previous timer for child1
    updateTimer1 = setTimeout(() => {
        // If no update after 10 sec, setting communication status to 'Fail'
        if (!child1Updated) {
            errorChild1Ref.set('Fail');
        }
    }, ERROR_TIMEOUT);
}

// Function to reset timer for amr4
function resetTimer2() {
    clearTimeout(updateTimer2); // to clear the previous timer for child2
    updateTimer2 = setTimeout(() => {
        // If no update after 10 sec, seting communication status to 'Fail'
        if (!child2Updated) {
            errorChild2Ref.set('Fail');
        }
    }, ERROR_TIMEOUT);
}

// Function to handle update for child1
function updateChild1() {
    errorChild1Ref.set('OK'); // If updated, set status to 'OK'
    child1Updated = false; // Reset the flag 
    resetTimer1(); // Reset the timer for child1
}

// Function to handle update for child2
function updateChild2() {
    errorChild2Ref.set('OK'); // If updated, set status to 'OK'
    child2Updated = false; // Reset the flag 
    resetTimer2(); // Reset the timer for child2
}

//listener for child1 (amr3/position/x)
child1Ref.on('value', (snapshot) => {
    updateChild1(); // to reset the timer and mark the entry as updated
});

//listener for child2 (amr4/position/x)
child2Ref.on('value', (snapshot) => {
    updateChild2(); // to reset the timer and mark the entry as updated
});

// Initialize timers on page load
resetTimer1();
resetTimer2();



const mapConfig = {
    width: 520,
    height: 240,
    originX: -40,
    originY: -160
};
const amrColors = { "amr3": "orange", "amr4": "blue", "amr5": "green" };
let mapContainer, staticMap, markerContainer;


// Function to get the color of the AMR based on its status
function getAmrColor(amrStatus) {
    const colors = {
        'green': 'green',
        'yellow': 'yellow',
        'red': 'red',
        // You can add other statuses and their corresponding colors here
    };
    return colors[amrStatus] || 'gray';  // Default to gray if the status is unknown
}

function createMarker(amrId, amrStatus) {
    const marker = document.createElement('div');
    marker.classList.add('marker');
    marker.style.position = 'absolute';
    marker.style.width = '30px';  // Set a fixed size for the circle
    marker.style.height = '30px';
    marker.style.borderRadius = '50%';  // Make the marker a circle
    marker.style.display = 'flex';
    marker.style.alignItems = 'center';  // Center the label vertically
    marker.style.justifyContent = 'center';  // Center the label horizontally
    marker.style.color = 'black';  // Make label text white
    marker.style.fontSize = '16px';  // Adjust font size for the label

    // Set the label (3 or 4) inside the circle
    const label = amrId === 'amr3' ? '3' : amrId === 'amr4' ? '4' : ''; // Display 3 for amr3, 4 for amr4
    marker.innerHTML = `<span class="marker-label">${label}</span>`;

    // Set the color of the marker based on the AMR status
    marker.style.backgroundColor = getAmrColor(amrStatus) || 'gray';  // Get color from AMR status or default to gray
    markerContainer.appendChild(marker);
    return marker;
}


function updateMarkers(amrs) {
    markerContainer.innerHTML = '';
    Object.entries(amrs).forEach(([amrId, amr]) => {
        if (amr && amr.position) {
            // Get the AMR's status
            const amrStatus = amr.loc_stop === 1 ? "red" : amr.obstacle_stop === 1 ? "yellow" : amr.emg_stop === 1 || amr.communication === 'Fail' ? "yellow" : "green";
            // Calculate the marker position
            const { x, y } = calculateMarkerPosition(amr.position.y + 80, amr.position.x - 90);

            // Create the marker with the status color
            const marker = createMarker(amrId, amrStatus);
            positionMarker(marker, x, y);

            marker.classList.add('state-update-animation');
            setTimeout(() => marker.classList.remove('state-update-animation'), 1000);
                }
    });
}

// Function to calculate the marker position in pixels
function calculateMarkerPosition(xMeters, yMeters) {
    const x = ((xMeters - mapConfig.originX) / mapConfig.width) * staticMap.naturalWidth;
    const y = ((yMeters - mapConfig.originY) / mapConfig.height) * staticMap.naturalHeight;
    return { x, y };
}

function positionMarker(marker, x, y) {
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
}

amrsRef.on('value', (snapshot) => {
    const amrs = snapshot.val();
    updateMarkers(amrs);
    Object.entries(amrs).forEach(([amrId, amr]) => {
        updateTable(amr, amrId);
        updateAMRStatusIndicator(amr, amrId);
        checkAndPlaySound(amrs); 
    });
});

function updateTable(amr, amrId) {
    const suffix = amrId === "amr3" ? "03" : amrId === "amr4" ? "04" : null;
    if (!suffix) return;

    const cells = {
        trip: document.getElementById(`amr${suffix}_trip`),
        shift: document.getElementById(`amr${suffix}_shift`), //for second shift
        location: document.getElementById(`amr${suffix}_location`),
        cycle: document.getElementById(`amr${suffix}_cycle`),
        faults: document.getElementById(`amr${suffix}_faults`),
        comm: document.getElementById(`amr${suffix}_comm`),
        mode: document.getElementById(`amr${suffix}_mode`),
        soc: document.getElementById(`amr${suffix}_soc`),
        status: document.getElementById(`amr${suffix}_status`) //for amr status eg:running,waiting,passing
    };

    if (!Object.values(cells).every(cell => cell)) return;

    // Update the cells with new values
    const values = {
        trip: amr.tripCount || '-',
        shift: amr.second_shift || '-',
        location: amr.location || '-',
        cycle: amr.cycleTime || '-',
        faults: amr.faults || '-',
        comm: amr.communication || '-',
        mode: amr.mode || '-',
        soc: amr.soc || '-',
        status: amr.zone_wait || '-'
    };

    Object.keys(values).forEach(key => {
        if (cells[key].textContent !== values[key]) {
            cells[key].textContent = values[key];
            cells[key].classList.add('blinking-cell');
            setTimeout(() => {
                cells[key].classList.remove('blinking-cell');
            }, 1000);
        }

        // Apply red background if battery status (soc) is less than 30
        if (key === 'soc') {
            cells[key].style.backgroundColor = parseInt(values.soc, 10) < 30 ? 'red' : '';
        }
    });

    cells.faults.classList.toggle('flashing-cell', amr.loc_stop === 1);
    cells.comm.classList.toggle('flashing-cell', amr.communication === 'Fail');
    cells.status.classList.toggle('flashing-cell', amr.zone_wait === 'C_error Stop');
}


function updateAMRStatusIndicator(amr, amrId) {
    const cellId = amrId === 'amr3' ? 'amr1' : amrId === 'amr4' ? 'amr2' : null;
    if (!cellId) return;
    
    const cell = document.getElementById(cellId);
    const amrStatus = amr.loc_stop === 1 ? "red" : amr.obstacle_stop === 1 ? "yellow" : amr.emg_stop === 1 || amr.communication === 'Fail' || amr.zone_wait === "C_error Stop" ? "yellow" : "green";
    cell.style.backgroundColor = getAmrColor(amrStatus) || 'gray';
}

function checkAndPlaySound(amrs) {
    const alertSound = document.getElementById('alertSound');
    let shouldPlaySound = false;

    Object.values(amrs).forEach((amr) => {
        if (amr.loc_stop === 1 || amr.zone_wait === "C_error Stop") {
            shouldPlaySound = true;
        }
    });
    if (shouldPlaySound) {
        alertSound.play().catch(error => {
            console.log("Sound play failed:", error);
        });
    } else {
        alertSound.pause();
        alertSound.currentTime = 0;  // Reset sound to the start
    }
}

let currentDate = new Date().toDateString(); // Track the current date

// Function to check if the date has changed
function checkForNewDay() {
    const lastAccessedDate = localStorage.getItem("lastAccessedDate"); // Retrieve the last date from localStorage

    if (!lastAccessedDate || lastAccessedDate !== currentDate) {
        // If it's the first run or the date has changed
        console.log("New day detected. Resetting trip and shift counts.");
        resetTripAndShift();
        localStorage.setItem("lastAccessedDate", currentDate); // Update the stored date
    } else {
        console.log("Same day detected. No reset needed.");
    }
}

function resetTripAndShift() {
    // Define the IDs of the table cells for trip count and second shift
    fault_ref.child('amr3').child('tripCount').set('-')
    fault_ref.child('amr4').child('tripCount').set('-')
    fault_ref.child('amr3').child('second_shift').set('-')
    fault_ref.child('amr4').child('second_shift').set('-')
    // const tripCells = document.querySelectorAll('[id^="amr03_trip"], [id^="amr04_trip"]');
    // const shiftCells = document.querySelectorAll('[id^="amr03_shift"], [id^="amr04_shift"]');
    // tripCells.forEach(cell => {
    //     cell.textContent = "-"; // Reset trip count
    // });

    // shiftCells.forEach(cell => {
    //     cell.textContent = "-"; // Reset shift count
    // });
    console.log('Trip count and second shift reset.');
}


