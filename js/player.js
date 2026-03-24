document.addEventListener('DOMContentLoaded', () => {
    const driveIframe = document.getElementById('driveIframe');
    const episodeTitle = document.getElementById('episodeTitle');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const backBtn = document.querySelector('.back-btn');
    const qualitySelector = document.getElementById('qualitySelector');
    const qualitySelect = document.getElementById('qualitySelect');
    const qualitySize = document.getElementById('qualitySize');
    
    let currentEpisodeData = null;
    let currentQuality = null;
    let availableQualities = null;
    let autoPlayNext = true; // Автопродолжение включено по умолчанию
    let checkInterval = null;
    
    // Функция получения параметров из URL
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            season: params.get('season'),
            episode: params.get('episode'),
            time: params.get('t')
        };
    }
    
    // Функция получения ID файла из ссылки Google Drive
    function getFileIdFromPath(path) {
        let match = path.match(/[?&]id=([^&]+)/);
        if (match) return match[1];
        match = path.match(/\/d\/([^\/]+)/);
        if (match) return match[1];
        return null;
    }
    
    function getEmbedUrl(drivePath) {
        const fileId = getFileIdFromPath(drivePath);
        if (fileId) {
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
        return drivePath;
    }
    
    function getDownloadUrl(drivePath) {
        const fileId = getFileIdFromPath(drivePath);
        if (fileId) {
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return drivePath;
    }
    
    // Функция сохранения прогресса
    function saveProgress(season, episode, quality) {
        const progressKey = `progress_${season}_${episode}`;
        const progressData = {
            season: season,
            episode: episode,
            timestamp: Date.now(),
            title: currentEpisodeData?.title || '',
            quality: quality || currentQuality,
            completed: false
        };
        localStorage.setItem(progressKey, JSON.stringify(progressData));
        
        localStorage.setItem('lastWatched', JSON.stringify({
            season: season,
            episode: episode,
            title: currentEpisodeData?.title || '',
            quality: quality || currentQuality
        }));
        
        localStorage.setItem(`quality_${season}_${episode}`, quality || currentQuality);
    }
    
    // Функция отметки серии как просмотренной
    function markAsWatched(season, episode) {
        const progressKey = `progress_${season}_${episode}`;
        const saved = localStorage.getItem(progressKey);
        if (saved) {
            const data = JSON.parse(saved);
            data.completed = true;
            data.timestamp = Date.now();
            localStorage.setItem(progressKey, JSON.stringify(data));
        }
    }
    
    function getSavedProgress(season, episode) {
        const progressKey = `progress_${season}_${episode}`;
        const saved = localStorage.getItem(progressKey);
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }
    
    function getSavedQuality(season, episode) {
        const savedQuality = localStorage.getItem(`quality_${season}_${episode}`);
        if (savedQuality) {
            return savedQuality;
        }
        return null;
    }
    
    function updateTitleWithQuality(season, episode, title, quality) {
        episodeTitle.textContent = `${season} сезон, ${episode} серия - ${title || ''} (${quality})`;
    }
    
    // Функция получения следующей серии
    function getNextEpisode(season, episode) {
        const seasonData = episodesData.series.find(s => s.season === season);
        if (!seasonData) return null;
        
        const currentEpisodeIndex = seasonData.episodes.findIndex(e => e.number === episode);
        
        // Следующая серия в том же сезоне
        if (currentEpisodeIndex < seasonData.episodes.length - 1) {
            const nextEpisode = seasonData.episodes[currentEpisodeIndex + 1];
            return {
                season: season,
                episode: nextEpisode.number,
                title: nextEpisode.title,
                episodeData: nextEpisode
            };
        }
        
        // Если это последняя серия, ищем следующий сезон
        const allSeasons = episodesData.series;
        const currentSeasonIndex = allSeasons.findIndex(s => s.season === season);
        
        if (currentSeasonIndex < allSeasons.length - 1) {
            const nextSeason = allSeasons[currentSeasonIndex + 1];
            if (nextSeason.episodes.length > 0) {
                const firstEpisode = nextSeason.episodes[0];
                return {
                    season: nextSeason.season,
                    episode: firstEpisode.number,
                    title: firstEpisode.title,
                    episodeData: firstEpisode
                };
            }
        }
        
        return null; // Это последняя серия последнего сезона
    }
    
    // Функция получения лучшего доступного качества для серии
    function getBestAvailableQuality(season, episode, preferredQuality) {
        const qualities = episodesData.getAvailableQualities(season, episode);
        if (!qualities) return null;
        
        // Если предпочтительное качество доступно, используем его
        if (preferredQuality && qualities[preferredQuality]) {
            return preferredQuality;
        }
        
        // Иначе берем самое высокое доступное
        const qualityOrder = ["240p", "360p", "480p", "720p", "1080p", "2160p"];
        for (let i = qualityOrder.length - 1; i >= 0; i--) {
            const q = qualityOrder[i];
            if (qualities[q]) {
                return q;
            }
        }
        return null;
    }
    
    // Функция загрузки следующей серии
    function loadNextEpisode() {
        if (!currentEpisodeData) return;
        
        const next = getNextEpisode(currentEpisodeData.season, currentEpisodeData.episode);
        
        if (next) {
            // Определяем качество для следующей серии
            const nextQuality = getBestAvailableQuality(next.season, next.episode, currentQuality);
            
            // Сохраняем прогресс текущей серии как завершенной
            markAsWatched(currentEpisodeData.season, currentEpisodeData.episode);
            
            // Обновляем текущие данные
            currentEpisodeData = {
                season: next.season,
                episode: next.episode,
                title: next.title
            };
            currentQuality = nextQuality;
            
            // Сохраняем выбранное качество для следующей серии
            localStorage.setItem(`quality_${next.season}_${next.episode}`, nextQuality);
            
            // Загружаем видео
            const videoPath = episodesData.getVideoPath(next.season, next.episode, nextQuality);
            if (videoPath) {
                const embedUrl = getEmbedUrl(videoPath);
                driveIframe.src = embedUrl;
                updateTitleWithQuality(next.season, next.episode, next.title, nextQuality);
                saveProgress(next.season, next.episode, nextQuality);
                
                showNotification(`🎬 Автопродолжение: ${next.season} сезон, ${next.episode} серия (${nextQuality})`);
            }
        } else {
            showNotification("🏁 Поздравляем! Вы посмотрели все доступные серии!");
        }
    }
    
    // Функция отслеживания окончания видео (через проверку iframe)
    function startVideoTracking() {
        if (checkInterval) clearInterval(checkInterval);
        
        let lastCheckTime = Date.now();
        
        checkInterval = setInterval(() => {
            if (!driveIframe.src) return;
            
            // Google Drive iframe не дает прямого доступа к состоянию видео
            // Поэтому используем эвристику: если прошло больше 2 секунд с последней активности
            // и мы не можем получить статус, то предполагаем что видео все еще играет
            // Вместо этого добавим кнопку "Следующая серия" вручную
            
        }, 5000);
    }
    
    // Добавляем кнопку автопродолжения и ручного перехода
    function addAutoPlayControls() {
        const episodeInfo = document.querySelector('.episode-info');
        
        // Создаем панель автопродолжения
        const autoPlayPanel = document.createElement('div');
        autoPlayPanel.className = 'autoplay-panel';
        autoPlayPanel.innerHTML = `
            <div class="autoplay-toggle">
                <label class="switch">
                    <input type="checkbox" id="autoplayToggle" ${autoPlayNext ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
                <span>🎬 Автопродолжение</span>
            </div>
            <button id="nextEpisodeBtn" class="next-episode-btn">▶ Следующая серия</button>
        `;
        
        episodeInfo.appendChild(autoPlayPanel);
        
        const autoplayToggle = document.getElementById('autoplayToggle');
        const nextEpisodeBtn = document.getElementById('nextEpisodeBtn');
        
        autoplayToggle.addEventListener('change', (e) => {
            autoPlayNext = e.target.checked;
            localStorage.setItem('autoPlayNext', autoPlayNext);
            showNotification(autoPlayNext ? 'Автопродолжение включено' : 'Автопродолжение выключено');
        });
        
        nextEpisodeBtn.addEventListener('click', () => {
            loadNextEpisode();
        });
    }
    
    function loadQualities(season, episode) {
        availableQualities = episodesData.getAvailableQualities(season, episode);
        
        if (availableQualities && Object.keys(availableQualities).length > 0) {
            qualitySelector.style.display = 'block';
            qualitySelect.innerHTML = '';
            
            const qualityOrder = ["240p", "360p", "480p", "720p", "1080p", "2160p"];
            const sortedQualities = Object.keys(availableQualities).sort((a, b) => {
                return qualityOrder.indexOf(a) - qualityOrder.indexOf(b);
            });
            
            sortedQualities.forEach(quality => {
                const option = document.createElement('option');
                option.value = quality;
                const sizeInfo = availableQualities[quality].size ? ` (${availableQualities[quality].size})` : '';
                option.textContent = `${quality}${sizeInfo}`;
                qualitySelect.appendChild(option);
            });
            
            let selectedQuality = getSavedQuality(season, episode);
            if (!selectedQuality || !availableQualities[selectedQuality]) {
                selectedQuality = episodesData.getDefaultQuality(season, episode);
            }
            
            if (selectedQuality && availableQualities[selectedQuality]) {
                qualitySelect.value = selectedQuality;
                currentQuality = selectedQuality;
                updateQualitySize(selectedQuality);
                if (currentEpisodeData) {
                    updateTitleWithQuality(season, episode, currentEpisodeData.title, selectedQuality);
                }
            }
            
            qualitySelect.addEventListener('change', (e) => {
                const newQuality = e.target.value;
                if (newQuality && availableQualities[newQuality]) {
                    changeQuality(newQuality);
                }
            });
        } else {
            qualitySelector.style.display = 'none';
        }
    }
    
    function updateQualitySize(quality) {
        if (availableQualities && availableQualities[quality] && availableQualities[quality].size) {
            qualitySize.textContent = `Вес: ${availableQualities[quality].size}`;
        } else {
            qualitySize.textContent = '';
        }
    }
    
    function changeQuality(newQuality) {
        if (!currentEpisodeData) return;
        
        currentQuality = newQuality;
        updateQualitySize(newQuality);
        updateTitleWithQuality(currentEpisodeData.season, currentEpisodeData.episode, currentEpisodeData.title, newQuality);
        
        localStorage.setItem(`quality_${currentEpisodeData.season}_${currentEpisodeData.episode}`, newQuality);
        
        const videoPath = episodesData.getVideoPath(currentEpisodeData.season, currentEpisodeData.episode, newQuality);
        
        if (videoPath) {
            const embedUrl = getEmbedUrl(videoPath);
            driveIframe.src = embedUrl;
            showNotification(`Качество изменено на ${newQuality}`);
            saveProgress(currentEpisodeData.season, currentEpisodeData.episode, newQuality);
        }
    }
    
    function showResumeNotification(savedProgress) {
        const qualityInfo = savedProgress.quality ? ` (${savedProgress.quality})` : '';
        
        const notification = document.createElement('div');
        notification.className = 'resume-notification';
        notification.innerHTML = `
            <div class="resume-content">
                <p>📺 Вы смотрели ${savedProgress.season} сезон, ${savedProgress.episode} серия${qualityInfo}</p>
                ${savedProgress.completed ? '<p>✅ Серия была завершена</p>' : ''}
                <div class="resume-buttons">
                    <button class="resume-yes">✅ Продолжить смотреть</button>
                    <button class="resume-no">▶️ Смотреть заново</button>
                </div>
                <button class="close-modal">✖</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        notification.querySelector('.resume-yes').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        notification.querySelector('.resume-no').addEventListener('click', () => {
            saveProgress(savedProgress.season, savedProgress.episode, savedProgress.quality);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        notification.querySelector('.close-modal').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    // Простое копирование ссылки без таймкода
    async function copySimpleLink() {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('season', currentEpisodeData.season);
        params.set('episode', currentEpisodeData.episode);
        
        const fullUrl = `${baseUrl}?${params.toString()}`;
        
        try {
            await navigator.clipboard.writeText(fullUrl);
            showNotification('✅ Ссылка скопирована!');
        } catch (err) {
            showNotification('❌ Ошибка копирования');
        }
    }
    
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
        }, 3000);
    }
    
    function loadVideo(season, episode, title) {
        loadQualities(season, episode);
        
        let selectedQuality = getSavedQuality(season, episode);
        if (!selectedQuality || !availableQualities || !availableQualities[selectedQuality]) {
            selectedQuality = episodesData.getDefaultQuality(season, episode);
        }
        
        currentQuality = selectedQuality;
        if (qualitySelect && qualitySelect.value !== selectedQuality) {
            qualitySelect.value = selectedQuality;
            updateQualitySize(selectedQuality);
        }
        
        updateTitleWithQuality(season, episode, title, selectedQuality);
        
        let videoPath = episodesData.getVideoPath(season, episode, selectedQuality);
        
        if (!videoPath) {
            episodeTitle.innerHTML = '<span style="color: #ff6b6b;">⚠️ Ошибка: видео не найдено</span>';
            return;
        }
        
        const embedUrl = getEmbedUrl(videoPath);
        driveIframe.src = embedUrl;
        
        currentEpisodeData = { season, episode, title };
        
        saveProgress(season, episode, selectedQuality);
        
        // Проверяем сохраненный прогресс
        const savedProgress = getSavedProgress(season, episode);
        if (savedProgress && !savedProgress.completed) {
            setTimeout(() => {
                showResumeNotification(savedProgress);
            }, 500);
        }
        
        // Запускаем отслеживание для автопродолжения
        startVideoTracking();
    }
    
    function goBackToSeasons() {
        localStorage.removeItem('currentEpisode');
        window.location.href = 'index.html';
    }
    
    function downloadWithQuality() {
        if (!currentEpisodeData) return;
        
        const qualities = episodesData.getAvailableQualities(currentEpisodeData.season, currentEpisodeData.episode);
        
        if (qualities && Object.keys(qualities).length > 1) {
            const notification = document.createElement('div');
            notification.className = 'download-notification';
            notification.innerHTML = `
                <div class="download-content">
                    <p>📥 Выберите качество для скачивания</p>
                    <div class="download-buttons">
                        ${Object.keys(qualities).sort((a, b) => {
                            const order = ["240p", "360p", "480p", "720p", "1080p", "2160p"];
                            return order.indexOf(a) - order.indexOf(b);
                        }).map(q => `
                            <button class="download-quality-btn" data-quality="${q}">
                                ${q} (${qualities[q].size || 'размер неизвестен'})
                            </button>
                        `).join('')}
                    </div>
                    <button class="close-modal-download">✖ Закрыть</button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            notification.querySelectorAll('.download-quality-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const quality = btn.dataset.quality;
                    const videoPath = episodesData.getVideoPath(currentEpisodeData.season, currentEpisodeData.episode, quality);
                    if (videoPath) {
                        const downloadUrl = getDownloadUrl(videoPath);
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = `${currentEpisodeData.season}_series_${currentEpisodeData.episode}_${quality}.mp4`;
                        link.click();
                        showNotification(`📥 Скачивание ${quality} началось...`);
                    }
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                });
            });
            
            notification.querySelector('.close-modal-download').addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            });
        } else {
            const videoPath = episodesData.getVideoPath(currentEpisodeData.season, currentEpisodeData.episode, currentQuality);
            if (videoPath) {
                const downloadUrl = getDownloadUrl(videoPath);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `${currentEpisodeData.season}_series_${currentEpisodeData.episode}_${currentQuality}.mp4`;
                link.click();
                showNotification(`📥 Скачивание ${currentQuality} началось...`);
            }
        }
    }
    
    // Загружаем настройки автопродолжения
    const savedAutoPlay = localStorage.getItem('autoPlayNext');
    if (savedAutoPlay !== null) {
        autoPlayNext = savedAutoPlay === 'true';
    }
    
    const urlParams = getUrlParams();
    
    if (urlParams.season && urlParams.episode) {
        const seasonNum = parseInt(urlParams.season);
        const episodeNum = parseInt(urlParams.episode);
        const episodeData = episodesData.getEpisode(seasonNum, episodeNum);
        
        if (episodeData) {
            loadVideo(seasonNum, episodeNum, episodeData.title);
        } else {
            episodeTitle.textContent = 'Ошибка: серия не найдена';
            setTimeout(() => goBackToSeasons(), 2000);
        }
    } else {
        const savedEpisode = localStorage.getItem('currentEpisode');
        if (savedEpisode) {
            const episode = JSON.parse(savedEpisode);
            loadVideo(episode.season, episode.episode, episode.title);
        } else {
            episodeTitle.textContent = 'Ошибка: серия не выбрана';
            setTimeout(() => goBackToSeasons(), 2000);
        }
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goBackToSeasons();
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadWithQuality);
    }
    
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copySimpleLink);
    }
    
    // Добавляем панель автопродолжения
    setTimeout(() => {
        addAutoPlayControls();
    }, 1000);
    
    function addRippleEffect(element) {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    }
    
    const buttons = document.querySelectorAll('.download-btn, .copy-btn, .back-btn');
    buttons.forEach(btn => addRippleEffect(btn));
});
