class PomodoroTimer {
    constructor() {
        this.timeLeft = 25 * 60;
        this.initialTime = 25 * 60;
        this.isRunning = false;
        this.interval = null;
        this.currentMode = 'pomodoro';
        this.completedPomodoros = 0;
        this.totalFocusTime = 0;
        this.dailyGoal = 8;
        
        this.timeSettings = {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15
        };

        this.modeLabels = {
            pomodoro: '专注时间',
            shortBreak: '短休息',
            longBreak: '长休息'
        };

        this.init();
    }

    init() {
        this.loadSettings();
        this.loadProgress();
        this.bindEvents();
        this.updateDisplay();
        this.updateProgress();
    }

    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTheme(e.target.dataset.theme));
        });

        document.getElementById('settingsToggle').addEventListener('click', () => {
            document.getElementById('settingsContent').classList.toggle('hidden');
        });

        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.interval);
    }

    reset() {
        this.pause();
        this.timeLeft = this.timeSettings[this.currentMode] * 60;
        this.initialTime = this.timeLeft;
        this.updateDisplay();
    }

    completeTimer() {
        this.pause();
        
        if (this.currentMode === 'pomodoro') {
            this.completedPomodoros++;
            this.totalFocusTime += this.timeSettings.pomodoro;
            this.saveProgress();
            this.updateProgress();
            this.showNotification('🎉 专注完成！休息一下吧！');
        } else {
            this.showNotification('⏰ 休息结束，准备开始新的专注！');
        }

        this.timeLeft = 0;
        this.updateDisplay();
        
        setTimeout(() => {
            this.reset();
        }, 3000);
    }

    switchMode(mode) {
        if (this.isRunning) {
            const confirmSwitch = confirm('计时器正在运行，确定要切换模式吗？');
            if (!confirmSwitch) return;
        }

        this.pause();
        this.currentMode = mode;
        this.timeLeft = this.timeSettings[mode] * 60;
        this.initialTime = this.timeLeft;
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        document.getElementById('timerLabel').textContent = this.modeLabels[mode];
        this.updateDisplay();
    }

    switchTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        localStorage.setItem('pomodoro-theme', theme);
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        
        this.updateProgressRing();
    }

    updateProgressRing() {
        const progress = (this.initialTime - this.timeLeft) / this.initialTime;
        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - progress);
        
        const progressRing = document.querySelector('.progress-ring-progress');
        progressRing.style.strokeDashoffset = offset;
    }

    updateProgress() {
        document.getElementById('completedPomodoros').textContent = this.completedPomodoros;
        document.getElementById('totalFocusTime').textContent = `${this.totalFocusTime} 分钟`;
        
        const progressPercent = Math.min((this.completedPomodoros / this.dailyGoal) * 100, 100);
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('progressPercent').textContent = `${Math.round(progressPercent)}%`;
    }

    saveSettings() {
        const pomodoroTime = parseInt(document.getElementById('pomodoroTime').value);
        const shortBreakTime = parseInt(document.getElementById('shortBreakTime').value);
        const longBreakTime = parseInt(document.getElementById('longBreakTime').value);

        if (pomodoroTime < 1 || pomodoroTime > 60 ||
            shortBreakTime < 1 || shortBreakTime > 30 ||
            longBreakTime < 1 || longBreakTime > 60) {
            alert('请输入有效的时间范围！');
            return;
        }

        this.timeSettings = {
            pomodoro: pomodoroTime,
            shortBreak: shortBreakTime,
            longBreak: longBreakTime
        };

        localStorage.setItem('pomodoro-settings', JSON.stringify(this.timeSettings));
        
        if (!this.isRunning) {
            this.timeLeft = this.timeSettings[this.currentMode] * 60;
            this.initialTime = this.timeLeft;
            this.updateDisplay();
        }

        document.getElementById('settingsContent').classList.add('hidden');
        this.showNotification('✅ 设置已保存！');
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoro-settings');
        if (savedSettings) {
            this.timeSettings = JSON.parse(savedSettings);
            document.getElementById('pomodoroTime').value = this.timeSettings.pomodoro;
            document.getElementById('shortBreakTime').value = this.timeSettings.shortBreak;
            document.getElementById('longBreakTime').value = this.timeSettings.longBreak;
        }

        const savedTheme = localStorage.getItem('pomodoro-theme');
        if (savedTheme) {
            this.switchTheme(savedTheme);
        }

        this.timeLeft = this.timeSettings[this.currentMode] * 60;
        this.initialTime = this.timeLeft;
    }

    saveProgress() {
        const today = new Date().toDateString();
        const progressData = {
            date: today,
            completedPomodoros: this.completedPomodoros,
            totalFocusTime: this.totalFocusTime
        };
        localStorage.setItem('pomodoro-progress', JSON.stringify(progressData));
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('pomodoro-progress');
        if (savedProgress) {
            const progressData = JSON.parse(savedProgress);
            const today = new Date().toDateString();
            
            if (progressData.date === today) {
                this.completedPomodoros = progressData.completedPomodoros;
                this.totalFocusTime = progressData.totalFocusTime;
            }
        }
    }

    showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('番茄时钟', { body: message });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('番茄时钟', { body: message });
                }
            });
        }
        
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
