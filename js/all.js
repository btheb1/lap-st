const episodesData = {
    title: "СашаТаня",
    description: "Сериал о жизни Саши и Тани после свадьбы",
    year: 2024,
    defaultQuality: "1080p", // Качество по умолчанию
    
    series: [
        {
            season: 1,
            title: "Первый сезон",
            year: 2024,
            episodes: [
                { 
                    number: 1, 
                    title: "Знакомство", 
                    duration: "25:30", 
                    description: "Первая серия",
                    qualities: {
                        "1080p": { file: "ser01_1080p.mp4", size: "850 MB", path: "film/seas1/ser01_1080p.mp4" },
                        "720p": { file: "ser01_720p.mp4", size: "450 MB", path: "film/seas1/ser01_720p.mp4" },
                        "480p": { file: "ser01_480p.mp4", size: "250 MB", path: "film/seas1/ser01_480p.mp4" }
                    }
                },
                { 
                    number: 2, 
                    title: "Свадьба", 
                    duration: "24:15", 
                    description: "Вторая серия",
                    qualities: {
                        "1080p": { file: "ser02_1080p.mp4", size: "820 MB", path: "film/seas1/ser02_1080p.mp4" },
                        "720p": { file: "ser02_720p.mp4", size: "430 MB", path: "film/seas1/ser02_720p.mp4" },
                        "480p": { file: "ser02_480p.mp4", size: "240 MB", path: "film/seas1/ser02_480p.mp4" }
                    }
                },
                { 
                    number: 3, 
                    title: "Медовый месяц", 
                    duration: "26:45", 
                    description: "Третья серия",
                    qualities: {
                        "1080p": { file: "ser03_1080p.mp4", size: "890 MB", path: "film/seas1/ser03_1080p.mp4" },
                        "720p": { file: "ser03_720p.mp4", size: "470 MB", path: "film/seas1/ser03_720p.mp4" }
                    }
                },
                { 
                    number: 4, 
                    title: "Новая квартира", 
                    duration: "23:50", 
                    description: "Четвертая серия",
                    qualities: {
                        "1080p": { file: "ser04_1080p.mp4", size: "780 MB", path: "film/seas1/ser04_1080p.mp4" },
                        "720p": { file: "ser04_720p.mp4", size: "410 MB", path: "film/seas1/ser04_720p.mp4" },
                        "480p": { file: "ser04_480p.mp4", size: "220 MB", path: "film/seas1/ser04_480p.mp4" }
                    }
                }
            ]
        },
        {
            season: 2,
            title: "Второй сезон",
            year: 2024,
            episodes: [
                { 
                    number: 1, 
                    title: "Новые проблемы", 
                    duration: "24:45", 
                    description: "Первая серия второго сезона",
                    qualities: {
                        "1080p": { file: "ser01_1080p.mp4", size: "860 MB", path: "film/seas2/ser01_1080p.mp4" },
                        "720p": { file: "ser01_720p.mp4", size: "460 MB", path: "film/seas2/ser01_720p.mp4" }
                    }
                },
                { 
                    number: 2, 
                    title: "Родители", 
                    duration: "25:20", 
                    description: "Вторая серия",
                    qualities: {
                        "1080p": { file: "ser02_1080p.mp4", size: "840 MB", path: "film/seas2/ser02_1080p.mp4" },
                        "720p": { file: "ser02_720p.mp4", size: "440 MB", path: "film/seas2/ser02_720p.mp4" },
                        "480p": { file: "ser02_480p.mp4", size: "250 MB", path: "film/seas2/ser02_480p.mp4" }
                    }
                }
            ]
        }
    ],
    
    // Функция получения доступных качеств для серии
    getAvailableQualities: function(season, episode) {
        const seasonData = this.series.find(s => s.season === season);
        if (seasonData) {
            const episodeData = seasonData.episodes.find(e => e.number === episode);
            if (episodeData) {
                return episodeData.qualities;
            }
        }
        return null;
    },
    
    // Функция получения лучшего доступного качества
    getBestQuality: function(season, episode) {
        const qualities = this.getAvailableQualities(season, episode);
        if (qualities) {
            const qualityOrder = ["2160p", "1080p", "720p", "480p", "360p"];
            for (let q of qualityOrder) {
                if (qualities[q]) {
                    return q;
                }
            }
        }
        return null;
    },
    
    // Функция получения качества по умолчанию
    getDefaultQuality: function(season, episode) {
        const qualities = this.getAvailableQualities(season, episode);
        if (qualities && qualities[this.defaultQuality]) {
            return this.defaultQuality;
        }
        return this.getBestQuality(season, episode);
    },
    
    // Функция получения пути к видео
    getVideoPath: function(season, episode, quality) {
        const qualities = this.getAvailableQualities(season, episode);
        if (qualities && qualities[quality]) {
            return qualities[quality].path;
        }
        // Если запрошенное качество недоступно, берем лучшее
        const bestQuality = this.getBestQuality(season, episode);
        if (bestQuality && qualities[bestQuality]) {
            return qualities[bestQuality].path;
        }
        return null;
    },
    
    // Функция получения информации о качестве
    getQualityInfo: function(season, episode, quality) {
        const qualities = this.getAvailableQualities(season, episode);
        if (qualities && qualities[quality]) {
            return qualities[quality];
        }
        return null;
    },
    
    getEpisode: function(season, episode) {
        const seasonData = this.series.find(s => s.season === season);
        if (seasonData) {
            return seasonData.episodes.find(e => e.number === episode);
        }
        return null;
    },
    
    getAllSeasons: function() {
        return this.series;
    },
    
    getEpisodesCount: function(season) {
        const seasonData = this.series.find(s => s.season === season);
        return seasonData ? seasonData.episodes.length : 0;
    }
};

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = episodesData;
}
