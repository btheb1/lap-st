document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const episodeTitle = document.getElementById('episodeTitle');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    
    let currentEpisodeData = null;
    let saveTimeout = null;
    
    // Функция получения параметров из URL
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            season: params.get('season'),
            episode: params.get('episode'),
            time: params.get('t')
        };
    }
    
    // Функция сохранения прогресса
    function saveProgress(season, episode, time) {
        const progressKey = `progress_${season}_${episode}`;
        const progressData = {
            season: season,
            episode: episode,
            time: Math.floor(time),
            timestamp: Date.now(),
            title: currentEpisodeData?.title || ''
        };
        localStorage.setItem(progressKey, JSON.stringify(progressData));
        
        // Сохраняем последний просмотренный сериал
        localStorage.setItem('lastWatched', JSON.stringify({
            season: season,
            episode: episode,
            time: Math.floor(time),
            title: currentEpisodeData?.title || ''
        }));
    }
    
    // Функция получения сохраненного прогресса
    function getSavedProgress(season, episode) {
        const progressKey = `progress_${season}_${episode}`;
        const saved = localStorage.getItem(progressKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }
    
    // Функция показа уведомления о продолжении просмотра
    function showResumeNotification(savedProgress) {
        const timeInSeconds = savedProgress.time;
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = timeInSeconds % 60;
        
        let timeString = '';
        if (hours > 0) {
            timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        const notification = document.createElement('div');
        notification.className = 'resume-notification';
        notification.innerHTML = `
            <div class="resume-content">
                <p>📺 Вы смотрели ${savedProgress.season} сезон, ${savedProgress.episode} серия</p>
                <p>⏱️ Остановились на ${timeString}</p>
                <div class="resume-buttons">
                    <button class="resume-yes">✅ Досмотреть с ${timeString}</button>
                    <button class="resume-no">▶️ Смотреть с начала</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Обработчики кнопок
        notification.querySelector('.resume-yes').addEventListener('click', () => {
            videoPlayer.currentTime = savedProgress.time;
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
            videoPlayer.play();
        });
        
        notification.querySelector('.resume-no').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
            videoPlayer.play();
            // Сохраняем новый прогресс с 0
            saveProgress(savedProgress.season, savedProgress.episode, 0);
        });
    }
    
    // Функция копирования ссылки с таймкодом
    async function copyLinkWithTimestamp() {
        const currentTime = Math.floor(videoPlayer.currentTime);
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('season', currentEpisodeData.season);
        params.set('episode', currentEpisodeData.episode);
        
        let timeString = '';
        const hours = Math.floor(currentTime / 3600);
        const minutes = Math.floor((currentTime % 3600) / 60);
        const seconds = currentTime % 60;
        
        if (hours > 0) {
            timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeString = `${minutes}:${seconds.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Спрашиваем, копировать с таймкодом или без
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.innerHTML = `
            <div class="copy-content">
                <p>📋 Копирование ссылки</p>
                <p>Текущее время: ${timeString}</p>
                <div class="copy-buttons">
                    <button class="copy-with-time">✅ С таймкодом (${timeString})</button>
                    <button class="copy-without-time">📄 Без таймкода</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Обработчик копирования с таймкодом
        notification.querySelector('.copy-with-time').addEventListener('click', async () => {
            params.set('t', currentTime);
            const fullUrl = `${baseUrl}?${params.toString()}`;
            
            try {
                await navigator.clipboard.writeText(fullUrl);
                showNotification('✅ Ссылка с таймкодом скопирована!');
            } catch (err) {
                showNotification('❌ Ошибка копирования');
            }
            
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Обработчик копирования без таймкода
        notification.querySelector('.copy-without-time').addEventListener('click', async () => {
            const fullUrl = `${baseUrl}?${params.toString()}`;
            
            try {
                await navigator.clipboard.writeText(fullUrl);
                showNotification('✅ Ссылка скопирована!');
            } catch (err) {
                showNotification('❌ Ошибка копирования');
            }
            
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    // Функция показа уведомления
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
    
    // Функция загрузки видео
    function loadVideo(season, episode, file, title, startTime = null) {
        const videoPath = `film/seas${season}/${file}`;
        videoSource.src = videoPath;
        videoPlayer.load();
        
        // Обновляем заголовок
        episodeTitle.textContent = `${season} сезон, ${episode} серия - ${title || ''}`;
        
        // Сохраняем текущие данные
        currentEpisodeData = { season, episode, file, title };
        
        // Обработка ошибок
        videoPlayer.addEventListener('error', () => {
            episodeTitle.innerHTML += '<br><span style="color: #ff6b6b;">⚠️ Видео не найдено</span>';
            downloadBtn.disabled = true;
            copyLinkBtn.disabled = true;
        });
        
        // Когда видео готово
        videoPlayer.addEventListener('loadedmetadata', () => {
            if (startTime !== null && startTime > 0) {
                videoPlayer.currentTime = startTime;
            } else {
                // Проверяем сохраненный прогресс
                const savedProgress = getSavedProgress(season, episode);
                if (savedProgress && savedProgress.time > 5) { // Если остановились после 5 секунд
                    showResumeNotification(savedProgress);
                }
            }
        });
        
        // Сохраняем прогресс каждые 5 секунд
        videoPlayer.addEventListener('timeupdate', () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                if (videoPlayer.currentTime > 0) {
                    saveProgress(season, episode, videoPlayer.currentTime);
                }
            }, 5000);
        });
        
        // Сохраняем прогресс при закрытии/перезагрузке
        window.addEventListener('beforeunload', () => {
            if (videoPlayer.currentTime > 0) {
                saveProgress(season, episode, videoPlayer.currentTime);
            }
        });
    }
    
    // Основная логика
    const urlParams = getUrlParams();
    
    if (urlParams.season && urlParams.episode) {
        // Если есть параметры в URL, загружаем серию из all.js
        const seasonNum = parseInt(urlParams.season);
        const episodeNum = parseInt(urlParams.episode);
        const seasonData = episodesData.series.find(s => s.season === seasonNum);
        
        if (seasonData) {
            const episodeData = seasonData.episodes.find(e => e.number === episodeNum);
            if (episodeData) {
                const startTime = urlParams.time ? parseFloat(urlParams.time) : null;
                loadVideo(seasonNum, episodeNum, episodeData.file, episodeData.title, startTime);
                
                // Обновляем URL без перезагрузки
                const newUrl = `${window.location.pathname}?season=${seasonNum}&episode=${episodeNum}`;
                window.history.pushState({}, '', newUrl);
            }
        }
    } else {
        // Если нет параметров, берем из localStorage
        const savedEpisode = localStorage.getItem('currentEpisode');
        if (savedEpisode) {
            const episode = JSON.parse(savedEpisode);
            loadVideo(episode.season, episode.episode, episode.file, episode.title);
        } else {
            episodeTitle.textContent = 'Ошибка: серия не выбрана';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }
    
    // Обработчик кнопки скачивания
    downloadBtn.addEventListener('click', () => {
        if (currentEpisodeData) {
            const videoPath = `film/seas${currentEpisodeData.season}/${currentEpisodeData.file}`;
            const link = document.createElement('a');
            link.href = videoPath;
            link.download = `${currentEpisodeData.season}_series_${currentEpisodeData.episode}.mp4`;
            link.click();
            showNotification('📥 Скачивание началось...');
        }
    });
    
    // Обработчик кнопки копирования ссылки
    copyLinkBtn.addEventListener('click', copyLinkWithTimestamp);
});
