// Расчёты: луна, солнце, прогноз клёва, приливы. Без интерфейса — можно проверять отдельно.
(function (root) {
  const HPA_TO_MM = 0.750062;
  const SYNODIC = 29.530588853;

  // ---------- Луна ----------
  function moonInfo(date) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    let age = ((jd - 2451550.1) / SYNODIC) % 1;
    if (age < 0) age += 1;
    const illum = (1 - Math.cos(2 * Math.PI * age)) / 2;
    let name, effect, text;
    if (age < 0.035 || age > 0.965) {
      name = "Новолуние"; effect = 6;
      text = "Новолуние: ночи тёмные, рыба днём кормится активнее. Хорошо для хищника.";
    } else if (age < 0.22) {
      name = "Растущий серп"; effect = 4;
      text = "Луна растёт: активность рыбы постепенно повышается.";
    } else if (age < 0.28) {
      name = "Первая четверть"; effect = 3;
      text = "Первая четверть: обычно ровный, неплохой клёв.";
    } else if (age < 0.465) {
      name = "Растущая луна"; effect = 1;
      text = "Почти полная луна: клёв обычный.";
    } else if (age < 0.535) {
      name = "Полнолуние"; effect = -4;
      text = "Полнолуние: ночью светло, рыба кормится ночью, а днём клюёт хуже. Попробуйте ночную рыбалку.";
    } else if (age < 0.72) {
      name = "Убывающая луна"; effect = 0;
      text = "Луна убывает: на клёв почти не влияет.";
    } else if (age < 0.78) {
      name = "Последняя четверть"; effect = 1;
      text = "Последняя четверть: клёв обычный.";
    } else {
      name = "Убывающий серп"; effect = 3;
      text = "Скоро новолуние — рыба становится активнее.";
    }
    return { age, illum, name, effect, text, days: Math.floor(age * SYNODIC) + 1 };
  }

  // ---------- Солнце (упрощённая формула NOAA), для запасного режима ----------
  function sunTimes(date, lat, lon) {
    const rad = Math.PI / 180;
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    const n = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000);
    const g = 2 * Math.PI / 365 * (n - 1);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const cosH = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
    if (cosH > 1) return { polarNight: true };
    if (cosH < -1) return { polarDay: true };
    const ha = Math.acos(cosH) / rad;
    const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return {
      sunrise: new Date(base + (720 - 4 * (lon + ha) - eq) * 60000),
      sunset: new Date(base + (720 - 4 * (lon - ha) - eq) * 60000)
    };
  }

  // ---------- Погода ----------
  const WMO = {
    0: "Ясно", 1: "Почти ясно", 2: "Переменная облачность", 3: "Пасмурно",
    45: "Туман", 48: "Туман с изморозью",
    51: "Слабая морось", 53: "Морось", 55: "Сильная морось", 56: "Ледяная морось", 57: "Ледяная морось",
    61: "Небольшой дождь", 63: "Дождь", 65: "Сильный дождь", 66: "Ледяной дождь", 67: "Ледяной дождь",
    71: "Небольшой снег", 73: "Снег", 75: "Сильный снег", 77: "Снежная крупа",
    80: "Кратковременный дождь", 81: "Ливень", 82: "Сильный ливень",
    85: "Снегопад", 86: "Сильный снегопад", 95: "Гроза", 96: "Гроза с градом", 99: "Гроза с градом"
  };
  const DIRS = ["северный", "северо-восточный", "восточный", "юго-восточный", "южный", "юго-западный", "западный", "северо-западный"];
  const DIRS_SHORT = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
  function dirIndex(deg) { return Math.round(((deg % 360) + 360) % 360 / 45) % 8; }

  // Превращает ответ Open-Meteo в список дней.
  function parseWeather(json) {
    const h = json.hourly, d = json.daily;
    const byDate = {};
    h.time.forEach((t, i) => {
      const day = t.slice(0, 10);
      (byDate[day] = byDate[day] || []).push({
        hour: +t.slice(11, 13), time: t,
        p: h.pressure_msl[i] * HPA_TO_MM, t: h.temperature_2m[i],
        w: h.wind_speed_10m[i], g: h.wind_gusts_10m ? h.wind_gusts_10m[i] : null,
        pr: h.precipitation[i], c: h.cloud_cover[i]
      });
    });
    return d.time.map((day, i) => {
      const hrs = byDate[day] || [];
      const ps = hrs.map(x => x.p).filter(x => x != null);
      const pAt = hr => { const x = hrs.find(q => q.hour === hr); return x ? x.p : null; };
      return {
        date: day,
        code: d.weather_code[i], tMax: d.temperature_2m_max[i], tMin: d.temperature_2m_min[i],
        wind: d.wind_speed_10m_max[i], gust: d.wind_gusts_10m_max ? d.wind_gusts_10m_max[i] : null,
        windDir: d.wind_direction_10m_dominant[i], precip: d.precipitation_sum[i],
        sunrise: d.sunrise[i], sunset: d.sunset[i],
        pMean: ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null,
        pMin: ps.length ? Math.min(...ps) : null, pMax: ps.length ? Math.max(...ps) : null,
        pMorning: pAt(6), pEvening: pAt(21),
        hours: hrs
      };
    });
  }

  // ---------- Клёв ----------
  // Общая оценка дня (0–100) и понятные причины.
  function dayScore(day, prev) {
    let s = 44;
    const why = [];
    const add = (v, good, text) => { s += v; why.push({ good, text, v }); };

    // Давление: главное — стабильность
    if (day.pMean != null && prev && prev.pMean != null) {
      const dp = day.pMean - prev.pMean;
      const ad = Math.abs(dp);
      if (ad < 2) add(12, true, "Давление стабильное — рыба спокойна и кормится.");
      else if (ad < 4) add(2, null, dp > 0 ? "Давление немного растёт — клёв обычный." : "Давление немного падает — хищник может оживиться.");
      else if (ad < 7) add(-10, false, dp > 0 ? "Давление заметно растёт — рыба вялая." : "Давление заметно падает — рыба беспокоится.");
      else add(-20, false, dp > 0 ? "Резкий скачок давления вверх — клёв обычно плохой." : "Резкое падение давления — погода портится, клёв плохой.");
    }
    if (day.pMax != null && day.pMax - day.pMin > 7) add(-6, false, "За день давление сильно «скачет».");
    if (day.pMean != null) {
      if (day.pMean > 775) add(-5, false, "Очень высокое давление — рыба уходит на глубину.");
      else if (day.pMean < 740) add(-5, false, "Очень низкое давление — непогода, рыба малоактивна.");
    }
    // Ветер
    if (day.wind != null) {
      if (day.wind < 3) add(4, true, "Почти безветренно — удобно ловить.");
      else if (day.wind <= 6) add(6, true, "Лёгкий ветер с рябью — рыба смелее подходит к берегу.");
      else if (day.wind <= 10) add(-6, false, "Ветер сильный — на открытой воде волна.");
      else add(-18, false, "Очень сильный ветер — ловить тяжело и опасно на лодке.");
      const di = dirIndex(day.windDir);
      if (di === 5 || di === 6 || di === 4) add(2, true, "Ветер южный или западный — по примете к клёву.");
      else if (di === 2 || di === 1 || di === 0) add(-2, false, "Ветер северный или восточный — по примете клюёт хуже.");
    }
    // Осадки
    if (day.precip != null) {
      if (day.precip > 10) add(-12, false, "Сильные осадки — вода мутнеет, клёв слабый.");
      else if (day.precip > 3) add(-4, false, "Дождь — ловить можно, но неуютно.");
      else if (day.precip > 0.2) add(3, true, "Небольшой дождик — часто к хорошему клёву.");
    }
    if ([95, 96, 99].includes(day.code)) add(-10, false, "Гроза — уходите от воды, опасно!");
    // Температура
    if (prev && prev.tMax != null && day.tMax != null) {
      const dt = day.tMax - prev.tMax;
      if (Math.abs(dt) >= 7) add(-8, false, dt > 0 ? "Резкое потепление — рыбе нужно время привыкнуть." : "Резкое похолодание — рыба затаилась.");
      else if (Math.abs(dt) < 3) add(3, true, "Температура ровная, без скачков.");
    }
    // Луна
    const moon = moonInfo(new Date(day.date + "T12:00:00Z"));
    add(moon.effect, moon.effect > 0 ? true : moon.effect < 0 ? false : null, moon.text);

    const dp = prev && prev.pMean != null && day.pMean != null ? day.pMean - prev.pMean : 0;
    return { score: clamp(s), why, moon, dp };
  }

  function fishScore(fishId, fish, base, month) {
    const act = fish.m[month];
    let s = base.score + (act - 1.5) * 12;
    if (fish.pred && base.dp <= -1 && base.dp >= -5) s += 6;
    if (fish.pred && base.dp > 4) s -= 4;
    if (!fish.pred && Math.abs(base.dp) < 2) s += 4;
    if (act === 0) s = Math.min(s, 15);
    return { id: fishId, score: clamp(s), season: act };
  }

  function spotDay(spot, day, prev, fishDb) {
    const base = dayScore(day, prev);
    const month = +day.date.slice(5, 7) - 1;
    const ids = spot && spot.f && spot.f.length ? spot.f : Object.keys(fishDb);
    const fish = ids.map(id => fishScore(id, fishDb[id], base, month)).sort((a, b) => b.score - a.score);
    const top = fish.slice(0, 3);
    const total = top.length ? clamp(top.reduce((a, b) => a + b.score, 0) / top.length) : base.score;
    return { base, fish, total, stars: stars(total), verdict: verdict(total) };
  }

  function stars(s) { return s >= 82 ? 5 : s >= 64 ? 4 : s >= 45 ? 3 : s >= 26 ? 2 : 1; }
  function verdict(s) {
    return ["", "Клёв плохой", "Клёв слабый", "Клёв средний", "Клёв хороший", "Клёв отличный"][stars(s)];
  }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

  // Лучшее время: утренняя и вечерняя зорька
  function bestTimes(day) {
    if (!day.sunrise || !day.sunset) return [];
    const sr = toMin(day.sunrise), ss = toMin(day.sunset);
    if (sr == null || ss == null || ss <= sr) return [];
    return [
      { label: "Утренняя зорька", from: fmtMin(sr - 45), to: fmtMin(sr + 120) },
      { label: "Вечерняя зорька", from: fmtMin(ss - 120), to: fmtMin(ss + 30) }
    ];
  }
  function toMin(iso) { const m = /T(\d\d):(\d\d)/.exec(iso); return m ? +m[1] * 60 + +m[2] : null; }
  function fmtMin(m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }

  // ---------- Приливы ----------
  // Ищет полную и малую воду по часовой высоте уровня моря.
  function tideEvents(times, levels) {
    const ev = [];
    for (let i = 1; i < levels.length - 1; i++) {
      const a = levels[i - 1], b = levels[i], c = levels[i + 1];
      if (a == null || b == null || c == null) continue;
      const isMax = b > a && b >= c, isMin = b < a && b <= c;
      if (!isMax && !isMin) continue;
      const denom = a - 2 * b + c;
      const off = denom !== 0 ? 0.5 * (a - c) / denom : 0;
      const h = b - 0.25 * (a - c) * off;
      const t = new Date(times[i] + ":00Z").getTime() + off * 3600000;
      const iso = new Date(t).toISOString().slice(0, 16);
      ev.push({ type: isMax ? "high" : "low", time: iso, h });
    }
    // убираем мелкие колебания (меньше 5 см)
    return ev.filter((e, i) => {
      const n = ev[i + 1], p = ev[i - 1];
      const r = Math.max(n ? Math.abs(n.h - e.h) : 0, p ? Math.abs(p.h - e.h) : 0);
      return r >= 0.05;
    });
  }

  // Клёв по часам: оценка дня + зорьки, ночь, ветер, дождь и скачки давления в этот час
  function hourly(day, prev) {
    const base = dayScore(day, prev).score;
    const sr = day.sunrise ? toMin(day.sunrise) : 360, ss = day.sunset ? toMin(day.sunset) : 1200;
    const month = +day.date.slice(5, 7) - 1;
    const hrs = day.hours || [];
    return hrs.map((h, i) => {
      const m = h.hour * 60 + 30;
      let s = base;
      const why = [];
      if (m >= sr - 60 && m <= sr + 120) { s += 18; why.push("утренняя зорька"); }
      else if (m >= ss - 120 && m <= ss + 30) { s += 16; why.push("вечерняя зорька"); }
      else if (ss > sr && (m > ss + 60 || m < sr - 60)) { s -= 16; why.push("ночь"); }
      else if (month >= 5 && month <= 7 && h.hour >= 11 && h.hour <= 15) { s -= 7; why.push("дневная жара"); }
      if (h.w != null) { if (h.w > 8) { s -= 10; why.push("сильный ветер"); } else if (h.w >= 2 && h.w <= 5) s += 3; }
      if (h.pr != null && h.pr > 1.5) { s -= 8; why.push("дождь"); }
      const p3 = hrs[i - 3];
      if (p3 && h.p != null && p3.p != null && Math.abs(h.p - p3.p) > 1.5) { s -= 6; why.push("скачок давления"); }
      return { hour: h.hour, score: clamp(s), why };
    });
  }
  function bestWindow(hours) {
    let best = null;
    for (let i = 0; i < hours.length - 1; i++) {
      const a = (hours[i].score + hours[i + 1].score + (hours[i + 2] ? hours[i + 2].score : hours[i + 1].score)) / 3;
      if (!best || a > best.a) best = { a, from: hours[i].hour, to: Math.min(24, hours[i].hour + 3) };
    }
    return best;
  }

  const api = { hourly, bestWindow, moonInfo, sunTimes, parseWeather, dayScore, fishScore, spotDay, stars, verdict, bestTimes, tideEvents,
    WMO, DIRS, DIRS_SHORT, dirIndex, HPA_TO_MM };
  root.FC = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
