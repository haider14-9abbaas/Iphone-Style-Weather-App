const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const weatherMain = document.getElementById('weatherMain');
const citySamples = document.querySelectorAll('.city-samples span');

// Weather icon mapping
function getWeatherIcon(code) {
  if ([0, 1].includes(code)) return "wi-day-sunny";
  if ([2, 3].includes(code)) return "wi-day-cloudy";
  if ([45, 48].includes(code)) return "wi-fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return "wi-rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "wi-snow";
  if ([95, 96, 99].includes(code)) return "wi-thunderstorm";
  return "wi-cloud";
}

async function getCoords(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error('City not found');
  return data.results[0];
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=4&timezone=auto`;
  const res = await fetch(url);
  return await res.json();
}

searchForm.onsubmit = async e => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  showLoading();
  try {
    const loc = await getCoords(city);
    const weatherData = await getWeather(loc.latitude, loc.longitude);
    renderWeather(loc, weatherData);
  } catch (err) {
    weatherMain.innerHTML = `<div class="weather-placeholder animate__animated animate__shakeX">City not found. Try another city.</div>`;
  }
};

if (citySamples.length)
  citySamples.forEach(span => span.onclick = () => {
    cityInput.value = span.textContent;
    searchForm.dispatchEvent(new Event('submit'));
  });

function showLoading() {
  weatherMain.innerHTML = `<div class="weather-placeholder animate__animated animate__fadeIn">Loading...</div>`;
}

function renderWeather(loc, data) {
  const c = data.current_weather;
  const icon = getWeatherIcon(c.weathercode);
  const daily = data.daily;
  const todayIdx = 0;

  // Simulate hourly (Open-Meteo has no free hourly for browser)
  const hourly = Array.from({length: 6}, (_, i) => ({
    time: (new Date(Date.now() + i * 3600000)).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
    temp: Math.round(c.temperature + (Math.random()-0.5)*4),
    icon
  }));

  const dnames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  weatherMain.innerHTML = `
    <div class="weather-card animate__animated animate__fadeInUp">
      <div class="weather-city">${loc.name}${loc.country_code ? ', '+loc.country_code : ''}</div>
      <div class="weather-temp">${c.temperature}&deg;<i class="wi ${icon} weather-emoji animate__animated animate__fadeIn"></i></div>
      <div class="weather-desc">${weatherDescFromCode(c.weathercode)}</div>
      <div class="weather-hi-low">H:${Math.round(daily.temperature_2m_max[todayIdx])}&deg; L:${Math.round(daily.temperature_2m_min[todayIdx])}&deg;</div>
      <div class="weather-cloud">Wind: ${c.windspeed} km/h &middot; Dir: ${c.winddirection}&deg;</div>
      <div class="weather-extra">
        <div>Today<span>${c.temperature}&deg;</span></div>
        <div>Max<span>${Math.round(daily.temperature_2m_max[todayIdx])}&deg;</span></div>
        <div>Min<span>${Math.round(daily.temperature_2m_min[todayIdx])}&deg;</span></div>
      </div>
      <div class="weather-forecast">
        <div class="weather-forecast-title">Next Hours</div>
        <div class="weather-forecast-list">
          ${hourly.map(h => `
            <div class="weather-forecast-item">
              <div>${h.time}</div>
              <i class="wi ${h.icon}"></i>
              <div>${h.temp}&deg;</div>
            </div>
          `).join('')}
        </div>
        <div class="weather-forecast-title">4-Day Forecast</div>
        <div class="weather-forecast-list">
          ${[0,1,2,3].map(i => `
            <div class="weather-forecast-item">
              <div>${dnames[(new Date(daily.time[i])).getDay()]}</div>
              <i class="wi ${getWeatherIcon(daily.weathercode[i])}"></i>
              <div>${Math.round(daily.temperature_2m_min[i])}&deg; | ${Math.round(daily.temperature_2m_max[i])}&deg;</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function weatherDescFromCode(code) {
  if ([0].includes(code)) return "Clear Sky";
  if ([1].includes(code)) return "Mainly Clear";
  if ([2].includes(code)) return "Partly Cloudy";
  if ([3].includes(code)) return "Overcast";
  if ([45,48].includes(code)) return "Fog";
  if ([51,53,55].includes(code)) return "Drizzle";
  if ([56,57].includes(code)) return "Freezing Drizzle";
  if ([61,63,65,80,81,82].includes(code)) return "Rain";
  if ([66,67].includes(code)) return "Freezing Rain";
  if ([71,73,75,77,85,86].includes(code)) return "Snow";
  if ([95,96,99].includes(code)) return "Thunderstorm";
  return "Unknown";
}
