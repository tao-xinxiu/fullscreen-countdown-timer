// ===== DOM Elements =====
const countdownEl = document.getElementById("countdown");
const hourInput = document.getElementById("hourInput");
const minuteInput = document.getElementById("minuteInput");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const alarmSound = document.getElementById("alarmSound");
const titleEl = document.getElementById("title");
const timeLine = document.getElementById("timeLine");
const dateLine = document.getElementById("dateLine");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const quickBtnContainer = document.getElementById("quickBtnContainer");
const quickAddContainer = document.getElementById("quickAddContainer");
const quickTweakContainer = document.getElementById("quickTweakContainer");
const nowBtn = document.getElementById("nowBtn"); // Fixed selector
const tweakRow1 = document.getElementById("tweakRow1");
const tweakRow2 = document.getElementById("tweakRow2");
const countdownPreview = document.getElementById("countdownPreview");
const timerSelect = document.getElementById("timerSelect");
const addTimerBtn = document.getElementById("addTimerBtn");
const renameTimerBtn = document.getElementById("renameTimerBtn");
const additionalTimers = document.getElementById("additionalTimers");
const bottomRight = document.querySelector(".bottom-right");
const bottomLeft = document.querySelector(".bottom-left");

// ===== Constants =====
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const increments = [2, 5, 10, 20, 30, 60, 120];
// const tweaks = [-1, -2, -5, -10, -30, 1, 2, 5, 10, 30];
const tweakRow1Mins = [-5, -2, -1, 1, 2, 5];
const tweakRow2Mins = [-60, -30, -10, 10, 30, 60];

// ===== State =====
let timer;
let remainingTime = 0;
let wakeLock = null;
let timers = {
    main: {
        name: "Main Timer",
        target: null,
        remaining: 0,
        timer: null,
        isRunning: false
    }
};
let currentTimerId = "main";
let timerOrder = ["main"]; // Track the order of timers

// ===== Utility Functions =====
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    // Always use hh:mm:ss format for consistent alignment
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateCurrentTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dateStr = now.toISOString().split('T')[0];
    const weekday = weekdays[now.getDay()];
    timeLine.textContent = `${hh}:${mm}:${ss}`;
    dateLine.textContent = `${dateStr} ${weekday}`;
}

function updateCountdownPreview() {
    const h = parseInt(hourInput.value, 10);
    const m = parseInt(minuteInput.value, 10);
    
    if (isValidHourMinute(h, m)) {
        const target = getTargetTime(h, m);
        const now = new Date();
        const remainingSeconds = Math.floor((target - now) / 1000);
        
        if (remainingSeconds > 0) {
            const hours = Math.floor(remainingSeconds / 3600);
            const minutes = Math.ceil((remainingSeconds % 3600) / 60);
            
            let previewText = "";
            if (hours > 0) {
                previewText += `${hours}h`;
            }
            if (minutes > 0 || hours === 0) {
                previewText += `${minutes}min`;
            }
            
            countdownPreview.textContent = previewText.trim();
            countdownPreview.style.color = "#fd0";
        } else {
            countdownPreview.textContent = "0min";
            countdownPreview.style.color = "#666";
        }
    } else {
        countdownPreview.textContent = "0min";
        countdownPreview.style.color = "#666";
    }
}

function addNewTimer() {
    const timerName = prompt("Enter timer name:");
    if (timerName && timerName.trim()) {
        const timerId = `timer_${Date.now()}`;
        timers[timerId] = {
            name: timerName.trim(),
            target: null,
            remaining: 0,
            timer: null,
            isRunning: false
        };
        // Add to timer order
        timerOrder.push(timerId);
        // Auto-switch to the newly added timer
        currentTimerId = timerId;
        updateTimerSelect();
        setCurrentTimer(timerId);
        updateAdditionalTimers();
    }
}

function deleteTimer(timerId) {
    if (timerId === "main") {
        alert("Cannot delete the main timer!");
        return;
    }
    
    const timer = timers[timerId];
    if (!timer) return;
    
    if (timer.isRunning) {
        if (timer.timer) {
            clearInterval(timer.timer);
        }
        timer.isRunning = false;
    }
    
    delete timers[timerId];
    
    // Remove from timer order
    const orderIndex = timerOrder.indexOf(timerId);
    if (orderIndex > -1) {
        timerOrder.splice(orderIndex, 1);
    }
    
    // If the deleted timer was the current timer, switch to main
    if (currentTimerId === timerId) {
        currentTimerId = "main";
        setCurrentTimer("main");
    }
    
    updateTimerSelect();
    updateAdditionalTimers();
}

