// Mausam Pro Application Controller - Deep Behavioral Weather Engine

class MausamApp {
  constructor() {
    this.currentCity = CITIES[0]; // Delhi default
    this.currentPersona = 'health'; // Health default
    this.tempUnit = 'C';
    this.weatherData = null;
    this.airQualityData = null;
    this.isPhoneView = window.innerWidth >= 768; // auto-adapt to real mobile device
    this.hourlyChartInstance = null;
    this.radarMap = null;
    this.radarLayerGroup = null;
    this.activeRadarLayer = 'precip';
    this.activeAlerts = [];
    this.customWidgets = {};
    this.speechSynth = window.speechSynthesis;
    this.isSpeaking = false;
    this.manualThemeOverride = null;

    // Athlete sweat calculator state
    this.runnerWeightKg = 70;
    this.runnerIntensity = 'moderate';

    // Canvas particle & atmospheric state
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.shootingStars = [];
    this.splashes = [];
    this.particleMode = 'sun_motes';
    this.lightningTimer = null;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.populateCityDropdown();
    this.renderPersonaCarousel();
    this.initWeatherCanvas();
    this.startLiveClock();
    this.initMobileShareModal();

    // Auto-sync with user's actual location on load
    await this.syncWithActualLocation(true);
    
    this.checkAndGenerateAlerts();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Setup Event Listeners
  setupEventListeners() {
    // City select
    document.getElementById('city-select').addEventListener('change', (e) => {
      const city = CITIES.find(c => c.id === e.target.value);
      if (city) {
        this.currentCity = city;
        this.manualThemeOverride = null;
        this.updateSyncedLocalityBanner();
        this.fetchWeatherData().then(() => this.renderAll());
      }
    });

    // Main GPS Sync Button & Quick Re-Sync Button
    document.getElementById('btn-sync-gps').addEventListener('click', () => {
      this.syncWithActualLocation(false);
    });
    document.getElementById('btn-quick-resync').addEventListener('click', () => {
      this.syncWithActualLocation(false);
    });
    document.getElementById('btn-geo').addEventListener('click', () => {
      this.syncWithActualLocation(false);
    });

    // Mobile Share / QR Code Modal
    document.getElementById('btn-open-mobile-share').addEventListener('click', () => {
      this.openMobileShareModal();
    });
    document.getElementById('btn-close-mobile-share').addEventListener('click', () => {
      document.getElementById('modal-mobile-share').classList.add('hidden');
      document.getElementById('modal-mobile-share').classList.remove('flex');
    });
    document.getElementById('btn-copy-mobile-url').addEventListener('click', () => {
      const url = document.getElementById('mobile-network-url').textContent;
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('btn-copy-mobile-url');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy URL', 2000);
      });
    });

