const API_KEY = "5e805779ff4ee480a343457a6e77fd87";

// ===============================
// ELEMENT HTML
// ===============================

const form = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");

const statusMessage = document.querySelector("#status-message");
const weatherCard = document.querySelector("#weather-card");

const cityName = document.querySelector("#city-name");
const currentDate = document.querySelector("#current-date");
const temperature = document.querySelector("#temperature");
const temperatureUnit = document.querySelector("#temperature-unit");
const weatherDescription = document.querySelector("#weather-description");
const weatherIcon = document.querySelector("#weather-icon");

const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const pressure = document.querySelector("#pressure");

const unitButtons = document.querySelectorAll(".unit-button");
const historyList = document.querySelector("#history-list");
const forecastList = document.querySelector("#forecast-list");

// ===============================
// STATE
// ===============================

let currentUnit = localStorage.getItem("weather-unit") || "metric";
let searchHistory = JSON.parse(
    localStorage.getItem("weather-history")
) || [];


// ===============================
// STATUS MESSAGE
// ===============================

const showStatus = (message) => {
    statusMessage.textContent = message;
    statusMessage.style.display = "block";
};


const hideStatus = () => {
    statusMessage.style.display = "none";
};


// ===============================
// MENAMPILKAN DATA CUACA
// ===============================

const displayWeather = (data) => {

    cityName.textContent = `${data.name}, ${data.sys.country}`;

    temperature.textContent = Math.round(data.main.temp);
    currentUnit === "metric"
        ? (temperatureUnit.textContent = "°C")
        : (temperatureUnit.textContent = "°F");

    // Array method: map()
    const descriptions = data.weather.map(
        (item) => item.description
    );

    weatherDescription.textContent = descriptions[0];

    humidity.textContent = `${data.main.humidity}%`;

    if (currentUnit === "metric") {
        wind.textContent = `${Math.round(data.wind.speed * 3.6)} km/j`;
    } else {
        wind.textContent = `${Math.round(data.wind.speed)} mph`;
    }

    pressure.textContent = `${data.main.pressure} hPa`;

    weatherIcon.src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    weatherIcon.alt = data.weather[0].description;
    weatherIcon.style.display = "block";

    currentDate.textContent =
        new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
};

// ===============================
// PRAKIRAAN CUACA 5 HARI
// ===============================

const getForecast = async (city) => {

    try {

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}&lang=id`
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil prakiraan cuaca");
        }

        const data = await response.json();

        console.log("Forecast data:", data);

        displayForecast(data);

    } catch (error) {

        console.error("Error fetching forecast:", error);

    }

};

// ===============================
// MENAMPILKAN PRAKIRAAN CUACA 5 HARI
// ===============================

const displayForecast = (data) => {

    if (!forecastList) return;

    forecastList.innerHTML = "";

    const dailyData = {};

    // Ambil satu data untuk setiap tanggal
    data.list.forEach((item) => {

        const date = item.dt_txt.split(" ")[0];

        // Kalau tanggal belum ada, simpan data pertama
        if (!dailyData[date]) {
            dailyData[date] = item;
        }

    });

    const forecastDays = Object.values(dailyData).slice(0, 5);

    console.log("Forecast days:", forecastDays);

    forecastDays.forEach((item) => {

        const date = new Date(item.dt * 1000);

        const day = date.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });

        const temperature = Math.round(item.main.temp);

        const description = item.weather[0].description;

        const icon =
            `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;

        const card = document.createElement("div");

        card.classList.add("forecast-card");

        card.innerHTML = `
            <p class="forecast-day">${day}</p>

            <img
                src="${icon}"
                alt="${description}"
                class="forecast-icon"
            >

            <h3>${temperature}°${currentUnit === "metric" ? "C" : "F"}</h3>

            <p class="forecast-description">
                ${description}
            </p>
        `;

        forecastList.appendChild(card);

    });

};


// ===============================
// RIWAYAT PENCARIAN
// ===============================

const displayHistory = () => {

    if (!historyList) return;

    historyList.innerHTML = "";

    if (searchHistory.length === 0) {

        historyList.innerHTML =
            "<li>Belum ada riwayat pencarian.</li>";

        return;
    }

    searchHistory.forEach((city) => {

        const li = document.createElement("li");

        const button = document.createElement("button");

        button.textContent = city;
        button.classList.add("history-button");

        button.addEventListener("click", () => {

            cityInput.value = city;

            getWeather(city);

        });

        li.appendChild(button);

        historyList.appendChild(li);

    });
};


// ===============================
// MENAMBAHKAN RIWAYAT
// ===============================

const addToHistory = (city) => {

    const normalizedCity = city.trim();

    searchHistory = searchHistory.filter(
        (item) =>
            item.toLowerCase() !== normalizedCity.toLowerCase()
    );

    searchHistory.unshift(normalizedCity);

    // Maksimal 5 riwayat
    searchHistory = searchHistory.slice(0, 5);

    localStorage.setItem(
        "weather-history",
        JSON.stringify(searchHistory)
    );

    displayHistory();
};


// ===============================
// MENGAMBIL DATA DARI API
// ===============================

const getWeather = async (city) => {

    showStatus("⏳ Memuat data cuaca...");

    weatherCard.classList.add("loading");

    try {

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}&lang=id`
        );

        // Error jika kota tidak ditemukan
        if (response.status === 404) {
            throw new Error("Kota tidak ditemukan");
        }

        // Error dari API lainnya
        if (!response.ok) {
            throw new Error("Terjadi kesalahan pada API");
        }

        const data = await response.json();

        // tampilkan cuaca saat ini

        displayWeather(data);

        // prakirakan cuaca 5 hari

        getForecast(data.name);

        // riwayat pencarian

        addToHistory(data.name);

        hideStatus();

    } catch (error) {

        if (error instanceof TypeError) {

            showStatus(
                "❌ Koneksi gagal. Periksa internet kamu."
            );

        } else {

            showStatus(`❌ ${error.message}`);

        }

    } finally {

        weatherCard.classList.remove("loading");

    }
};


// ===============================
// GANTI SATUAN
// ===============================

const updateUnitButtons = () => {

    unitButtons.forEach((button) => {

        button.classList.remove("active");

        if (button.dataset.unit === currentUnit) {
            button.classList.add("active");
        }

    });
};


unitButtons.forEach((button) => {

    button.addEventListener("click", () => {

        currentUnit = button.dataset.unit;

        localStorage.setItem(
            "weather-unit",
            currentUnit
        );

        updateUnitButtons();

        const currentCity =
            cityName.textContent.split(",")[0];

        if (
            currentCity &&
            currentCity !== "Belum ada kota"
        ) {
            getWeather(currentCity);
        }

    });

});


// ===============================
// EVENT PENCARIAN
// ===============================

form.addEventListener("submit", (event) => {

    event.preventDefault();

    const city = cityInput.value.trim();

    if (city === "") {

        showStatus(
            "⚠️ Silakan masukkan nama kota."
        );

        return;
    }

    getWeather(city);

});


// ===============================
// SAAT HALAMAN DIBUKA
// ===============================

updateUnitButtons();
displayHistory();
