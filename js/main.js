document.addEventListener('DOMContentLoaded', () => {
    const seasonsContainer = document.getElementById('seasonsContainer');
    
    if (!seasonsContainer) return;
    
    // Получаем все сезоны из all.js
    const allSeasons = episodesData.getAllSeasons();
    
    // Отображаем информацию о сериале
    const seriesInfo = document.querySelector('.series-info h2');
    if (seriesInfo) {
        seriesInfo.textContent = `Сериал "${episodesData.title}"`;
        const description = document.createElement('p');
        description.className = 'series-description';
        description.textContent = episodesData.description;
        document.querySelector('.series-info').appendChild(description);
    }
    
    // Отображаем все сезоны
    allSeasons.forEach((season) => {
        const seasonCard = document.createElement('div');
        seasonCard.className = 'season-card';
        
        // Проверяем наличие прогресса для серий
        const episodesWithProgress = season.episodes.map(ep => {
            const progressKey = `progress_${season.season}_${ep.number}`;
            const saved = localStorage.getItem(progressKey);
            const hasProgress = saved && JSON.parse(saved).time > 10;
            return { ...ep, hasProgress };
        });
        
        seasonCard.innerHTML = `
            <div class="season-header">
                <h3 class="season-title">${season.season} Сезон</h3>
                <span class="season-year">${season.year}</span>
            </div>
            <div class="episodes-count">${season.episodes.length} серий</div>
            <div class="episodes-grid">
                ${episodesWithProgress.map(ep => `
                    <button class="episode-btn ${ep.hasProgress ? 'has-progress' : ''}" 
                            data-season="${season.season}" 
                            data-episode="${ep.number}" 
                            data-file="${ep.file}"
                            data-title="${ep.title}"
                            data-duration="${ep.duration}">
                        <div class="episode-number">${ep.number} серия</div>
                        <div class="episode-title">${ep.title}</div>
                        <div class="episode-duration">${ep.duration}</div>
                        ${ep.hasProgress ? '<span class="progress-icon">⏺</span>' : ''}
                    </button>
                `).join('')}
            </div>
        `;
        
        seasonsContainer.appendChild(seasonCard);
    });
    
    // Добавляем обработчики на кнопки серий
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const season = parseInt(btn.dataset.season);
            const episode = parseInt(btn.dataset.episode);
            const file = btn.dataset.file;
            const title = btn.dataset.title;
            
            // Сохраняем данные в localStorage
            localStorage.setItem('currentEpisode', JSON.stringify({
                season: season,
                episode: episode,
                file: file,
                title: title
            }));
            
            // Переходим на страницу плеера с параметрами
            window.location.href = `player.html?season=${season}&episode=${episode}`;
        });
    });
});
