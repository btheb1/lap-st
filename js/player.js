document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const episodeTitle = document.getElementById('episodeTitle');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const backBtn = document.querySelector('.back-btn');
    const qualitySelector = document.getElementById('qualitySelector');
    const qualitySelect = document.getElementById('qualitySelect');
    const qualitySize = document.getElementById('qualitySize');
    
    let currentEpisodeData = null;
    let currentQuality = null;
    let saveTimeout = null;
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
    
    // Функция сохранения прогресса (с качеством)
    function saveProgress(season, episode, time, quality) {
        const progressKey = `progress_${season}_${episode}`;
        const progressData = {
            season: season,
            episode: episode,
            time: Math.floor(time),
            timestamp: Date.now(),
            title: currentEpisodeData?.title || '',
            quality: quality || currentQuality || episodesData.defaultQuality
        };
        localStorage.setItem(progressKey, JSON.stringify(progressData));
        
        // Сохраняем последний просмотренный сериал
        localStorage.setItem('lastWatched', JSON.stringify({
            season: season,
            episode: episode,
            time: Math.floor(time),
            title: currentEpisodeData?.title || '',
            quality: quality || currentQuality || episodesData.defaultQuality
        }));
        
        // Сохраняем выбранное качество для этого сериала
        localStorage.setItem(`quality_${season}_${episode}`, quality || currentQuality);
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
    
    // Функция получения сохраненного качества
    function getSavedQuality(season, episode) {
        const savedQuality = localStorage.getItem(`quality_${season}_${episode}`);
        if (savedQuality) {
            return savedQuality;
        }
        return null;
    }
    
    // Функция загрузки доступных качеств
    function loadQualities(season, episode) {
        availableQualities = episodesData.getAvailableQualities(season, episode);
        
        if (availableQualities && Object.keys(availableQualities).length > 0) {
            qualitySelector.style.display = 'block';
            qualitySelect.innerHTML = '';
            
            // Сортируем качества по разрешению (от большего к меньшему)
            const qualityOrder = ["2160p", "1080p", "720p", "480p", "360p"];
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
            
            // Устанавливаем текущее качество
            let selectedQuality = null;
            
            // Проверяем качество из URL
            const urlParams = getUrlParams();
            if (urlParams.quality && availableQualities[urlParams.quality]) {
                selectedQuality = urlParams.quality;
            }
            // Проверяем сохраненное качество
            else if (getSavedQuality(season, episode)) {
                const savedQuality = getSavedQuality(season, episode);
                if (availableQualities[savedQuality]) {
                    selectedQuality = savedQuality;
                }
            }
            // Если нет сохраненного, берем качество по умолчанию
            else {
                selectedQuality = episodesData.getDefaultQuality(season, episode);
            }
            
            if (selectedQuality && availableQualities[selectedQuality]) {
                qualitySelect.value = selectedQuality;
                currentQuality = selectedQuality;
                updateQualitySize(selectedQuality);
            }
            
            // Обработчик изменения качества
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
    
    // Функция обновления размера файла
    function updateQualitySize(quality) {
        if (availableQualities && availableQualities[quality] && availableQualities[quality].size) {
            qualitySize.textContent = `Вес: ${availableQualities[quality].size}`;
        } else {
            qualitySize.textContent = '';
        }
    }
    
    // Функция смены качества
    function changeQuality(newQuality) {
        if (!currentEpisodeData) return;
        
        const currentTime = videoPlayer.currentTime;
        const wasPlaying = !videoPlayer.paused;
        
        currentQuality = newQuality;
        updateQualitySize(newQuality);
        
        // Сохраняем выбранное качество
        localStorage.setItem(`quality_${currentEpisodeData.season}_${currentEpisodeData.episode}`, newQuality);
        
        // Загружаем видео с новым качеством
        const videoPath = episodesData.getVideoPath(currentEpisodeData.season, currentEpisodeData.episode, newQuality);
        
        if (videoPath) {
            videoSource.src = videoPath;
            videoPlayer.load();
            
            // Когда видео загрузится, возвращаем на сохраненное время
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoPlayer.currentTime = currentTime;
                if (wasPlaying) {
                    videoPlayer.play();
                }
                showNotification(`Качество изменено на ${newQuality}`);
            }, { once: true });
        }
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
            timeString = `${minutes}:${seconds.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        const qualityInfo = savedProgress.quality ? ` (${savedProgress.quality})` : '';
        
        const notification = document.createElement('div');
        notification.className = 'resume-notification';
        notification.innerHTML = `
            <div class="resume-content">
                <p>📺 Вы смотрели ${savedProgress.season} сезон, ${savedProgress.episode} серия${qualityInfo}</p>
                <p>⏱️ Остановились на ${timeString}</p>
                <div class="resume-buttons">
                    <button class="resume-yes">✅ Досмотреть с ${timeString}</button>
                    <button class="resume-no">▶️ Смотреть с начала</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
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
            saveProgress(savedProgress.season, savedProgress.episode, 0, savedProgress.quality);
        });
    }
    
    // Функция копирования ссылки с таймкодом и качеством
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
        
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.innerHTML = `
            <div class="copy-content">
                <p>📋 Копирование ссылки</p>
                <p>Текущее время: ${timeString}</p>
                <p>Качество: ${currentQuality}</p>
                <div class="copy-buttons">
                    <button class="copy-with-time">✅ С таймкодом и качеством</button>
                    <button class="copy-without-time">📄 Без таймкода</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        notification.querySelector('.copy-with-time').addEventListener('click', async () => {
            params.set('t', currentTime);
            params.set('quality', currentQuality);
            const fullUrl = `${baseUrl}?${params.toString()}`;
            
            try {
                await navigator.clipboard.writeText(fullUrl);
                showNotification('✅ Ссылка с таймкодом и качеством скопирована!');
            } catch (err) {
                showNotification('❌ Ошибка копирования');
            }
            
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        notification.querySelector('.copy-without-time').addEventListener('click', async () => {
            params.set('quality', currentQuality);
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
    function loadVideo(season, episode, title, startTime = null, quality = null) {
        // Загружаем доступные качества
        loadQualities(season, episode);
        
        // Определяем качество
        let selectedQuality = quality;
        if (!selectedQuality) {
            // Проверяем сохраненное качество
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
        
        const videoPath = episodesData.getVideoPath(season, episode, selectedQuality);
        
        if (!videoPath) {
            episodeTitle.innerHTML = '<span style="color: #ff6b6b;">⚠️ Ошибка: видео не найдено</span>';
            return;
        }
        
        videoSource.src = videoPath;
        videoPlayer.load();
        
        // Обновляем заголовок
        episodeTitle.textContent = `${season} сезон, ${episode} серия - ${title || ''} (${selectedQuality})`;
        
        // Сохраняем текущие данные
        currentEpisodeData = { season, episode, title };
        
        // Обработка ошибок
        videoPlayer.addEventListener('error', () => {
            episodeTitle.innerHTML += '<br><span style="color: #ff6b6b;">⚠️ Видео не найдено. Убедитесь, что файл загружен</span>';
            downloadBtn.disabled = true;
            copyLinkBtn.disabled = true;
        });
        
        // Когда видео готово
        videoPlayer.addEventListener('loadedmetadata', () => {
            if (startTime !== null && startTime > 0) {
                videoPlayer.currentTime = startTime;
                videoPlayer.play();
            } else {
                // Проверяем сохраненный прогресс
                const savedProgress = getSavedProgress(season, episode);
                if (savedProgress && savedProgress.time > 5) {
                    showResumeNotification(savedProgress);
                } else {
                    videoPlayer.play();
                }
            }
        });
        
        // Сохраняем прогресс каждые 5 секунд
        videoPlayer.addEventListener('timeupdate', () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                if (videoPlayer.currentTime > 0 && videoPlayer.currentTime < videoPlayer.duration - 5) {
                    saveProgress(season, episode, videoPlayer.currentTime, currentQuality);
                }
            }, 5000);
        });
        
        // Сохраняем прогресс при закрытии/перезагрузке
        window.addEventListener('beforeunload', () => {
            if (videoPlayer.currentTime > 0 && videoPlayer.currentTime < videoPlayer.duration - 5) {
                saveProgress(season, episode, videoPlayer.currentTime, currentQuality);
            }
        });
        
        // Сохраняем прогресс при паузе
        videoPlayer.addEventListener('pause', () => {
            if (videoPlayer.currentTime > 0 && videoPlayer.currentTime < videoPlayer.duration - 5) {
                saveProgress(season, episode, videoPlayer.currentTime, currentQuality);
            }
        });
    }
    
    // Функция возврата к сезонам
    function goBackToSeasons() {
        localStorage.removeItem('currentEpisode');
        window.location.href = 'index.html';
    }
    
    // Функция скачивания с выбором качества
    function downloadWithQuality() {
        if (!currentEpisodeData) return;
        
        const qualities = episodesData.getAvailableQualities(currentEpisodeData.season, currentEpisodeData.episode);
        
        if (qualities && Object.keys(qualities).length > 1) {
            // Если несколько качеств, спрашиваем
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.innerHTML = `
                <div class="copy-content">
                    <p>📥 Выберите качество для скачивания</p>
                    <div class="copy-buttons">
                        ${Object.keys(qualities).sort((a, b) => {
                            const order = ["2160p", "1080p", "720p", "480p", "360p"];
                            return order.indexOf(a) - order.indexOf(b);
                        }).map(q => `
                            <button class="download-quality-btn" data-quality="${q}">
                                ${q} (${qualities[q].size || 'размер неизвестен'})
                            </button>
                        `).join('')}
                    </div>
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
                        const link = document.createElement('a');
                        link.href = videoPath;
                        link.download = `${currentEpisodeData.season}_series_${currentEpisodeData.episode}_${quality}.mp4`;
                        link.click();
                        showNotification(`📥 Скачивание ${quality} началось...`);
                    }
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                });
            });
        } else {
            // Если одно качество, скачиваем сразу
            const videoPath = episodesData.getVideoPath(currentEpisodeData.season, currentEpisodeData.episode, currentQuality);
            if (videoPath) {
                const link = document.createElement('a');
                link.href = videoPath;
                link.download = `${currentEpisodeData.season}_series_${currentEpisodeData.episode}_${currentQuality}.mp4`;
                link.click();
                showNotification(`📥 Скачивание ${currentQuality} началось...`);
            }
        }
    }
    
    // Основная логика
    const urlParams = getUrlParams();
    
    if (urlParams.season && urlParams.episode) {
        const seasonNum = parseInt(urlParams.season);
        const episodeNum = parseInt(urlParams.episode);
        const episodeData = episodesData.getEpisode(seasonNum, episodeNum);
        
        if (episodeData) {
            const startTime = urlParams.time ? parseFloat(urlParams.time) : null;
            const quality = urlParams.quality || null;
            loadVideo(seasonNum, episodeNum, episodeData.title, startTime, quality);
            
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
    
    // Обработчики кнопок
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
    
    // Добавляем эффект ripple для кнопок
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
