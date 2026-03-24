document.addEventListener('DOMContentLoaded', () => {
    const seasonsContainer = document.getElementById('seasonsContainer');
    
    if (!seasonsContainer) return;
    
    // Отображаем все сезоны
    episodesData.series.forEach((season, seasonIndex) => {
        const seasonCard = document.createElement('div');
        seasonCard.className = 'season-card';
        
        // Проверяем, есть ли сохраненный прогресс для серий
        const episodesWithProgress = season.episodes.map(ep => {
            const progressKey = `progress_${seasonIndex + 1}_${ep.number}`;
            const saved = localStorage.getItem(progressKey);
            const hasProgress = saved && JSON.parse(saved).time > 10;
            return { ...ep, hasProgress };
        });
        
        seasonCard.innerHTML = `
            <h3 class="season-title">${seasonIndex + 1} Сезон</h3>
            <div class="episodes-grid" id="season-${seasonIndex + 1}">
                ${episodesWithProgress.map(ep => `
                    <button class="episode-btn ${ep.hasProgress ? 'has-progress' : ''}" 
                            data-season="${seasonIndex + 1}" 
                            data-episode="${ep.number}" 
                            data-file="${ep.file}"
                            data-title="${ep.title}">
                        ${ep.number} серия<br>
                        <small>${ep.title}</small>
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
            const season = btn.dataset.season;
            const episode = btn.dataset.episode;
            const file = btn.dataset.file;
            const title = btn.dataset.title;
            
            // Сохраняем данные
            localStorage.setItem('currentEpisode', JSON.stringify({
                season: parseInt(season),
                episode: parseInt(episode),
                file: file,
                title: title
            }));
            
            // Переходим на страницу плеера с параметрами
            window.location.href = `player.html?season=${season}&episode=${episode}`;
        });
    });
});
