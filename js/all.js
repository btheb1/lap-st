const episodesData = {
    title: "СашаТаня",
    description: "Сериал о жизни Саши и Тани после свадьбы",
    year: 2024,
    
    series: [
        {
            season: 1,
            title: "Первый сезон",
            year: 2024,
            episodes: [
                { number: 1, title: "Знакомство", file: "ser01.mp4", duration: "25:30", description: "Первая серия" },
                { number: 2, title: "Свадьба", file: "ser02.mp4", duration: "24:15", description: "Вторая серия" },
                { number: 3, title: "Медовый месяц", file: "ser03.mp4", duration: "26:45", description: "Третья серия" },
                { number: 4, title: "Новая квартира", file: "ser04.mp4", duration: "23:50", description: "Четвертая серия" },
                { number: 5, title: "Соседи", file: "ser05.mp4", duration: "25:10", description: "Пятая серия" },
                { number: 6, title: "Работа", file: "ser06.mp4", duration: "24:40", description: "Шестая серия" },
                { number: 7, title: "Друзья", file: "ser07.mp4", duration: "26:20", description: "Седьмая серия" },
                { number: 8, title: "Семейный ужин", file: "ser08.mp4", duration: "25:55", description: "Восьмая серия" },
                { number: 9, title: "Отдых", file: "ser09.mp4", duration: "24:10", description: "Девятая серия" },
                { number: 10, title: "Финал сезона", file: "ser10.mp4", duration: "27:30", description: "Десятая серия" }
            ]
        },
        {
            season: 2,
            title: "Второй сезон",
            year: 2024,
            episodes: [
                { number: 1, title: "Новые проблемы", file: "ser01.mp4", duration: "24:45", description: "Первая серия второго сезона" },
                { number: 2, title: "Родители", file: "ser02.mp4", duration: "25:20", description: "Вторая серия" },
                { number: 3, title: "Дети", file: "ser03.mp4", duration: "26:15", description: "Третья серия" },
                { number: 4, title: "Карьера", file: "ser04.mp4", duration: "24:50", description: "Четвертая серия" },
                { number: 5, title: "Путешествие", file: "ser05.mp4", duration: "27:10", description: "Пятая серия" },
                { number: 6, title: "Кризис", file: "ser06.mp4", duration: "25:40", description: "Шестая серия" },
                { number: 7, title: "Примирение", file: "ser07.mp4", duration: "24:30", description: "Седьмая серия" },
                { number: 8, title: "Праздник", file: "ser08.mp4", duration: "26:50", description: "Восьмая серия" },
                { number: 9, title: "Секреты", file: "ser09.mp4", duration: "25:15", description: "Девятая серия" },
                { number: 10, title: "Финал", file: "ser10.mp4", duration: "28:00", description: "Десятая серия" }
            ]
        },
        {
            season: 3,
            title: "Третий сезон",
            year: 2025,
            episodes: [
                { number: 1, title: "Новый этап", file: "ser01.mp4", duration: "25:30", description: "Первая серия третьего сезона" },
                { number: 2, title: "Переезд", file: "ser02.mp4", duration: "26:20", description: "Вторая серия" },
                { number: 3, title: "Знакомства", file: "ser03.mp4", duration: "24:45", description: "Третья серия" },
                { number: 4, title: "Сложный выбор", file: "ser04.mp4", duration: "27:10", description: "Четвертая серия" },
                { number: 5, title: "Поддержка", file: "ser05.mp4", duration: "25:55", description: "Пятая серия" },
                { number: 6, title: "Испытание", file: "ser06.mp4", duration: "26:40", description: "Шестая серия" },
                { number: 7, title: "Победа", file: "ser07.mp4", duration: "24:20", description: "Седьмая серия" },
                { number: 8, title: "Будущее", file: "ser08.mp4", duration: "27:30", description: "Восьмая серия" }
            ]
        },
        {
            season: 4,
            title: "Четвертый сезон",
            year: 2025,
            episodes: [
                { number: 1, title: "Продолжение", file: "ser01.mp4", duration: "25:15", description: "Первая серия" },
                { number: 2, title: "Развитие", file: "ser02.mp4", duration: "26:00", description: "Вторая серия" },
                { number: 3, title: "События", file: "ser03.mp4", duration: "24:35", description: "Третья серия" },
                { number: 4, title: "Решение", file: "ser04.mp4", duration: "25:50", description: "Четвертая серия" },
                { number: 5, title: "Перемены", file: "ser05.mp4", duration: "26:25", description: "Пятая серия" },
                { number: 6, title: "Финал", file: "ser06.mp4", duration: "28:15", description: "Шестая серия" }
            ]
        }
    ],
    
    // Функция для получения серии
    getEpisode: function(season, episode) {
        const seasonData = this.series.find(s => s.season === season);
        if (seasonData) {
            return seasonData.episodes.find(e => e.number === episode);
        }
        return null;
    },
    
    // Функция для получения всех сезонов
    getAllSeasons: function() {
        return this.series;
    },
    
    // Функция для получения количества серий в сезоне
    getEpisodesCount: function(season) {
        const seasonData = this.series.find(s => s.season === season);
        return seasonData ? seasonData.episodes.length : 0;
    }
};

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = episodesData;
}
