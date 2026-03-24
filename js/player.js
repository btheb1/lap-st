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
            quality: quality || currentQuality
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
    
    // Функция получения предыдущей серии
    function getPrevEpisode(season, episode) {
        const seasonData = episodesData.series.find(s => s.season === season);
        if (!seasonData) return null;
        
        const currentEpisodeIndex = seasonData.episodes.findIndex(e => e.number === episode);
        
        if (currentEpisodeIndex > 0) {
            const prevEpisode = seasonData.episodes[currentEpisodeIndex - 1];
            return {
                season: season,
                episode: prevEpisode.number,
                title: prevEpisode.title,
                episodeData: prevEpisode
            };
        }
        
        const allSeasons = episodesData.series;
        const currentSeasonIndex = allSeasons.findIndex(s => s.season === season);
        
        if (currentSeasonIndex > 0) {
            const prevSeason = allSeasons[currentSeasonIndex - 1];
            if (prevSeason.episodes.length > 0) {
                const lastEpisode = prevSeason.episodes[prevSeason.episodes.length - 1];
                return {
                    season: prevSeason.season,
                    episode: lastEpisode.number,
                    title: lastEpisode.title,
                    episodeData: lastEpisode
                };
            }
        }
        
        return null;
    }
    
    // Функция получения следующей серии
    function getNextEpisode(season, episode) {
        const seasonData = episodesData.series.find(s => s.season === season);
        if (!seasonData) return null;
        
        const currentEpisodeIndex = seasonData.episodes.findIndex(e => e.number === episode);
        
        if (currentEpisodeIndex < seasonData.episodes.length - 1) {
            const nextEpisode = seasonData.episodes[currentEpisodeIndex + 1];
            return {
                season: season,
                episode: nextEpisode.number,
                title: nextEpisode.title,
                episodeData: nextEpisode
            };
        }
        
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
        
        return null;
    }
    
    // Функция загрузки серии
    function loadEpisode(season, episode, title) {
        const qualities = episodesData.getAvailableQualities(season, episode);
        
        let selectedQuality = getSavedQuality(season, episode);
        if (!selectedQuality || !qualities || !qualities[selectedQuality]) {
            selectedQuality = episodesData.getDefaultQuality(season, episode);
        }
        
        currentQuality = selectedQuality;
        currentEpisodeData = { season, episode, title };
        
        if (qualitySelect && qualities) {
            qualitySelect.value = selectedQuality;
            updateQualitySize(selectedQuality);
        }
        
        updateTitleWithQuality(season, episode, title, selectedQuality);
        
        const videoPath = episodesData.getVideoPath(season, episode, selectedQuality);
        
        if (!videoPath) {
            episodeTitle.innerHTML = '<span style="color: #ff6b6b;">⚠️ Ошибка: видео не найдено</span>';
            return;
        }
        
        const embedUrl = getEmbedUrl(videoPath);
        driveIframe.src = embedUrl;
        
        saveProgress(season, episode, selectedQuality);
        
        const newUrl = `${window.location.pathname}?season=${season}&episode=${episode}`;
        window.history.pushState({}, '', newUrl);
        
        updateNavigationButtons();
    }
    
    // Функция обновления состояния кнопок навигации
    function updateNavigationButtons() {
        const prevBtn = document.getElementById('prevEpisodeBtn');
        const nextBtn = document.getElementById('nextEpisodeBtn');
        
        if (prevBtn && currentEpisodeData) {
            const prev = getPrevEpisode(currentEpisodeData.season, currentEpisodeData.episode);
            prevBtn.disabled = !prev;
            prevBtn.style.opacity = prev ? '1' : '0.5';
            prevBtn.style.cursor = prev ? 'pointer' : 'not-allowed';
        }
        
        if (nextBtn && currentEpisodeData) {
            const next = getNextEpisode(currentEpisodeData.season, currentEpisodeData.episode);
            nextBtn.disabled = !next;
            nextBtn.style.opacity = next ? '1' : '0.5';
            nextBtn.style.cursor = next ? 'pointer' : 'not-allowed';
        }
    }
    
    function loadPrevEpisode() {
        if (!currentEpisodeData) return;
        
        const prev = getPrevEpisode(currentEpisodeData.season, currentEpisodeData.episode);
        if (prev) {
            loadEpisode(prev.season, prev.episode, prev.title);
            showNotification(`◀ ${prev.season} сезон, ${prev.episode} серия`);
        } else {
            showNotification("Это первая серия");
        }
    }
    
    function loadNextEpisode() {
        if (!currentEpisodeData) return;
        
        const next = getNextEpisode(currentEpisodeData.season, currentEpisodeData.episode);
        if (next) {
            loadEpisode(next.season, next.episode, next.title);
            showNotification(`${next.season} сезон, ${next.episode} серия ▶`);
        } else {
            showNotification("Это последняя серия");
        }
    }
    
    function goToCatalog() {
        localStorage.removeItem('currentEpisode');
        window.location.href = 'index.html';
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
            }
            
            qualitySelect.addEventListener('change', (e) => {
                const newQuality = e.target.value;
                if (newQuality && availableQualities[newQuality] && currentEpisodeData) {
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
    
    // ========== ИСПРАВЛЕННОЕ УВЕДОМЛЕНИЕ С КРАСИВЫМИ КНОПКАМИ ==========
    function showResumeNotification(savedProgress) {
        const qualityInfo = savedProgress.quality ? ` (${savedProgress.quality})` : '';
        
        const notification = document.createElement('div');
        notification.className = 'resume-notification';
        notification.innerHTML = `
            <div class="resume-content">
                <p>📺 Вы смотрели ${savedProgress.season} сезон, ${savedProgress.episode} серия${qualityInfo}</p>
                <div class="resume-buttons">
                    <button class="resume-catalog-btn">📁 В каталог</button>
                    <button class="resume-play-btn">▶️ Смотреть с начала</button>
                </div>
                <button class="close-modal">✖</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        notification.querySelector('.resume-catalog-btn').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
            goToCatalog();
        });
        
        notification.querySelector('.resume-play-btn').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        notification.querySelector('.close-modal').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
    // ===================================================================
    
    async function copySimpleLink() {
        if (!currentEpisodeData) return;
        
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
    
    function addNavigationButtons() {
        const episodeInfo = document.querySelector('.episode-info');
        
        const navPanel = document.createElement('div');
        navPanel.className = 'navigation-panel';
        navPanel.innerHTML = `
            <div class="nav-buttons">
                <button id="prevEpisodeBtn" class="nav-btn prev-btn">◀ Предыдущая</button>
                <button id="catalogBtn" class="nav-btn catalog-btn">📁 В каталог</button>
                <button id="nextEpisodeBtn" class="nav-btn next-btn">Следующая ▶</button>
            </div>
        `;
        
        episodeInfo.appendChild(navPanel);
        
        const prevBtn = document.getElementById('prevEpisodeBtn');
        const nextBtn = document.getElementById('nextEpisodeBtn');
        const catalogBtn = document.getElementById('catalogBtn');
        
        prevBtn.addEventListener('click', loadPrevEpisode);
        nextBtn.addEventListener('click', loadNextEpisode);
        catalogBtn.addEventListener('click', goToCatalog);
        
        updateNavigationButtons();
    }
    
    function loadVideo(season, episode, title) {
        loadQualities(season, episode);
        
        let selectedQuality = getSavedQuality(season, episode);
        if (!selectedQuality || !availableQualities || !availableQualities[selectedQuality]) {
            selectedQuality = episodesData.getDefaultQuality(season, episode);
        }
        
        currentQuality = selectedQuality;
        currentEpisodeData = { season, episode, title };
        
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
        
        saveProgress(season, episode, selectedQuality);
        
        const newUrl = `${window.location.pathname}?season=${season}&episode=${episode}`;
        window.history.pushState({}, '', newUrl);
        
        updateNavigationButtons();
        
        const savedProgress = getSavedProgress(season, episode);
        if (savedProgress) {
            setTimeout(() => {
                showResumeNotification(savedProgress);
            }, 500);
        }
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
    
    setTimeout(() => {
        addNavigationButtons();
    }, 500);
    
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
