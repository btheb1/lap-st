document.addEventListener('DOMContentLoaded', () => {
    const seasonsList = document.getElementById('seasonsList');
    const episodesSection = document.getElementById('episodesSection');
    const episodesGrid = document.getElementById('episodesGrid');
    const currentSeasonTitle = document.getElementById('currentSeasonTitle');
    const backToSeasonsBtn = document.getElementById('backToSeasonsBtn');
    
    // Получаем все сезоны из all.js
    const allSeasons = episodesData.getAllSeasons();
    
    // Отображаем информацию о сериале
    const seriesInfo = document.querySelector('.series-info h2');
    if (seriesInfo) {
        seriesInfo.textContent = `Сериал "${episodesData.title}"`;
    }
    
    // Функция отображения сезонов
    function displaySeasons() {
        seasonsList.innerHTML = '';
        
        allSeasons.forEach((season) => {
            // Проверяем, есть ли сохраненный прогресс в этом сезоне
            let hasAnyProgress = false;
            season.episodes.forEach(ep => {
                const progressKey = `progress_${season.season}_${ep.number}`;
                const saved = localStorage.getItem(progressKey);
                if (saved && JSON.parse(saved).time > 10) {
                    hasAnyProgress = true;
                }
            });
            
            const seasonCard = document.createElement('div');
            seasonCard.className = 'season-card-select';
            seasonCard.setAttribute('data-season', season.season);
            
            seasonCard.innerHTML = `
                <div class="season-card-content">
                    <div class="season-number">${season.season} СЕЗОН</div>
                    <div class="season-info">
                        <span class="season-year">${season.year}</span>
                        <span class="episodes-count">${season.episodes.length} серий</span>
                    </div>
                    ${hasAnyProgress ? '<div class="progress-indicator">⏺ Есть прогресс</div>' : ''}
                </div>
                <div class="season-arrow">→</div>
            `;
            
            seasonCard.addEventListener('click', () => {
                showEpisodes(season.season);
            });
            
            seasonsList.appendChild(seasonCard);
        });
    }
    
    // Функция отображения серий выбранного сезона
    function showEpisodes(seasonNumber) {
        const season = allSeasons.find(s => s.season === seasonNumber);
        
        if (!season) return;
        
        // Обновляем заголовок
        currentSeasonTitle.innerHTML = `
            <h3>${season.season} Сезон</h3>
            <p>${season.year} год • ${season.episodes.length} серий</p>
        `;
        
        // Очищаем и заполняем сетку серий
        episodesGrid.innerHTML = '';
        
        season.episodes.forEach(ep => {
            // Проверяем сохраненный прогресс
            const progressKey = `progress_${season.season}_${ep.number}`;
            const savedProgress = localStorage.getItem(progressKey);
            const hasProgress = savedProgress && JSON.parse(savedProgress).time > 10;
            let progressTime = '';
            
            if (hasProgress) {
                const saved = JSON.parse(savedProgress);
                const minutes = Math.floor(saved.time / 60);
                const seconds = Math.floor(saved.time % 60);
                progressTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            const episodeCard = document.createElement('button');
            episodeCard.className = `episode-card ${hasProgress ? 'has-progress' : ''}`;
            episodeCard.setAttribute('data-season', season.season);
            episodeCard.setAttribute('data-episode', ep.number);
            episodeCard.setAttribute('data-file', ep.file);
            episodeCard.setAttribute('data-title', ep.title);
            
            episodeCard.innerHTML = `
                <div class="episode-number">${ep.number} серия</div>
                <div class="episode-title">${ep.title}</div>
                <div class="episode-duration">${ep.duration}</div>
                ${hasProgress ? `<div class="episode-progress">⏺ ${progressTime}</div>` : ''}
            `;
            
            episodeCard.addEventListener('click', () => {
                // Сохраняем данные и переходим к просмотру
                localStorage.setItem('currentEpisode', JSON.stringify({
                    season: season.season,
                    episode: ep.number,
                    file: ep.file,
                    title: ep.title
                }));
                
                window.location.href = `player.html?season=${season.season}&episode=${ep.number}`;
            });
            
            episodesGrid.appendChild(episodeCard);
        });
        
        // Показываем секцию с сериями, скрываем список сезонов
        seasonsList.style.display = 'none';
        episodesSection.style.display = 'block';
        
        // Плавная прокрутка вверх
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Кнопка "Назад к сезонам"
    backToSeasonsBtn.addEventListener('click', () => {
        seasonsList.style.display = 'grid';
        episodesSection.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Отображаем сезоны
    displaySeasons();
});
