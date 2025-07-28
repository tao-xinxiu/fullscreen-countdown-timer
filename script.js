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

// ===== Constants =====
const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const increments = [1, 5, 10, 20, 30, 40, 50, 60, 120];
const tweaks = [-1, -2, -5, -10, 1, 2, 5, 10];

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
    const target = targetTime();
    if (!target) return;
    const now = new Date();
    titleEl.textContent = `Time until ${target.toLocaleTimeString()}`;
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
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    document.addEventListener("fullscreenchange", () => {
        fullscreenBtn.textContent = document.fullscreenElement ? "✕" : "⛶";
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
    // Hour quick set buttons (9:00 to 22:00)
    for (let h = 9; h <= 22; h++) {
        const btn = document.createElement("button");
        btn.textContent = `${String(h).padStart(2,'0')}:00`;
        btn.addEventListener("click", () => {
            hourInput.value = h;
            minuteInput.value = "00";
            startCountdown();
        });
        quickBtnContainer.appendChild(btn);
    }
    // Quick add increments (+min/h)
    increments.forEach(min => {
        const btn = document.createElement("button");
        btn.textContent = min < 60 ? `+${min}min` : `+${min/60}h`;
        btn.addEventListener("click", () => {
            const now = new Date();
            const target = new Date(now.getTime() + min * 60000);
            hourInput.value = target.getHours();
            minuteInput.value = String(target.getMinutes()).padStart(2,'0');
            startCountdown();
        });
        quickAddContainer.appendChild(btn);
    });
    // Quick tweak buttons (-/+min)
    tweaks.forEach(min => {
        const tweakBtn = document.createElement("button");
        tweakBtn.textContent = min < 0 ? `${min}min` : `+${min}min`;
        tweakBtn.addEventListener("click", () => {
            let h = parseInt(hourInput.value, 10);
            let m = parseInt(minuteInput.value, 10);

            // If either input is invalid, use current time
            if (isNaN(h) || isNaN(m)) {
                const now = new Date();
                h = now.getHours();
                m = now.getMinutes();
            }

            // Create a date with the base time
            const base = new Date();
            base.setHours(h);
            base.setMinutes(m);
            base.setSeconds(0);

            // Add/subtract the tweak minutes
            base.setMinutes(base.getMinutes() + min);

            // Update inputs
            hourInput.value = base.getHours();
            minuteInput.value = String(base.getMinutes()).padStart(2, '0');

            // Restart countdown
            startCountdown();
        });
        quickTweakContainer.appendChild(tweakBtn);
    });
}

// ===== Initialization =====
function initialize() {
    setVH();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    setupEventListeners();
    setupShortcutButtons();
}

// ===== Start App =====
initialize();
