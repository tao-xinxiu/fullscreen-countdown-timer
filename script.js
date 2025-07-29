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

// ===== Constants =====
const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const increments = [2, 5, 10, 20, 30, 60, 120];
// const tweaks = [-1, -2, -5, -10, -30, 1, 2, 5, 10, 30];
const tweakRow1Mins = [-5, -2, -1, 1, 2, 5];
const tweakRow2Mins = [-60, -30, -10, 10, 30, 60];

// ===== State =====
let timer;
let remainingTime = 0;
let wakeLock = null;

// ===== Utility Functions =====
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
        ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
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

function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function targetTime() {
    const h = parseInt(hourInput.value, 10);
    let m = parseInt(minuteInput.value, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        alert("Please enter a valid hour and minute!");
        return;
    }
    minuteInput.value = String(m).padStart(2, '0');
    const target = new Date();
    target.setHours(h);
    target.setMinutes(m);
    target.setSeconds(0);
    return target;
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
    enableWakeLock();
    clearInterval(timer);
    document.body.style.background = "#111";

    const h = parseInt(hourInput.value, 10);
    const m = parseInt(minuteInput.value, 10);

    if (!isValidHourMinute(h, m)) {
        alert("Please enter a valid hour (0-23) and minute (0-59)!");
        return;
    }

    const target = new Date();
    target.setHours(h);
    target.setMinutes(m);
    target.setSeconds(0);

    titleEl.textContent = `Time until ${target.toLocaleTimeString()}`;
    const now = new Date();
    remainingTime = Math.floor((target - now) / 1000);
    countdownEl.textContent = formatTime(remainingTime);

    timer = setInterval(() => {
        remainingTime--;
        countdownEl.textContent = formatTime(remainingTime);

        if (remainingTime <= 0) {
            clearInterval(timer);
            countdownEl.textContent = "TIME UP!";
            alarmSound.play();
            document.body.style.background = "#009";
            titleEl.textContent = "Countdown Timer";
        }
    }, 1000);
}

function stopCountdown() {
    releaseWakeLock();
    clearInterval(timer);
    countdownEl.textContent = "00:00";
    titleEl.textContent = "Countdown Timer";
    document.body.style.background = "#111";
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
            fullscreenBtn.textContent = document.fullscreenElement ? "✕" : "⛶";
        }
    });
    window.addEventListener('resize', setVH);
    nowBtn.addEventListener("click", () => {
        const target = new Date();
        hourInput.value = target.getHours();
        minuteInput.value = String(target.getMinutes()).padStart(2,'0');
    });
}

// ===== Shortcut Buttons Setup =====
function setupShortcutButtons() {
    // Hour and half-hour quick set buttons
    const quickBtnContainer = document.getElementById("quickBtnContainer");
    quickBtnContainer.innerHTML = "";
    const morning = [[9, 0], [9, 30], [10, 0], [10, 30], [11, 0], [11, 30], [12, 0], [12, 30]];
    const afternoon = [[13, 0], [13, 30], [14, 0], [14, 30],[15, 0], [15, 30], [16, 0], [16, 30], [17, 0], [17, 30], [18,0]];
    const night = [[19, 0], [20, 0], [21, 0], [22, 0]];
    
    // Helper to create a row
    function createHourRow(arr) {
        const row = document.createElement("div");
        row.className = "quick-hour-row";
        arr.forEach(([h, min]) => {
            const btn = document.createElement("button");
            btn.textContent = `${String(h).padStart(2,'0')}:${min === 0 ? '00' : '30'}`;
            btn.addEventListener("click", () => {
                hourInput.value = h;
                minuteInput.value = String(min).padStart(2,'0');
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
        btn.textContent = min < 60 ? `${min}min` : `${min/60}h`;
        btn.addEventListener("click", () => {
            const now = new Date();
            const target = new Date(now.getTime() + min * 60000);
            hourInput.value = target.getHours();
            minuteInput.value = String(target.getMinutes()).padStart(2,'0');
            startCountdown();
        });
        quickAddContainer.appendChild(btn);
    });
    // Quick tweak buttons (-/+min) based on input time
    // Row 1
    [...tweakRow1Mins].forEach(min => {
        const tweakBtn = document.createElement("button");
        tweakBtn.textContent = min < 0 ? `${min}min` : `+${min}min`;
        tweakBtn.addEventListener("click", () => {
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
        });
        tweakRow1.appendChild(tweakBtn);
    });
    // Row 2
    [...tweakRow2Mins].forEach(min => {
        const tweakBtn = document.createElement("button");
        tweakBtn.textContent = min < 0 ? `${min}min` : `+${min}min`;
        tweakBtn.addEventListener("click", () => {
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
        });
        tweakRow2.appendChild(tweakBtn);
    });
}

// ===== Initialization =====
function initialize() {
    setVH();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    setupEventListeners();
    setupShortcutButtons();

    // Change fullscreen button to refresh if in standalone mode
    if (isStandaloneMode()) {
        fullscreenBtn.textContent = "⟳"; // or use a refresh icon of your choice
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

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
