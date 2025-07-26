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

const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function updateCurrentTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dateStr = now.toISOString().split('T')[0]; 
    const weekday = weekdays[now.getDay()];
    timeLine.textContent = `${hh}:${mm}:${ss}`;
    dateLine.textContent = `${dateStr} (${weekday})`;
}
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

// 生成整点快捷按钮
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

// 增量快捷按钮 (+5min, +10min, ...)
const increments = [5, 10, 20, 30, 60, 120];
increments.forEach(min => {
    const btn = document.createElement("button");
    btn.textContent = `+${min}min`;
    btn.addEventListener("click", () => {
        const now = new Date();
        const target = new Date(now.getTime() + min * 60000);
        hourInput.value = target.getHours();
        minuteInput.value = String(target.getMinutes()).padStart(2,'0');
        startCountdown();
    });
    quickAddContainer.appendChild(btn);
});

startBtn.addEventListener("click", startCountdown);
stopBtn.addEventListener("click", stopCountdown);

function startCountdown() {
    clearInterval(timer);
    document.body.style.background = "#111";

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

    titleEl.textContent = `Time until ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    remainingTime = Math.floor((target - now) / 1000);
    countdownEl.textContent = formatTime(remainingTime);

    timer = setInterval(() => {
        remainingTime--;
        countdownEl.textContent = formatTime(remainingTime);

        if (remainingTime <= 0) {
            clearInterval(timer);
            countdownEl.textContent = "TIME UP!";
            alarmSound.play();
            document.body.style.background = "#c62828";
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

// 全屏切换
fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});
