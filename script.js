let socket;
// Websocket connection
function connect() {
    socket = new WebSocket('ws://localhost:8765');

    socket.onopen = function(e) {
        console.log('Connected to server');
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'time') {
            updateClock(data.time);
        } else if (data.type === 'motor_status') {
            updateMotorStatus(data.status);
        }
    };

    socket.onclose = function(event) {
        console.log('Disconnected from server');
        setTimeout(connect, 1000);
    };
}

function updateClock(time) {
    const date = new Date(time * 1000);
    updateDigitalClock(date);
    updateAnalogClock(date);
    updateDate(date);
}
// digital clock functionality
function updateDigitalClock(date) {
    let hh = date.getHours(),
        mm = date.getMinutes(),
        ampm;

    if (hh >= 12) {
        hh = hh - 12;
        ampm = 'PM';
    } else {
        ampm = 'AM';
    }

    if (hh === 0) hh = 12;

    hh = hh < 10 ? `0${hh}` : hh;
    mm = mm < 10 ? `0${mm}` : mm;

    document.getElementById('text-hour').innerHTML = `${hh}:`;
    document.getElementById('text-minutes').innerHTML = mm;
    document.getElementById('text-ampm').innerHTML = ampm;
}
// analog clock functionality
function updateAnalogClock(date) {
    const hour = document.getElementById('clock-hour'),
          minutes = document.getElementById('clock-minutes'),
          seconds = document.getElementById('clock-seconds');

    const hh = date.getHours() * 30,
          mm = date.getMinutes() * 6,
          ss = date.getSeconds() * 6;
        
    hour.style.transform = `rotateZ(${hh + mm / 12}deg)`;
    minutes.style.transform = `rotateZ(${mm}deg)`;
    seconds.style.transform = `rotateZ(${ss}deg)`;
}
// date functionality   
function updateDate(date) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayWeek = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    document.getElementById('date-day-week').innerHTML = `${dayWeek},`;
    document.getElementById('date-day').innerHTML = day;
    document.getElementById('date-month').innerHTML = `${month},`;
    document.getElementById('date-year').innerHTML = year;
}

function updateMotorStatus(status) {
    document.getElementById('motor-status').textContent = `Motor Status: ${status}`;
}
// End of clock functionality

// motor control functionality
document.getElementById('action-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const time = document.getElementById('action-time').value;
    const actionType = document.getElementById('action-type').value;
    const durationMinutes = parseInt(document.getElementById('action-duration-minutes').value);
    const durationSeconds = parseInt(document.getElementById('action-duration-seconds').value);
    
    const action = {
        time: time,
        type: actionType,
        duration: durationMinutes * 60 + durationSeconds
    };

    socket.send(JSON.stringify({
        type: 'add_action',
        action: action
    }));

    addActionToList(action);

    e.target.reset();
});

function addActionToList(action) {
    const actionItem = document.createElement('div');
    actionItem.classList.add('action-item');
    
    const [hours, minutes] = action.time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    const formattedTime = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    
    const durationMinutes = Math.floor(action.duration / 60);
    const durationSeconds = action.duration % 60;
    
    actionItem.innerHTML = `
        <span>${formattedTime} - Motor ${action.type}, Duration: ${durationMinutes}m ${durationSeconds}s</span>
        <button onclick="removeAction(this)">Remove</button>
    `;
    document.getElementById('action-list').appendChild(actionItem);
}

function removeAction(button) {
    const actionItem = button.parentElement;
    const actionIndex = Array.from(document.getElementById('action-list').children).indexOf(actionItem);
    
    socket.send(JSON.stringify({
        type: 'remove_action',
        index: actionIndex
    }));

    actionItem.remove();
}
// End of motor control functionality

// lighting control functionality
function updateLightStatus(isOn) {
    const statusIcon = document.querySelector('#light-status i');
    if (isOn) {
        statusIcon.classList.remove('fa-moon');
        statusIcon.classList.add('fa-sun');
    } else {
        statusIcon.classList.remove('fa-sun');
        statusIcon.classList.add('fa-moon');
    }
}

document.getElementById('lighting-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const time = document.getElementById('light-time').value;
    const action = document.getElementById('light-action').value;
    
    addScheduleToList({ time, action });

    // Reset form
    e.target.reset();
});

function addScheduleToList(schedule) {
    const scheduleItem = document.createElement('div');
    scheduleItem.classList.add('schedule-item');
    
    const [hours, minutes] = schedule.time.split(':');
    const formattedTime = new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    scheduleItem.innerHTML = `
        <span>${formattedTime} - Lights ${schedule.action}</span>
        <button onclick="removeSchedule(this)">Remove</button>
    `;
    document.getElementById('lighting-schedule-list').appendChild(scheduleItem);
}

function removeSchedule(button) {
    button.closest('.schedule-item').remove();
}
// Example usage:
// updateLightStatus(true); // For lights on
// updateLightStatus(false); // For lights off

// End of lighting control functionality

// CO2 control functionality
document.getElementById('co2-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const desiredLevel = document.getElementById('co2-level').value;
    // Here you would typically send this value to your backend or device
    console.log(`Desired CO2 level set to ${desiredLevel} ppm`);
});

// Function to update CO2 level (call this when you get new data from your sensor)
function updateCO2Level(level) {
    document.querySelector('.co2-value').textContent = level;
    
    // Update status based on CO2 level
    const statusElement = document.getElementById('co2-status-value');
    if (level < 1000) {
        statusElement.textContent = 'Normal';
        statusElement.style.color = 'green';
    } else if (level < 2000) {
        statusElement.textContent = 'Elevated';
        statusElement.style.color = 'orange';
    } else {
        statusElement.textContent = 'High';
        statusElement.style.color = 'red';
    }
}

