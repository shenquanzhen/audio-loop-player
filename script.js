document.addEventListener('DOMContentLoaded', () => {
    const audioFileInput = document.getElementById('audioFileInput');
    const srtFileInput = document.getElementById('srtFileInput');
    const uploadAudioButton = document.getElementById('uploadAudioButton');
    const uploadSrtButton = document.getElementById('uploadSrtButton');
    const fileInfo = document.getElementById('fileInfo');
    const audioFileName = document.getElementById('audioFileName');
    const srtFileName = document.getElementById('srtFileName');
    const duration = document.getElementById('duration');
    const audioControls = document.getElementById('audioControls');
    const audioPlayer = document.getElementById('audioPlayer');

    const startHour = document.getElementById('startHour');
    const startMinute = document.getElementById('startMinute');
    const startSecond = document.getElementById('startSecond');
    const endHour = document.getElementById('endHour');
    const endMinute = document.getElementById('endMinute');
    const endSecond = document.getElementById('endSecond');

    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');
    const stopButton = document.getElementById('stopButton');

    // 填充时间选择器
    function populateTimeSelectors() {
        for (let i = 0; i < 24; i++) {
            startHour.add(new Option(i, i));
            endHour.add(new Option(i, i));
        }
        for (let i = 0; i < 60; i++) {
            startMinute.add(new Option(i, i));
            endMinute.add(new Option(i, i));
            startSecond.add(new Option(i, i));
            endSecond.add(new Option(i, i));
        }
    }

    populateTimeSelectors();

    uploadAudioButton.addEventListener('click', () => {
        audioFileInput.click();
    });

    uploadSrtButton.addEventListener('click', () => {
        srtFileInput.click();
    });

    audioFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            audioFileName.textContent = file.name;
            const audioUrl = URL.createObjectURL(file);
            audioPlayer.src = audioUrl;

            audioPlayer.addEventListener('loadedmetadata', () => {
                const totalSeconds = Math.floor(audioPlayer.duration);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                duration.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // 更新结束时间选择器
                endHour.value = hours;
                endMinute.value = minutes;
                endSecond.value = seconds;
            });

            audioPlayer.addEventListener('error', () => {
                alert('无法播放所选文件。请确保它是有效的音频文件。');
            });
        }
    });

    srtFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.srt')) {
            srtFileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                subtitles = parseSRT(event.target.result);
                subtitleContainer.classList.remove('hidden');
            };
            reader.readAsText(file);
        } else {
            alert('请选择一个SRT文件。');
        }
    });

    let loopInterval;
    let isPlaying = false;
    let subtitles = [];

    function startLoop() {
        if (!audioPlayer.src) {
            alert('请先上传音频文件');
            return;
        }

        const startTime = getSelectedTime(startHour, startMinute, startSecond);
        const endTime = getSelectedTime(endHour, endMinute, endSecond);
        
        if (startTime >= endTime) {
            alert('开始时间必须小于结束时间');
            return;
        }

        audioPlayer.currentTime = startTime;
        playWithDelay();
        isPlaying = true;

        loopInterval = setInterval(() => {
            if (audioPlayer.currentTime >= endTime) {
                audioPlayer.pause();
                setTimeout(() => {
                    audioPlayer.currentTime = startTime;
                    playWithDelay();
                }, 1000);
            }
            updateSubtitles();
        }, 100); // 每0.1秒检查一次，以更流畅地更新字幕
    }

    function playWithDelay() {
        setTimeout(() => {
            audioPlayer.play();
        }, 1000);
    }

    function updateSubtitles() {
        const currentTime = audioPlayer.currentTime;
        const currentSubtitle = subtitles.find(sub => 
            currentTime >= sub.start && currentTime <= sub.end
        );
        subtitleDisplay.value = currentSubtitle ? currentSubtitle.text : '';
    }

    function pauseLoop() {
        audioPlayer.pause();
        isPlaying = false;
    }

    function resumeLoop() {
        if (!isPlaying) {
            audioPlayer.play();
            isPlaying = true;
        }
    }

    function stopLoop() {
        clearInterval(loopInterval);
        audioPlayer.pause();
        audioPlayer.currentTime = getSelectedTime(startHour, startMinute, startSecond);
        isPlaying = false;
    }

    startButton.addEventListener('click', startLoop);
    pauseButton.addEventListener('click', pauseLoop);
    resumeButton.addEventListener('click', resumeLoop);
    stopButton.addEventListener('click', stopLoop);

    // 当音频播放结束时，重新开始循环
    audioPlayer.addEventListener('ended', () => {
        if (isPlaying) {
            audioPlayer.currentTime = getSelectedTime(startHour, startMinute, startSecond);
            audioPlayer.play();
        }
    });

    function getSelectedTime(hourSelect, minuteSelect, secondSelect) {
        return hourSelect.value * 3600 + minuteSelect.value * 60 + Number(secondSelect.value);
    }

    function parseSRT(srtContent) {
        const subtitleBlocks = srtContent.trim().split('\n\n');
        return subtitleBlocks.map(block => {
            const [, times, ...textLines] = block.split('\n');
            const [start, end] = times.split(' --> ').map(timeToSeconds);
            return {
                start,
                end,
                text: textLines.join('\n')
            };
        });
    }

    function timeToSeconds(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(parseFloat);
        return hours * 3600 + minutes * 60 + seconds;
    }
});