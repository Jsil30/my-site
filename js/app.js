// Single app.js: weather widget + navbar & reveal behavior
(() => {
	// Weather widget logic
	const weatherModule = (() => {
		const elTemp = () => document.getElementById('weather-temp');
		const elCond = () => document.getElementById('weather-cond');
		const elEmoji = () => document.getElementById('weather-emoji');
		const btnRetry = () => document.getElementById('weather-retry');
		const card = () => document.getElementById('weather-card');

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
			const _elCond = elCond();
			if(!_elCond) return;
			_elCond.textContent = 'Loading…';
			try{
				const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
				const res = await fetch(url);
				if(!res.ok) throw new Error('Network response not ok');
				const data = await res.json();
				if(!data || !data.current_weather) throw new Error('No current weather data');
				const cw = data.current_weather;
				const t = Math.round(cw.temperature);
				const m = mapWeather(cw.weathercode);
				if(elEmoji()) elEmoji().textContent = m.emoji;
				if(elTemp()) elTemp().textContent = `${t}°C`;
				if(elCond()) elCond().textContent = m.text;
				if(card()) card().classList.add('visible');
			}catch(err){
				if(elCond()) elCond().textContent = 'Unable to fetch';
			}
		}

		function requestLocation(){
			const _elCond = elCond();
			if(!_elCond) return;
			if(!navigator.geolocation){
				_elCond.textContent = 'Enable location to see your weather';
				return;
			}
			_elCond.textContent = 'Requesting location…';
			navigator.geolocation.getCurrentPosition((pos) => {
				fetchWeather(pos.coords.latitude, pos.coords.longitude);
			}, (err) => {
				// Friendly fallback message when user denies permission
				_elCond.textContent = 'Enable location to see your weather';
			}, { maximumAge: 600000, timeout: 10000 });
		}

		function init(){
			const retry = btnRetry();
			if(retry) retry.addEventListener('click', requestLocation);
			requestLocation();
		}

		return { init };
	})();

	// UI: navbar scroll and reveal effects (migrated from main.js)
	const uiModule = (() => {
		function init(){
			const navbar = document.getElementById('navbar');
			if(navbar){
				window.addEventListener('scroll', () => {
					navbar.classList.toggle('scrolled', window.scrollY > 30);
				});
			}

			const revealEls = document.querySelectorAll('.reveal');
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							entry.target.classList.add('visible');
							observer.unobserve(entry.target);
						}
					});
				},
				{ threshold: 0.12 }
			);
			revealEls.forEach((el) => observer.observe(el));

			// Stagger reveal for grid children
			document.querySelectorAll('.services-grid, .projects-grid, .testimonials-grid, .process-steps').forEach((grid) => {
				Array.from(grid.children).forEach((child, i) => {
					child.style.transitionDelay = `${i * 0.08}s`;
					child.classList.add('reveal');
					observer.observe(child);
				});
			});
		}

		return { init };
	})();

	// Initialize on DOMContentLoaded
	document.addEventListener('DOMContentLoaded', () => {
		uiModule.init();
		weatherModule.init();
	});

})();