function renameCurrentTimer() {
    const currentTimer = getCurrentTimer();
    if (!currentTimer) return;
    
    const newName = prompt("Enter new timer name:", currentTimer.name);
    if (newName && newName.trim()) {
        currentTimer.name = newName.trim();
        updateTimerSelect();
        updateAdditionalTimers();
    }
}

function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const isScrolled = scrollTop > 50;
    
    if (bottomRight && bottomLeft) {
        if (isScrolled) {
            bottomRight.classList.add("bottom-hidden");
            bottomLeft.classList.add("bottom-hidden");
        } else {
            bottomRight.classList.remove("bottom-hidden");
            bottomLeft.classList.remove("bottom-hidden");
        }
    }
}

function updateTimerSelect() {
    timerSelect.innerHTML = "";
    Object.keys(timers).forEach(timerId => {
        const option = document.createElement("option");
        option.value = timerId;
        option.textContent = timers[timerId].name;
        if (timerId === currentTimerId) {
            option.selected = true;
        }
        timerSelect.appendChild(option);
    });
}

function updateAdditionalTimers() {
    if (!additionalTimers) return;
    
    additionalTimers.innerHTML = "";
    
    // Use timerOrder to maintain the order, but only show running timers
    timerOrder.forEach(timerId => {
        if (timerId !== "main" && timers[timerId] && timers[timerId].isRunning) {
            const timerEl = document.createElement("div");
            timerEl.className = "additional-timer";
            timerEl.setAttribute("data-timer-id", timerId);
            timerEl.draggable = true;
            
            // Format end time as hh:mm (24h format)
            const endTime = timers[timerId].target ? 
                `${String(timers[timerId].target.getHours()).padStart(2, '0')}:${String(timers[timerId].target.getMinutes()).padStart(2, '0')}` : "";
            
            timerEl.innerHTML = `
                <span class="timer-name">${timers[timerId].name}</span>
                <span class="timer-end-time">${endTime}</span>
                <span class="timer-remaining">${formatTime(timers[timerId].remaining)}</span>
                <button class="delete-timer-btn" data-timer-id="${timerId}" title="Delete timer"><i class="fas fa-trash"></i></button>
            `;
            
            // Add delete button event listener
            const deleteBtn = timerEl.querySelector('.delete-timer-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTimer(timerId);
            });
            
            // Add drag and drop event listeners
            timerEl.addEventListener('dragstart', handleDragStart);
            timerEl.addEventListener('dragover', handleDragOver);
            timerEl.addEventListener('drop', handleDrop);
            timerEl.addEventListener('dragenter', handleDragEnter);
            timerEl.addEventListener('dragleave', handleDragLeave);
            
            additionalTimers.appendChild(timerEl);
        }
    });
}

function getCurrentTimer() {
    return timers[currentTimerId];
}

function setCurrentTimer(timerId) {
    currentTimerId = timerId;
    const timer = getCurrentTimer();
    if (timer && timer.target) {
        hourInput.value = timer.target.getHours();
        minuteInput.value = String(timer.target.getMinutes()).padStart(2, '0');
        updateCountdownPreview();
    } else {
        hourInput.value = "";
        minuteInput.value = "";
        updateCountdownPreview();
    }
}

function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function targetTime() {
    const h = parseInt(hourInput.value, 10);
    let m = parseInt(minuteInput.value, 10);
    if (isNaN(h) || isNaN(m) || !isValidHourMinute(h, m)) {
        alert("Please enter a valid hour (0-23) and minute (0-59)!");
        return;
    }
    minuteInput.value = String(m).padStart(2, '0');
    return getTargetTime(h, m);
}

async function enableWakeLock() {
    try {
        if ("wakeLock" in navigator) {
            wakeLock = await navigator.wakeLock.request("screen");
            console.log("Screen Wake Lock enabled");
        }
    } catch (err) {
        console.error("Wake Lock failed:", err);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
        console.log("Screen Wake Lock released");
    }
}

