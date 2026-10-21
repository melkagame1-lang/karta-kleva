// Интерфейс приложения «Карта клёва»
(function () {
  const FISH = window.FISH, SPOTS = window.SPOTS, WATER = window.WATER;
  // Личные места пользователя — хранятся только на телефоне
  const MY_KEY = "kk_my_spots";
  let MY = [];
  try { MY = JSON.parse(localStorage.getItem(MY_KEY)) || []; } catch (e) { MY = []; }
  const saveMy = () => { try { localStorage.setItem(MY_KEY, JSON.stringify(MY)); } catch (e) {} };
  const ALL = () => SPOTS.concat(MY);
  const byId = id => ALL().find(s => s.id === id);
  const DAYS = 7;
  const CACHE_KEY = "kk_weather_v1";
  const CACHE_TTL = 3 * 3600 * 1000;
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  const state = {
    day: 0,              // 0 = сегодня
    weather: {},         // id -> массив дней (включая вчера на позиции 0)
    tides: {},           // id -> события
    fetchedAt: null,
    offline: false,
    me: null,
    filterFish: null,
    query: "",
    favs: new Set(store.get("kk_favs") || []),
    current: null,       // открытое место
    custom: null         // своя точка
  };

  // ---------------- Карта ----------------
  const map = L.map("map", { zoomControl: false, attributionControl: true, minZoom: 2, worldCopyJump: false })
    .fitBounds([[42, 20], [70, 165]]);
  map.attributionControl.setPrefix(false);

  // Запасная карта без интернета: контуры России, озёра, реки
  map.createPane("base"); map.getPane("base").style.zIndex = 150;
  const css = getComputedStyle(document.documentElement);
  const tok = n => css.getPropertyValue(n).trim();
  function drawBasemap() {
    const B = window.BASEMAP; if (!B) return;
    const flip = arr => arr.map(r => r.map(p => [p[1], p[0]]));
    L.polygon(flip(B.other), { pane: "base", stroke: true, weight: 0.6, color: tok("--line"), fillColor: tok("--land-other"), fillOpacity: 1, interactive: false }).addTo(map);
    L.polygon(flip(B.ru), { pane: "base", stroke: true, weight: 1, color: tok("--line"), fillColor: tok("--land"), fillOpacity: 1, interactive: false }).addTo(map);
    L.polygon(flip(B.lakes), { pane: "base", stroke: false, fillColor: tok("--water-map"), fillOpacity: 1, interactive: false }).addTo(map);
    L.polyline(flip(B.rivers), { pane: "base", weight: 1, color: tok("--water-map"), interactive: false }).addTo(map);
  }
  map.getContainer().style.background = tok("--sea");
  drawBasemap();

  const layers = {
    "Схема": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd", maxZoom: 19, attribution: "© OpenStreetMap, © CARTO" }),
    "Спутник": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18, attribution: "© Esri" })
  };
  let layerName = store.get("kk_layer") || "Схема";
  layers[layerName].addTo(map);
  $("#btnLayer").textContent = layerName === "Схема" ? "Спутник" : "Схема";
  $("#btnLayer").onclick = () => {
    map.removeLayer(layers[layerName]);
    layerName = layerName === "Схема" ? "Спутник" : "Схема";
    layers[layerName].addTo(map);
    store.set("kk_layer", layerName);
    $("#btnLayer").textContent = layerName === "Схема" ? "Спутник" : "Схема";
  };
  const depthLayer = L.tileLayer.wms("https://wms.gebco.net/mapserv?", { layers: "GEBCO_LATEST", format: "image/png", transparent: true, opacity: .55, attribution: "Глубины: GEBCO" });
  $("#btnDepth").onclick = () => {
    const on = map.hasLayer(depthLayer);
    on ? map.removeLayer(depthLayer) : depthLayer.addTo(map);
    $("#btnDepth").classList.toggle("on", !on);
    if (!on) setStatus("Глубины морей (GEBCO). Глубины озёр и рек — в карточке каждого места.", false), setTimeout(() => setStatus(""), 5000);
  };
  $("#btnZoomIn").onclick = () => map.zoomIn();
  $("#btnZoomOut").onclick = () => map.zoomOut();

  const markers = {};
  function markerIcon(spot) {
    const r = rating(spot.id, state.day);
    const st = r ? r.stars : 0;
    const dim = !matches(spot);
    const fav = state.favs.has(spot.id);
    return L.divIcon({
      className: "",
      html: `<div class="pin r${st}${spot.my ? " my" : ""}${dim ? " dim" : ""}${fav ? " fav" : ""}${state.current && state.current.id === spot.id ? " sel" : ""}"><span>${st || "·"}</span></div>`,
      iconSize: [30, 38], iconAnchor: [15, 36]
    });
  }
  function drawMarkers() {
    Object.keys(markers).forEach(id => { if (!byId(id)) { map.removeLayer(markers[id]); delete markers[id]; } });
    ALL().forEach(s => {
      if (!markers[s.id]) {
        markers[s.id] = L.marker([s.lat, s.lon], { icon: markerIcon(s), keyboard: true, title: s.n })
          .addTo(map).on("click", () => openSpot(s));
      } else markers[s.id].setIcon(markerIcon(s));
      markers[s.id].setZIndexOffset(matches(s) ? 1000 : 0);
    });
  }

  // Своя точка — нажатие на карту
  let customMarker = null;
  map.on("click", e => {
    const { lat, lng } = e.latlng;
    const pop = L.popup({ closeButton: false, className: "kk-pop" })
      .setLatLng(e.latlng)
      .setContent(`<div class="pop"><b>${lat.toFixed(4)}, ${lng.toFixed(4)}</b><button type="button" id="popGo">Прогноз здесь</button><button type="button" id="popSave" class="alt">Сохранить место</button></div>`)
      .openOn(map);
    setTimeout(() => {
      const b = document.getElementById("popGo"); if (b) b.onclick = () => { map.closePopup(pop); openCustom(lat, lng); };
      const c = document.getElementById("popSave"); if (c) c.onclick = () => { map.closePopup(pop); openForm({ lat, lon: lng }); };
    }, 0);
  });

  // ---------------- Данные ----------------
  const WURL = "https://api.open-meteo.com/v1/forecast";
  const HOURLY = "temperature_2m,pressure_msl,wind_speed_10m,wind_gusts_10m,precipitation,cloud_cover";
  const DAILY = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,sunrise,sunset";
  function weatherUrl(lats, lons) {
    return `${WURL}?latitude=${lats.join(",")}&longitude=${lons.join(",")}&hourly=${HOURLY}&daily=${DAILY}&timezone=auto&past_days=1&forecast_days=${DAYS}&wind_speed_unit=ms`;
  }
  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  async function loadAll(force) {
    const cache = store.get(CACHE_KEY);
    if (!force && cache && Date.now() - cache.at < CACHE_TTL) {
      state.weather = cache.data; state.fetchedAt = cache.at;
      for (const s of MY) if (!state.weather[s.id]) await ensureWeather(s);
      return;
    }
    setStatus("Загружаю погоду…");
    try {
      let arr;
      if (window.FISH_DEMO) throw new Error("demo");
      const json = await getJSON(weatherUrl(ALL().map(s => s.lat), ALL().map(s => s.lon)));
      arr = Array.isArray(json) ? json : [json];
      const data = {};
      ALL().forEach((s, i) => { if (arr[i]) data[s.id] = FC.parseWeather(arr[i]); });
      state.weather = data; state.fetchedAt = Date.now(); state.offline = false;
      store.set(CACHE_KEY, { at: state.fetchedAt, data });
      setStatus("");
    } catch (e) {
      if (window.FISH_DEMO) {
        const data = {};
        ALL().forEach(s => { data[s.id] = FC.parseWeather(window.demoWeather(s.lat, s.lon)); });
        state.weather = data; state.fetchedAt = Date.now(); state.offline = true;
        setStatus("Пример: в предпросмотре нет интернета, погода и клёв показаны условно.", true);
      } else if (cache) {
        state.weather = cache.data; state.fetchedAt = cache.at; state.offline = true;
        setStatus("Нет интернета. Показан прогноз от " + new Date(cache.at).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + ".", true);
      } else {
        state.offline = true;
        setStatus("Не удалось загрузить погоду. Проверьте интернет и нажмите «Обновить».", true);
      }
    }
  }

  // Погода для одного места (например, только что добавленного личного)
  async function ensureWeather(s) {
    if (state.weather[s.id]) return true;
    try {
      const json = window.FISH_DEMO ? window.demoWeather(s.lat, s.lon) : await getJSON(weatherUrl([s.lat], [s.lon]));
      state.weather[s.id] = FC.parseWeather(json);
      const c = store.get(CACHE_KEY);
      if (c && !window.FISH_DEMO) { c.data[s.id] = state.weather[s.id]; store.set(CACHE_KEY, c); }
      return true;
    } catch (e) { return false; }
  }

  async function loadTides(key, lat, lon) {
    if (state.tides[key]) return state.tides[key];
    if (window.FISH_DEMO) { state.tides[key] = window.demoTides(lat, lon); return state.tides[key]; }
    const c = store.get("kk_tide_" + key);
    try {
      const j = await getJSON(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=sea_level_height_msl&timezone=auto&past_days=1&forecast_days=${DAYS}`);
      const ev = FC.tideEvents(j.hourly.time, j.hourly.sea_level_height_msl);
      state.tides[key] = ev;
      store.set("kk_tide_" + key, ev);
      return ev;
    } catch (e) {
      if (c) { state.tides[key] = c; return c; }
      return null;
    }
  }

  // Оценка клёва места на день (кэшируется)
  const rcache = {};
  function rating(id, dayIdx, spotOverride) {
    const days = id === "custom" ? state.custom && state.custom.days : state.weather[id];
    if (!days || !days[dayIdx + 1]) return null;
    const k = id + ":" + dayIdx + ":" + (state.fetchedAt || 0);
    if (id !== "custom" && rcache[k]) return rcache[k];
    const spot = spotOverride || byId(id);
    const r = FC.spotDay(spot, days[dayIdx + 1], days[dayIdx], FISH);
    if (id !== "custom") rcache[k] = r;
    return r;
  }

  // ---------------- Фильтр и поиск ----------------
  function matches(s) {
    if (state.filterFish && !s.f.includes(state.filterFish)) return false;
    if (state.area === "sev" && s.area !== "sev") return false;
    if (state.area === "arh" && !(s.area === "sev" || s.area === "arh")) return false;
    if (state.area === "my" && !s.my) return false;
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    return s.n.toLowerCase().includes(q) || s.r.toLowerCase().includes(q) || s.f.some(f => FISH[f].n.toLowerCase().includes(q));
  }

  const fishSel = $("#fishFilter");
  Object.entries(FISH).sort((a, b) => a[1].n.localeCompare(b[1].n, "ru")).forEach(([id, f]) => {
    const o = el("option"); o.value = id; o.textContent = f.n; fishSel.appendChild(o);
  });
  fishSel.onchange = () => { state.filterFish = fishSel.value || null; refresh(); if (state.sheet === "list") renderList(); };
  $("#search").addEventListener("input", e => { state.query = e.target.value; refresh(); showList(); });

  // ---------------- Выбор дня ----------------
  const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  function dayLabel(i) {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { top: i === 0 ? "Сегодня" : i === 1 ? "Завтра" : WD[d.getDay()], bot: d.getDate() + " " + MON[d.getMonth()] };
  }
  function renderDayBar() {
    const bar = $("#days"); bar.innerHTML = "";
    for (let i = 0; i < DAYS; i++) {
      const l = dayLabel(i);
      const b = el("button", "day" + (i === state.day ? " on" : ""), `<b>${l.top}</b><small>${l.bot}</small>`);
      b.type = "button"; b.setAttribute("aria-pressed", i === state.day);
      b.onclick = () => { state.day = i; renderDayBar(); refresh(); rerenderSheet(); };
      bar.appendChild(b);
    }
  }

  // ---------------- Нижняя панель ----------------
  const sheet = $("#sheet"), body = $("#sheetBody");
  function setSheet(mode, expanded) {
    state.sheet = mode;
    sheet.dataset.mode = mode;
    sheet.classList.toggle("open", !!expanded);
  }
  $("#handle").onclick = () => sheet.classList.toggle("open");
  // перетаскивание
  (function () {
    let y0 = null, dy = 0;
    const h = $("#handle");
    h.addEventListener("touchstart", e => { y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
    h.addEventListener("touchmove", e => { if (y0 != null) dy = e.touches[0].clientY - y0; }, { passive: true });
    h.addEventListener("touchend", () => {
      if (Math.abs(dy) > 30) sheet.classList.toggle("open", dy < 0);
      y0 = null;
    });
  })();

  function rerenderSheet() {
    if (state.sheet === "form") return;
    if (state.sheet === "spot" && state.current) renderSpot(state.current);
    else renderList();
  }

  function stars(n) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += `<i class="${i <= n ? "on" : ""}"></i>`;
    return `<span class="bob r${n}" role="img" aria-label="${n} из 5">${s}</span>`;
  }

  function distKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const fmtKm = km => km < 10 ? km.toFixed(1) + " км" : Math.round(km).toLocaleString("ru-RU") + " км";

  function showList() { if (state.sheet !== "list") { state.current = null; drawMarkers(); } setSheet("list", sheet.classList.contains("open")); renderList(); }

  function renderList() {
    let list = ALL().filter(matches).map(s => ({ s, r: rating(s.id, state.day), d: state.me ? distKm(state.me, s) : null }));
    const sortBy = state.sortBy || (state.me ? "near" : "bite");
    list.sort((a, b) => sortBy === "near" && a.d != null ? a.d - b.d : (b.r ? b.r.total : 0) - (a.r ? a.r.total : 0));
    const favs = list.filter(x => state.favs.has(x.s.id));
    const l = dayLabel(state.day);
    body.innerHTML = "";
    const head = el("div", "listhead");
    head.innerHTML = `<h2>${state.query || state.filterFish ? "Найдено: " + list.length : "Где клюёт — " + l.top.toLowerCase()}</h2>
      <div class="seg" role="group" aria-label="Сортировка">
        <button type="button" data-s="bite" class="${sortBy === "bite" ? "on" : ""}">По клёву</button>
        <button type="button" data-s="near" class="${sortBy === "near" ? "on" : ""}">Ближе ко мне</button>
      </div>`;
    const chips = el("div", "chips");
    [["", "Вся Россия"], ["my", "Мои места" + (MY.length ? " · " + MY.length : "")], ["sev", "Северодвинск"], ["arh", "Архангельская обл."]].forEach(([v, t]) => {
      const c = el("button", "chip" + ((state.area || "") === v ? " on" : ""), t); c.type = "button";
      c.onclick = () => { state.area = v || null; refresh(); renderList(); if (v === "my" && MY.length) map.fitBounds(MY.map(s => [s.lat, s.lon]), { padding: [60, 60], maxZoom: 11 }); else if (v === "sev") map.flyTo([64.52, 39.8], 9); else if (v === "arh") map.flyTo([63.4, 41], 6); };
      chips.appendChild(c);
    });
    head.appendChild(chips);
    head.querySelectorAll(".seg button").forEach(b => b.onclick = () => {
      if (b.dataset.s === "near" && !state.me) { locate(true); return; }
      state.sortBy = b.dataset.s; renderList();
    });
    body.appendChild(head);
    if (state.area === "my") body.appendChild(myIntro());
    if (!list.length) {
      if (state.area !== "my") body.appendChild(el("p", "empty", "Ничего не нашлось. Попробуйте другое название, регион или рыбу."));
      return;
    }
    const mk = (arr, title) => {
      if (title) body.appendChild(el("h3", "sub", title));
      const ul = el("ul", "spots");
      arr.forEach(({ s, r, d }) => {
        const li = el("li");
        const b = el("button", "spotrow");
        b.type = "button";
        const fishNames = (r ? r.fish.slice(0, 3).map(f => FISH[f.id].n) : s.f.slice(0, 3).map(f => FISH[f].n)).join(", ");
        b.innerHTML = `<span class="sr-main"><b>${esc(s.n)}</b><small>${esc(s.r)}${d != null ? " · " + fmtKm(d) : ""}</small><small class="fishline">${esc(fishNames)}</small></span>
          <span class="sr-side">${r ? stars(r.stars) + `<small>${r.verdict.replace("Клёв ", "")}</small>` : "<small>нет данных</small>"}</span>`;
        b.onclick = () => openSpot(s);
        li.appendChild(b); ul.appendChild(li);
      });
      body.appendChild(ul);
    };
    if (favs.length && !state.query) mk(favs, "Избранное");
    mk(list, favs.length && !state.query ? "Все места" : null);
    body.appendChild(footNote());
  }

  function myIntro() {
    const d = el("div", "card myintro");
    d.innerHTML = `<h3>${MY.length ? "Добавить ещё место" : "Здесь будут ваши места"}</h3>
      <p>Нажмите на карте точку, где ловите, и выберите «Сохранить место». Или сохраните место, где вы стоите сейчас.</p>
      <p class="hint">Места хранятся только на этом телефоне.</p>
      <div class="acts"><button type="button" class="primary" id="addHere">Сохранить, где я сейчас</button></div>`;
    setTimeout(() => { const b = document.getElementById("addHere"); if (b) b.onclick = () => {
      b.textContent = "Определяю…";
      locate(false, Object.assign(() => { if (state.me) openForm({ lat: state.me.lat, lon: state.me.lon }); else b.textContent = "Сохранить, где я сейчас"; }, { quiet: true }));
    }; }, 0);
    return d;
  }

  // ---------- Форма личного места ----------
  function openForm(draft) {
    const isEdit = !!draft.id;
    const near = SPOTS.map(s => ({ s, d: distKm(draft, s) })).sort((a, b) => a.d - b.d)[0];
    const sel = new Set(draft.f || (near && near.d < 150 ? near.s.f : ["shchuka", "okun", "plotva"]));
    setSheet("form", true);
    state.current = null; drawMarkers();
    body.innerHTML = "";
    const f = el("form", "myform");
    f.innerHTML = `<button type="button" class="back" id="fBack">‹ Отмена</button>
      <h2>${isEdit ? "Изменить место" : "Новое место"}</h2>
      <p class="meta"><span>${draft.lat.toFixed(4)}, ${draft.lon.toFixed(4)}</span>${near ? `<span>${fmtKm(near.d)} до «${esc(near.s.n)}»</span>` : ""}</p>
      <label class="fld"><span>Название</span><input id="fName" required maxlength="60" placeholder="Например: Коса у маяка" value="${esc(draft.n || "")}"></label>
      <label class="fld"><span>Водоём</span><select id="fWater">${Object.entries(WATER).map(([k, v]) => `<option value="${k}"${(draft.w || "lake") === k ? " selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="chk"><input type="checkbox" id="fTide"${draft.tide ? " checked" : ""}> Здесь есть приливы (море, устье)</label>
      <div class="fld"><span>Какая рыба тут ловится</span><div class="fishpick" id="fFish">${Object.entries(FISH).sort((x, y) => x[1].n.localeCompare(y[1].n, "ru")).map(([id, fi]) =>
        `<button type="button" class="chip${sel.has(id) ? " on" : ""}" data-id="${id}" aria-pressed="${sel.has(id)}">${fi.n}</button>`).join("")}</div></div>
      <label class="fld"><span>Заметки</span><textarea id="fNote" rows="4" placeholder="Глубина, на что клевало, как подъехать, где ставить машину…">${esc(draft.note || "")}</textarea></label>
      <p class="ferr" id="fErr" hidden></p>
      <div class="acts"><button type="submit" class="primary">${isEdit ? "Сохранить изменения" : "Сохранить место"}</button></div>`;
    body.appendChild(f);
    body.scrollTop = 0;
    f.querySelectorAll("#fFish .chip").forEach(c => c.onclick = () => {
      const on = !sel.has(c.dataset.id); on ? sel.add(c.dataset.id) : sel.delete(c.dataset.id);
      c.classList.toggle("on", on); c.setAttribute("aria-pressed", on);
    });
    $("#fBack").onclick = () => { if (isEdit) openSpot(byId(draft.id)); else { setSheet("list", false); renderList(); } };
    f.onsubmit = async e => {
      e.preventDefault();
      const name = $("#fName").value.trim();
      const err = $("#fErr");
      if (!name) { err.hidden = false; err.textContent = "Введите название места."; $("#fName").focus(); return; }
      if (!sel.size) { err.hidden = false; err.textContent = "Отметьте хотя бы одну рыбу — от этого зависит прогноз клёва."; return; }
      const water = $("#fWater").value;
      const spot = Object.assign(isEdit ? byId(draft.id) : { id: "my-" + Date.now().toString(36), lat: draft.lat, lon: draft.lon, my: true, area: "my", created: Date.now() }, {
        n: name, w: water, tide: $("#fTide").checked, f: [...sel], note: $("#fNote").value.trim(),
        r: "Моё место", d: ""
      });
      if (!isEdit) MY.push(spot);
      saveMy();
      Object.keys(rcache).forEach(k => { if (k.startsWith(spot.id + ":")) delete rcache[k]; });
      if (customMarker) { map.removeLayer(customMarker); customMarker = null; }
      await ensureWeather(spot);
      drawMarkers();
      openSpot(spot);
      setStatus(isEdit ? "Изменения сохранены." : "Место сохранено. Оно в списке «Мои места».");
      setTimeout(() => setStatus(""), 3500);
    };
  }

  function deleteMy(s) {
    MY = MY.filter(x => x.id !== s.id); saveMy();
    delete state.weather[s.id];
    state.current = null; drawMarkers();
    state.area = MY.length ? "my" : null;
    setSheet("list", true); renderList();
    setStatus("Место удалено."); setTimeout(() => setStatus(""), 3000);
  }

  function footNote() {
    const p = el("p", "foot");
    p.innerHTML = `Прогноз клёва — оценка по погоде, давлению, луне и сезону. Это подсказка, а не гарантия.
      С апреля по июнь во многих регионах действует <b>нерестовый запрет</b> — проверьте правила рыболовства своего региона.`
      + (state.fetchedAt ? `<br>Погода обновлена: ${new Date(state.fetchedAt).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}. Источник: Open-Meteo.` : "");
    return p;
  }

  async function openSpot(s) {
    state.current = s;
    if (s.my && !state.weather[s.id]) ensureWeather(s).then(() => { if (state.current === s) renderSpot(s); drawMarkers(); });
    drawMarkers();
    setSheet("spot", true);
    renderSpot(s);
    map.panTo([s.lat, s.lon], { animate: true });
    if (s.tide && !state.tides[s.id]) {
      await loadTides(s.id, s.lat, s.lon);
      if (state.current === s) renderSpot(s);
    }
  }

  async function openCustom(lat, lon) {
    const near = SPOTS.map(s => ({ s, d: distKm({ lat, lon }, s) })).sort((a, b) => a.d - b.d)[0];
    const fish = near.d < 300 ? near.s.f : ["shchuka", "okun", "plotva", "leshch", "karas"];
    const spot = { id: "custom", n: "Моя точка", r: `${lat.toFixed(3)}, ${lon.toFixed(3)}`, lat, lon, w: null, f: fish,
      d: near.d < 300 ? `Своя точка. Список рыбы взят от ближайшего места «${near.s.n}» (${fmtKm(near.d)}).` : "Своя точка. Рядом нет мест из базы — показаны самые распространённые рыбы.",
      custom: true };
    if (customMarker) map.removeLayer(customMarker);
    customMarker = L.marker([lat, lon], { icon: L.divIcon({ className: "", html: '<div class="pin mine"><span>+</span></div>', iconSize: [30, 38], iconAnchor: [15, 36] }) }).addTo(map);
    state.custom = { spot, days: null };
    state.current = spot;
    setSheet("spot", true);
    body.innerHTML = `<p class="empty">Загружаю прогноз для точки…</p>`;
    try {
      const json = window.FISH_DEMO ? window.demoWeather(lat, lon) : await getJSON(weatherUrl([lat], [lon]));
      state.custom.days = FC.parseWeather(json);
    } catch (e) {
      body.innerHTML = `<p class="empty">Не удалось загрузить погоду для этой точки. Проверьте интернет.</p>`;
      return;
    }
    const ev = await loadTides("c" + lat.toFixed(2) + lon.toFixed(2), lat, lon);
    if (ev && ev.length) {
      const hs = ev.map(e => e.h); const range = Math.max(...hs) - Math.min(...hs);
      if (range > 0.3) { spot.tide = true; state.tides.custom = ev; }
    }
    if (state.current === spot) renderSpot(spot);
  }

  // ---------- Карточка места ----------
  function renderSpot(s) {
    const days = s.custom ? state.custom.days : state.weather[s.id];
    body.innerHTML = "";
    const top = el("div", "spothead");
    const fav = state.favs.has(s.id);
    top.innerHTML = `
      <button type="button" class="back" id="back" aria-label="Назад к списку">‹ Все места</button>
      <h2>${esc(s.n)}</h2>
      <p class="meta">${s.my ? '<span class="tag mine">Моё место</span>' : ""}${s.w ? `<span class="tag">${WATER[s.w]}</span>` : ""}${s.tide ? '<span class="tag tide">Приливы</span>' : ""}<span>${esc(s.r)}</span>${state.me ? `<span>${fmtKm(distKm(state.me, s))} от вас</span>` : ""}</p>
      ${s.d ? `<p class="desc">${esc(s.d)}</p>` : ""}
      ${s.my && s.note ? `<div class="note"><small>Мои заметки</small><p>${esc(s.note).replace(/\n/g, "<br>")}</p></div>` : ""}
      <div class="acts">
        ${s.custom ? `<button type="button" id="saveCustom" class="primary">Сохранить в мои места</button>` : s.my ? `<button type="button" id="editMy" class="ghost">Изменить</button><button type="button" id="delMy" class="ghost danger">Удалить</button>` : `<button type="button" id="favBtn" class="ghost">${fav ? "★ В избранном" : "☆ В избранное"}</button>`}
        <button type="button" class="ghost" id="toRoute">Маршрут ↓</button>
      </div>`;
    body.appendChild(top);
    $("#back").onclick = () => { state.current = null; if (customMarker && s.custom) { map.removeLayer(customMarker); customMarker = null; } drawMarkers(); setSheet("list", false); renderList(); };
    const sc = $("#saveCustom"); if (sc) sc.onclick = () => openForm({ lat: s.lat, lon: s.lon, f: s.f, tide: s.tide });
    const em = $("#editMy"); if (em) em.onclick = () => openForm(s);
    const dm = $("#delMy"); if (dm) dm.onclick = () => {
      if (dm.dataset.armed) { deleteMy(s); return; }
      dm.dataset.armed = "1"; dm.textContent = "Точно удалить?"; dm.classList.add("armed");
      setTimeout(() => { if (dm.isConnected) { delete dm.dataset.armed; dm.textContent = "Удалить"; dm.classList.remove("armed"); } }, 4000);
    };
    $("#toRoute").onclick = () => { const r = body.querySelector(".route"); if (r) r.scrollIntoView({ behavior: "smooth", block: "start" }); };
    const fb = $("#favBtn");
    if (fb) fb.onclick = () => {
      fav ? state.favs.delete(s.id) : state.favs.add(s.id);
      store.set("kk_favs", [...state.favs]); drawMarkers(); renderSpot(s);
    };

    if (!days) { body.appendChild(el("p", "empty", "Нет данных о погоде. Проверьте интернет и нажмите «Обновить».")); return; }

    // Полоска дней
    const strip = el("div", "strip");
    for (let i = 0; i < DAYS; i++) {
      const r = rating(s.id, i, s);
      const d = days[i + 1]; if (!d) continue;
      const l = dayLabel(i);
      const b = el("button", "sday" + (i === state.day ? " on" : ""));
      b.type = "button";
      b.innerHTML = `<b>${l.top}</b><small>${l.bot}</small>${r ? stars(r.stars) : ""}<span class="t">${Math.round(d.tMax)}°</span>`;
      b.onclick = () => { state.day = i; renderDayBar(); refresh(); renderSpot(s); };
      strip.appendChild(b);
    }
    body.appendChild(strip);

    const r = rating(s.id, state.day, s);
    const day = days[state.day + 1], prev = days[state.day];
    if (!r || !day) return;

    // Вердикт
    const v = el("section", "card verdict r" + r.stars);
    const reasons = r.base.why.slice().sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
    v.innerHTML = `<div class="vtop"><div><h3>${r.verdict}</h3><p>${dayLabel(state.day).top}, ${dayLabel(state.day).bot}</p></div>
      <div class="score"><span>${r.total}</span><small>из 100</small></div></div>
      ${stars(r.stars)}
      <h4>Почему так</h4>
      <ul class="why">${reasons.map(w => `<li class="${w.good === true ? "g" : w.good === false ? "b" : "n"}">${esc(w.text)}</li>`).join("")}</ul>`;
    body.appendChild(v);

    // Запреты и правила
    body.appendChild(rulesCard(s));

    // Лучшее время
    const bt = FC.bestTimes(day);
    if (bt.length) {
      const c = el("section", "card");
      c.innerHTML = `<h3>Когда ловить</h3><div class="times">${bt.map(t => `<div><small>${t.label}</small><b>${t.from}–${t.to}</b></div>`).join("")}</div>
        <p class="hint">Восход ${day.sunrise.slice(11, 16)}, закат ${day.sunset.slice(11, 16)}. На зорьке рыба выходит кормиться ближе к берегу.</p>`;
      body.appendChild(c);
    }

    // Погода и давление
    const dp = prev && prev.pMean != null ? day.pMean - prev.pMean : 0;
    const arrow = Math.abs(dp) < 1 ? "→" : dp > 0 ? "↑" : "↓";
    const dpText = Math.abs(dp) < 1 ? "не меняется" : (dp > 0 ? "растёт на " : "падает на ") + Math.abs(dp).toFixed(0) + " мм";
    const di = FC.dirIndex(day.windDir);
    const w = el("section", "card");
    w.innerHTML = `<h3>Погода</h3>
      <p class="wx">${FC.WMO[day.code] || "—"}</p>
      <dl class="grid">
        <div><dt>Температура</dt><dd>${fmtT(day.tMin)}…${fmtT(day.tMax)}</dd></div>
        <div><dt>Ветер</dt><dd>${Math.round(day.wind)} <small>м/с</small></dd><small class="note">${windWords(day.wind)}, ${FC.DIRS[di]}</small></div>
        <div><dt>Давление</dt><dd>${Math.round(day.pMean)} <small>мм рт. ст.</small> ${arrow}</dd><small class="note">${dpText} за сутки${pressWords(day.pMean)}</small></div>
        <div><dt>Осадки</dt><dd>${(day.precip || 0).toFixed(1)} <small>мм</small></dd><small class="note">${rainWords(day.precip || 0)}</small></div>
      </dl>
      <h4>Давление на неделю</h4>
      ${pressureChart(days, state.day)}`;
    body.appendChild(w);

    // Луна
    const m = r.base.moon;
    const mc = el("section", "card moon");
    mc.innerHTML = `${moonSvg(m.age)}<div><h3>${m.name}</h3><p class="meta2">Освещено ${Math.round(m.illum * 100)}% · ${m.days}-й день луны</p><p>${esc(m.text)}</p></div>`;
    body.appendChild(mc);

    // Приливы
    const tc = el("section", "card");
    const tideKey = s.custom ? "custom" : s.id;
    if (s.tide) {
      const ev = (state.tides[tideKey] || []).filter(e => e.time.slice(0, 10) === day.date);
      tc.innerHTML = `<h3>Приливы и отливы</h3>` + (state.tides[tideKey] ?
        (ev.length ? `<ul class="tides">${ev.map(e => `<li class="${e.type}"><b>${e.time.slice(11, 16)}</b><span>${e.type === "high" ? "Полная вода (прилив)" : "Малая вода (отлив)"}</span><small>${e.h >= 0 ? "+" : ""}${e.h.toFixed(2)} м</small></li>`).join("")}</ul>` : `<p>На этот день данных нет.</p>`)
        + `<p class="hint">Лучше всего клюёт, когда вода движется: за 1–2 часа до полной воды и в первые часы отлива. В «стоячую» воду клёв затихает. На отливе не уходите далеко по осушке — вода возвращается быстро.</p>`
        : `<p class="empty">Загружаю приливы…</p>`);
    } else {
      tc.innerHTML = `<h3>Приливы и отливы</h3><p>${s.w === "sea" ? "Здесь приливы очень слабые (несколько сантиметров) и на клёв не влияют." : "Здесь приливов нет — это пресный водоём. На клёв влияют погода, давление и время суток."}</p>`;
    }
    body.appendChild(tc);

    // Глубины
    const dep = window.DEPTHS && DEPTHS[s.id];
    const dc = el("section", "card");
    dc.innerHTML = `<h3>Глубины</h3>` + (dep ? `<div class="depnums"><div><small>Средняя</small><b>≈ ${String(dep.avg).replace(".", ",")} м</b></div><div><small>Максимальная</small><b>≈ ${String(dep.max).replace(".", ",")} м</b></div></div><p>${esc(dep.t)}</p>` : `<p>Для своей точки глубины неизвестны. Промерьте дно — как это сделать, смотрите во вкладке «Советы».</p>`)
      + (window.TIPS ? TIPS.profileSvg(s.w === "river" ? "river" : "lake") : "")
      + `<p class="hint">Схема показывает, где обычно стоит рыба на таком водоёме. Это не точная карта дна.</p>`;
    body.appendChild(dc);

    // Маршрут
    body.appendChild(routeCard(s));

    // Рыба
    const fh = el("section", "fishes");
    fh.innerHTML = `<h3 class="sub">Какая рыба здесь водится</h3><p class="hint">Отсортировано по тому, как она должна клевать в этот день.</p>`;
    r.fish.forEach(fr => {
      const f = FISH[fr.id];
      const st = FC.stars(fr.score);
      const seasonTxt = ["не сезон", "слабый сезон", "сезон", "лучший сезон"][fr.season];
      const card = el("details", "fish r" + st);
      const look = window.FISHART && FISHART.LOOK[fr.id];
      card.innerHTML = `<summary><span class="fthumb" data-fish="${fr.id}">${window.FISHART ? FISHART.draw(fr.id, "fishart sm") : ""}</span><span class="fname"><b>${f.n}</b><small class="season s${fr.season}">${seasonTxt}${f.pred ? " · хищник" : ""}</small></span>${stars(st)}</summary>
        <div class="fbody">
          ${look ? `<h4>Как выглядит</h4><p>${esc(look[0])}</p><p class="hint">Размер: ${esc(look[1])}</p>` : ""}
          <button type="button" class="ghost more" data-fish="${fr.id}">Фото и всё о рыбе ›</button>
          <h4>На что ловить</h4><ul>${f.bait.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
          <h4>Как ловить</h4><p>${esc(f.method)}</p>
          <h4>Совет</h4><p>${esc(f.tip)}</p>
          <h4>Когда клюёт лучше всего</h4>${seasonBar(f.m)}
        </div>`;
      fh.appendChild(card);
    });
    body.appendChild(fh);
    fh.querySelectorAll(".more").forEach(b => b.onclick = () => window.UI2 && UI2.openFish(b.dataset.fish));
    fh.querySelectorAll(".fthumb").forEach(t => fillThumb(t, t.dataset.fish));
    const firstFish = fh.querySelector("details"); if (firstFish) firstFish.open = true;
    body.appendChild(footNote());
  }

  const fmtT = t => (t > 0 ? "+" : "") + Math.round(t) + "°";
  const windWords = w => w < 1 ? "штиль" : w < 4 ? "слабый" : w < 7 ? "умеренный" : w < 11 ? "сильный" : "очень сильный";
  const pressWords = p => p > 770 ? ", высокое" : p < 745 ? ", низкое" : ", в норме";
  const rainWords = p => p < 0.2 ? "без осадков" : p < 3 ? "небольшие" : p < 10 ? "заметные" : "сильные";

  function seasonBar(m) {
    const L = ["Я", "Ф", "М", "А", "М", "И", "И", "А", "С", "О", "Н", "Д"];
    const now = new Date().getMonth();
    return `<div class="months" role="img" aria-label="Активность по месяцам">${m.map((v, i) => `<span class="mo${i === now ? " now" : ""}"><i style="height:${6 + v * 8}px" class="a${v}"></i><small>${L[i]}</small></span>`).join("")}</div>`;
  }

  function pressureChart(days, sel) {
    const pts = [];
    days.slice(1, DAYS + 1).forEach((d, di) => d.hours.forEach(h => { if (h.p != null) pts.push({ x: di * 24 + h.hour, p: h.p, di }); }));
    if (pts.length < 2) return "";
    const W = 320, H = 96, pad = { l: 30, r: 6, t: 8, b: 18 };
    let min = Math.min(...pts.map(p => p.p)), max = Math.max(...pts.map(p => p.p));
    const mid = (min + max) / 2; if (max - min < 10) { min = mid - 5; max = mid + 5; }
    min = Math.floor(min); max = Math.ceil(max);
    const X = x => pad.l + x / (DAYS * 24) * (W - pad.l - pad.r);
    const Y = p => pad.t + (max - p) / (max - min) * (H - pad.t - pad.b);
    const line = pts.map((p, i) => (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p.p).toFixed(1)).join(" ");
    const area = line + ` L${X(pts[pts.length - 1].x).toFixed(1)} ${H - pad.b} L${X(pts[0].x).toFixed(1)} ${H - pad.b} Z`;
    let g = "";
    for (let i = 0; i <= DAYS; i++) g += `<line x1="${X(i * 24)}" x2="${X(i * 24)}" y1="${pad.t}" y2="${H - pad.b}" class="gl"/>`;
    for (let i = 0; i < DAYS; i++) g += `<text x="${X(i * 24 + 12)}" y="${H - 5}" class="lbl" text-anchor="middle">${dayLabel(i).top.slice(0, 3)}</text>`;
    g += `<text x="${pad.l - 4}" y="${Y(max) + 4}" class="lbl" text-anchor="end">${max}</text><text x="${pad.l - 4}" y="${Y(min)}" class="lbl" text-anchor="end">${min}</text>`;
    const selRect = `<rect x="${X(sel * 24)}" y="${pad.t}" width="${X(24) - X(0)}" height="${H - pad.t - pad.b}" class="selr"/>`;
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="График давления, мм рт. ст.">${selRect}${g}<path d="${area}" class="ar"/><path d="${line}" class="ln"/></svg></div>`;
  }

  function moonSvg(age) {
    // Рисуем освещённую часть: терминатор — эллипс
    const r = 26, cx = 30, cy = 30;
    const k = Math.cos(2 * Math.PI * age); // 1 — новолуние, -1 — полнолуние
    const waxing = age < 0.5;
    const rx = Math.abs(k) * r;
    // освещённая половина справа при растущей луне
    const sweepOuter = waxing ? 1 : 0;
    const sweepInner = (k > 0) === waxing ? 0 : 1;
    const d = `M${cx} ${cy - r} A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r} A${rx} ${r} 0 0 ${sweepInner} ${cx} ${cy - r} Z`;
    return `<svg class="moonsvg" viewBox="0 0 60 60" width="60" height="60" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${r}" class="mdark"/><path d="${d}" class="mlit"/></svg>`;
  }

  // ---------------- Запреты в карточке места ----------------
  function rulesCard(s) {
    const c = el("section", "card rules");
    if (!window.RULES) return c;
    let id = s.id, from = "";
    if (s.my || s.custom) {
      const near = Object.keys(RULES.SPOT_RULES).map(k => SPOTS.find(x => x.id === k)).filter(Boolean)
        .map(x => ({ x, d: distKm(s, x) })).sort((a, b) => a.d - b.d)[0];
      if (near && near.d < 40) { id = near.x.id; from = `По правилам для района «${esc(near.x.n)}» (${fmtKm(near.d)}).`; }
      else {
        const nb = SPOTS.map(x => ({ x, d: distKm(s, x) })).sort((a, b) => a.d - b.d)[0];
        id = nb ? nb.x.id : null;
      }
    }
    const list = id ? RULES.forSpot(id) : null;
    const order = { on: 0, maybe: 1, soon: 2, off: 3 };
    if (list) {
      const dated = list.filter(r => r.dated).sort((a, b) => order[a.st.k] - order[b.st.k]);
      const perm = list.filter(r => !r.dated);
      const active = dated.filter(r => r.st.k === "on" || r.st.k === "maybe").length;
      const sizes = (s.f || []).filter(f => RULES.SIZES[f]).map(f => `${FISH[f].n} — от ${RULES.SIZES[f]} см`);
      c.innerHTML = `<h3>Запреты и правила</h3>${from ? `<p class="hint">${from}</p>` : ""}
        <p class="rsumm ${active ? "on" : "off"}">${active ? `Сейчас действует запретов: ${active}` : "Сезонных запретов сейчас нет"}</p>
        <ul class="rlist">${dated.map(r => `<li class="st-${r.st.k}"><span class="badge">${r.st.text}</span><b>${esc(r.what)}</b><small>${esc(r.dates)} · ${esc(r.where)}</small></li>`).join("")}
        ${perm.map(r => `<li class="st-perm"><span class="badge">Действует всегда</span><b>${esc(r.what)}</b><small>${esc(r.where)}</small></li>`).join("")}</ul>
        ${sizes.length ? `<h4>Меньше этого размера — отпустить</h4><p>${sizes.join(", ")}.</p>` : ""}
        <p class="hint">По Правилам рыболовства Северного бассейна (приказ № 292). Правила меняются — перед поездкой проверяйте новости во вкладке «Запреты».</p>
        <button type="button" class="ghost" id="toRules">Все запреты и новости рыбоохраны ›</button>`;
    } else {
      const b = RULES.BASIN[RULES.SPOT_BASIN[id] || ""];
      c.innerHTML = `<h3>Запреты и правила</h3>
        <p>${b ? `Это место относится к правилам рыболовства: <b>${b.n}</b>.` : ""} Весной (обычно апрель–июнь) действует нерестовый запрет: нельзя ловить с лодки, ограничено число крючков. Точные даты для этого места пока не внесены в приложение.</p>
        <div class="acts"><a class="ghost" href="${b ? b.url : "https://fish.gov.ru/"}" target="_blank" rel="noopener">Официальные правила</a><button type="button" class="ghost" id="toRules">Новости рыбоохраны ›</button></div>`;
    }
    setTimeout(() => { const t = c.querySelector("#toRules"); if (t) t.onclick = () => window.UI2 && UI2.show("rules"); }, 0);
    return c;
  }

  // ---------------- Фото в миниатюрах ----------------
  async function fillThumb(node, id) {
    if (!window.PHOTOS) return;
    const list = await PHOTOS.get(id);
    if (list.length && node.isConnected) {
      const img = new Image(); img.alt = FISH[id].n; img.loading = "lazy"; img.src = list[0].src;
      img.onload = () => { node.innerHTML = ""; node.appendChild(img); node.classList.add("photo"); };
    }
  }

  // ---------------- Маршрут ----------------
  const FROM = [["me", "Где я сейчас"], ["64.563,39.830", "Северодвинск"], ["64.539,40.516", "Архангельск"], ["64.417,40.821", "Новодвинск"],
    ["61.253,46.633", "Котлас"], ["59.220,39.890", "Вологда"], ["68.970,33.070", "Мурманск"], ["55.756,37.617", "Москва"], ["59.939,30.316", "Санкт-Петербург"],
    ["56.838,60.605", "Екатеринбург"], ["55.030,82.920", "Новосибирск"]];
  let routeLayer = null;
  function routeCard(s) {
    const c = el("section", "card route");
    const saved = store.get("kk_from") || (s.area ? "64.563,39.830" : "me");
    c.innerHTML = `<h3>Маршрут</h3>${s.how ? `<p>${esc(s.how)}</p>` : ""}
      <div class="rrow"><label for="fromSel">Откуда</label><select id="fromSel">${FROM.map(([v, t]) => `<option value="${v}"${v === saved ? " selected" : ""}>${t}</option>`).join("")}</select></div>
      <button type="button" class="primary" id="routeBtn">Проложить маршрут</button>
      <div id="routeOut" class="rout" hidden></div>`;
    setTimeout(() => {
      const b = document.getElementById("routeBtn"); if (!b) return;
      document.getElementById("fromSel").onchange = e => store.set("kk_from", e.target.value);
      b.onclick = () => buildRoute(s, document.getElementById("fromSel").value);
    }, 0);
    return c;
  }
  async function buildRoute(s, from) {
    const out = document.getElementById("routeOut");
    let a;
    if (from === "me") {
      if (!state.me) { out.hidden = false; out.textContent = "Определяю, где вы…"; await new Promise(res => { res.quiet = true; locate(false, res); }); }
      if (!state.me) { out.hidden = false; out.textContent = "Не удалось определить местоположение. Выберите город в списке «Откуда»."; return; }
      a = state.me;
    } else { const [la, lo] = from.split(",").map(Number); a = { lat: la, lon: lo }; }
    out.hidden = false; out.textContent = "Строю маршрут…";
    if (routeLayer) map.removeLayer(routeLayer);
    let km, mins, road = false;
    try {
      if (window.FISH_DEMO) throw new Error("demo");
      const j = await getJSON(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${s.lon},${s.lat}?overview=full&geometries=geojson`);
      const r = j.routes && j.routes[0]; if (!r) throw new Error("no route");
      routeLayer = L.geoJSON(r.geometry, { style: { color: tok("--accent"), weight: 5, opacity: .9 } }).addTo(map);
      km = r.distance / 1000; mins = r.duration / 60; road = true;
    } catch (e) {
      routeLayer = L.polyline([[a.lat, a.lon], [s.lat, s.lon]], { color: tok("--accent"), weight: 3, dashArray: "8 8" }).addTo(map);
      km = distKm(a, s);
    }
    map.fitBounds(routeLayer.getBounds(), { padding: [40, 40], paddingBottomRight: [0, 220] });
    sheet.classList.remove("open");

    const h = mins ? `${Math.floor(mins / 60)} ч ${Math.round(mins % 60)} мин` : "";
    const ya = `https://yandex.ru/maps/?rtext=${a.lat},${a.lon}~${s.lat},${s.lon}&rtt=auto`;
    const nav = `yandexnavi://build_route_on_map?lat_from=${a.lat}&lon_from=${a.lon}&lat_to=${s.lat}&lon_to=${s.lon}`;
    const gg = `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lon}&destination=${s.lat},${s.lon}`;
    out.innerHTML = (road ? `<p class="rsum"><b>${fmtKm(km)}</b> по дорогам · около <b>${h}</b> на машине</p><p class="hint">Последний участок до воды может быть без дороги.</p>`
      : `<p class="rsum"><b>${fmtKm(km)}</b> по прямой</p><p class="hint">Дорожный маршрут сейчас недоступен (нет интернета или сюда не ведут дороги). Откройте навигатор:</p>`)
      + `<div class="acts"><a class="ghost" href="${ya}" target="_blank" rel="noopener">Яндекс Карты</a><a class="ghost" href="${nav}">Яндекс Навигатор</a><a class="ghost" href="${gg}" target="_blank" rel="noopener">Google Карты</a></div>`;
    body.scrollTop += out.getBoundingClientRect().top - body.getBoundingClientRect().top - 8;
  }

  // ---------------- Геолокация ----------------
  let meMarker = null;
  function locate(sortAfter, done) {
    done = done || (() => {});
    if (!navigator.geolocation) { setStatus("Телефон не сообщает местоположение.", true); done(); return; }
    setStatus("Определяю, где вы…");
    navigator.geolocation.getCurrentPosition(p => {
      state.me = { lat: p.coords.latitude, lon: p.coords.longitude };
      if (meMarker) map.removeLayer(meMarker);
      meMarker = L.circleMarker([state.me.lat, state.me.lon], { radius: 8, weight: 3, color: "#fff", fillColor: tok("--accent"), fillOpacity: 1 }).addTo(map);
      map.setView([state.me.lat, state.me.lon], 7);
      setStatus("");
      if (sortAfter) state.sortBy = "near";
      if (!done.quiet) rerenderSheet();
      done();
    }, () => { setStatus("Не удалось определить местоположение. Разрешите доступ к геолокации в настройках.", true); done(); }, { enableHighAccuracy: false, timeout: 15000 });
  }
  $("#btnMe").onclick = () => locate(false);

  // ---------------- Прочее ----------------
  function setStatus(t, warn) {
    const s = $("#status"); s.textContent = t; s.hidden = !t; s.classList.toggle("warn", !!warn);
  }
  function refresh() { drawMarkers(); }
  $("#btnRefresh").onclick = async () => { Object.keys(rcache).forEach(k => delete rcache[k]); state.tides = {}; await loadAll(true); refresh(); rerenderSheet(); };
  $("#btnList").onclick = () => { showList(); sheet.classList.add("open"); };

  window.APP = { openSpot, map, state, showMapTab: () => setTimeout(() => map.invalidateSize(), 50) };

  // Старт
  renderDayBar();
  setSheet("list", false);
  drawMarkers();
  renderList();
  loadAll(false).then(() => { refresh(); rerenderSheet(); });
})();
