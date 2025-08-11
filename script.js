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
const nowBtn = document.getElementById("nowBtn");
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
const tweakRow1Mins = [-5, -2, -1, 1, 2, 5];
const tweakRow2Mins = [-60, -30, -10, 10, 30, 60];

// ===== State =====
let mainTimer = null;
let wakeLock = null;
let timers = {
    main: {
        name: "Focus",
        target: null,
        remaining: 0,
        isRunning: false
    }
};
let currentTimerId = "main";
let timerOrder = ["main"];

// ===== Page Visibility API Support =====
let isPageVisible = true;

// Check if Page Visibility API is supported
function isPageVisibilitySupported() {
    return typeof document.hidden !== "undefined" || 
           typeof document.msHidden !== "undefined" || 
           typeof document.webkitHidden !== "undefined";
}

// Get current page visibility state
function getPageVisibilityState() {
    if (document.hidden !== undefined) return document.hidden;
    if (document.msHidden !== undefined) return document.msHidden;
    if (document.webkitHidden !== undefined) return document.webkitHidden;
    return false;
}

// Handle page visibility changes
function handleVisibilityChange() {
    const wasVisible = isPageVisible;
    isPageVisible = !getPageVisibilityState();
    
    // If page becomes visible and we have running timers, resync them
    if (isPageVisible && !wasVisible) {
        console.log("Page became visible, resyncing timers...");
        resyncAllTimers();
    }
}

// ===== Core Timer Functions =====

// Main timer function that runs every second
function updateAllTimers() {
    const now = new Date();
    
    // Update current time display
    updateCurrentTimeDisplay(now);
    
    // Update all running timers
    Object.keys(timers).forEach(timerId => {
        const timer = timers[timerId];
        if (timer.isRunning && timer.target) {
            updateTimer(timerId, now);
        }
    });
    
    // Update additional timers display
    updateAdditionalTimersDisplay();
}

// Update a specific timer
function updateTimer(timerId, now) {
    const timer = timers[timerId];
    if (!timer || !timer.target || !timer.isRunning) return;
    
    // Calculate remaining time
    const newRemaining = Math.floor((timer.target - now) / 1000);
    
    if (newRemaining <= 0) {
        // Timer completed
        completeTimer(timerId);
    } else {
        // Update remaining time
        timer.remaining = newRemaining;
        
        // Update main timer display if this is the main timer
        if (timerId === "main") {
            countdownEl.textContent = formatTime(newRemaining);
        }
    }
}

// Complete a timer
function completeTimer(timerId) {
    const timer = timers[timerId];
    if (!timer) return;
    
    console.log(`Timer ${timerId} completed: ${timer.name}`);
    
    // Stop the timer
    timer.isRunning = false;
    timer.remaining = 0;
    
    if (timerId === "main") {
        // Main timer completed
        countdownEl.textContent = "TIME UP!";
        document.body.style.background = "#009";
        titleEl.textContent = "Countdown Timer";
        releaseWakeLock();
    }
    
    // Play notification sound for all completed timers
    alarmSound.play();
}

// Resync all running timers based on current time
function resyncAllTimers() {
    const now = new Date();
    
    Object.keys(timers).forEach(timerId => {
        const timer = timers[timerId];
        if (timer.isRunning && timer.target) {
            updateTimer(timerId, now);
        }
    });
}