// Example usage:
// updateCO2Level(1200);
// End of CO2 control functionality

// Substrate control functionality
function updateSubstrateData(moisture, oxygen, ec) {
    document.getElementById('moisture-value').textContent = moisture.toFixed(2);
    document.getElementById('oxygen-value').textContent = oxygen.toFixed(1);
    document.getElementById('ec-value').textContent = ec.toFixed(2);
}

// Example usage:
// updateSubstrateData(0.35, 21.0, 1.5);
// Test the function to ensure it's updating all values
updateSubstrateData(0.35, 21.0, 1.5);

//End of substrate control functionality

// Irrigation control functionality
document.addEventListener('DOMContentLoaded', function() {
    const zoneCountInput = document.getElementById('zone-count');
    const zoneList = document.getElementById('zone-list');
    const scheduleZoneSelect = document.getElementById('schedule-zone');
    const scheduleSourceSelect = document.getElementById('schedule-source');
    const scheduleForm = document.getElementById('irrigation-schedule-form');
    const activeSchedules = document.getElementById('active-schedules');

    function updateZones() {
        const zoneCount = parseInt(zoneCountInput.value);
        zoneList.innerHTML = '';
        scheduleZoneSelect.innerHTML = '';
        
        for (let i = 1; i <= zoneCount; i++) {
            const zoneName = `Zone ${i}`;
            zoneList.innerHTML += `
                <div class="zone-item">
                    <span>${zoneName}</span>
                    <button onclick="renameZone(${i})" class="btn-small">Rename</button>
                </div>
            `;
            scheduleZoneSelect.innerHTML += `<option value="${i}">${zoneName}</option>`;
        }
    }

    function updateWaterSources() {
        scheduleSourceSelect.innerHTML = '';
        document.querySelectorAll('#water-sources .water-source').forEach(source => {
            const checkbox = source.querySelector('input[type="checkbox"]');
            if (checkbox.checked) {
                scheduleSourceSelect.innerHTML += `<option value="${checkbox.id}">${checkbox.nextElementSibling.textContent}</option>`;
            }
        });
    }

    zoneCountInput.addEventListener('change', updateZones);
    document.getElementById('water-sources').addEventListener('change', updateWaterSources);

    document.getElementById('add-water-source').addEventListener('click', function() {
        const sourceName = prompt('Enter new water source name:');
        if (sourceName) {
            const sourceId = sourceName.toLowerCase().replace(/\s+/g, '-');
            document.getElementById('water-sources').innerHTML += `
                <div class="water-source">
                    <input type="checkbox" id="${sourceId}">
                    <label for="${sourceId}">${sourceName}</label>
                </div>
            `;
            updateWaterSources();
        }
    });

    scheduleForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const zone = scheduleZoneSelect.value;
        const time = document.getElementById('schedule-time').value;
        const duration = document.getElementById('schedule-duration').value;
        const source = scheduleSourceSelect.value;

        activeSchedules.innerHTML += `
            <div class="schedule-item">
                <span>Zone ${zone}: ${time} for ${duration} mins (${source})</span>
                <button onclick="this.parentElement.remove()">Remove</button>
            </div>
        `;

        scheduleForm.reset();
    });

    // Initialize
    updateZones();
    updateWaterSources();
});

function renameZone(zoneIndex) {
    const newName = prompt(`Enter new name for Zone ${zoneIndex}:`);
    if (newName) {
        document.querySelector(`#zone-list .zone-item:nth-child(${zoneIndex}) span`).textContent = newName;
        document.querySelector(`#schedule-zone option[value="${zoneIndex}"]`).textContent = newName;
    }
}
// End of Irrigation control functionality

// You would typically call this function when you receive new data from your sensors
// Drag and drop functionality
let draggedWidget = null;

document.querySelectorAll('.widget').forEach(widget => {
    widget.addEventListener('dragstart', (e) => {
        draggedWidget = e.target;
        e.dataTransfer.setData('text/plain', '');
    });

    widget.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    widget.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedWidget !== e.target) {
            const dashboard = document.querySelector('.dashboard');
            const widgets = Array.from(dashboard.children);
            const fromIndex = widgets.indexOf(draggedWidget);
            const toIndex = widgets.indexOf(e.target);

            if (fromIndex < toIndex) {
                dashboard.insertBefore(draggedWidget, e.target.nextSibling);
            } else {
                dashboard.insertBefore(draggedWidget, e.target);
            }
        }
    });
});

// Theme toggle functionality
const themeButton = document.getElementById('theme-button');
const darkTheme = 'dark-theme';
const iconTheme = 'bxs-sun';

const selectedTheme = localStorage.getItem('selected-theme');
const selectedIcon = localStorage.getItem('selected-icon');

const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light';
const getCurrentIcon = () => themeButton.classList.contains(iconTheme) ? 'bxs-moon' : 'bxs-sun';

if (selectedTheme) {
    document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme);
    themeButton.classList[selectedIcon === 'bxs-moon' ? 'add' : 'remove'](iconTheme);
}

themeButton.addEventListener('click', () => {
    document.body.classList.toggle(darkTheme);
    themeButton.classList.toggle(iconTheme);
    localStorage.setItem('selected-theme', getCurrentTheme());
    localStorage.setItem('selected-icon', getCurrentIcon());
});

connect();

setInterval(() => {
    const now = new Date();
    updateClock(Math.floor(now.getTime() / 1000));
}, 1000);

// Path: server.js