// ===== Countdown Logic =====
function startCountdown() {
    const currentTimer = getCurrentTimer();
    if (!currentTimer) return;

    const target = targetTime();
    if (!target) return;

    currentTimer.target = target;
    currentTimer.isRunning = true;
    
    if (currentTimerId === "main") {
        enableWakeLock();
        clearInterval(timer);
        document.body.style.background = "#111";
        titleEl.textContent = `${timers.main.name} - Time until ${target.toLocaleTimeString()}`;
        const now = new Date();
        remainingTime = Math.floor((target - now) / 1000);
        countdownEl.textContent = formatTime(remainingTime);

        timer = setInterval(() => {
            remainingTime--;
            countdownEl.textContent = formatTime(remainingTime);
            currentTimer.remaining = remainingTime;

            if (remainingTime <= 0) {
                clearInterval(timer);
                countdownEl.textContent = "TIME UP!";
                alarmSound.play();
                document.body.style.background = "#009";
                titleEl.textContent = "Countdown Timer";
                currentTimer.isRunning = false;
            }
        }, 1000);
    } else {
        // Additional timer
        const now = new Date();
        currentTimer.remaining = Math.floor((target - now) / 1000);
        
        if (currentTimer.timer) {
            clearInterval(currentTimer.timer);
        }
        
        currentTimer.timer = setInterval(() => {
            currentTimer.remaining--;
            updateAdditionalTimers();

            if (currentTimer.remaining <= 0) {
                clearInterval(currentTimer.timer);
                currentTimer.isRunning = false;
                updateAdditionalTimers();
                alarmSound.play();
            }
        }, 1000);
        
        updateAdditionalTimers();
    }
}

function stopCountdown() {
    const currentTimer = getCurrentTimer();
    if (!currentTimer) return;

    if (currentTimerId === "main") {
        releaseWakeLock();
        clearInterval(timer);
        countdownEl.textContent = "00:00";
        titleEl.textContent = "Countdown Timer";
        document.body.style.background = "#111";
    } else {
        if (currentTimer.timer) {
            clearInterval(currentTimer.timer);
        }
        currentTimer.isRunning = false;
        updateAdditionalTimers();
    }
    
    currentTimer.target = null;
    currentTimer.remaining = 0;
}

