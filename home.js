// weather.js - Unified Weather Logic with Enter key + Unit Toggle

const apiKey = "48c0a26619e44658b0983211251607";
let map;
let hourlyChartInstance;
let currentUnit = "metric"; // "imperial" or "metric"

function getFormattedDateTime(localtime) {
  const date = new Date(localtime);
  const options = {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
  };
  return date.toLocaleString('en-US', options);
}

function loadMap(lat, lon) {
  if (map) map.remove();
  map = L.map('map').setView([lat, lon], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker([lat, lon]).addTo(map).bindPopup("You're here!").openPopup();
}

function drawHourlyChart(labels, temps, rain, isMetric) {
  const ctx = document.getElementById("hourlyChart").getContext("2d");
  if (hourlyChartInstance) hourlyChartInstance.destroy();

  hourlyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: isMetric ? 'Temp (°C)' : 'Temp (°F)',
          data: temps,
          borderColor: "#f44336",
          backgroundColor: "transparent",
          tension: 0.4,
          yAxisID: 'y1'
        },
        {
          type: 'bar',
          label: 'Rain (mm)',
          data: rain,
          backgroundColor: "#2196f3",
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: { display: true, text: "Rainfall (mm)" }
        },
        y1: {
          beginAtZero: false,
          position: 'right',
          title: { display: true, text: isMetric ? "Temperature (°C)" : "Temperature (°F)" },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function fetchWeather(city = "Jaipur") {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=8&aqi=yes&alerts=no`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const { location, current, forecast } = data;
      const isMetric = currentUnit === "metric";

      // Current Weather Display
      const formattedDate = getFormattedDateTime(location.localtime);
      const temp = isMetric ? `${current.temp_c}°C` : `${current.temp_f}°F`;
      const feelsLike = isMetric ? `${current.feelslike_c}°C` : `${current.feelslike_f}°F`;
      const wind = isMetric ? `${current.wind_kph} kph` : `${current.wind_mph} mph`;
      const dew = isMetric
        ? `${current.dewpoint_c ?? "-"}°C`
        : `${current.dewpoint_f ?? "-"}°F`;
      const visibility = isMetric ? `${current.vis_km} km` : `${current.vis_miles} mi`;

      document.querySelector(".current-weathercard").innerHTML = `
        <p style="color: #c24f29; font-size: 14px;">${formattedDate}</p>
        <h2 style="font-size: 24px; font-weight: bold;">${location.name}, ${location.country}</h2>
        <div style="font-size: 36px; font-weight: bold;">${temp}</div>
        <p><strong>Feels like ${feelsLike}.</strong> ${current.condition.text}</p>
        <p>💨 ${wind} | 📈 ${current.pressure_mb} hPa</p>
        <p>Humidity: ${current.humidity}% | UV: ${current.uv}</p>
        <p>Dew point: ${dew} | Visibility: ${visibility}</p>
      `;

      loadMap(location.lat, location.lon);

      // Hourly Forecast
      const hours = forecast.forecastday[0].hour
        .filter(h => new Date(h.time) > new Date())
        .slice(0, 12);
      const hourlyLabels = hours.map(h => new Date(h.time).getHours() + "h");
      const hourlyTemps = hours.map(h => isMetric ? h.temp_c : h.temp_f);
      const hourlyRain = hours.map(h => h.precip_mm);
      drawHourlyChart(hourlyLabels, hourlyTemps, hourlyRain, isMetric);

      // 8-Day Forecast
      const forecastList = document.getElementById("forecastList");
      forecastList.innerHTML = "";

      forecast.forecastday.forEach(day => {
        const dateObj = new Date(day.date);
        const dayName = dateObj.toLocaleDateString("en-US", { weekday: 'short' });
        const dateLabel = dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });

        const forecastTemp = isMetric
          ? `${day.day.maxtemp_c}° / ${day.day.mintemp_c}°C`
          : `${day.day.maxtemp_f}° / ${day.day.mintemp_f}°F`;

        forecastList.innerHTML += `
          <div class="forecast-item">
            <div class="forecast-date">${dayName}, ${dateLabel}</div>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
            <div class="forecast-temp">${forecastTemp}</div>
            <div class="forecast-type">${day.day.condition.text}</div>
          </div>
        `;
      });
    })
    .catch(err => console.error("Error fetching weather data:", err));
}

// 🔍 Search handlers
function handleSearch() {
  const city = document.querySelector(".search-input1").value.trim();
  if (city) fetchWeather(city);
}

document.querySelector(".search-button").addEventListener("click", handleSearch);

// 🧠 Enter key triggers same search
document.querySelector(".search-input1").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    handleSearch();
  }
});

// 🌡️ Toggle between Metric and Imperial
const unitButtons = document.querySelectorAll(".unit-button");
unitButtons.forEach(button => {
  button.addEventListener("click", () => {
    unitButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    currentUnit = button.textContent.includes("Metric") ? "metric" : "imperial";

    const city = document.querySelector(".search-input1").value.trim() || "Jaipur";
    fetchWeather(city);
  });
});

// 🟢 Load default on startup
fetchWeather();



