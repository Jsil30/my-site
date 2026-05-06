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
					console.error('fetchWeather error', err);
					if(elCond()) elCond().textContent = `Unable to fetch (${err.message})`;
			}
		}

			function promptForCoords(){
				// Basic manual fallback: ask user for "lat,lon" (simple UX for testing/offline/localfile)
				const raw = window.prompt('Enter coordinates as "lat,lon" (e.g. 60.1699,24.9384)');
				if(!raw) return;
				const parts = raw.split(',').map(s => s.trim());
				if(parts.length !== 2) return alert('Please enter latitude and longitude separated by a comma.');
				const la = parseFloat(parts[0]);
				const lo = parseFloat(parts[1]);
				if(Number.isFinite(la) && Number.isFinite(lo)){
					fetchWeather(la, lo);
				}else{
					alert('Invalid coordinates. Try again.');
				}
			}

				async function promptForLocation(){
					// Let user enter either a city name or coordinates
					const raw = window.prompt('Enter a city name (e.g. Helsinki) or coordinates as "lat,lon"');
					if(!raw) return;
					// Looks like coordinates?
					if(raw.indexOf(',') > -1){
						const parts = raw.split(',').map(s => s.trim());
						if(parts.length === 2){
							const la = parseFloat(parts[0]);
							const lo = parseFloat(parts[1]);
							if(Number.isFinite(la) && Number.isFinite(lo)){
								return fetchWeather(la, lo);
							}
						}
						alert('Invalid coordinates. Try again.');
						return;
					}

					// Treat as city name — use Open-Meteo geocoding
					const query = encodeURIComponent(raw.trim());
					const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`;
					try{
						const res = await fetch(geoUrl);
						if(!res.ok) throw new Error('Geocoding request failed');
						const data = await res.json();
						if(!data || !data.results || data.results.length === 0){
							return alert('No locations found for that name. Try a different query.');
						}
						// If multiple results, pick the first (most relevant)
						const place = data.results[0];
						const la = place.latitude;
						const lo = place.longitude;
						fetchWeather(la, lo);
					}catch(err){
						console.error('Geocoding error', err);
						alert('Unable to resolve location name. Try entering coordinates instead.');
					}
				}

			let _geoAttempt = 0; // count auto-retries per user action

			function requestLocation(){
				const _elCond = elCond();
				if(!_elCond) return;
				// Notify if insecure context but still attempt geolocation (some browsers may block it)
				if(!window.isSecureContext){
					_elCond.textContent = 'Note: Geolocation works best on HTTPS or localhost — attempting anyway.';
				}
				if(!navigator.geolocation){
					_elCond.textContent = 'Geolocation not supported in this browser';
					return;
				}

				_geoAttempt = 0;
				_elCond.textContent = 'Requesting location…';

				const geoOptions = { maximumAge: 600000, timeout: 20000, enableHighAccuracy: false };

				const doGeo = (options) => {
					navigator.geolocation.getCurrentPosition((pos) => {
						console.log('geolocation success', pos.coords);
						fetchWeather(pos.coords.latitude, pos.coords.longitude);
					}, (err) => {
						console.warn('geolocation error', err);
						if(err && err.code === 1){ // PERMISSION_DENIED
							_elCond.textContent = 'Enable location to see your weather';
							return;
						}
						if(err && err.code === 3){ // TIMEOUT
							if(_geoAttempt === 0){
								// retry once with higher accuracy and longer timeout
								_geoAttempt++;
								_elCond.textContent = 'Location timeout — retrying with higher accuracy…';
								const retryOptions = { maximumAge: 600000, timeout: 30000, enableHighAccuracy: true };
								return doGeo(retryOptions);
							} else {
								_elCond.textContent = 'Location error: Timeout expired — automatic retry failed. Please try again.';
								return;
							}
						}
						if(err && err.message){
							_elCond.textContent = `Location error: ${err.message}`;
						} else {
							_elCond.textContent = 'Location unavailable';
						}
					}, options);
				};

				doGeo(geoOptions);
			}

			function onRetryClick(){
				// Always retry automatic geolocation when Retry is clicked
				requestLocation();
			}

		function init(){
			const retry = btnRetry();
				if(retry) retry.addEventListener('click', onRetryClick);
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