// ===== Event Listeners Setup =====
function setupEventListeners() {
    startBtn.addEventListener("click", startCountdown);
    stopBtn.addEventListener("click", stopCountdown);
    fullscreenBtn.addEventListener("click", () => {
        if (isStandaloneMode()) {
            location.reload(); // Refresh the page
            return;
        }
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    document.addEventListener("fullscreenchange", () => {
        if (!isStandaloneMode()) {
            fullscreenBtn.innerHTML = document.fullscreenElement ? '<i class="fas fa-times"></i>' : '<i class="fas fa-expand"></i>';
        }
    });
    window.addEventListener('resize', setVH);
    nowBtn.addEventListener("click", () => {
        const target = new Date();
        hourInput.value = target.getHours();
        minuteInput.value = String(target.getMinutes()).padStart(2, '0');
        updateCountdownPreview();
    });
    
    // Add event listeners for input changes to update preview
    hourInput.addEventListener("input", updateCountdownPreview);
    minuteInput.addEventListener("input", updateCountdownPreview);
    
    // Timer selection and management
    timerSelect.addEventListener("change", (e) => {
        setCurrentTimer(e.target.value);
    });
    
    addTimerBtn.addEventListener("click", addNewTimer);
    renameTimerBtn.addEventListener("click", renameCurrentTimer);
    
    // Scroll detection
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('scroll', handleScroll);
}

// ===== Shortcut Buttons Setup =====
function setupShortcutButtons() {
    // Hour and half-hour quick set buttons
    const quickBtnContainer = document.getElementById("quickBtnContainer");
    quickBtnContainer.innerHTML = "";
    const morning = [[9, 0], [9, 30], [10, 0], [10, 30], [11, 0], [11, 30], [12, 0], [12, 30]];
    const afternoon = [[13, 0], [13, 30], [14, 0], [14, 30], [15, 0], [15, 30], [16, 0], [16, 30], [17, 0], [17, 30], [18, 0]];
    const night = [[19, 0], [20, 0], [21, 0], [22, 0]];

    // Helper to create a row
    function createHourRow(arr) {
        const row = document.createElement("div");
        row.className = "quick-hour-row";
        arr.forEach(([h, min]) => {
            const btn = document.createElement("button");
            btn.textContent = `${String(h).padStart(2, '0')}:${min === 0 ? '00' : '30'}`;
            btn.addEventListener("click", () => {
                hourInput.value = h;
                minuteInput.value = String(min).padStart(2, '0');
                updateCountdownPreview();
                startCountdown();
            });
            row.appendChild(btn);
        });
        return row;
    }
    quickBtnContainer.appendChild(createHourRow(morning));
    quickBtnContainer.appendChild(createHourRow(afternoon));
    quickBtnContainer.appendChild(createHourRow(night));
    // Quick add increments (min/h) based on now
    increments.forEach(min => {
        const btn = document.createElement("button");
        btn.textContent = min < 60 ? `${min}min` : `${min / 60}h`;
        btn.addEventListener("click", () => {
            const now = new Date();
            const target = new Date(now.getTime() + min * 60000);
            hourInput.value = target.getHours();
            minuteInput.value = String(target.getMinutes()).padStart(2, '0');
            updateCountdownPreview();
            startCountdown();
        });
        quickAddContainer.appendChild(btn);
    });
    // Quick tweak buttons (-/+min) based on input time
    // Row 1
    [...tweakRow1Mins].forEach(min => { createTweakButton(min, tweakRow1) });
    // Row 2
    [...tweakRow2Mins].forEach(min => { createTweakButton(min, tweakRow2) });
}

function createTweakButton(min, tweakRow) {
    const tweakBtn = document.createElement("button");
    tweakBtn.textContent = min < 0 ? `${min}min` : `+${min}min`;
    tweakBtn.addEventListener("click", () => {
        adjustInputTimeBy(min);
    });
    tweakRow.appendChild(tweakBtn);
}

function adjustInputTimeBy(min) {
    let h = parseInt(hourInput.value, 10);
    let m = parseInt(minuteInput.value, 10);
    if (!isValidHourMinute(h, m)) {
        const now = new Date();
        h = now.getHours();
        m = now.getMinutes();
    }
    let total = h * 60 + m + min;
    if (total < 0) total = 0;
    h = Math.floor(total / 60);
    m = total % 60;
    hourInput.value = h;
    minuteInput.value = String(m).padStart(2, '0');
    updateCountdownPreview();
    if (isValidHourMinute(h, m) && isValidTarget(h, m)) {
        startCountdown();
    } else {
        stopCountdown();
    }
}

// ===== Initialization =====
function initialize() {
    setVH();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    setInterval(updateAdditionalTimers, 1000); // Update additional timers every second
    setupEventListeners();
    setupShortcutButtons();
    updateTimerSelect();
    updateCountdownPreview(); // Initialize the preview

    // Change fullscreen button to refresh if in standalone mode
    if (isStandaloneMode()) {
        fullscreenBtn.innerHTML = '<i class="fas fa-redo"></i>';
    }
}

// ===== Start App =====
initialize();

function isValidHourMinute(h, m) {
    return (
        Number.isInteger(h) &&
        Number.isInteger(m) &&
        h >= 0 && h <= 23 &&
        m >= 0 && m <= 59
    );
}

function isValidTarget(h, m) {
    // target time is after now
    return getTargetTime(h, m) > new Date();
}

function getTargetTime(h, m) {
    const target = new Date();
    target.setHours(h);
    target.setMinutes(m);
    target.setSeconds(0);
    return target;
}

// ===== Drag and Drop Functions =====
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (draggedElement !== this) {
        const draggedTimerId = draggedElement.getAttribute('data-timer-id');
        const droppedTimerId = this.getAttribute('data-timer-id');
        
        if (draggedTimerId && droppedTimerId) {
            // Get the current order of running timers (excluding main)
            const runningTimerOrder = timerOrder.filter(id => id !== "main" && timers[id] && timers[id].isRunning);
            
            // Find indices in the running timer order
            const draggedIndex = runningTimerOrder.indexOf(draggedTimerId);
            const droppedIndex = runningTimerOrder.indexOf(droppedTimerId);
            
            if (draggedIndex !== -1 && droppedIndex !== -1) {
                // Remove the dragged timer from its current position
                runningTimerOrder.splice(draggedIndex, 1);
                
                // Insert it at the new position
                runningTimerOrder.splice(droppedIndex, 0, draggedTimerId);
                
                // Update the main timerOrder array
                // First, remove all non-main timers from timerOrder
                timerOrder = timerOrder.filter(id => id === "main");
                
                // Then add back the running timers in their new order
                runningTimerOrder.forEach(id => {
                    if (timers[id]) {
                        timerOrder.push(id);
                    }
                });
                
                // Update the display
                updateAdditionalTimers();
            }
        }
    }
    
    draggedElement.style.opacity = '1';
    draggedElement = null;
}

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
