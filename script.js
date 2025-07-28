let timer;
let remainingTime = 0;

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

const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    } else {
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
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
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

// shortcut buttons for setting 9:00 until 22:00
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

// shortcut buttons for setting +5min, +10min, ... based on current time
const increments = [1, 5, 10, 20, 30, 40, 50, 60, 120];
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

// shortcut buttons for setting -1min, -5min, ... based on set time
const tweaks = [-1, -2, -5, -10, 1, 2, 5, 10];
tweaks.forEach(min => {
    const tweakBtn = document.createElement("button");
    tweakBtn.textContent = min < 0 ? `${min}min` : `+${min}min`;
    tweakBtn.addEventListener("click", () => {
        const base = targetTime();
        const target = new Date(base.getTime() + min * 60000);
        hourInput.value = target.getHours();
        minuteInput.value = String(target.getMinutes()).padStart(2,'0');
        startCountdown();
    });
    quickTweakContainer.appendChild(tweakBtn);
});

function targetTime() {
    const h = parseInt(hourInput.value, 10);
    let m = parseInt(minuteInput.value, 10);

    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        alert("Please enter a valid hour and minute!");
        return;
    }

    minuteInput.value = String(m).padStart(2, '0');

    const now = new Date();
    const target = new Date();
    target.setHours(h);
    target.setMinutes(m);
    target.setSeconds(0);

    if (target <= now) {
        alert("Selected time has already passed. Please choose a future time today!");
        return;
    }

    return target;
}

startBtn.addEventListener("click", startCountdown);
stopBtn.addEventListener("click", stopCountdown);

function startCountdown() {
    clearInterval(timer);
    document.body.style.background = "#111";

    const h = parseInt(hourInput.value, 10);
    let m = parseInt(minuteInput.value, 10);
    const now = new Date();

    titleEl.textContent = `Time until ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    remainingTime = Math.floor((targetTime() - now) / 1000);
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
    clearInterval(timer);
    countdownEl.textContent = "00:00";
    titleEl.textContent = "Countdown Timer";
    document.body.style.background = "#111";
}

fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = "✕";  // 进入全屏后显示“退出”图标
    } else {
        fullscreenBtn.textContent = "⛶";  // 退出全屏后恢复原图标
    }
});

function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVH);
setVH();
