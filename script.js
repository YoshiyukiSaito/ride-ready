const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const locationEl = document.getElementById("location");
const temperatureEl = document.getElementById("temperature");
const precipitationEl = document.getElementById("precipitation");
const retryButton = document.getElementById("retry");
const todayTab = document.getElementById("today-tab");
const tomorrowTab = document.getElementById("tomorrow-tab");
const weatherPanel = document.getElementById("weather-panel");

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
let forecast;
let selectedDay = 0;

function setLoading(message) {
  statusEl.textContent = message;
  resultEl.textContent = "読み込み中…";
  resultEl.className = "result";
  locationEl.textContent = "—";
  temperatureEl.textContent = "—";
  precipitationEl.textContent = "—";
}

function showError(message) {
  statusEl.textContent = message;
  resultEl.textContent = "天気を取得できませんでした";
  resultEl.className = "result";
}

function updateWeatherCard(weather, day) {
  const condition = weather.precipitationProbability >= 50 ? "雨" : "晴れ";
  statusEl.textContent = day === 0 ? "今日の天気です。" : "明日の天気です。";
  resultEl.textContent = condition;
  resultEl.className = `result ${condition === "雨" ? "rain" : "sunny"}`;
  locationEl.textContent = weather.location;
  temperatureEl.textContent = weather.temperature;
  precipitationEl.textContent = `${weather.precipitationProbability}%`;
}

async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    daily: "temperature_2m_max,precipitation_probability_max",
    timezone: "auto",
  });

  const response = await fetch(`${WEATHER_API}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Weather request failed with ${response.status}`);
  }

  const data = await response.json();
  const temperatures = data.daily?.temperature_2m_max ?? [];
  const precipitationProbabilities = data.daily?.precipitation_probability_max ?? [];

  return {
    location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    days: [0, 1].map((day) => ({
      temperature:
        temperatures[day] === undefined ? "—" : `${Math.round(temperatures[day])}°C`,
      precipitationProbability: Math.round(precipitationProbabilities[day] ?? 0),
    })),
  };
}

function selectDay(day) {
  selectedDay = day;
  const isToday = day === 0;
  todayTab.classList.toggle("is-active", isToday);
  tomorrowTab.classList.toggle("is-active", !isToday);
  todayTab.setAttribute("aria-selected", String(isToday));
  tomorrowTab.setAttribute("aria-selected", String(!isToday));
  weatherPanel.setAttribute("aria-labelledby", isToday ? "today-tab" : "tomorrow-tab");

  if (forecast) {
    updateWeatherCard({ ...forecast.days[day], location: forecast.location }, day);
  }
}

function requestWeather() {
  forecast = undefined;
  setLoading("位置情報を取得しています…");

  if (!navigator.geolocation) {
    showError("このブラウザは位置情報に対応していません。" );
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const weather = await fetchWeather(
          position.coords.latitude,
          position.coords.longitude
        );
        forecast = weather;
        selectDay(selectedDay);
      } catch (error) {
        console.error(error);
        showError("天気情報を取得できませんでした。");
      }
    },
    () => {
      showError("位置情報の取得が許可されませんでした。" );
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

retryButton.addEventListener("click", requestWeather);
todayTab.addEventListener("click", () => selectDay(0));
tomorrowTab.addEventListener("click", () => selectDay(1));
requestWeather();
