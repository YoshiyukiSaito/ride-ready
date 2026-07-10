const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const locationEl = document.getElementById("location");
const temperatureEl = document.getElementById("temperature");
const precipitationEl = document.getElementById("precipitation");
const retryButton = document.getElementById("retry");

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

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

function updateWeatherCard(weather) {
  const condition = weather.precipitationProbability >= 50 ? "雨" : "晴れ";
  statusEl.textContent = weather.message;
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
    current: "temperature_2m,precipitation_probability",
    daily: "precipitation_probability_max",
    timezone: "auto",
  });

  const response = await fetch(`${WEATHER_API}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Weather request failed with ${response.status}`);
  }

  const data = await response.json();
  const temperature = data.current?.temperature_2m;
  const precipitationProbability = Math.round(
    data.daily?.precipitation_probability_max?.[0] ??
      data.current?.precipitation_probability ??
      0
  );

  return {
    location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    temperature: temperature === undefined ? "—" : `${Math.round(temperature)}°C`,
    precipitationProbability,
    message:
      precipitationProbability >= 50
        ? "今日の降水確率が高いです。"
        : "今日の降水確率は低めです。",
  };
}

function requestWeather() {
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
        updateWeatherCard(weather);
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
requestWeather();
