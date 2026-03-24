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
            time: params.get('t'),
            quality: params.get('quality')
        };
    }
    
    // Функция получения ID файла из ссылки Google Drive
    function getFileIdFromPath(path) {
        // Форматы ссылок:
        // https://drive.google.com/uc?export=download&id=XXXXX
        // https://drive.google.com/file/d/XXXXX/view
        // https://drive.google.com/file/d/XXXXX/preview
        
        let match = path.match(/[?&]id=([^&]+)/);
        if (match) return match[1];
        
        match = path.match(/\/d\/([^\/]+)/);
        if (match) return match[1];
        
        return null;
    }
    
    // Функция получения embed URL для iframe
    function getEmbedUrl(drivePath) {
        const fileId = getFileIdFromPath(drivePath);
        if (fileId) {
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
        return drivePath;
    }
    
    // Функция получения прямой ссылки для скачивания
    function getDownloadUrl(drivePath) {
        const fileId = getFileIdFromPath(drivePath);
        if (fileId) {
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return drivePath;
    }
    
    // Функция сохранения прогресса (время не можем сохранять в iframe, только качество и серию)
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
    
    function loadQualities(season, episode) {
        availableQualities = episodesData.getAvailableQualities(season, episode);
        
        if (availableQualities && Object.keys(availableQualities).length > 0) {
            qualitySelector.style.display = 'block';
            qualitySelect.innerHTML = '';
            
            const qualityOrder = ["2160p", "1080p", "720p", "480p", "360p", "240p"];
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
            
            let selectedQuality = null;
            
            const urlParams = getUrlParams();
            if (urlParams.quality && availableQualities[urlParams.quality]) {
                selectedQuality = urlParams.quality;
            }
            else if (getSavedQuality(season, episode)) {
                const savedQuality = getSavedQuality(season, episode);
                if (availableQualities[savedQuality]) {
                    selectedQuality = savedQuality;
                }
            }
            else {
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
        saveProgress(currentEpisodeData.season, currentEpisodeData.episode, newQuality);
        
        const videoPath = episodesData.getVideoPath(currentEpisodeData.season, currentEpisodeData.episode, newQuality);
        
        if (videoPath) {
            const embedUrl = getEmbedUrl(videoPath);
            driveIframe.src = embedUrl;
            showNotification(`Качество изменено на ${newQuality}`);
        }
    }
    
    function showResumeNotification(savedProgress) {
        const qualityInfo = savedProgress.quality ? ` (${savedProgress.quality})` : '';
        
        const notification = document.createElement('div');
        notification.className = 'resume-notification';
        notification.innerHTML = `
            <div class="resume-content">
                <p>📺 Вы смотрели ${savedProgress.season} сезон, ${savedProgress.episode} серия${qualityInfo}</p>
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
    
    async function copyLinkWithTimestamp() {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('season', currentEpisodeData.season);
        params.set('episode', currentEpisodeData.episode);
        params.set('quality', currentQuality);
        
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.innerHTML = `
            <div class="copy-content">
                <p>📋 Копирование ссылки</p>
                <p>Качество: ${currentQuality}</p>
                <div class="copy-buttons">
                    <button class="copy-with-quality">✅ Скопировать ссылку</button>
                </div>
                <button class="close-modal">✖</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        notification.querySelector('.copy-with-quality').addEventListener('click', async () => {
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
        
        notification.querySelector('.close-modal').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
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
        }, 2000);
    }
    
    function loadVideo(season, episode, title, quality = null) {
        loadQualities(season, episode);
        
        let selectedQuality = quality;
        if (!selectedQuality) {
            const savedQuality = getSavedQuality(season, episode);
            if (savedQuality && availableQualities && availableQualities[savedQuality]) {
                selectedQuality = savedQuality;
            } else {
                selectedQuality = episodesData.getDefaultQuality(season, episode);
            }
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
        
        // Сохраняем прогресс (качество и серию)
        saveProgress(season, episode, selectedQuality);
        
        // Проверяем сохраненный прогресс для уведомления
        const savedProgress = getSavedProgress(season, episode);
        if (savedProgress && savedProgress.quality) {
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
                            const order = ["2160p", "1080p", "720p", "480p", "360p", "240p"];
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
            const quality = urlParams.quality || null;
            loadVideo(seasonNum, episodeNum, episodeData.title, quality);
            
            const newUrl = `${window.location.pathname}?season=${seasonNum}&episode=${episodeNum}`;
            window.history.pushState({}, '', newUrl);
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
        copyLinkBtn.addEventListener('click', copyLinkWithTimestamp);
    }
    
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