// ===== Utility Functions =====

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateCurrentTimeDisplay(now) {
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

// ===== Timer Management Functions =====

function addNewTimer() {
    const timerName = prompt("Enter timer name:");
    if (timerName && timerName.trim()) {
        const timerId = `timer_${Date.now()}`;
        timers[timerId] = {
            name: timerName.trim(),
            target: null,
            remaining: 0,
            isRunning: false
        };
        
        timerOrder.push(timerId);
        currentTimerId = timerId;
        updateTimerSelect();
        setCurrentTimer(timerId);
        updateAdditionalTimersDisplay();
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
        timer.isRunning = false;
    }
    
    delete timers[timerId];
    
    const orderIndex = timerOrder.indexOf(timerId);
    if (orderIndex > -1) {
        timerOrder.splice(orderIndex, 1);
    }
    
    if (currentTimerId === timerId) {
        currentTimerId = "main";
        setCurrentTimer("main");
    }
    
    updateTimerSelect();
    updateAdditionalTimersDisplay();
}

function renameCurrentTimer() {
    const currentTimer = getCurrentTimer();
    if (!currentTimer) return;
    
    const newName = prompt("Enter new timer name:", currentTimer.name);
    if (newName && newName.trim()) {
        currentTimer.name = newName.trim();
        updateTimerSelect();
        updateAdditionalTimersDisplay();
        updateTimerTitle();
    }
}

function updateTimerTitle() {
    const currentTimer = getCurrentTimer();
    if (currentTimer && currentTimer.isRunning && currentTimer.target) {
        if (currentTimerId === "main") {
            titleEl.textContent = `${currentTimer.name} - Time until ${currentTimer.target.toLocaleTimeString()}`;
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

function updateAdditionalTimersDisplay() {
    if (!additionalTimers) return;
    
    additionalTimers.innerHTML = "";
    
    timerOrder.forEach(timerId => {
        if (timerId !== "main" && timers[timerId]) {
            const timer = timers[timerId];
            const timerEl = document.createElement("div");
            timerEl.className = "additional-timer";
            timerEl.setAttribute("data-timer-id", timerId);
            timerEl.draggable = true;
            
            const endTime = timer.target ? 
                `${String(timer.target.getHours()).padStart(2, '0')}:${String(timer.target.getMinutes()).padStart(2, '0')}` : "";
            
            const displayText = ` | ${formatTime(timer.remaining)}`;
            
            timerEl.innerHTML = `
                <span class="timer-name">${timer.name}</span>
                <span class="timer-end-time">${endTime}</span>
                <span class="timer-remaining">${displayText}</span>
                <button class="delete-timer-btn" data-timer-id="${timerId}" title="Delete timer"><i class="fas fa-trash"></i></button>
            `;
            
            const deleteBtn = timerEl.querySelector('.delete-timer-btn');
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteTimer(timerId);
            });
            
            timerEl.addEventListener("dragstart", handleDragStart);
            timerEl.addEventListener("dragover", handleDragOver);
            timerEl.addEventListener("drop", handleDrop);
            timerEl.addEventListener("dragenter", handleDragEnter);
            timerEl.addEventListener("dragleave", handleDragLeave);
            
            timerEl.addEventListener("touchstart", handleTouchStart);
            timerEl.addEventListener("touchmove", handleTouchMove);
            timerEl.addEventListener("touchend", handleTouchEnd);
            
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

// ===== Timer Control Functions =====

function startCountdown() {
    const currentTimer = getCurrentTimer();
    if (!currentTimer) return;

    const target = targetTime();
    if (!target) return;

    currentTimer.target = target;
    currentTimer.isRunning = true;
    
    if (currentTimerId === "main") {
        enableWakeLock();
        document.body.style.background = "#111";
        titleEl.textContent = `${timers.main.name} - Time until ${target.toLocaleTimeString()}`;
        
        const now = new Date();
        timers.main.remaining = Math.floor((target - now) / 1000);
        countdownEl.textContent = formatTime(timers.main.remaining);
    }
    
    updateAdditionalTimersDisplay();
}

function stopCountdown() {
    const currentTimer = getCurrentTimer();
    if (!currentTimer) return;

    if (currentTimerId === "main") {
        releaseWakeLock();
        countdownEl.textContent = "00:00";
        titleEl.textContent = "Countdown Timer";
        document.body.style.background = "#111";
    }
    
    currentTimer.isRunning = false;
    currentTimer.target = null;
    currentTimer.remaining = 0;
    
    updateAdditionalTimersDisplay();
}

// ===== Helper Functions =====

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

function isValidHourMinute(h, m) {
    return (
        Number.isInteger(h) &&
        Number.isInteger(m) &&
        h >= 0 && h <= 23 &&
        m >= 0 && m <= 59
    );
}

function isValidTarget(h, m) {
    return getTargetTime(h, m) > new Date();
}

function getTargetTime(h, m) {
    const target = new Date();
    target.setHours(h);
    target.setMinutes(m);
    target.setSeconds(0);
    return target;
}

// ===== Quick Button Functions =====

function setupShortcutButtons() {
    const morning = [[9, 0], [9, 30], [10, 0], [10, 30], [11, 0], [11, 30], [12, 0], [12, 30]];
    const afternoon = [[13, 0], [13, 30], [14, 0], [14, 30], [15, 0], [15, 30], [16, 0], [16, 30], [17, 0], [17, 30], [18, 0]];
    const night = [[19, 0], [20, 0], [21, 0], [22, 0]];

    function createHourRow(arr) {
        const row = document.createElement("div");
        row.className = "quick-hour-row";
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        arr.forEach(([h, min]) => {
            const btn = document.createElement("button");
            btn.textContent = `${String(h).padStart(2, '0')}:${min === 0 ? '00' : '30'}`;
            
            const isPastTime = (h < currentHour) || (h === currentHour && min <= currentMinute);
            
            if (isPastTime) {
                btn.disabled = true;
                btn.style.opacity = "0.4";
                btn.style.cursor = "not-allowed";
                btn.title = "Time has passed";
            } else {
                btn.addEventListener("click", () => {
                    hourInput.value = h;
                    minuteInput.value = String(min).padStart(2, '0');
                    updateCountdownPreview();
                    startCountdown();
                });
            }
            
            row.appendChild(btn);
        });
        return row;
    }
    
    quickBtnContainer.innerHTML = "";
    quickBtnContainer.appendChild(createHourRow(morning));
    quickBtnContainer.appendChild(createHourRow(afternoon));
    quickBtnContainer.appendChild(createHourRow(night));
    
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
    
    [...tweakRow1Mins].forEach(min => { createTweakButton(min, tweakRow1) });
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

function updateQuickButtons() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const timeButtons = quickBtnContainer.querySelectorAll('button');
    
    timeButtons.forEach(btn => {
        const timeText = btn.textContent;
        const [hourStr, minuteStr] = timeText.split(':');
        const h = parseInt(hourStr, 10);
        const min = parseInt(minuteStr, 10);
        
        if (!isNaN(h) && !isNaN(min)) {
            const isPastTime = (h < currentHour) || (h === currentHour && min <= currentMinute);
            
            if (isPastTime) {
                btn.disabled = true;
                btn.style.opacity = "0.4";
                btn.style.cursor = "not-allowed";
                btn.title = "Time has passed";
            } else {
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
                btn.title = "";
            }
        }
    });
}

// ===== Event Listeners =====

function setupEventListeners() {
    startBtn.addEventListener("click", startCountdown);
    stopBtn.addEventListener("click", stopCountdown);
    fullscreenBtn.addEventListener("click", () => {
        if (isStandaloneMode()) {
            location.reload();
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
    
    hourInput.addEventListener("input", updateCountdownPreview);
    minuteInput.addEventListener("input", updateCountdownPreview);
    
    timerSelect.addEventListener("change", (e) => {
        setCurrentTimer(e.target.value);
    });
    
    addTimerBtn.addEventListener("click", addNewTimer);
    renameTimerBtn.addEventListener("click", renameCurrentTimer);
    
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('scroll', handleScroll);
}

// ===== Scroll and UI Functions =====

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
            const runningTimerOrder = timerOrder.filter(id => id !== "main" && timers[id] && timers[id].isRunning);
            
            const draggedIndex = runningTimerOrder.indexOf(draggedTimerId);
            const droppedIndex = runningTimerOrder.indexOf(droppedTimerId);
            
            if (draggedIndex !== -1 && droppedIndex !== -1) {
                runningTimerOrder.splice(draggedIndex, 1);
                runningTimerOrder.splice(droppedIndex, 0, draggedTimerId);
                
                timerOrder = timerOrder.filter(id => id === "main");
                runningTimerOrder.forEach(id => {
                    if (timers[id]) {
                        timerOrder.push(id);
                    }
                });
                
                updateAdditionalTimersDisplay();
            }
        }
    }
    
    draggedElement.style.opacity = '1';
    draggedElement = null;
}

// ===== Touch Events for iPad Support =====
let touchStartY = 0;
let touchStartElement = null;
let touchStartIndex = -1;
let isDragging = false;
let dragOffset = 0;

function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
    touchStartElement = this;
    touchStartIndex = Array.from(additionalTimers.children).indexOf(this);
    isDragging = false;
    dragOffset = 0;
    
    e.preventDefault();
    
    this.style.opacity = '0.8';
    this.style.transform = 'scale(1.02)';
    this.style.zIndex = '1000';
    this.style.position = 'relative';
    this.style.transition = 'none';
}

function handleTouchMove(e) {
    if (!touchStartElement) return;
    
    e.preventDefault();
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY;
    
    if (Math.abs(deltaY) > 10) {
        isDragging = true;
        dragOffset = deltaY;
        
        touchStartElement.style.transform = `translateY(${deltaY}px) scale(1.02)`;
        
        const elements = Array.from(additionalTimers.children);
        const elementHeight = touchStartElement.offsetHeight;
        const currentIndex = elements.indexOf(touchStartElement);
        
        let targetIndex = currentIndex;
        const threshold = elementHeight / 2;
        
        if (deltaY > threshold && currentIndex < elements.length - 1) {
            targetIndex = currentIndex + 1;
        } else if (deltaY < -threshold && currentIndex > 0) {
            targetIndex = currentIndex - 1;
        }
        
        if (targetIndex !== currentIndex) {
            const targetElement = elements[targetIndex];
            if (targetElement && targetElement !== touchStartElement) {
                if (targetIndex > currentIndex) {
                    additionalTimers.insertBefore(touchStartElement, targetElement.nextSibling);
                } else {
                    additionalTimers.insertBefore(touchStartElement, targetElement);
                }
                
                touchStartElement.style.transform = `translateY(${deltaY}px) scale(1.02)`;
            }
        }
    }
}

function handleTouchEnd(e) {
    if (!touchStartElement) return;
    
    e.preventDefault();
    
    touchStartElement.style.opacity = '1';
    touchStartElement.style.transform = 'scale(1)';
    touchStartElement.style.zIndex = '';
    touchStartElement.style.position = '';
    touchStartElement.style.transition = '';
    
    const elements = Array.from(additionalTimers.children);
    const runningTimerOrder = elements.map(el => el.getAttribute('data-timer-id')).filter(id => id);
    
    timerOrder = timerOrder.filter(id => id === "main");
    runningTimerOrder.forEach(id => {
        if (timers[id]) {
            timerOrder.push(id);
        }
    });
    
    touchStartElement = null;
    touchStartIndex = -1;
    isDragging = false;
    dragOffset = 0;
}

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// ===== Initialization =====

function initialize() {
    setVH();
    updateCurrentTimeDisplay(new Date());
    
    // Start the main timer that updates everything every second
    mainTimer = setInterval(updateAllTimers, 1000);
    
    // Update quick buttons every minute
    setInterval(updateQuickButtons, 60000);
    
    // Periodic timer resync every 30 seconds
    setInterval(() => {
        if (isPageVisible) {
            resyncAllTimers();
        }
    }, 30000);
    
    setupEventListeners();
    setupShortcutButtons();
    updateTimerSelect();
    updateCountdownPreview();

    if (isStandaloneMode()) {
        fullscreenBtn.innerHTML = '<i class="fas fa-redo"></i>';
    }

    if (isPageVisibilitySupported()) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
        window.addEventListener('blur', () => {
            isPageVisible = false;
        });
        window.addEventListener('focus', () => {
            if (!isPageVisible) {
                isPageVisible = true;
                resyncAllTimers();
            }
        });
    }
    
    document.addEventListener('touchstart', () => {
        if (!isPageVisible) {
            isPageVisible = true;
            resyncAllTimers();
        }
    });
    
    if ('onpageshow' in window) {
        window.addEventListener('pageshow', () => {
            if (!isPageVisible) {
                isPageVisible = true;
                resyncAllTimers();
            }
        });
    }
}

// ===== Start App =====
initialize();
