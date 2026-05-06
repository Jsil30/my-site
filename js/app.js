(function(){
  const elTemp = document.getElementById('weather-temp');
  const elCond = document.getElementById('weather-cond');
  const elEmoji = document.getElementById('weather-emoji');
  const btnRetry = document.getElementById('weather-retry');
  const card = document.getElementById('weather-card');

  const weatherCodeMap = {
    0: {emoji:'☀️', text:'Clear'},
    1: {emoji:'🌤️', text:'Mainly clear'},
    2: {emoji:'⛅', text:'Partly cloudy'},
    3: {emoji:'☁️', text:'Overcast'},
    45: {emoji:'🌫️', text:'Fog'},
    48: {emoji:'🌫️', text:'Depositing rime fog'},
    51: {emoji:'🌦️', text:'Light drizzle'},
    53: {emoji:'🌦️', text:'Moderate drizzle'},
    55: {emoji:'🌧️', text:'Dense drizzle'},
    56: {emoji:'🥶', text:'Freezing drizzle'},
    57: {emoji:'🥶', text:'Freezing drizzle'},
    61: {emoji:'🌧️', text:'Slight rain'},
    63: {emoji:'🌧️', text:'Moderate rain'},
    65: {emoji:'🌧️', text:'Heavy rain'},
    66: {emoji:'🥶', text:'Freezing rain'},
    67: {emoji:'🥶', text:'Heavy freezing rain'},
    71: {emoji:'❄️', text:'Slight snow'},
    73: {emoji:'❄️', text:'Moderate snow'},
    75: {emoji:'❄️', text:'Heavy snow'},
    77: {emoji:'❄️', text:'Snow grains'},
    80: {emoji:'🌧️', text:'Rain showers'},
    81: {emoji:'🌧️', text:'Moderate showers'},
    82: {emoji:'🌧️', text:'Violent showers'},
    85: {emoji:'❄️', text:'Slight snow showers'},
    86: {emoji:'❄️', text:'Heavy snow showers'},
    95: {emoji:'⛈️', text:'Thunderstorm'},
    96: {emoji:'⛈️', text:'Thunderstorm with hail'},
    99: {emoji:'⛈️', text:'Severe thunderstorm'}
  };

  function mapWeather(code){
    return weatherCodeMap.hasOwnProperty(code) ? weatherCodeMap[code] : {emoji:'🌈', text:'Unknown'};
  }

  async function fetchWeather(lat, lon){
    if(!elCond) return;
    elCond.textContent = 'Loading…';
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      if(!data || !data.current_weather) throw new Error('No current weather data');
      const cw = data.current_weather;
      const t = Math.round(cw.temperature);
      const m = mapWeather(cw.weathercode);
      if(elEmoji) elEmoji.textContent = m.emoji;
      if(elTemp) elTemp.textContent = `${t}°C`;
      if(elCond) elCond.textContent = m.text;
      if(card) card.classList.add('visible');
    }catch(err){
      if(elCond) elCond.textContent = 'Unable to fetch';
    }
  }

  function requestLocation(){
    if(!elCond) return;
    if(!navigator.geolocation){
      elCond.textContent = 'Enable location to see your weather';
      return;
    }
    elCond.textContent = 'Requesting location…';
    navigator.geolocation.getCurrentPosition((pos) => {
      fetchWeather(pos.coords.latitude, pos.coords.longitude);
    }, (err) => {
      // Friendly fallback message when user denies permission
      elCond.textContent = 'Enable location to see your weather';
    }, { maximumAge: 600000, timeout: 10000 });
  }

  if(btnRetry) btnRetry.addEventListener('click', requestLocation);
  // initialize after DOM content loaded
  document.addEventListener('DOMContentLoaded', requestLocation);
})();
