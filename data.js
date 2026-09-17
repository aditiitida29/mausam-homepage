// Mausam Weather Engine - Deep Behavioral & Atmospheric Data Models

const CITIES = [
  { id: 'delhi', name: 'New Delhi', country: 'India', lat: 28.6139, lon: 77.2090, timezone: 'Asia/Kolkata', tag: 'High AQI / Commute Focus' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, timezone: 'Asia/Kolkata', tag: 'Coastal / Surfing' },
  { id: 'bengaluru', name: 'Bengaluru', country: 'India', lat: 12.9716, lon: 77.5946, timezone: 'Asia/Kolkata', tag: 'Pleasant / Fitness' },
  { id: 'goa', name: 'Goa', country: 'India', lat: 15.2993, lon: 74.1240, timezone: 'Asia/Kolkata', tag: 'Beaches & Surfing' },
  { id: 'shimla', name: 'Shimla', country: 'India', lat: 31.1048, lon: 77.1734, timezone: 'Asia/Kolkata', tag: 'Mountain / Agriculture / Frost' },
  { id: 'london', name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London', tag: 'Traveler & Rain Focus' },
  { id: 'newyork', name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, timezone: 'America/New_York', tag: 'Commute & Travel' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo', tag: 'Travel & Urban Commute' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney', tag: 'Beach & Outdoor Fitness' },
  { id: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris', tag: 'Events & Tourism' },
  { id: 'punjab', name: 'Ludhiana', country: 'India', lat: 30.9010, lon: 75.8573, timezone: 'Asia/Kolkata', tag: 'Agricultural Heartland' },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, timezone: 'Asia/Dubai', tag: 'High UV / Desert Climate' }
];

const PERSONAS = {
  health: {
    id: 'health',
    name: 'Health & Wellness',
    title: 'Health-Conscious',
    icon: 'heart-pulse',
    color: 'from-emerald-500 to-teal-700',
    accent: 'emerald',
    badge: 'AQI, Pollen & Biometeorology',
    description: 'In-depth Air Quality, multi-species botanical pollen, UV damage timer, Vitamin D window, and migraine/asthma risks.',
    widgets: ['aqi_breakdown', 'pollen_meter', 'uv_vit_d', 'health_advisory']
  },
  fitness: {
    id: 'fitness',
    name: 'Outdoor Fitness',
    title: 'Fitness & Athletes',
    icon: 'activity',
    color: 'from-amber-500 to-orange-700',
    accent: 'amber',
    badge: 'Best Running Hours & Aero Drag',
    description: 'Sport-specific suitability, sweat & hydration rates, aero drag penalty, sunrise/sunset golden hours, and WBGT heat flags.',
    widgets: ['best_running_hours', 'sport_suitability', 'sweat_calculator', 'sun_twilight', 'wind_metrics']
  },
  beach: {
    id: 'beach',
    name: 'Beach & Surfing',
    title: 'Beachgoers & Surfers',
    icon: 'waves',
    color: 'from-cyan-500 to-blue-700',
    accent: 'cyan',
    badge: 'Tides, Swell & Marine Safety',
    description: 'Tidal curves, swell height & period, sea vs air temp, wetsuit selector, rip current risk, and water UV reflection.',
    widgets: ['tide_chart', 'wave_swell', 'water_temp', 'marine_safety']
  },
  traveler: {
    id: 'traveler',
    name: 'Travel & Trips',
    title: 'Frequent Travelers',
    icon: 'plane',
    color: 'from-indigo-500 to-purple-700',
    accent: 'indigo',
    badge: 'AI Smart Packing & Flight Delays',
    description: 'Multi-destination trip radar, airport weather delay analysis, thermal shock index, and AI packing suggestions.',
    widgets: ['saved_destinations', 'flight_delay_risk', 'ai_packing_guide', 'destination_brief']
  },
  family: {
    id: 'family',
    name: 'Parents & Family',
    title: 'Parents & Families',
    icon: 'users',
    color: 'from-pink-500 to-rose-700',
    accent: 'pink',
    badge: 'School Commute & Kids Guard',
    description: 'School bell-schedule drop-off/pickup cards, rain countdown, kids outfit advisor, and playground slide safety index.',
    widgets: ['school_commute', 'rain_radar_alert', 'kids_clothing_guide', 'playground_suitability']
  },
  agri: {
    id: 'agri',
    name: 'Agri & Gardening',
    title: 'Agriculture & Gardeners',
    icon: 'sprout',
    color: 'from-lime-500 to-green-700',
    accent: 'lime',
    badge: '3-Depth Soil & Frost Radar',
    description: 'Soil temperature & moisture across 3 depths, evapotranspiration (ET0) irrigation, frost hours, and disease spray windows.',
    widgets: ['soil_moisture', 'evapotranspiration', 'frost_pest_alert', 'planting_guidance']
  },
  commuter: {
    id: 'commuter',
    name: 'Daily Commuter',
    title: 'Commuters & Drivers',
    icon: 'car',
    color: 'from-blue-500 to-slate-700',
    accent: 'blue',
    badge: 'Multi-Modal Commute & Fog Safety',
    description: 'Car, bike & transit commute score, fog distance, stopping distance multiplier, hydroplaning risk, and rush-hour buffers.',
    widgets: ['commute_score', 'road_visibility', 'modal_impact', 'departure_planner']
  },
  event: {
    id: 'event',
    name: 'Event Planner',
    title: 'Event & Wedding Planners',
    icon: 'calendar-heart',
    color: 'from-violet-500 to-fuchsia-700',
    accent: 'violet',
    badge: '14-Day Comfort & Canopy Matrix',
    description: '14-day rain & gust probability matrix, guest comfort index (Humidex), marquee tent requirements, and wedding golden hour.',
    widgets: ['comfort_index', 'rain_matrix', 'venue_fallback_advisor', 'golden_photo_hour']
  }
};

// Algorithmic Scoring Models & Deep Calculators
const ScoringAlgorithms = {
  // 1. Calculate Best Running Hours Score (0 to 100)
  calculateRunningScore: (tempC, humidityPct, windKph, uvIndex, rainProbPct) => {
    let score = 100;
    if (tempC < 12) score -= Math.min(30, (12 - tempC) * 2.5);
    else if (tempC > 20) score -= Math.min(45, (tempC - 20) * 3.5);
    
    if (humidityPct > 70) score -= (humidityPct - 70) * 0.8;
    else if (humidityPct < 30) score -= (30 - humidityPct) * 0.4;
    
    if (windKph > 20) score -= (windKph - 20) * 1.2;
    if (uvIndex > 6) score -= (uvIndex - 6) * 4;
    if (rainProbPct > 20) score -= rainProbPct * 0.5;

    return Math.max(10, Math.min(100, Math.round(score)));
  },

  // 2. Calculate Sweat & Sodium Loss Rate for Athletes
  calculateSweatRate: (weightKg = 70, intensity = 'moderate', tempC = 25, humidityPct = 60) => {
    // Base sweat in L/hour
    let baseSweat = (weightKg / 70) * 0.8;
    if (intensity === 'high') baseSweat *= 1.4;
    if (intensity === 'extreme') baseSweat *= 1.8;

    // Thermal multiplier
    const tempFactor = 1 + Math.max(0, (tempC - 20) * 0.04);
    const humidFactor = 1 + Math.max(0, (humidityPct - 50) * 0.008);
    
    const sweatRateLiters = Math.round(baseSweat * tempFactor * humidFactor * 10) / 10;
    const sodiumMgPerHour = Math.round(sweatRateLiters * 950); // ~950mg Na per Liter

    return {
      sweatRateLiters,
      sodiumMgPerHour,
      fluidIntakeMl: Math.round(sweatRateLiters * 1000)
    };
  },

  // 3. Calculate WBGT (Wet-Bulb Globe Temp approximation for heat safety)
  calculateWBGT: (tempC, humidityPct, windKph) => {
    const vPress = (humidityPct / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
    const wbgt = 0.567 * tempC + 0.393 * vPress + 3.94 - (windKph * 0.05);
    const wbgtRounded = Math.round(wbgt * 10) / 10;

    let flag = 'Green';
    let flagColor = 'text-emerald-400';
    let alert = 'Normal physical training. Safe conditions.';
    if (wbgtRounded >= 32.2) {
      flag = 'Black Flag';
      flagColor = 'text-rose-400';
      alert = 'Hazardous. Cancel strenuous outdoor exertion.';
    } else if (wbgtRounded >= 30.1) {
      flag = 'Red Flag';
      flagColor = 'text-orange-400';
      alert = 'High Heat Strain. Enforce 20 min rest / 40 min training.';
    } else if (wbgtRounded >= 28.0) {
      flag = 'Yellow Flag';
      flagColor = 'text-amber-300';
      alert = 'Moderate Strain. Hydrate frequently.';
    }

    return { wbgt: wbgtRounded, flag, flagColor, alert };
  },

  // 4. Calculate Event Comfort Index (0 to 100)
  calculateComfortIndex: (tempC, humidityPct, windKph, rainProbPct) => {
    const vPress = (humidityPct / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
    const heatIndex = tempC + 0.33 * vPress - 0.7 * (windKph / 3.6) - 4.0;
    let comfort = 100;
    if (heatIndex > 26) comfort -= (heatIndex - 26) * 4;
    else if (heatIndex < 16) comfort -= (16 - heatIndex) * 3;
    if (windKph > 20) comfort -= (windKph - 20) * 2;
    comfort -= (rainProbPct * 0.6);
    return Math.max(15, Math.min(100, Math.round(comfort)));
  },

  // 5. Calculate Commute Delay Risk & Multi-Modal Safety
  calculateCommuteImpact: (visibilityKm, rainMm, windKph, weatherCode) => {
    let impactScore = 0;
    if (visibilityKm < 0.5) impactScore += 60;
    else if (visibilityKm < 1.5) impactScore += 40;
    else if (visibilityKm < 4.0) impactScore += 20;
    
    if (rainMm > 6.0) impactScore += 45;
    else if (rainMm > 2.0) impactScore += 30;
    else if (rainMm > 0.1) impactScore += 12;
    
    if (windKph > 40) impactScore += 25;
    
    if ([95, 96, 99].includes(weatherCode)) impactScore += 45;
    if ([45, 48].includes(weatherCode)) impactScore += 40;
    
    impactScore = Math.min(100, impactScore);
    let level = 'Optimal Flow';
    let color = 'text-emerald-400';
    let delayMin = '0-5 mins';
    let brakingDistanceMult = '1.0x (Standard)';
    
    if (impactScore > 65) {
      level = 'Hazardous Travel Delay';
      color = 'text-rose-400';
      delayMin = '25-45+ mins';
      brakingDistanceMult = '1.6x (High Wet Skid)';
    } else if (impactScore > 40) {
      level = 'Moderate Traffic Slowdown';
      color = 'text-amber-400';
      delayMin = '12-25 mins';
      brakingDistanceMult = '1.3x (Moderate Wet)';
    } else if (impactScore > 20) {
      level = 'Minor Commute Delay';
      color = 'text-yellow-300';
      delayMin = '5-12 mins';
      brakingDistanceMult = '1.1x';
    }
    return { score: impactScore, level, color, delayMin, brakingDistanceMult };
  },

  // 6. Calculate Evapotranspiration (ET0) for Agriculture
  calculateET0: (tempC, humidityPct, windKph, solarRadiation = 18) => {
    // Simplified Hargreaves & Samani FAO-56 Reference ET estimation
    const et0 = 0.0023 * (tempC + 17.8) * Math.sqrt(12) * (solarRadiation * 0.408);
    const roundedET0 = Math.round(Math.max(1.5, et0) * 10) / 10;
    const weeklyNeedMm = Math.round(roundedET0 * 7);
    return { dailyET0: roundedET0, weeklyWaterNeedMm: weeklyNeedMm };
  },

  // 7. Calculate Vitamin D Synthesis & Sunburn Safe Window
  calculateUVDetails: (uvIndex, skinType = 2) => {
    // Skin type 1 (very fair), 2 (fair), 3 (medium), 4 (olive), 5 (dark brown)
    const baseDamageMinutes = [60, 40, 25, 18, 12, 8];
    const uvClamped = Math.max(1, uvIndex);
    const sunburnMinutes = Math.round(baseDamageMinutes[skinType - 1] * (5 / uvClamped));
    const vitDMinutes = Math.round(Math.max(8, sunburnMinutes * 0.35));

    return {
      sunburnMinutes: Math.max(10, sunburnMinutes),
      vitDMinutes: Math.min(25, vitDMinutes),
      recommendation: uvIndex >= 8 ? 'Extreme UV: Avoid sun 11 AM - 3 PM. SPF 50+.' : (uvIndex >= 6 ? 'High UV: SPF 30+, hat and sunglasses needed.' : 'Moderate UV: Safe with light protection.')
    };
  },

  // 8. AI Packing Recommendation Generator
  generatePackingTips: (tempC, rainProbPct, uvIndex, windKph, city = '') => {
    const tips = [];
    const cityLower = city.toLowerCase();

    // London Special Rule
    if (cityLower.includes('london') || rainProbPct > 35) {
      tips.push({ icon: 'umbrella', title: 'Rainwear & Shell', text: 'Compact windproof umbrella, waterproof trench & water-resistant boots', tag: 'Rain Ready' });
    }
    // Goa / Mumbai Coastal Special Rule
    if (cityLower.includes('goa') || cityLower.includes('mumbai')) {
      tips.push({ icon: 'sun', title: 'Beach & Coastal Wear', text: 'Lightweight linen shirts, polarized sunglasses, flip-flops & bug spray', tag: 'Coastal Essentials' });
    }
    // Shimla Mountain Rule
    if (cityLower.includes('shimla') || tempC < 14) {
      tips.push({ icon: 'shirt', title: 'Thermal Insulation', text: 'Thermal base layers, fleece jacket, wool socks & cold-weather lip balm', tag: 'Cold Climate' });
    } else if (tempC > 28) {
      tips.push({ icon: 'sun', title: 'Heat & Breathability', text: 'Breathable cottons, hydration flask, sun hat & electrolyte sachets', tag: 'Heat Defense' });
    } else {
      tips.push({ icon: 'layers', title: 'Versatile Layering', text: 'Light cotton tee + stylish cardigan/light denim jacket', tag: 'Mild Temp' });
    }
    
    // Tokyo / Paris Urban Rule
    if (cityLower.includes('tokyo') || cityLower.includes('paris')) {
      tips.push({ icon: 'footprints', title: 'Urban Walking Shoes', text: 'Cushioned walking sneakers for high daily step counts', tag: 'City Walking' });
    }
    if (uvIndex >= 6) {
      tips.push({ icon: 'sparkles', title: 'Broad-Spectrum UV', text: 'SPF 50+ PA++++ sunscreen lotion & UV sunglasses', tag: 'High UV' });
    }
    if (windKph > 28) {
      tips.push({ icon: 'wind', title: 'Windbreaker Shell', text: 'Windbreaker jacket & secure travel backpack rain cover', tag: 'Gusty' });
    }

    return tips;
  },

  // 9. Solar Position & Time-of-Day Category Resolver
  getTimeOfDayCategory: (nowDate = new Date(), sunriseHours = 6.0, sunsetHours = 18.5) => {
    const currentDecimalHours = nowDate.getHours() + nowDate.getMinutes() / 60;
    if (currentDecimalHours >= sunriseHours - 0.8 && currentDecimalHours < sunriseHours + 0.8) return 'dawn';
    if (currentDecimalHours >= sunriseHours + 0.8 && currentDecimalHours < sunsetHours - 1.2) return 'day';
    if (currentDecimalHours >= sunsetHours - 1.2 && currentDecimalHours < sunsetHours + 0.5) return 'golden_hour';
    if (currentDecimalHours >= sunsetHours + 0.5 && currentDecimalHours < sunsetHours + 1.2) return 'dusk';
    return 'night';
  },

  // 10. Atmospheric Theme Resolver
  getAtmosphericTheme: (weatherCode, timeCategory) => {
    if ([95, 96, 99, 82].includes(weatherCode)) {
      return { bgClass: 'bg-stormy', particleMode: 'stormy', glowColor: 'rgba(168, 85, 247, 0.45)', mood: 'Thunder & Lightning' };
    }
    if ([51, 53, 55, 61, 63, 65, 80].includes(weatherCode)) {
      return { bgClass: 'bg-rainy', particleMode: 'rainy', glowColor: 'rgba(14, 165, 233, 0.35)', mood: 'Rain Showers' };
    }
    if ([71, 73, 75].includes(weatherCode)) {
      return { bgClass: 'bg-snowy', particleMode: 'snowy', glowColor: 'rgba(224, 242, 254, 0.4)', mood: 'Winter Snow' };
    }
    if ([45, 48].includes(weatherCode)) {
      return { bgClass: 'bg-foggy', particleMode: 'foggy', glowColor: 'rgba(148, 163, 184, 0.35)', mood: 'Ethereal Mist' };
    }
    if (weatherCode === 3) {
      return { bgClass: 'bg-overcast', particleMode: 'cloudy', glowColor: 'rgba(100, 116, 139, 0.3)', mood: 'Overcast Skies' };
    }
    if (weatherCode === 2) {
      if (timeCategory === 'night' || timeCategory === 'dusk') {
        return { bgClass: 'bg-partly-cloudy-night', particleMode: 'stars_clouds', glowColor: 'rgba(99, 102, 241, 0.3)', mood: 'Moonlit Scattered Clouds' };
      }
      if (timeCategory === 'golden_hour') {
        return { bgClass: 'bg-golden-hour', particleMode: 'sun_motes', glowColor: 'rgba(249, 115, 22, 0.45)', mood: 'Golden Sunset Clouds' };
      }
      if (timeCategory === 'dawn') {
        return { bgClass: 'bg-dawn', particleMode: 'sun_motes', glowColor: 'rgba(251, 146, 60, 0.4)', mood: 'Morning Pastel Clouds' };
      }
      return { bgClass: 'bg-partly-cloudy-day', particleMode: 'sun_motes', glowColor: 'rgba(56, 189, 248, 0.35)', mood: 'Partly Cloudy' };
    }
    if (timeCategory === 'night' || timeCategory === 'dusk') {
      return { bgClass: 'bg-clear-night', particleMode: 'stars', glowColor: 'rgba(99, 102, 241, 0.35)', mood: 'Starry Starlit Sky' };
    }
    if (timeCategory === 'golden_hour') {
      return { bgClass: 'bg-golden-hour', particleMode: 'sun_motes', glowColor: 'rgba(249, 115, 22, 0.5)', mood: 'Radiant Golden Hour' };
    }
    if (timeCategory === 'dawn') {
      return { bgClass: 'bg-dawn', particleMode: 'sun_motes', glowColor: 'rgba(251, 146, 60, 0.45)', mood: 'Rosy Sunrise Dawn' };
    }
    return { bgClass: 'bg-sunny-day', particleMode: 'sun_motes', glowColor: 'rgba(245, 158, 11, 0.4)', mood: 'Vibrant Sunny Sky' };
  }
};

// Weather Code Translator (WMO standard)
const WMO_CODES = {
  0: { label: 'Clear Sky', icon: 'sun', bg: 'sunny-day', mood: 'Bright & crystal clear' },
  1: { label: 'Mainly Clear', icon: 'sun-medium', bg: 'sunny-day', mood: 'Mostly sunny & pleasant' },
  2: { label: 'Partly Cloudy', icon: 'cloud-sun', bg: 'partly-cloudy-day', mood: 'Scattered fair clouds' },
  3: { label: 'Overcast', icon: 'cloud', bg: 'overcast', mood: 'Overcast skies' },
  45: { label: 'Dense Fog', icon: 'cloud-fog', bg: 'foggy', mood: 'Low visibility mist' },
  48: { label: 'Depositing Rime Fog', icon: 'cloud-fog', bg: 'foggy', mood: 'Freezing dense fog' },
  51: { label: 'Light Drizzle', icon: 'cloud-drizzle', bg: 'rainy', mood: 'Light scattered drizzle' },
  53: { label: 'Moderate Drizzle', icon: 'cloud-drizzle', bg: 'rainy', mood: 'Steady drizzle' },
  55: { label: 'Dense Drizzle', icon: 'cloud-rain', bg: 'rainy', mood: 'Heavy drizzle' },
  61: { label: 'Slight Rain', icon: 'cloud-rain', bg: 'rainy', mood: 'Scattered rain showers' },
  63: { label: 'Moderate Rain', icon: 'cloud-rain', bg: 'rainy', mood: 'Steady rainfall' },
  65: { label: 'Heavy Rain', icon: 'cloud-rain-wind', bg: 'rainy', mood: 'Torrential downpour' },
  71: { label: 'Slight Snow', icon: 'snowflake', bg: 'snowy', mood: 'Light flurries' },
  73: { label: 'Moderate Snow', icon: 'snowflake', bg: 'snowy', mood: 'Snowfall' },
  75: { label: 'Heavy Snow', icon: 'snowflake', bg: 'snowy', mood: 'Heavy snow accumulation' },
  80: { label: 'Rain Showers', icon: 'cloud-sun-rain', bg: 'rainy', mood: 'Passing rain showers' },
  82: { label: 'Violent Rain Showers', icon: 'cloud-rain-wind', bg: 'stormy', mood: 'Severe downpour' },
  95: { label: 'Thunderstorm', icon: 'zap', bg: 'stormy', mood: 'Active thunder & lightning' },
  96: { label: 'Thunderstorm with Hail', icon: 'zap-off', bg: 'stormy', mood: 'Severe hail storm' },
  99: { label: 'Heavy Hail Thunderstorm', icon: 'zap-off', bg: 'stormy', mood: 'Hazardous hail storm' }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CITIES, PERSONAS, ScoringAlgorithms, WMO_CODES };
}
