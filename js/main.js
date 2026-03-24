document.addEventListener('DOMContentLoaded', () => {
    const seasonsList = document.getElementById('seasonsList');
    const episodesSection = document.getElementById('episodesSection');
    const episodesGrid = document.getElementById('episodesGrid');
    const currentSeasonTitle = document.getElementById('currentSeasonTitle');
    const backToSeasonsBtn = document.getElementById('backToSeasonsBtn');
    
    const allSeasons = episodesData.getAllSeasons();
    
    const seriesInfo = document.querySelector('.series-info h2');
    if (seriesInfo) {
        seriesInfo.textContent = `Сериал "${episodesData.title}"`;
    }
    
    // Функция для получения диапазона качеств (от меньшего к большему)
    function getQualityRange(qualities) {
        if (!qualities || Object.keys(qualities).length === 0) return null;
        
        const qualityOrder = ["240p", "360p", "480p", "720p", "1080p", "2160p"];
        
        let minQuality = null;
        let maxQuality = null;
        let minIndex = Infinity;
        let maxIndex = -Infinity;
        
        Object.keys(qualities).forEach(q => {
            const index = qualityOrder.indexOf(q);
            if (index !== -1) {
                if (index < minIndex) {
                    minIndex = index;
                    minQuality = q;
                }
                if (index > maxIndex) {
                    maxIndex = index;
                    maxQuality = q;
                }
            }
        });
        
        if (minQuality && maxQuality) {
            if (minQuality === maxQuality) {
                const num = minQuality.replace('p', '');
                return num;
            }
            const minNum = minQuality.replace('p', '');
            const maxNum = maxQuality.replace('p', '');
            return `${minNum}-${maxNum}`; // 240-1080, а не 1080-240
        }
        
        return null;
    }
    
    function displaySeasons() {
        seasonsList.innerHTML = '';
        
        allSeasons.forEach((season) => {
            let hasAnyProgress = false;
            season.episodes.forEach(ep => {
                const progressKey = `progress_${season.season}_${ep.number}`;
                const saved = localStorage.getItem(progressKey);
                if (saved && JSON.parse(saved).time) {
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
    
    function showEpisodes(seasonNumber) {
        const season = allSeasons.find(s => s.season === seasonNumber);
        
        if (!season) return;
        
        currentSeasonTitle.innerHTML = `
            <h3>${season.season} Сезон</h3>
            <p>${season.year} год • ${season.episodes.length} серий</p>
        `;
        
        episodesGrid.innerHTML = '';
        
        season.episodes.forEach(ep => {
            const progressKey = `progress_${season.season}_${ep.number}`;
            const savedProgress = localStorage.getItem(progressKey);
            const hasProgress = savedProgress && JSON.parse(savedProgress).time;
            let progressTime = '';
            let savedQuality = '';
            
            if (hasProgress) {
                const saved = JSON.parse(savedProgress);
                if (saved.time) {
                    const minutes = Math.floor(saved.time / 60);
                    const seconds = Math.floor(saved.time % 60);
                    progressTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                if (saved.quality) {
                    savedQuality = ` • ${saved.quality}`;
                }
            }
            
            const qualities = episodesData.getAvailableQualities(season.season, ep.number);
            const qualityRange = getQualityRange(qualities);
            
            const episodeCard = document.createElement('button');
            episodeCard.className = `episode-card ${hasProgress ? 'has-progress' : ''}`;
            episodeCard.setAttribute('data-season', season.season);
            episodeCard.setAttribute('data-episode', ep.number);
            episodeCard.setAttribute('data-title', ep.title);
            
            episodeCard.innerHTML = `
                <div class="episode-number">${ep.number} серия</div>
                <div class="episode-title">${ep.title}</div>
                <div class="episode-duration">${ep.duration}</div>
                ${qualityRange ? `<div class="episode-qualities">🎬 ${qualityRange}</div>` : ''}
                ${hasProgress ? `<div class="episode-progress">⏺ ${progressTime}${savedQuality}</div>` : ''}
            `;
            
            episodeCard.addEventListener('click', () => {
                localStorage.setItem('currentEpisode', JSON.stringify({
                    season: season.season,
                    episode: ep.number,
                    title: ep.title
                }));
                
                window.location.href = `player.html?season=${season.season}&episode=${ep.number}`;
            });
            
            episodesGrid.appendChild(episodeCard);
        });
        
        seasonsList.style.display = 'none';
        episodesSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    backToSeasonsBtn.addEventListener('click', () => {
        seasonsList.style.display = 'grid';
        episodesSection.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    displaySeasons();
});
