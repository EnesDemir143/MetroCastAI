export type Language = 'tr' | 'en';

export const translations = {
    tr: {
        weather: "Hava durumu",
        precipitation: "Yağış",
        humidity: "Nem",
        wind: "Rüzgar",
        temperature: "Sıcaklık",
        forecast: "Tahmin",
        today: "Bugün",
        tomorrow: "Yarın",
        fetchS3: "En Son Veriyi Çek (S3)",
        loadSample: "Örnek Veri Yükle",
        dataUpdated: "Veri güncellendi",
        loading: "Yükleniyor...",
        days: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
    },
    en: {
        weather: "Weather",
        precipitation: "Precipitation",
        humidity: "Humidity",
        wind: "Wind",
        temperature: "Temperature",
        forecast: "Forecast",
        today: "Today",
        tomorrow: "Tomorrow",
        fetchS3: "Fetch Latest (S3)",
        loadSample: "Load Sample Data",
        dataUpdated: "Data updated",
        loading: "Loading...",
        days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    }
};
