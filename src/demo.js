// Только для предпросмотра без интернета: правдоподобная условная погода.
window.FISH_DEMO = true;
(function () {
  function rnd(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  const pad = n => String(n).padStart(2, "0");
  window.demoWeather = function (lat, lon) {
    const tz = Math.round(lon / 15);
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const hourly = { time: [], temperature_2m: [], pressure_msl: [], wind_speed_10m: [], wind_gusts_10m: [], precipitation: [], cloud_cover: [] };
    const daily = { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [], wind_speed_10m_max: [], wind_gusts_10m_max: [], wind_direction_10m_dominant: [], sunrise: [], sunset: [] };
    const seed = lat * 7 + lon * 3;
    const baseT = 14 - (lat - 45) * 0.9 - (lon > 90 ? 4 : 0);
    for (let d = 0; d < 8; d++) {
      const day = new Date(start.getTime() + d * 86400000);
      const ds = `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
      let tmax = -99, tmin = 99, pr = 0, wmax = 0;
      for (let h = 0; h < 24; h++) {
        const t = d * 24 + h;
        const p = 1014 + 9 * Math.sin(t / 30 + seed) + 4 * Math.sin(t / 11 + seed * 2);
        const temp = baseT + 4 * Math.sin((h - 9) / 24 * 2 * Math.PI) + 3 * Math.sin(t / 50 + seed);
        const w = Math.max(0.5, 4 + 3 * Math.sin(t / 17 + seed) + rnd(seed + t) * 2);
        const rain = rnd(seed * 3 + t) > 0.93 ? rnd(t) * 2 : 0;
        hourly.time.push(`${ds}T${pad(h)}:00`);
        hourly.pressure_msl.push(+p.toFixed(1)); hourly.temperature_2m.push(+temp.toFixed(1));
        hourly.wind_speed_10m.push(+w.toFixed(1)); hourly.wind_gusts_10m.push(+(w * 1.6).toFixed(1));
        hourly.precipitation.push(+rain.toFixed(1)); hourly.cloud_cover.push(50);
        tmax = Math.max(tmax, temp); tmin = Math.min(tmin, temp); pr += rain; wmax = Math.max(wmax, w);
      }
      const sun = FC.sunTimes(day, lat, lon);
      const loc = dt => { const x = new Date(dt.getTime() + tz * 3600000); return `${ds}T${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}`; };
      daily.time.push(ds);
      daily.weather_code.push(pr > 3 ? 63 : pr > 0.3 ? 61 : rnd(seed + d) > 0.5 ? 2 : 1);
      daily.temperature_2m_max.push(+tmax.toFixed(1)); daily.temperature_2m_min.push(+tmin.toFixed(1));
      daily.precipitation_sum.push(+pr.toFixed(1)); daily.wind_speed_10m_max.push(+wmax.toFixed(1));
      daily.wind_gusts_10m_max.push(+(wmax * 1.6).toFixed(1));
      daily.wind_direction_10m_dominant.push(Math.round(rnd(seed + d * 5) * 360));
      daily.sunrise.push(sun.sunrise ? loc(sun.sunrise) : `${ds}T09:00`);
      daily.sunset.push(sun.sunset ? loc(sun.sunset) : `${ds}T15:00`);
    }
    return { hourly, daily };
  };
  window.demoTides = function (lat, lon) {
    const now = new Date();
    const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1);
    const t = [], l = [], amp = lat > 65 ? 1.6 : lat > 55 ? 2.2 : 0.4;
    for (let i = 0; i < 24 * 8; i++) {
      t.push(new Date(start + i * 3600000).toISOString().slice(0, 16));
      l.push(amp * Math.cos(2 * Math.PI * (i - lon / 30) / 12.42) * (0.8 + 0.2 * Math.cos(i / 170)));
    }
    return FC.tideEvents(t, l);
  };
})();
