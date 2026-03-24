const episodesData = {
    title: "СашаТаня",
    description: "Сериал о жизни Саши и Тани",
    year: 2013,
    
    series: [
        {
            season: 1,
            title: "Первый сезон",
            year: 2013,
            episodes: [
                { 
                    number: 1, 
                    title: "Новоселье", 
                    duration: "23:08", 
                    description: "Первая серия",
                    qualities: {
                        "1080p": { file: "ser01_1080p.mp4", size: "850 MB", path: "film/seas1/ser01_1080p.mp4" },
                        "720p": { file: "ser01_720p.mp4", size: "450 MB", path: "film/seas1/ser01_720p.mp4" },
                        "480p": { file: "ser01_480p.mp4", size: "250 MB", path: "film/seas1/ser01_480p.mp4" },
                        "360p": { file: "seas01_ser01_360p.mp4", size: "101 MB", path: "film/seas01/ser01/seas01_ser01_360p.mp4" },
                        "240p": { file: "seas01_ser01_240p.mp4", size: "59.3 MB", path: "film/seas01/ser01/seas01_ser01_240p.mp4" }
                    }
                },
                { 
                    number: 2, 
                    title: "Свадьба", 
                    duration: "24:15", 
                    description: "Вторая серия",
                    qualities: {
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
                        "480p": { file: "ser01_480p.mp4", size: "260 MB", path: "film/seas2/ser01_480p.mp4" },
                        "360p": { file: "ser01_360p.mp4", size: "180 MB", path: "film/seas2/ser01_360p.mp4" }
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
    
    // Порядок качеств от лучшего к худшему
    qualityOrder: ["2160p", "1080p", "720p", "480p", "360p", "240p"],
    
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
    
    // Функция получения самого высокого доступного качества
    getBestQuality: function(season, episode) {
        const qualities = this.getAvailableQualities(season, episode);
        if (!qualities) return null;
        
        for (let q of this.qualityOrder) {
            if (qualities[q]) {
                return q;
            }
        }
        return null;
    },
    
    // Функция получения самого низкого доступного качества
    getWorstQuality: function(season, episode) {
        const qualities = this.getAvailableQualities(season, episode);
        if (!qualities) return null;
        
        for (let i = this.qualityOrder.length - 1; i >= 0; i--) {
            const q = this.qualityOrder[i];
            if (qualities[q]) {
                return q;
            }
        }
        return null;
    },
    
    // Функция получения качества по умолчанию (самое высокое)
    getDefaultQuality: function(season, episode) {
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = episodesData;
}