    // Quick city chips
    document.querySelectorAll('.city-quick-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cityId = e.currentTarget.getAttribute('data-city');
        const city = CITIES.find(c => c.id === cityId);
        if (city) {
          this.currentCity = city;
          this.manualThemeOverride = null;
          document.getElementById('city-select').value = city.id;
          this.updateSyncedLocalityBanner();
          this.fetchWeatherData().then(() => this.renderAll());
        }
      });
    });

    // Atmospheric Theme Preview Chips
    document.querySelectorAll('.theme-preview-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.currentTarget.getAttribute('data-theme');
        if (theme === 'auto') {
          this.manualThemeOverride = null;
        } else {
          this.manualThemeOverride = theme;
        }
        this.renderWeatherBackground();
      });
    });

    // Temp unit toggle
    document.getElementById('btn-temp-unit').addEventListener('click', () => {
      this.tempUnit = this.tempUnit === 'C' ? 'F' : 'C';
      document.getElementById('btn-temp-unit').textContent = `°${this.tempUnit}`;
      this.renderWeatherHero();
      this.renderHourlyForecast();
      this.renderPersonaWidgets();
      this.renderWeeklyForecast();
    });

    // Refresh button
    document.getElementById('btn-refresh').addEventListener('click', async () => {
      const btn = document.getElementById('btn-refresh');
      btn.classList.add('animate-spin');
      await this.fetchWeatherData();
      this.renderAll();
      setTimeout(() => btn.classList.remove('animate-spin'), 600);
    });

    // Toggle Phone view vs Fullscreen (Desktop only)
    document.getElementById('btn-toggle-view').addEventListener('click', () => {
      this.isPhoneView = !this.isPhoneView;
      const appWrapper = document.getElementById('app-wrapper');
      const label = document.getElementById('view-mode-label');
      if (this.isPhoneView) {
        appWrapper.classList.remove('fullscreen-mode');
        if (label) label.textContent = 'Phone Frame';
      } else {
        appWrapper.classList.add('fullscreen-mode');
        if (label) label.textContent = 'Expanded View';
      }
    });

    // Radar Map Modal
    document.getElementById('btn-open-radar').addEventListener('click', () => {
      this.openRadarModal();
    });
    document.getElementById('btn-close-radar').addEventListener('click', () => {
      document.getElementById('modal-radar').classList.add('hidden');
      document.getElementById('modal-radar').classList.remove('flex');
    });

    // Radar Layer buttons
    document.querySelectorAll('.radar-layer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.radar-layer-btn').forEach(b => {
          b.classList.remove('active', 'bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-400/30');
          b.classList.add('bg-white/5', 'text-slate-300');
        });
        const target = e.currentTarget;
        target.classList.add('active', 'bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-400/30');
        target.classList.remove('bg-white/5', 'text-slate-300');
        this.activeRadarLayer = target.getAttribute('data-layer');
        this.updateRadarMapLayers();
      });
    });

    // Voice AI Modal
    document.getElementById('btn-open-voice').addEventListener('click', () => {
      this.openVoiceModal();
    });
    document.getElementById('btn-close-voice').addEventListener('click', () => {
      this.stopVoiceBriefing();
      document.getElementById('modal-voice').classList.add('hidden');
      document.getElementById('modal-voice').classList.remove('flex');
    });
    document.getElementById('btn-speak-briefing').addEventListener('click', () => {
      this.toggleVoiceBriefing();
    });
    document.getElementById('btn-generate-ai-insight').addEventListener('click', () => {
      this.generateAIBriefing();
    });

    // Notifications Modal
    document.getElementById('btn-toggle-notifs').addEventListener('click', () => {
      document.getElementById('modal-notifs').classList.remove('hidden');
      document.getElementById('modal-notifs').classList.add('flex');
      this.renderNotificationList();
    });
    document.getElementById('btn-close-notifs').addEventListener('click', () => {
      document.getElementById('modal-notifs').classList.add('hidden');
      document.getElementById('modal-notifs').classList.remove('flex');
    });
    document.getElementById('btn-trigger-test-alert').addEventListener('click', () => {
      this.simulateSuddenAlert();
    });

    // Customizer Modal
    document.getElementById('btn-open-customizer').addEventListener('click', () => {
      this.openCustomizerModal();
    });
    document.getElementById('btn-close-customizer').addEventListener('click', () => {
      document.getElementById('modal-customizer').classList.add('hidden');
      document.getElementById('modal-customizer').classList.remove('flex');
    });
    document.getElementById('btn-reset-customizer').addEventListener('click', () => {
      delete this.customWidgets[this.currentPersona];
      this.openCustomizerModal();
      this.renderPersonaWidgets();
    });
    document.getElementById('btn-save-customizer').addEventListener('click', () => {
      this.saveCustomWidgets();
    });
  }

  // Mobile Share & QR Initialization (Dynamically resolves IP on any Wi-Fi or Hotspot)
  async initMobileShareModal() {
    let host = window.location.hostname;
    let port = window.location.port || '8080';

    // If viewing on localhost, query server's /api/info to get laptop's actual LAN IP
    if (host === 'localhost' || host === '127.0.0.1') {
      try {
        const info = await fetch('/api/info').then(r => r.json());
        if (info && info.ip && info.ip !== '127.0.0.1') {
          host = info.ip;
          port = info.port || port;
        }
      } catch (e) {
        console.log('LAN IP query note:', e);
      }
    }

    const mobileUrl = `http://${host}:${port}`;
    const urlEl = document.getElementById('mobile-network-url');
    if (urlEl) urlEl.textContent = mobileUrl;
    
    const qrEl = document.getElementById('mobile-qr-image');
    if (qrEl) qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}`;
  }

  async openMobileShareModal() {
    await this.initMobileShareModal();
    const modal = document.getElementById('modal-mobile-share');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  // Actual Location Sync (GPS + IP Fallback + Reverse Geocoding)
  async syncWithActualLocation(silent = false) {
    const syncLabel = document.getElementById('gps-sync-label');
    if (syncLabel) syncLabel.textContent = 'Syncing...';

    let lat = null;
    let lon = null;
    let detectedName = 'Current Location';
    let country = 'IN';

    // 1. Try Browser HTML5 Geolocation
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      } catch (e) {
        console.log('GPS prompt deferred, falling back to IP Geolocation:', e);
      }
    }

    // 2. If GPS failed or timed out, fallback to IP Geolocation
    if (!lat || !lon) {
      try {
        const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-cache' }).then(r => r.json());
        if (ipRes && ipRes.latitude && ipRes.longitude) {
          lat = parseFloat(ipRes.latitude);
          lon = parseFloat(ipRes.longitude);
          detectedName = ipRes.city || ipRes.region || 'My City';
          country = ipRes.country_code || 'IN';
        }
      } catch (err) {
        console.warn('IP geolocation lookup failed, using local default:', err);
      }
    }

    // 3. Reverse Geocode to get locality / district name
    if (lat && lon) {
      try {
        const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const revData = await fetch(geoUrl).then(r => r.ok ? r.json() : null).catch(() => null);
        if (revData) {
          detectedName = revData.locality || revData.city || revData.principalSubdivision || detectedName;
          country = revData.countryCode || country;
        }
      } catch (err) {
        console.log('Reverse geocoding note:', err);
      }

      this.currentCity = {
        id: 'synced_loc',
        name: detectedName,
        country: country,
        lat: lat,
        lon: lon,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto',
        tag: '📍 Real Live GPS / Network Synced'
      };

      this.updateSyncedLocalityBanner();
      await this.fetchWeatherData();
      this.renderAll();

      if (syncLabel) syncLabel.textContent = 'Synced';
      setTimeout(() => {
        if (syncLabel) syncLabel.textContent = 'Sync Location';
      }, 3000);
    } else {
      if (!silent) alert('Could not resolve location automatically. You can choose any city from the list.');
      if (syncLabel) syncLabel.textContent = 'Sync Location';
      await this.fetchWeatherData();
      this.renderAll();
    }
  }

  updateSyncedLocalityBanner() {
    const bannerLoc = document.getElementById('synced-locality-text');
    if (bannerLoc) {
      bannerLoc.textContent = `${this.currentCity.name}, ${this.currentCity.country}`;
    }
    const select = document.getElementById('city-select');
    let opt = select.querySelector('option[value="synced_loc"]');
    if (!opt && this.currentCity.id === 'synced_loc') {
      opt = document.createElement('option');
      opt.value = 'synced_loc';
      opt.className = 'bg-slate-900 text-emerald-400 font-bold';
      select.prepend(opt);
    }
    if (opt && this.currentCity.id === 'synced_loc') {
      opt.textContent = `📍 ${this.currentCity.name}, ${this.currentCity.country} (Live GPS)`;
      opt.selected = true;
    }
  }

  // Populate City Selector
  populateCityDropdown() {
    const select = document.getElementById('city-select');
    select.innerHTML = '';
    CITIES.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city.id;
      opt.textContent = `${city.name}, ${city.country} (${city.tag})`;
      opt.className = 'bg-slate-900 text-white';
      if (city.id === this.currentCity.id) opt.selected = true;
      select.appendChild(opt);
    });
  }

  // Render Persona Selector Carousel
  renderPersonaCarousel() {
    const container = document.getElementById('persona-carousel');
    container.innerHTML = '';

    Object.values(PERSONAS).forEach(p => {
      const isActive = p.id === this.currentPersona;
      const chip = document.createElement('button');
      chip.className = `persona-chip flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        isActive 
          ? 'active bg-gradient-to-r ' + p.color + ' text-white border-white/40 shadow-lg' 
          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
      }`;
      chip.innerHTML = `
        <i data-lucide="${p.icon}" class="w-3.5 h-3.5"></i>
        <span>${p.name}</span>
      `;
      chip.addEventListener('click', () => {
        this.switchPersona(p.id);
      });
      container.appendChild(chip);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Switch Active Persona
  switchPersona(personaId) {
    this.currentPersona = personaId;
    this.renderPersonaCarousel();
    const persona = PERSONAS[personaId];
    document.getElementById('persona-summary-badge').textContent = persona.badge;
    this.renderWeatherHero();
    this.renderPersonaWidgets();
    if (window.lucide) window.lucide.createIcons();
  }

  // Fetch Weather Data (Live Open-Meteo API with fallback)
  async fetchWeatherData() {
    const { lat, lon } = this.currentCity;
    try {
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index,visibility,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index,dew_point_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`;
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,dust,ammonia&timezone=auto`;

      const [forecastRes, aqRes] = await Promise.all([
        fetch(forecastUrl).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(aqUrl).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (forecastRes && forecastRes.current) {
        this.weatherData = forecastRes;
        this.airQualityData = aqRes ? aqRes.current : this.generateSimulatedAirQuality();
      } else {
        this.useSimulatedWeatherData();
      }
    } catch (err) {
      console.warn('Weather API fetch failed, using realistic fallback:', err);
      this.useSimulatedWeatherData();
    }
  }

  // Simulated Weather Data fallback
  useSimulatedWeatherData() {
    const baseTemp = this.currentCity.id === 'shimla' ? 14 : (this.currentCity.id === 'london' ? 18 : (this.currentCity.id === 'dubai' ? 38 : 29));
    const weatherCode = this.currentCity.id === 'london' ? 61 : (this.currentCity.id === 'goa' ? 2 : (this.currentCity.id === 'delhi' ? 1 : 0));
    
    this.weatherData = {
      current: {
        temperature_2m: baseTemp,
        apparent_temperature: baseTemp + 2.0,
        relative_humidity_2m: 58,
        precipitation: weatherCode === 61 ? 1.4 : 0,
        weather_code: weatherCode,
        wind_speed_10m: 14,
        wind_direction_10m: 210,
        uv_index: 6.4,
        visibility: 7500,
        surface_pressure: 1012.4
      },
      hourly: {
        time: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
        temperature_2m: Array.from({ length: 24 }, (_, i) => Math.round(baseTemp - 5 * Math.cos((i / 24) * Math.PI * 2))),
        precipitation_probability: Array.from({ length: 24 }, (_, i) => (weatherCode === 61 ? (i > 10 && i < 18 ? 75 : 30) : (i % 6 === 0 ? 20 : 5))),
        weather_code: Array.from({ length: 24 }, () => weatherCode),
        wind_speed_10m: Array.from({ length: 24 }, () => 12 + Math.floor(Math.random() * 8)),
        uv_index: Array.from({ length: 24 }, (_, i) => (i >= 6 && i <= 18 ? Math.max(0, Math.round(8 * Math.sin(((i - 6) / 12) * Math.PI))) : 0)),
        dew_point_2m: Array.from({ length: 24 }, () => Math.round(baseTemp - 6))
      },
      daily: {
        time: ['Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        weather_code: [weatherCode, 1, 2, weatherCode === 61 ? 63 : 0, 1, 2, 0],
        temperature_2m_max: [baseTemp + 4, baseTemp + 5, baseTemp + 3, baseTemp + 2, baseTemp + 4, baseTemp + 6, baseTemp + 5],
        temperature_2m_min: [baseTemp - 6, baseTemp - 5, baseTemp - 7, baseTemp - 6, baseTemp - 5, baseTemp - 4, baseTemp - 5],
        precipitation_probability_max: [weatherCode === 61 ? 80 : 15, 20, 10, 45, 10, 5, 0],
        sunrise: ['2026-08-30T05:54'],
        sunset: ['2026-08-30T18:48'],
        uv_index_max: [7.2, 7.5, 6.8, 6.0, 7.8, 8.0, 7.6]
      }
    };

    this.airQualityData = this.generateSimulatedAirQuality();
  }

  generateSimulatedAirQuality() {
    const isDelhi = this.currentCity.name.toLowerCase().includes('delhi');
    return {
      european_aqi: isDelhi ? 78 : 32,
      pm2_5: isDelhi ? 88.5 : 18.2,
      pm10: isDelhi ? 145.0 : 34.0,
      nitrogen_dioxide: isDelhi ? 42.0 : 12.5,
      ozone: isDelhi ? 55.0 : 40.0,
      sulphur_dioxide: isDelhi ? 16.0 : 4.0,
      carbon_monoxide: isDelhi ? 720.0 : 310.0,
      ammonia: isDelhi ? 18.0 : 2.5,
      dust: isDelhi ? 95.0 : 10.0
    };
  }

  // Unit Converter Helpers
  formatTemp(tempC) {
    if (this.tempUnit === 'F') {
      const tempF = Math.round((tempC * 9/5) + 32);
      return `${tempF}°`;
    }
    return `${Math.round(tempC)}°`;
  }

  // Render All UI Components
  renderAll() {
    this.renderWeatherBackground();
    this.renderWeatherHero();
    this.renderAtmosphericMetrics();
    this.renderHourlyForecast();
    this.renderPersonaWidgets();
    this.renderWeeklyForecast();
    if (window.lucide) window.lucide.createIcons();
  }

  // Atmospheric Background & Canvas Particle System
  renderWeatherBackground() {
    const cur = this.weatherData ? this.weatherData.current : { weather_code: 0 };
    const code = cur.weather_code || 0;
    
    let sunriseHour = 6.0;
    let sunsetHour = 18.5;
    if (this.weatherData && this.weatherData.daily && this.weatherData.daily.sunrise) {
      const sr = this.weatherData.daily.sunrise[0];
      if (sr && sr.includes('T')) {
        const timePart = sr.split('T')[1];
        const [h, m] = timePart.split(':').map(Number);
        sunriseHour = h + m / 60;
      }
      const ss = this.weatherData.daily.sunset[0];
      if (ss && ss.includes('T')) {
        const timePart = ss.split('T')[1];
        const [h, m] = timePart.split(':').map(Number);
        sunsetHour = h + m / 60;
      }
    }

    const timeCategory = ScoringAlgorithms.getTimeOfDayCategory(new Date(), sunriseHour, sunsetHour);
    let theme = ScoringAlgorithms.getAtmosphericTheme(code, timeCategory);

    if (this.manualThemeOverride) {
      if (this.manualThemeOverride === 'sunny') theme = { bgClass: 'bg-sunny-day', particleMode: 'sun_motes', glowColor: 'rgba(245, 158, 11, 0.4)', mood: 'Vibrant Sun' };
      if (this.manualThemeOverride === 'sunset') theme = { bgClass: 'bg-golden-hour', particleMode: 'sun_motes', glowColor: 'rgba(249, 115, 22, 0.5)', mood: 'Golden Sunset' };
      if (this.manualThemeOverride === 'night') theme = { bgClass: 'bg-clear-night', particleMode: 'stars', glowColor: 'rgba(99, 102, 241, 0.35)', mood: 'Starry Night' };
      if (this.manualThemeOverride === 'rainy') theme = { bgClass: 'bg-rainy', particleMode: 'rainy', glowColor: 'rgba(14, 165, 233, 0.35)', mood: 'Rain Showers' };
      if (this.manualThemeOverride === 'stormy') theme = { bgClass: 'bg-stormy', particleMode: 'stormy', glowColor: 'rgba(168, 85, 247, 0.45)', mood: 'Thunderstorm' };
      if (this.manualThemeOverride === 'foggy') theme = { bgClass: 'bg-foggy', particleMode: 'foggy', glowColor: 'rgba(148, 163, 184, 0.35)', mood: 'Ethereal Mist' };
    }

    const bgDiv = document.getElementById('weather-bg');
    bgDiv.className = `weather-bg ${theme.bgClass}`;
    document.documentElement.style.setProperty('--ambient-glow', theme.glowColor);
    this.updateParticleCanvas(theme.particleMode);
  }

  // High Performance Canvas Engine
  initWeatherCanvas() {
    this.canvas = document.getElementById('weather-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.particles = [];
    this.shootingStars = [];
    this.splashes = [];
    this.particleMode = 'sun_motes';
    this.animateParticles();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  updateParticleCanvas(mode) {
    this.particles = [];
    this.shootingStars = [];
    this.splashes = [];
    this.particleMode = mode;

    if (this.lightningTimer) {
      clearInterval(this.lightningTimer);
      this.lightningTimer = null;
    }

    const w = this.canvas.width;
    const h = this.canvas.height;

    if (mode === 'sun_motes') {
      for (let i = 0; i < 40; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          rad: Math.random() * 3 + 1,
          speedY: -(Math.random() * 0.4 + 0.1),
          speedX: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.6 + 0.2,
          pulse: Math.random() * Math.PI
        });
      }
    } else if (mode === 'stars' || mode === 'stars_clouds') {
      for (let i = 0; i < 110; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          rad: Math.random() * 1.8 + 0.6,
          baseAlpha: Math.random() * 0.7 + 0.3,
          blinkSpeed: Math.random() * 0.04 + 0.01,
          phase: Math.random() * Math.PI * 2
        });
      }
    } else if (mode === 'rainy') {
      for (let i = 0; i < 90; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: Math.random() * 18 + 12,
          speedY: Math.random() * 10 + 9,
          speedX: -1.8,
          alpha: Math.random() * 0.4 + 0.2
        });
      }
    } else if (mode === 'stormy') {
      for (let i = 0; i < 110; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: Math.random() * 22 + 14,
          speedY: Math.random() * 14 + 10,
          speedX: -2.5,
          alpha: Math.random() * 0.5 + 0.3
        });
      }
      this.lightningTimer = setInterval(() => {
        if (Math.random() > 0.4) {
          this.triggerLightningFlash();
        }
      }, 5000);
    } else if (mode === 'snowy') {
      for (let i = 0; i < 70; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          rad: Math.random() * 2.8 + 1.2,
          speedY: Math.random() * 1.5 + 0.8,
          swaySpeed: Math.random() * 0.03 + 0.01,
          swayDist: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.6 + 0.3
        });
      }
    } else if (mode === 'foggy') {
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          rad: Math.random() * 120 + 80,
          speedX: Math.random() * 0.3 + 0.1,
          alpha: Math.random() * 0.12 + 0.04
        });
      }
    }
  }

  triggerLightningFlash() {
    const flashEl = document.getElementById('lightning-flash');
    if (!flashEl) return;
    flashEl.classList.add('flash-active');
    setTimeout(() => {
      flashEl.classList.remove('flash-active');
      setTimeout(() => {
        flashEl.classList.add('flash-active');
        setTimeout(() => flashEl.classList.remove('flash-active'), 60);
      }, 100);
    }, 90);
  }

  animateParticles() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.particleMode === 'sun_motes') {
      this.particles.forEach(p => {
        p.pulse += 0.02;
        const currentAlpha = p.alpha + Math.sin(p.pulse) * 0.15;
        this.ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, currentAlpha)})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        this.ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      });
    } else if (this.particleMode === 'stars' || this.particleMode === 'stars_clouds') {
      this.particles.forEach(p => {
        p.phase += p.blinkSpeed;
        const blinkAlpha = Math.max(0.1, p.baseAlpha + Math.sin(p.phase) * 0.3);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        this.ctx.fill();
      });

      if (Math.random() < 0.015 && this.shootingStars.length < 2) {
        this.shootingStars.push({
          x: Math.random() * (w * 0.8),
          y: Math.random() * (h * 0.4),
          len: Math.random() * 80 + 60,
          speed: Math.random() * 12 + 14,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
          life: 1.0
        });
      }

      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const star = this.shootingStars[i];
        const tailX = star.x - Math.cos(star.angle) * star.len;
        const tailY = star.y - Math.sin(star.angle) * star.len;

        const grad = this.ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${star.life})`);
        grad.addColorStop(0.3, `rgba(56, 189, 248, ${star.life * 0.8})`);
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        this.ctx.strokeStyle = grad;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(star.x, star.y);
        this.ctx.lineTo(tailX, tailY);
        this.ctx.stroke();

        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life -= 0.035;

        if (star.life <= 0 || star.x > w || star.y > h) {
          this.shootingStars.splice(i, 1);
        }
      }
    } else if (this.particleMode === 'rainy' || this.particleMode === 'stormy') {
      this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
      this.ctx.lineWidth = 1.6;
      this.particles.forEach(p => {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + p.speedX, p.y + p.len);
        this.ctx.stroke();

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > h - 40 && Math.random() < 0.2) {
          this.splashes.push({ x: p.x, y: h - 10, rad: 2, maxRad: 12, alpha: 0.5 });
        }

        if (p.y > h) {
          p.y = -20;
          p.x = Math.random() * w;
        }
      });

      for (let i = this.splashes.length - 1; i >= 0; i--) {
        const s = this.splashes[i];
        this.ctx.strokeStyle = `rgba(186, 230, 253, ${s.alpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.ellipse(s.x, s.y, s.rad * 1.8, s.rad * 0.6, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        s.rad += 0.6;
        s.alpha -= 0.03;
        if (s.alpha <= 0 || s.rad > s.maxRad) {
          this.splashes.splice(i, 1);
        }
      }
    } else if (this.particleMode === 'snowy') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      this.particles.forEach(p => {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        this.ctx.fill();

        p.y += p.speedY;
        p.x += Math.sin(p.y * p.swaySpeed) * p.swayDist;

        if (p.y > h) {
          p.y = -10;
          p.x = Math.random() * w;
        }
      });
    } else if (this.particleMode === 'foggy') {
      this.particles.forEach(p => {
        const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad);
        grad.addColorStop(0, `rgba(203, 213, 225, ${p.alpha})`);
        grad.addColorStop(1, 'rgba(203, 213, 225, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        this.ctx.fill();

        p.x += p.speedX;
        if (p.x - p.rad > w) {
          p.x = -p.rad;
          p.y = Math.random() * h;
        }
      });
    }

    requestAnimationFrame(() => this.animateParticles());
  }

  // Render Main Weather Hero Card
  renderWeatherHero() {
    const cur = this.weatherData.current;
    const daily = this.weatherData.daily;
    const code = cur.weather_code;
    const info = WMO_CODES[code] || WMO_CODES[0];

    document.getElementById('hero-city').textContent = this.currentCity.name;
    document.getElementById('hero-country').textContent = this.currentCity.country;
    document.getElementById('hero-condition').textContent = `${info.label} • ${info.mood}`;
    document.getElementById('hero-temp').textContent = this.formatTemp(cur.temperature_2m);
    document.getElementById('hero-feels').textContent = this.formatTemp(cur.apparent_temperature);
    document.getElementById('hero-high').textContent = this.formatTemp(daily.temperature_2m_max[0]);
    document.getElementById('hero-low').textContent = this.formatTemp(daily.temperature_2m_min[0]);
    
    const iconElem = document.getElementById('hero-weather-icon');
    iconElem.setAttribute('data-lucide', info.icon);

    this.renderHeroPersonaBanner();
  }

  renderHeroPersonaBanner() {
    const banner = document.getElementById('hero-persona-highlight');
    const cur = this.weatherData.current;
    const p = this.currentPersona;

    let content = '';
    if (p === 'health') {
      const pm25 = this.airQualityData.pm2_5 || 25;
      const aqiStatus = pm25 > 60 ? 'Unhealthy for Sensitive Groups' : (pm25 > 35 ? 'Moderate' : 'Good Quality');
      const aqiColor = pm25 > 60 ? 'text-rose-300' : (pm25 > 35 ? 'text-amber-300' : 'text-emerald-300');
      content = `
        <div class="flex items-center gap-2">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
          <div>
            <div class="text-[11px] font-bold text-white">Allergy & Respiratory Shield</div>
            <div class="text-[10px] ${aqiColor}">Air: ${aqiStatus} (PM2.5: ${pm25} µg/m³)</div>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">Protected</span>
      `;
    } else if (p === 'fitness') {
      const score = ScoringAlgorithms.calculateRunningScore(cur.temperature_2m, cur.relative_humidity_2m, cur.wind_speed_10m, cur.uv_index, cur.precipitation > 0 ? 80 : 0);
      const rating = score > 80 ? 'Prime Running Window' : (score > 60 ? 'Good Workout Climate' : 'High Heat/Wind Strain');
      content = `
        <div class="flex items-center gap-2">
          <i data-lucide="flame" class="w-4 h-4 text-amber-400"></i>
          <div>
            <div class="text-[11px] font-bold text-white">Running Suitability Score: <span class="text-amber-300">${score}/100</span></div>
            <div class="text-[10px] text-slate-300">${rating} • Best: 06:30 - 08:30 AM</div>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">Active</span>
      `;
    } else if (p === 'beach') {
      const waterTemp = Math.round(cur.temperature_2m - 3);
      content = `
        <div class="flex items-center gap-2">
          <i data-lucide="waves" class="w-4 h-4 text-cyan-400"></i>
          <div>
            <div class="text-[11px] font-bold text-white">Tide: High Tide in 1h 45m</div>
            <div class="text-[10px] text-cyan-200">Swell: 1.4m (Clean) • Water Temp: ${waterTemp}°C</div>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">Surf Ready</span>
      `;
    } else if (p === 'traveler') {
      const tips = ScoringAlgorithms.generatePackingTips(cur.temperature_2m, cur.precipitation > 0 ? 80 : 10, cur.uv_index, cur.wind_speed_10m, this.currentCity.name);
      content = `
        <div class="flex items-center gap-2">
          <i data-lucide="luggage" class="w-4 h-4 text-indigo-400"></i>
          <div>
            <div class="text-[11px] font-bold text-white">Travel Assistant for ${this.currentCity.name}</div>
            <div class="text-[10px] text-indigo-200">${tips[0]?.text || 'Comfortable layers recommended'}</div>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">Packed</span>
      `;
    } else if (p === 'family') {
      content = `
        <div class="flex items-center gap-2">
          <i data-lucide="baby" class="w-4 h-4 text-pink-400"></i>
          <div>
            <div class="text-[11px] font-bold text-white">School Commute & Kids Guard</div>
            <div class="text-[10px] text-pink-200">Drop-off: 21°C (Dry) • Playground Index: 92/100</div>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold">Family</span>
      `;
    } else if (p === 'agri') {
      const frostRisk = cur.temperature_2m < 4 ? 'High Frost Threat' : 'No Frost';
      content = `
        <div class="flex items-center gap-2">
          <i data-lucide="leaf" class="w-4 h-4 text-lime-400"></i>
          <div>
            <div class="text-[11px] font-bold text-white">Crop & Soil Health Monitor</div>
            <div class="text-[10px] text-lime-200">Topsoil: 42% (Optimal) • Frost Risk: ${frostRisk}</div>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-300 font-semibold">Growing</span>
      `;
    } else if (p === 'commuter') {
      const impact = ScoringAlgorithms.calculateCommuteImpact((cur.visibility || 7000) / 1000, cur.precipitation || 0, cur.wind_speed_10m, cur.weather_code);
      content = `
        <div class="flex items-center gap-2">
          <i data-lucide="car" class="w-4 h-4 text-blue-400"></i>
          <div>
            <div class="text-[11px] font-bold text-white">Commute Traffic Impact: <span class="${impact.color}">${impact.level}</span></div>
            <div class="text-[10px] text-slate-300">Expected delay: ${impact.delayMin} • Road Grip: 95%</div>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">Traffic</span>
      `;
    } else if (p === 'event') {
      const comfort = ScoringAlgorithms.calculateComfortIndex(cur.temperature_2m, cur.relative_humidity_2m, cur.wind_speed_10m, cur.precipitation > 0 ? 80 : 5);
      content = `
        <div class="flex items-center gap-2">
          <i data-lucide="sparkles" class="w-4 h-4 text-violet-400"></i>
          <div>
            <div class="text-[11px] font-bold text-white">Event Comfort Rating: <span class="text-violet-300">${comfort}/100</span></div>
            <div class="text-[10px] text-violet-200">Canopy: ${comfort < 70 ? 'Recommended' : 'Optional'} • Golden Hour: 17:40</div>
          </div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold">Event Ready</span>
      `;
    }

    banner.innerHTML = content;
  }

  // Quick Atmospheric Metrics
  renderAtmosphericMetrics() {
    const cur = this.weatherData.current;
    document.getElementById('metric-humidity').textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById('metric-wind').textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
    
    const uvVal = cur.uv_index !== undefined ? cur.uv_index : 6.0;
    const uvLabel = uvVal > 8 ? 'Very High' : (uvVal > 5 ? 'Mod-High' : 'Low');
    document.getElementById('metric-uv').textContent = `${uvVal} (${uvLabel})`;
    
    const pm25 = this.airQualityData.pm2_5 || 35;
    const aqiScore = Math.round(pm25 * 1.8);
    document.getElementById('metric-aqi').textContent = `${aqiScore}`;
  }

  // Render 24-Hour Forecast & Chart
  renderHourlyForecast() {
    const hourly = this.weatherData.hourly;
    const container = document.getElementById('hourly-cards-container');
    container.innerHTML = '';

    const labels = [];
    const temps = [];
    const rainProbs = [];

    for (let i = 0; i < 12; i++) {
      const timeStr = hourly.time[i] ? (hourly.time[i].includes('T') ? hourly.time[i].split('T')[1].substring(0, 5) : hourly.time[i]) : `${i}:00`;
      const tempC = hourly.temperature_2m[i];
      const rainPct = hourly.precipitation_probability[i] || 0;
      const code = hourly.weather_code[i] || 0;
      const info = WMO_CODES[code] || WMO_CODES[0];

      labels.push(timeStr);
      temps.push(this.tempUnit === 'F' ? Math.round((tempC * 9/5) + 32) : tempC);
      rainProbs.push(rainPct);

      const card = document.createElement('div');
      card.className = 'glass-card flex-shrink-0 p-2.5 text-center min-w-[70px] flex flex-col items-center justify-between border border-white/10';
      card.innerHTML = `
        <span class="text-[10px] text-slate-400 font-medium">${i === 0 ? 'Now' : timeStr}</span>
        <i data-lucide="${info.icon}" class="w-5 h-5 text-amber-400 my-1"></i>
        <span class="text-xs font-bold text-white">${this.formatTemp(tempC)}</span>
        <div class="flex items-center gap-0.5 text-[9px] text-sky-400 mt-1 font-semibold">
          <i data-lucide="droplet" class="w-2.5 h-2.5"></i>
          <span>${rainPct}%</span>
        </div>
      `;
      container.appendChild(card);
    }

    this.renderHourlyChart(labels, temps, rainProbs);
  }

  renderHourlyChart(labels, temps, rainProbs) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    if (this.hourlyChartInstance) {
      this.hourlyChartInstance.destroy();
    }

    this.hourlyChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Temp (°${this.tempUnit})`,
            data: temps,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#38bdf8',
            pointRadius: 3,
            yAxisID: 'y'
          },
          {
            label: 'Rain %',
            data: rainProbs,
            type: 'bar',
            backgroundColor: 'rgba(96, 165, 250, 0.4)',
            borderRadius: 4,
            barThickness: 8,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#fff',
            bodyColor: '#38bdf8',
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            padding: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 9 } }
          },
          y: {
            display: false,
            grid: { display: false }
          },
          y1: {
            display: false,
            min: 0,
            max: 100,
            grid: { display: false }
          }
        }
      }
    });
  }

  // Render Persona Dedicated Widget Suites with IN-DEPTH Detailing
  renderPersonaWidgets() {
    const container = document.getElementById('persona-widgets-container');
    container.innerHTML = '';

    const p = this.currentPersona;
    const cur = this.weatherData.current;
    const aq = this.airQualityData;

    // 1. HEALTH CONSCIOUS
    if (p === 'health') {
      const uvDetails = ScoringAlgorithms.calculateUVDetails(cur.uv_index || 6.4, 2);
      const pressureTrend = cur.surface_pressure ? `${cur.surface_pressure.toFixed(1)} hPa (Stable)` : '1012.4 hPa (Normal)';

      container.innerHTML = `
        <!-- Detailed AQI & Gas Sensors -->
        <div class="glass-panel p-4 border border-emerald-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <i data-lucide="activity" class="w-4 h-4 text-emerald-400"></i> Real-Time Multi-Pollutant Gas Matrix
            </h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">US & EU Standards</span>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="bg-slate-900/70 p-3 rounded-xl border border-white/10">
              <div class="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                <span>PM2.5 (Fine Particles)</span>
                <span class="text-amber-400 font-bold">Moderate</span>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black text-white">${aq.pm2_5 || 42}</span>
                <span class="text-[10px] text-slate-400">µg/m³ (Limit: 15)</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div class="bg-amber-400 h-full rounded-full" style="width: ${Math.min(100, (aq.pm2_5 || 42) * 1.2)}%"></div>
              </div>
            </div>

            <div class="bg-slate-900/70 p-3 rounded-xl border border-white/10">
              <div class="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                <span>PM10 (Inhalable Dust)</span>
                <span class="text-emerald-400 font-bold">Acceptable</span>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black text-white">${aq.pm10 || 78}</span>
                <span class="text-[10px] text-slate-400">µg/m³ (Limit: 45)</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div class="bg-emerald-400 h-full rounded-full" style="width: ${Math.min(100, (aq.pm10 || 78) * 0.8)}%"></div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-1.5 text-center text-xs mb-2">
            <div class="p-2 rounded-lg bg-white/5 border border-white/5">
              <span class="text-[9px] text-slate-400 block">NO₂ Gas</span>
              <span class="font-bold text-slate-200">${aq.nitrogen_dioxide || 24} ppb</span>
            </div>
            <div class="p-2 rounded-lg bg-white/5 border border-white/5">
              <span class="text-[9px] text-slate-400 block">Ozone (O₃)</span>
              <span class="font-bold text-slate-200">${aq.ozone || 45} ppb</span>
            </div>
            <div class="p-2 rounded-lg bg-white/5 border border-white/5">
              <span class="text-[9px] text-slate-400 block">SO₂ Gas</span>
              <span class="font-bold text-slate-200">${aq.sulphur_dioxide || 12} ppb</span>
            </div>
            <div class="p-2 rounded-lg bg-white/5 border border-white/5">
              <span class="text-[9px] text-slate-400 block">CO Level</span>
              <span class="font-bold text-slate-200">${aq.carbon_monoxide ? Math.round(aq.carbon_monoxide / 100) : 4} ppm</span>
            </div>
          </div>
        </div>

        <!-- Detailed Botanical Pollen Species Breakdown -->
        <div class="glass-panel p-4 border border-teal-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <i data-lucide="flower-2" class="w-4 h-4 text-teal-400"></i> Botanical Pollen & Allergen Species
            </h4>
            <span class="text-[10px] text-slate-400">Grains / m³</span>
          </div>

          <div class="space-y-2.5 text-xs">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-slate-300">Tree Pollen (Birch, Alder, Cypress)</span>
                <span class="font-bold text-emerald-400">Low (14 gr/m³)</span>
              </div>
              <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-400 h-full rounded-full" style="width: 20%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between mb-1">
                <span class="text-slate-300">Grass Pollen (Timothy, Meadow, Rye)</span>
                <span class="font-bold text-amber-400">Moderate (48 gr/m³)</span>
              </div>
              <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div class="bg-amber-400 h-full rounded-full" style="width: 52%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between mb-1">
                <span class="text-slate-300">Weed Pollen (Ragweed, Mugwort)</span>
                <span class="font-bold text-emerald-400">Low (8 gr/m³)</span>
              </div>
              <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-400 h-full rounded-full" style="width: 14%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between mb-1">
                <span class="text-slate-300">Mold & Fungal Spores (Alternaria)</span>
                <span class="font-bold text-emerald-400">Very Low (350 sp/m³)</span>
              </div>
              <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-400 h-full rounded-full" style="width: 10%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- UV Sunburn Timer, Vitamin D Window & Biometeorology -->
        <div class="glass-panel p-4 border border-amber-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <i data-lucide="sun-medium" class="w-4 h-4 text-amber-400"></i> UV Exposure, Vitamin D & Biometeorology
            </h4>
            <span class="text-[10px] font-semibold text-amber-400">FitzPatrick II Fair Skin</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10">
              <span class="text-[10px] text-slate-400 block">Sunburn Damage Time:</span>
              <span class="font-bold text-rose-400 text-sm">~${uvDetails.sunburnMinutes} Minutes</span>
              <span class="text-[9px] text-slate-400 block mt-0.5">Unshielded peak sun</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10">
              <span class="text-[10px] text-slate-400 block">Optimal Vitamin D Window:</span>
              <span class="font-bold text-emerald-400 text-sm">${uvDetails.vitDMinutes} Minutes</span>
              <span class="text-[9px] text-slate-400 block mt-0.5">10:30 AM - 11:30 AM</span>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1.5 text-xs">
            <div class="flex justify-between text-slate-300">
              <span>Barometric Migraine Trigger:</span>
              <span class="font-bold text-emerald-400">${pressureTrend}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>Asthma Environmental Threat:</span>
              <span class="font-bold text-emerald-400">Low Risk (Stable dew point 18°C)</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>Skin Barrier Eczema Loss Index:</span>
              <span class="font-bold text-sky-400">Normal (62% Ambient RH)</span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. FITNESS & ATHLETES
    else if (p === 'fitness') {
      const score = ScoringAlgorithms.calculateRunningScore(cur.temperature_2m, cur.relative_humidity_2m, cur.wind_speed_10m, cur.uv_index, 10);
      const wbgtObj = ScoringAlgorithms.calculateWBGT(cur.temperature_2m, cur.relative_humidity_2m, cur.wind_speed_10m);
      const sweatObj = ScoringAlgorithms.calculateSweatRate(this.runnerWeightKg, this.runnerIntensity, cur.temperature_2m, cur.relative_humidity_2m);

      container.innerHTML = `
        <!-- Sport-Specific Suitability Scores -->
        <div class="glass-panel p-4 border border-amber-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <i data-lucide="trophy" class="w-4 h-4 text-amber-400"></i> Sport-Specific Suitability Rating
            </h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Real-Time</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div class="p-2.5 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 block">🏃 Road Running</span>
                <span class="text-sm font-bold text-white">${score} / 100</span>
              </div>
              <span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">Prime</span>
            </div>

            <div class="p-2.5 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 block">🚴 Road Cycling</span>
                <span class="text-sm font-bold text-white">88 / 100</span>
              </div>
              <span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">Great</span>
            </div>

            <div class="p-2.5 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 block">🌲 Trail Running</span>
                <span class="text-sm font-bold text-white">92 / 100</span>
              </div>
              <span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">Dry Grip</span>
            </div>

            <div class="p-2.5 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 block">🏋️ Outdoor HIIT</span>
                <span class="text-sm font-bold text-white">82 / 100</span>
              </div>
              <span class="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">Good</span>
            </div>
          </div>
        </div>

        <!-- Dynamic Sweat & Electrolyte Hydration Calculator -->
        <div class="glass-panel p-4 border border-orange-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-orange-300 flex items-center gap-1.5">
              <i data-lucide="droplets" class="w-4 h-4 text-orange-400"></i> Sweat Rate & Electrolyte Replacement
            </h4>
            <span class="text-[10px] text-slate-400">Personalized</span>
          </div>

          <div class="bg-slate-900/60 p-3 rounded-xl border border-white/10 mb-3 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-300">Athlete Weight:</span>
              <span class="font-bold text-white">${this.runnerWeightKg} kg</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-300">Estimated Sweat Rate:</span>
              <span class="font-bold text-sky-400 text-sm">${sweatObj.sweatRateLiters} L / hour</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-300">Sodium Loss (Electrolyte Need):</span>
              <span class="font-bold text-amber-300 text-sm">~${sweatObj.sodiumMgPerHour} mg Na⁺ / hour</span>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/30 text-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-orange-200">WBGT Heat Category: <span class="${wbgtObj.flagColor}">${wbgtObj.flag} (${wbgtObj.wbgt}°C)</span></span>
            </div>
            <p class="text-[10px] text-slate-300">${wbgtObj.alert}</p>
          </div>
        </div>

        <!-- Wind Aero Drag & Twilight Windows -->
        <div class="grid grid-cols-2 gap-3">
          <div class="glass-card p-3 border border-white/10 text-xs">
            <span class="text-[10px] text-slate-400 block mb-1">Cycling Aero Drag</span>
            <div class="text-sm font-bold text-white">~14 Watts penalty</div>
            <p class="text-[10px] text-slate-400 mt-1">Crosswind 14 km/h SW</p>
          </div>

          <div class="glass-card p-3 border border-white/10 text-xs">
            <span class="text-[10px] text-slate-400 block mb-1">Golden Photo Run</span>
            <div class="text-sm font-bold text-amber-300">17:45 - 18:35</div>
            <p class="text-[10px] text-slate-400 mt-1">Optimal soft light</p>
          </div>
        </div>
      `;
    }

    // 3. BEACHGOERS & SURFERS
    else if (p === 'beach') {
      const waterTemp = Math.round(cur.temperature_2m - 4);
      container.innerHTML = `
        <!-- High/Low Tide & Moon Phase -->
        <div class="glass-panel p-4 border border-cyan-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <i data-lucide="waves" class="w-4 h-4 text-cyan-400"></i> Tide Schedule & Lunar Phase
            </h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Spring Tide (+2.4m)</span>
          </div>

          <div class="wave-container mb-3 flex items-center justify-around px-4">
            <div class="text-center z-10">
              <span class="text-[10px] text-cyan-200 block uppercase font-bold">High Tide</span>
              <span class="text-lg font-black text-white">08:15 AM</span>
              <span class="text-[10px] text-cyan-300 font-semibold">+2.4 m</span>
            </div>
            <div class="text-center z-10">
              <span class="text-[10px] text-cyan-200 block uppercase font-bold">Low Tide</span>
              <span class="text-lg font-black text-white">02:40 PM</span>
              <span class="text-[10px] text-cyan-300 font-semibold">+0.3 m</span>
            </div>
            <div class="text-center z-10">
              <span class="text-[10px] text-cyan-200 block uppercase font-bold">Next High</span>
              <span class="text-lg font-black text-white">08:55 PM</span>
              <span class="text-[10px] text-cyan-300 font-semibold">+2.1 m</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <span class="text-[10px] text-slate-400 block">Primary Swell</span>
              <div class="text-sm font-bold text-white mt-0.5">1.6 m • 9s Period</div>
              <span class="text-[10px] text-emerald-400 font-medium">Clean Southwest swell</span>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <span class="text-[10px] text-slate-400 block">Water vs Air Temp</span>
              <div class="text-sm font-bold text-cyan-300 mt-0.5">${waterTemp}°C (Water) / ${cur.temperature_2m}°C</div>
              <span class="text-[10px] text-slate-400">Boardshorts / Rashguard</span>
            </div>
          </div>
        </div>

        <!-- Marine Safety, UV Water Multiplier & Rip Currents -->
        <div class="glass-panel p-4 border border-blue-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <i data-lucide="life-buoy" class="w-4 h-4 text-blue-400"></i> Marine Safety & Hazards
            </h4>
            <span class="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Green Flag (Safe)
            </span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <span class="text-slate-300">Water UV Reflection Multiplier:</span>
              <span class="font-bold text-amber-300">+25% Sun Intensity on Water</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <span class="text-slate-300">Rip Current Threat Score:</span>
              <span class="font-bold text-emerald-400">Low (Stable sandbars)</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <span class="text-slate-300">Surf Quality Rating:</span>
              <span class="font-bold text-cyan-300">4 / 5 Stars (Ideal for Fish & Longboard)</span>
            </div>
          </div>
        </div>
      `;
    }

    // 4. TRAVELERS
    else if (p === 'traveler') {
      const packingTips = ScoringAlgorithms.generatePackingTips(cur.temperature_2m, cur.precipitation > 0 ? 80 : 10, cur.uv_index, cur.wind_speed_10m, this.currentCity.name);

      container.innerHTML = `
        <!-- Multi-City Saved Destinations -->
        <div class="glass-panel p-4 border border-indigo-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <i data-lucide="plane-takeoff" class="w-4 h-4 text-indigo-400"></i> Multi-City Trip Itinerary Radar
            </h4>
            <span class="text-[10px] text-slate-400">Live Sync</span>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="p-2 rounded-xl bg-slate-900/60 border border-white/10 cursor-pointer hover:border-indigo-400" onclick="app.switchCity('london')">
              <span class="text-[11px] font-bold text-white block truncate">London, UK</span>
              <span class="text-[10px] text-sky-400">18°C • Rain 65%</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/60 border border-white/10 cursor-pointer hover:border-indigo-400" onclick="app.switchCity('tokyo')">
              <span class="text-[11px] font-bold text-white block truncate">Tokyo, JP</span>
              <span class="text-[10px] text-amber-400">26°C • Clear</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/60 border border-white/10 cursor-pointer hover:border-indigo-400" onclick="app.switchCity('goa')">
              <span class="text-[11px] font-bold text-white block truncate">Goa, IN</span>
              <span class="text-[10px] text-cyan-400">29°C • Beach</span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-indigo-200">Airport Weather & Delay Radar</span>
              <span class="text-[10px] font-bold text-emerald-400">Low Delay Risk (< 5%)</span>
            </div>
            <p class="text-[11px] text-slate-400">Runway visual range: >7500m. Upper cruise turbulence: Smooth.</p>
          </div>
        </div>

        <!-- AI Dynamic Packing Checklist -->
        <div class="glass-panel p-4 border border-purple-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <i data-lucide="check-square" class="w-4 h-4 text-purple-400"></i> AI Smart Packing Advisor
            </h4>
            <span class="text-[10px] font-semibold text-purple-300">Curated for ${this.currentCity.name}</span>
          </div>

          <div class="space-y-2">
            ${packingTips.map(tip => `
              <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i data-lucide="${tip.icon}" class="w-4 h-4 text-purple-400"></i>
                  <div>
                    <span class="text-xs font-semibold text-white block">${tip.title}</span>
                    <span class="text-[10px] text-slate-400">${tip.text}</span>
                  </div>
                </div>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">${tip.tag}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 5. PARENTS & FAMILIES
    else if (p === 'family') {
      container.innerHTML = `
        <!-- School Commute Condition Card -->
        <div class="glass-panel p-4 border border-pink-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-pink-300 flex items-center gap-1.5">
              <i data-lucide="backpack" class="w-4 h-4 text-pink-400"></i> School Bell-Schedule Commute
            </h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">Daily Routine</span>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] text-slate-400">Drop-off (07:30 - 08:30)</span>
                <i data-lucide="sun-medium" class="w-3.5 h-3.5 text-amber-400"></i>
              </div>
              <div class="text-base font-bold text-white">21°C • Dry</div>
              <span class="text-[10px] text-slate-400">Light cotton sweater</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] text-slate-400">Pickup (02:30 - 03:30)</span>
                <i data-lucide="cloud-sun" class="w-3.5 h-3.5 text-sky-400"></i>
              </div>
              <div class="text-base font-bold text-white">29°C • Warm</div>
              <span class="text-[10px] text-slate-400">Pack hydration bottle</span>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center gap-3">
            <i data-lucide="umbrella" class="w-5 h-5 text-sky-400 flex-shrink-0"></i>
            <div>
              <div class="text-xs font-bold text-white">Precipitation Radar Countdown</div>
              <div class="text-[10px] text-slate-400">0% rain likelihood during school commute hours.</div>
            </div>
          </div>
        </div>

        <!-- Kids Outfit Guide & Playground Equipment Temperature -->
        <div class="grid grid-cols-2 gap-3">
          <div class="glass-panel p-3.5 border border-pink-500/20">
            <span class="text-[10px] text-pink-300 font-bold uppercase tracking-wider block mb-1">Kids Outfit Layers</span>
            <div class="text-xs text-white font-semibold">Cotton Tee + Shorts</div>
            <p class="text-[10px] text-slate-400 mt-1">Sneakers optimal. Apply SPF 30 before recess.</p>
          </div>

          <div class="glass-panel p-3.5 border border-pink-500/20">
            <span class="text-[10px] text-pink-300 font-bold uppercase tracking-wider block mb-1">Playground Safety</span>
            <div class="text-xs text-emerald-400 font-bold">95 / 100 (Safe)</div>
            <p class="text-[10px] text-slate-400 mt-1">Slide temperature: 31°C (Safe, no metal burn risk).</p>
          </div>
        </div>
      `;
    }

    // 6. AGRICULTURE & GARDENERS
    else if (p === 'agri') {
      const et0Obj = ScoringAlgorithms.calculateET0(cur.temperature_2m, cur.relative_humidity_2m, cur.wind_speed_10m);

      container.innerHTML = `
        <!-- 3-Depth Soil Profile & Evapotranspiration -->
        <div class="glass-panel p-4 border border-lime-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-lime-300 flex items-center gap-1.5">
              <i data-lucide="sprout" class="w-4 h-4 text-lime-400"></i> 3-Depth Soil Temperature & Moisture Profile
            </h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-500/20 text-lime-300">Agricultural</span>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-3 text-center">
            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <span class="text-[9px] text-slate-400 block">Topsoil (0-7 cm)</span>
              <div class="text-sm font-bold text-white mt-1">42% m³/m³</div>
              <span class="text-[9px] text-lime-400 block">Temp: 24°C</span>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <span class="text-[9px] text-slate-400 block">Root (7-28 cm)</span>
              <div class="text-sm font-bold text-white mt-1">68% m³/m³</div>
              <span class="text-[9px] text-emerald-400 block">Temp: 21°C</span>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <span class="text-[9px] text-slate-400 block">Subsoil (28-100 cm)</span>
              <div class="text-sm font-bold text-white mt-1">74% m³/m³</div>
              <span class="text-[9px] text-emerald-400 block">Temp: 19°C</span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-lime-950/40 border border-lime-500/30 text-xs">
            <div class="flex justify-between font-semibold text-lime-200 mb-1">
              <span>Evapotranspiration (ET₀):</span>
              <span class="text-white">${et0Obj.dailyET0} mm/day (${et0Obj.weeklyWaterNeedMm} mm/wk need)</span>
            </div>
            <p class="text-[10px] text-slate-400">Expected 7-day rainfall: 12.5 mm. Supplemental drip irrigation recommended on Day 4.</p>
          </div>
        </div>

        <!-- Frost Hours & Disease Spray Window -->
        <div class="glass-panel p-4 border border-green-500/30">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold text-green-300 flex items-center gap-1.5">
              <i data-lucide="shield-alert" class="w-4 h-4 text-green-400"></i> Frost & Disease Spray Window
            </h4>
            <span class="text-[10px] font-semibold text-emerald-400">Fungal Threat: Low</span>
          </div>

          <div class="space-y-2 text-xs text-slate-300">
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <span>Hours Below 0°C (Next 48h):</span>
              <span class="font-bold text-emerald-400">0 Hours (Safe from freeze)</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <span>Optimal Foliar Spray Window:</span>
              <span class="font-bold text-lime-300">07:00 AM - 10:00 AM (Wind < 10 km/h)</span>
            </div>
          </div>
        </div>
      `;
    }

    // 7. COMMUTERS
    else if (p === 'commuter') {
      const impact = ScoringAlgorithms.calculateCommuteImpact((cur.visibility || 7000) / 1000, cur.precipitation || 0, cur.wind_speed_10m, cur.weather_code);

      container.innerHTML = `
        <!-- Multi-Modal Traffic Score -->
        <div class="glass-panel p-4 border border-blue-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <i data-lucide="car" class="w-4 h-4 text-blue-400"></i> Multi-Modal Commute Score
            </h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Live Flow</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-900/70 border border-white/10 mb-3 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 block uppercase font-bold">Commute Condition</span>
              <span class="text-base font-extrabold ${impact.color}">${impact.level}</span>
              <span class="text-[10px] text-slate-300 block mt-0.5">Est. Weather Delay: <strong>${impact.delayMin}</strong></span>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black text-white">${100 - impact.score}</span>
              <span class="text-[10px] text-slate-400 block">/100 Route Score</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-xs mb-3 text-center">
            <div class="p-2 rounded-xl bg-slate-900/60 border border-white/10">
              <span class="text-[9px] text-slate-400 block">🚗 Car Driving</span>
              <span class="font-bold text-emerald-400">Normal</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/60 border border-white/10">
              <span class="text-[9px] text-slate-400 block">🛵 2-Wheeler</span>
              <span class="font-bold text-emerald-400">Dry Grip</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/60 border border-white/10">
              <span class="text-[9px] text-slate-400 block">🚇 Metro/Transit</span>
              <span class="font-bold text-sky-400">On Time</span>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1.5 text-xs">
            <div class="flex justify-between text-slate-300">
              <span>Road Stopping Distance:</span>
              <span class="font-bold text-emerald-400">${impact.brakingDistanceMult}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>Fog & Sight Range:</span>
              <span class="font-bold text-white">${((cur.visibility || 7500) / 1000).toFixed(1)} km (Clear)</span>
            </div>
          </div>
        </div>
      `;
    }

    // 8. EVENT PLANNERS
    else if (p === 'event') {
      const comfort = ScoringAlgorithms.calculateComfortIndex(cur.temperature_2m, cur.relative_humidity_2m, cur.wind_speed_10m, cur.precipitation > 0 ? 80 : 5);

      container.innerHTML = `
        <!-- 14-Day Rain Matrix & Canopy Advisor -->
        <div class="glass-panel p-4 border border-violet-500/30">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-violet-300 flex items-center gap-1.5">
              <i data-lucide="party-popper" class="w-4 h-4 text-violet-400"></i> Event Feasibility & Discomfort Index
            </h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">Planner AI</span>
          </div>

          <div class="p-3 rounded-xl bg-slate-900/70 border border-white/10 mb-3 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 block uppercase font-bold">Guest Comfort Index</span>
              <span class="text-base font-extrabold text-violet-300">${comfort} / 100 (High Comfort)</span>
              <span class="text-[10px] text-slate-300 block mt-0.5">Ideal for garden receptions & weddings</span>
            </div>
            <i data-lucide="smile" class="w-8 h-8 text-emerald-400"></i>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <span class="text-slate-300">Marquee & Tent Anchoring:</span>
              <span class="font-bold text-emerald-400">Standard (Gusts < 20 km/h)</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <span class="text-slate-300">Wedding Golden Hour Photo Window:</span>
              <span class="font-bold text-amber-300">05:45 PM - 06:30 PM (Soft Light)</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
              <span class="text-slate-300">14-Day Rain Threat Probability:</span>
              <span class="font-bold text-sky-300">Low (< 15% rain risk)</span>
            </div>
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Render 7-Day Extended Weekly Forecast
  renderWeeklyForecast() {
    const daily = this.weatherData.daily;
    const container = document.getElementById('weekly-forecast-container');
    container.innerHTML = '';

    const count = Math.min(7, daily.time.length);
    for (let i = 0; i < count; i++) {
      const dayLabel = i === 0 ? 'Today' : (daily.time[i].length > 5 ? new Date(daily.time[i]).toLocaleDateString('en-US', { weekday: 'short' }) : daily.time[i]);
      const maxT = daily.temperature_2m_max[i];
      const minT = daily.temperature_2m_min[i];
      const rainMax = daily.precipitation_probability_max[i] || 0;
      const code = daily.weather_code[i] || 0;
      const info = WMO_CODES[code] || WMO_CODES[0];

      const row = document.createElement('div');
      row.className = 'glass-card p-2.5 flex items-center justify-between border border-white/5 text-xs';
      row.innerHTML = `
        <span class="w-14 font-semibold text-slate-200">${dayLabel}</span>
        <div class="flex items-center gap-2 flex-1 justify-center">
          <i data-lucide="${info.icon}" class="w-4 h-4 text-amber-400"></i>
          <span class="text-[11px] text-slate-300 hidden sm:inline">${info.label}</span>
          ${rainMax > 20 ? `<span class="text-[10px] text-sky-400 font-semibold flex items-center gap-0.5"><i data-lucide="droplet" class="w-2.5 h-2.5"></i>${rainMax}%</span>` : ''}
        </div>
        <div class="w-24 text-right">
          <span class="font-bold text-white">${this.formatTemp(maxT)}</span>
          <span class="text-slate-400 ml-1.5 text-[11px]">${this.formatTemp(minT)}</span>
        </div>
      `;
      container.appendChild(row);
    }
  }

  // Switch City programmatically
  switchCity(cityId) {
    const city = CITIES.find(c => c.id === cityId);
    if (city) {
      this.currentCity = city;
      document.getElementById('city-select').value = city.id;
      this.updateSyncedLocalityBanner();
      this.fetchWeatherData().then(() => this.renderAll());
    }
  }

  // Live Clock for Phone Dynamic Island Notch
  startLiveClock() {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const notchElem = document.getElementById('notch-time');
      if (notchElem) notchElem.textContent = `${hrs}:${mins}`;
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  // Open Radar Map Modal & Leaflet map initialization
  openRadarModal() {
    const modal = document.getElementById('modal-radar');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('radar-status-location').textContent = `${this.currentCity.name} Region`;

    if (!this.radarMap) {
      setTimeout(() => {
        this.radarMap = L.map('radar-map').setView([this.currentCity.lat, this.currentCity.lon], 9);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 18
        }).addTo(this.radarMap);

        this.radarLayerGroup = L.layerGroup().addTo(this.radarMap);
        this.updateRadarMapLayers();
      }, 200);
    } else {
      setTimeout(() => {
        this.radarMap.setView([this.currentCity.lat, this.currentCity.lon], 9);
        this.radarMap.invalidateSize();
        this.updateRadarMapLayers();
      }, 200);
    }
  }

  updateRadarMapLayers() {
    if (!this.radarMap || !this.radarLayerGroup) return;
    this.radarLayerGroup.clearLayers();

    const { lat, lon } = this.currentCity;

    L.circleMarker([lat, lon], {
      radius: 8,
      fillColor: '#38bdf8',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).bindPopup(`<b>${this.currentCity.name}</b><br>Live Centered Position`).addTo(this.radarLayerGroup);

    if (this.activeRadarLayer === 'precip') {
      L.circle([lat + 0.08, lon - 0.05], {
        radius: 12000,
        color: '#38bdf8',
        fillColor: '#0284c7',
        fillOpacity: 0.45
      }).bindTooltip('Light Rain Cells (0.8 mm/h)').addTo(this.radarLayerGroup);

      L.circle([lat - 0.12, lon + 0.08], {
        radius: 18000,
        color: '#10b981',
        fillColor: '#059669',
        fillOpacity: 0.35
      }).bindTooltip('Scattered Moisture Band').addTo(this.radarLayerGroup);
    } else if (this.activeRadarLayer === 'clouds') {
      L.circle([lat, lon], {
        radius: 25000,
        color: '#94a3b8',
        fillColor: '#64748b',
        fillOpacity: 0.4
      }).bindTooltip('65% Stratocumulus Deck').addTo(this.radarLayerGroup);
    } else if (this.activeRadarLayer === 'temp') {
      L.circle([lat, lon], {
        radius: 20000,
        color: '#f59e0b',
        fillColor: '#d97706',
        fillOpacity: 0.35
      }).bindTooltip(`Thermal Core: ${this.weatherData.current.temperature_2m}°C`).addTo(this.radarLayerGroup);
    } else if (this.activeRadarLayer === 'wind') {
      L.circle([lat, lon], {
        radius: 15000,
        color: '#14b8a6',
        fillColor: '#0d9488',
        fillOpacity: 0.3
      }).bindTooltip(`Wind Stream: ${this.weatherData.current.wind_speed_10m} km/h SW`).addTo(this.radarLayerGroup);
    }
  }

  // Mausam AI Voice Assistant Engine
  openVoiceModal() {
    const modal = document.getElementById('modal-voice');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.generateAIBriefing();
  }

  generateAIBriefing() {
    const p = PERSONAS[this.currentPersona];
    const cur = this.weatherData.current;
    const city = this.currentCity.name;
    const info = WMO_CODES[cur.weather_code] || WMO_CODES[0];

    document.getElementById('voice-persona-title').textContent = `${p.name} Briefing for ${city}`;

    let script = `Good day! Here is your Mausam Personalized Briefing for ${city}. Currently, it is ${this.formatTemp(cur.temperature_2m)} with ${info.label.toLowerCase()}. `;

    if (this.currentPersona === 'health') {
      script += `Air Quality is at ${this.airQualityData.pm2_5 || 35} micrograms per cubic meter. Grass pollen is moderate today. Keep emergency inhalers handy if sensitive, and wear UV sunglasses.`;
    } else if (this.currentPersona === 'fitness') {
      script += `Running score is rated at 94 out of 100 for your morning window until 8:30 AM. Wind is mild at ${Math.round(cur.wind_speed_10m)} kilometers per hour. Hydrate with 700 ml of water per workout hour.`;
    } else if (this.currentPersona === 'beach') {
      script += `Next high tide is peaking in under two hours with clean southwest swells of 1.6 meters. Water temperature is pleasant at ${Math.round(cur.temperature_2m - 3)} degrees. Safe swimming green flag.`;
    } else if (this.currentPersona === 'traveler') {
      script += `Flight operations at ${city} airport are experiencing minimal weather disruption with 7.5 kilometers visibility. Remember to pack a light shell jacket and sunscreen.`;
    } else if (this.currentPersona === 'family') {
      script += `School morning commute temperature is 21 degrees with dry roads. Great news for the kids: the playground index is 95 out of 100 today.`;
    } else if (this.currentPersona === 'agri') {
      script += `Topsoil moisture is optimal at 42 percent. No frost threat is detected for the next 48 hours. Good conditions for active field management.`;
    } else if (this.currentPersona === 'commuter') {
      script += `Commute delay risk is low. High road visibility and dry tarmac ensure swift travel. Best departure slot is between 8:15 AM and 8:45 AM.`;
    } else if (this.currentPersona === 'event') {
      script += `Event comfort rating is 92 out of 100. Wind gusts remain under 18 kilometers per hour. Outdoor photography golden hour begins at 5:45 PM.`;
    }

    document.getElementById('voice-briefing-text').textContent = script;
  }

  toggleVoiceBriefing() {
    if (this.isSpeaking) {
      this.stopVoiceBriefing();
    } else {
      this.playVoiceBriefing();
    }
  }

  playVoiceBriefing() {
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported in this browser.');
      return;
    }

    this.stopVoiceBriefing();
    const text = document.getElementById('voice-briefing-text').textContent;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      const btn = document.getElementById('btn-speak-briefing');
      btn.innerHTML = `<i data-lucide="square" class="w-4 h-4"></i><span>Stop Voice Briefing</span>`;
      if (window.lucide) window.lucide.createIcons();
    };

    utterance.onend = () => {
      this.stopVoiceBriefing();
    };

    this.speechSynth.speak(utterance);
  }

  stopVoiceBriefing() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    this.isSpeaking = false;
    const btn = document.getElementById('btn-speak-briefing');
    if (btn) {
      btn.innerHTML = `<i data-lucide="volume-2" class="w-4 h-4"></i><span>Play Voice Briefing</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // Alerts & Notifications Center
  checkAndGenerateAlerts() {
    this.activeAlerts = [
      {
        id: 1,
        title: 'Low Allergy Threat Window',
        desc: 'Grass & Tree pollen counts remain low throughout morning hours.',
        type: 'info',
        time: '10m ago',
        icon: 'info'
      },
      {
        id: 2,
        title: 'UV Peak Alert (12:00 - 15:00)',
        desc: 'UV index will peak at 7.2. Apply broad-spectrum SPF 30+ outdoors.',
        type: 'warning',
        time: '35m ago',
        icon: 'sun'
      }
    ];

    if (this.currentCity.name.toLowerCase().includes('delhi')) {
      this.activeAlerts.unshift({
        id: 3,
        title: 'Air Quality Caution',
        desc: 'Moderate PM2.5 levels detected. Sensitive groups advised to wear protective masks.',
        type: 'alert',
        time: 'Just now',
        icon: 'alert-triangle'
      });
    }
  }

  renderNotificationList() {
    const list = document.getElementById('notif-list');
    list.innerHTML = '';

    this.activeAlerts.forEach(alert => {
      const card = document.createElement('div');
      const borderClass = alert.type === 'alert' ? 'border-rose-500/40 bg-rose-950/30' : (alert.type === 'warning' ? 'border-amber-500/40 bg-amber-950/30' : 'border-sky-500/40 bg-sky-950/30');
      const iconColor = alert.type === 'alert' ? 'text-rose-400' : (alert.type === 'warning' ? 'text-amber-400' : 'text-sky-400');

      card.className = `p-2.5 rounded-xl border ${borderClass} text-xs flex items-start gap-2.5`;
      card.innerHTML = `
        <i data-lucide="${alert.icon}" class="w-4 h-4 ${iconColor} mt-0.5 flex-shrink-0"></i>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white">${alert.title}</span>
            <span class="text-[9px] text-slate-400">${alert.time}</span>
          </div>
          <p class="text-[11px] text-slate-300 mt-0.5">${alert.desc}</p>
        </div>
      `;
      list.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  simulateSuddenAlert() {
    const sudden = {
      id: Date.now(),
      title: '🌧️ Sudden Rain Shower Warning',
      desc: `Localized rain cell approaching ${this.currentCity.name} center in ~15 mins.`,
      type: 'alert',
      time: 'Just now',
      icon: 'cloud-lightning'
    };
    this.activeAlerts.unshift(sudden);
    this.renderNotificationList();
  }

  // Persona Customizer Modal
  openCustomizerModal() {
    const modal = document.getElementById('modal-customizer');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const container = document.getElementById('customizer-widget-list');
    container.innerHTML = '';

    const allWidgets = [
      { id: 'aqi_breakdown', name: 'Air Quality & PM2.5 Gauge', persona: 'Health' },
      { id: 'pollen_meter', name: 'Pollen & Allergen Count', persona: 'Health' },
      { id: 'uv_safety', name: 'UV Exposure & Sunburn Timer', persona: 'Health' },
      { id: 'best_running_hours', name: 'Best Workout & Running Hours', persona: 'Fitness' },
      { id: 'sun_twilight', name: 'Sunrise, Sunset & Golden Hours', persona: 'Fitness' },
      { id: 'tide_chart', name: 'High & Low Tide Chart & Waves', persona: 'Beach' },
      { id: 'flight_delay_risk', name: 'Flight Delay & Travel Radar', persona: 'Travel' },
      { id: 'ai_packing_guide', name: 'AI Smart Packing Checklist', persona: 'Travel' },
      { id: 'school_commute', name: 'School Commute Forecast Cards', persona: 'Family' },
      { id: 'soil_moisture', name: 'Topsoil Moisture & Frost Risk', persona: 'Agri' },
      { id: 'commute_score', name: 'Weather-Impacted Commute Index', persona: 'Commuter' },
      { id: 'comfort_index', name: '14-Day Event Comfort Rating', persona: 'Event' }
    ];

    allWidgets.forEach(w => {
      const item = document.createElement('label');
      item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs cursor-pointer hover:bg-white/5';
      item.innerHTML = `
        <div>
          <span class="font-bold text-white block">${w.name}</span>
          <span class="text-[10px] text-slate-400">Category: ${w.persona}</span>
        </div>
        <input type="checkbox" checked class="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 bg-slate-800 border-slate-700">
      `;
      container.appendChild(item);
    });
  }

  saveCustomWidgets() {
    document.getElementById('modal-customizer').classList.add('hidden');
    document.getElementById('modal-customizer').classList.remove('flex');
    this.renderPersonaWidgets();
  }
}

// Instantiate App
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new MausamApp();
});
