// Дневник уловов, резервная копия и уведомления.
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const FISH = window.FISH;
  const KEY = "kk_diary";
  const cap = () => (window.Capacitor && window.Capacitor.Plugins) || {};
  const ls = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  // ---------- Фото в IndexedDB ----------
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error("no idb"));
      const r = indexedDB.open("kk", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("photos");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function putPhoto(id, blob) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction("photos", "readwrite"); t.objectStore("photos").put(blob, id); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
  async function getPhoto(id) { try { const d = await db(); return await new Promise(res => { const q = d.transaction("photos").objectStore("photos").get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } }
  async function delPhoto(id) { try { const d = await db(); d.transaction("photos", "readwrite").objectStore("photos").delete(id); } catch (e) {} }
  function shrink(file, max = 1280) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(img.src); res(b || file); }, "image/jpeg", .82);
      };
      img.onerror = () => res(file);
      img.src = URL.createObjectURL(file);
    });
  }

  const pl = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
  // ---------- Записи ----------
  const list = () => ls.get(KEY, []);
  const save = arr => ls.set(KEY, arr);
  function add(e) { const a = list(); a.unshift(e); save(a); refreshMap(); }
  function update(e) { save(list().map(x => x.id === e.id ? e : x)); refreshMap(); }
  function remove(id) { save(list().filter(x => x.id !== id)); delPhoto(id); refreshMap(); }
  function refreshMap() { if (window.APP && APP.drawMyCatches) APP.drawMyCatches(); }

  // Погода на момент улова — из уже загруженного прогноза места
  function snapshot(spotId, dateISO) {
    const out = {};
    const days = window.APP && APP.weatherFor ? APP.weatherFor(spotId) : null;
    const date = dateISO.slice(0, 10);
    const moon = FC.moonInfo(new Date(dateISO));
    out.moon = moon.name;
    if (days) {
      const i = days.findIndex(d => d.date === date);
      if (i > 0) {
        const d = days[i], p = days[i - 1];
        out.p = Math.round(d.pMean); out.dp = Math.round((d.pMean - p.pMean) * 10) / 10;
        out.t = Math.round(d.tMax); out.wind = Math.round(d.wind); out.code = d.code;
      }
    }
    return out;
  }

  // ---------- Экран «Дневник» ----------
  const box = () => $("#diaryScreen .scr");
  function render() {
    const a = list();
    const b = box();
    const total = a.reduce((s, e) => s + (+e.count || 1), 0);
    const kg = a.reduce((s, e) => s + (+e.weight || 0), 0);
    b.innerHTML = `<header class="scrhead"><h1>Дневник</h1><p>Записывайте уловы — приложение запомнит место, погоду, давление и луну. Со временем станет видно, когда у вас клюёт лучше.</p>
      <div class="acts"><button type="button" class="primary" id="dAdd">Записать улов</button></div></header>
      ${a.length ? `<div class="dstats"><div><b>${a.length}</b><small>${pl(a.length, "запись", "записи", "записей")}</small></div><div><b>${total}</b><small>${pl(total, "рыба", "рыбы", "рыб")}</small></div><div><b>${kg ? kg.toFixed(1).replace(".", ",") : "—"}</b><small>кг всего</small></div></div>${insights(a)}` : `<div class="card"><h3>Пока записей нет</h3><p>Нажмите «Записать улов» после рыбалки. Можно добавить фото, наживку и вес.</p></div>`}
      ${a.length ? `<section><h2>Записи</h2><ul class="dlist">${a.map(item).join("")}</ul></section>` : ""}
      <section class="card"><h3>Уведомления</h3>${notifyBlock()}</section>
      <section class="card"><h3>Резервная копия</h3><p>Сохраните свои места, избранное и дневник в файл — чтобы перенести на другой телефон или поделиться с другом.</p>
        <label class="chk"><input type="checkbox" id="bkPhotos"> С фотографиями (файл будет больше)</label>
        <div class="acts"><button type="button" class="ghost" id="bkExport">Сохранить в файл</button><label class="ghost filebtn">Загрузить из файла<input type="file" id="bkImport" accept=".json,application/json" hidden></label></div>
        <p class="hint" id="bkState"></p></section>`;
    $("#dAdd").onclick = () => openForm({});
    b.querySelectorAll(".ditem").forEach(li => {
      li.querySelector(".dedit").onclick = () => openForm(list().find(x => x.id === li.dataset.id));
      const del = li.querySelector(".ddel");
      del.onclick = () => {
        if (del.dataset.armed) { remove(li.dataset.id); render(); return; }
        del.dataset.armed = "1"; del.textContent = "Точно удалить?"; del.classList.add("armed");
        setTimeout(() => { if (del.isConnected) { delete del.dataset.armed; del.textContent = "Удалить"; del.classList.remove("armed"); } }, 4000);
      };
      const ph = li.querySelector(".dph");
      if (ph) getPhoto(li.dataset.id).then(bl => { if (bl && ph.isConnected) { const i = new Image(); i.src = URL.createObjectURL(bl); i.alt = "Фото улова"; ph.appendChild(i); } });
    });
    $("#bkExport").onclick = exportBackup;
    $("#bkImport").onchange = e => importBackup(e.target.files[0]);
    bindNotify();
  }

  function item(e) {
    const f = FISH[e.fish];
    const d = new Date(e.date);
    const ds = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) + ", " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const w = e.wx || {};
    const wx = [w.p ? `${w.p} мм${w.dp ? (w.dp > 0 ? " ↑" : " ↓") + Math.abs(w.dp) : ""}` : "", w.t != null ? (w.t > 0 ? "+" : "") + w.t + "°" : "", w.wind != null ? w.wind + " м/с" : "", w.moon || ""].filter(Boolean).join(" · ");
    return `<li class="ditem" data-id="${e.id}">
      ${e.photo ? `<div class="dph"></div>` : ""}
      <div class="dmain"><b>${f ? f.n : "Рыба"}${e.count > 1 ? ` × ${e.count}` : ""}${e.weight ? ` · ${String(e.weight).replace(".", ",")} кг` : ""}</b>
      <small>${ds}${e.place ? " · " + esc(e.place) : ""}</small>
      ${e.bait || e.method ? `<small>${esc([e.bait, e.method].filter(Boolean).join(" · "))}</small>` : ""}
      ${wx ? `<small class="dwx">${esc(wx)}</small>` : ""}
      ${e.note ? `<p>${esc(e.note)}</p>` : ""}
      <div class="acts"><button type="button" class="ghost dedit">Изменить</button><button type="button" class="ghost danger ddel">Удалить</button></div></div></li>`;
  }

  // Что работает лучше — по вашим записям
  function insights(a) {
    const byFish = {};
    a.forEach(e => { (byFish[e.fish] = byFish[e.fish] || []).push(e); });
    const rows = Object.entries(byFish).sort((x, y) => y[1].length - x[1].length).slice(0, 4).map(([id, es]) => {
      const baits = {};
      es.forEach(e => { if (e.bait) baits[e.bait] = (baits[e.bait] || 0) + (+e.count || 1); });
      const top = Object.entries(baits).sort((x, y) => y[1] - x[1])[0];
      return `<li><b>${FISH[id] ? FISH[id].n : id}</b> — ${es.length} ${pl(es.length, "раз", "раза", "раз")}${top ? `, лучше всего на «${esc(top[0])}»` : ""}</li>`;
    });
    const withP = a.filter(e => e.wx && e.wx.dp != null);
    let ptxt = "";
    if (withP.length >= 3) {
      const g = { "давление стабильное": 0, "давление падает": 0, "давление растёт": 0 };
      withP.forEach(e => { const k = Math.abs(e.wx.dp) < 2 ? "давление стабильное" : e.wx.dp < 0 ? "давление падает" : "давление растёт"; g[k] += (+e.count || 1); });
      const best = Object.entries(g).sort((x, y) => y[1] - x[1])[0];
      ptxt = `<p>Больше всего рыбы вы поймали, когда <b>${best[0]}</b>.</p>`;
    }
    return `<section class="card"><h3>Что у вас работает</h3><ul class="bul">${rows.join("")}</ul>${ptxt}</section>`;
  }

  // ---------- Форма записи ----------
  function openForm(e) {
    const isEdit = !!e.id;
    const ds = $("#diaryScreen"); ds.dataset.form = "1";
    window.UI2 && UI2.show("diary");
    delete ds.dataset.form;
    const b = box();
    const spots = (window.APP && APP.allSpots ? APP.allSpots() : window.SPOTS).slice();
    const me = window.APP && APP.state ? APP.state.me : null;
    if (me) spots.sort((x, y) => dist(me, x) - dist(me, y)); else spots.sort((x, y) => (y.my ? 1 : 0) - (x.my ? 1 : 0) || x.n.localeCompare(y.n, "ru"));
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const fishIds = Object.keys(FISH).sort((x, y) => FISH[x].n.localeCompare(FISH[y].n, "ru"));
    const cur = e.fish || (e.spotId && spots.find(s => s.id === e.spotId) ? spots.find(s => s.id === e.spotId).f[0] : "okun");
    b.innerHTML = `<button type="button" class="back" id="dBack">‹ Дневник</button>
      <h1>${isEdit ? "Изменить запись" : "Новый улов"}</h1>
      <form class="myform" id="dForm">
        <label class="fld"><span>Место</span><select id="dSpot">
          <option value="">Без места</option>
          ${me ? `<option value="__me"${e.spotId === "__me" ? " selected" : ""}>Где я сейчас (${me.lat.toFixed(3)}, ${me.lon.toFixed(3)})</option>` : ""}
          ${spots.map(s => `<option value="${s.id}"${(e.spotId || (window.APP && APP.state.current && APP.state.current.id)) === s.id ? " selected" : ""}>${esc(s.n)}${s.my ? " (моё)" : ""}</option>`).join("")}
        </select></label>
        <label class="fld"><span>Когда</span><input type="datetime-local" id="dDate" value="${(e.date || now).slice(0, 16)}" required></label>
        <label class="fld"><span>Рыба</span><select id="dFish">${fishIds.map(id => `<option value="${id}"${id === cur ? " selected" : ""}>${FISH[id].n}</option>`).join("")}</select></label>
        <div class="row3">
          <label class="fld"><span>Сколько, шт</span><input type="number" id="dCount" min="1" step="1" inputmode="numeric" value="${e.count || 1}"></label>
          <label class="fld"><span>Вес, кг</span><input type="number" id="dWeight" min="0" step="0.05" inputmode="decimal" value="${e.weight || ""}" placeholder="—"></label>
          <label class="fld"><span>Самая крупная, см</span><input type="number" id="dLen" min="0" step="1" inputmode="numeric" value="${e.len || ""}" placeholder="—"></label>
        </div>
        <p class="ferr" id="dSize" hidden></p>
        <label class="fld"><span>Наживка или приманка</span><input id="dBait" list="dBaitList" value="${esc(e.bait || "")}" placeholder="Например: мотыль, джиг 8 г"><datalist id="dBaitList"></datalist></label>
        <label class="fld"><span>Способ</span><input id="dMethod" list="dMethodList" value="${esc(e.method || "")}" placeholder="Например: зимняя удочка"><datalist id="dMethodList">${["Поплавок", "Фидер", "Донка", "Спиннинг, джиг", "Микроджиг", "Вертушка", "Воблер", "Жерлица", "Зимняя удочка", "Мормышка", "Балансир", "Нахлыст", "Самодур"].map(m => `<option value="${m}">`).join("")}</datalist></label>
        <label class="fld"><span>Фото</span><input type="file" id="dPhoto" accept="image/*"></label>
        <div id="dPrev" class="dprev"></div>
        <label class="fld"><span>Заметка</span><textarea id="dNote" rows="3" placeholder="Глубина, где стояла рыба, что не сработало…">${esc(e.note || "")}</textarea></label>
        <div class="acts"><button type="submit" class="primary">${isEdit ? "Сохранить" : "Записать"}</button></div>
      </form>`;
    b.scrollTop = 0;
    const fishSel = $("#dFish");
    const fillBait = () => { $("#dBaitList").innerHTML = (FISH[fishSel.value].bait || []).map(x => `<option value="${esc(x)}">`).join(""); checkSize(); };
    const checkSize = () => {
      const min = window.RULES && RULES.SIZES[fishSel.value], L = +$("#dLen").value, el = $("#dSize");
      el.hidden = !(min && L && L < min);
      if (!el.hidden) el.textContent = `${FISH[fishSel.value].n} меньше ${min} см — по правилам Архангельской области её нужно отпустить.`;
    };
    fishSel.onchange = fillBait; $("#dLen").oninput = checkSize; fillBait();
    if (isEdit && e.photo) getPhoto(e.id).then(bl => { if (bl) $("#dPrev").innerHTML = `<img src="${URL.createObjectURL(bl)}" alt="Фото улова">`; });
    $("#dPhoto").onchange = ev => { const f = ev.target.files[0]; if (f) $("#dPrev").innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Фото улова">`; };
    $("#dBack").onclick = render;
    $("#dForm").onsubmit = async ev => {
      ev.preventDefault();
      const sv = $("#dSpot").value;
      const spot = spots.find(s => s.id === sv);
      const date = $("#dDate").value;
      const id = e.id || "c" + Date.now().toString(36);
      const rec = {
        id, date, fish: fishSel.value, count: Math.max(1, +$("#dCount").value || 1),
        weight: +$("#dWeight").value || null, len: +$("#dLen").value || null,
        bait: $("#dBait").value.trim(), method: $("#dMethod").value.trim(), note: $("#dNote").value.trim(),
        spotId: sv || null, place: spot ? spot.n : sv === "__me" ? "Моя точка" : "",
        lat: spot ? spot.lat : sv === "__me" && me ? me.lat : e.lat || null,
        lon: spot ? spot.lon : sv === "__me" && me ? me.lon : e.lon || null,
        photo: e.photo || false,
        wx: spot ? snapshot(spot.id, date) : { moon: FC.moonInfo(new Date(date)).name }
      };
      const f = $("#dPhoto").files[0];
      if (f) { try { await putPhoto(id, await shrink(f)); rec.photo = true; } catch (er) {} }
      isEdit ? update(rec) : add(rec);
      render();
    };
  }
  function dist(a, b) { const R = 6371, r = Math.PI / 180, x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }

  // ---------- Резервная копия ----------
  async function exportBackup() {
    const st = $("#bkState");
    st.textContent = "Готовлю файл…";
    const data = { app: "karta-kleva", v: 1, at: new Date().toISOString(),
      my: ls.get("kk_my_spots", []), favs: ls.get("kk_favs", []), diary: list(), photos: {} };
    if ($("#bkPhotos").checked) {
      for (const e of data.diary) if (e.photo) {
        const bl = await getPhoto(e.id);
        if (bl) data.photos[e.id] = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(bl); });
      }
    }
    const json = JSON.stringify(data);
    const name = `karta-kleva-${new Date().toISOString().slice(0, 10)}.json`;
    const P = cap();
    try {
      if (P.Filesystem && P.Share) {
        const w = await P.Filesystem.writeFile({ path: name, data: json, directory: "CACHE", encoding: "utf8" });
        await P.Share.share({ title: "Карта клёва — резервная копия", text: "Мои места и дневник уловов", url: w.uri, dialogTitle: "Куда сохранить копию" });
        st.textContent = "Готово. Выберите, куда отправить файл: Telegram «Избранное», почта, Google Диск.";
        return;
      }
    } catch (er) { if (/cancel/i.test(String(er && er.message))) { st.textContent = ""; return; } }
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      st.textContent = "Файл сохранён в «Загрузки».";
    } catch (er) { st.textContent = "Не получилось сохранить файл."; }
  }
  async function importBackup(file) {
    const st = $("#bkState");
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== "karta-kleva") throw new Error("не тот файл");
      const my = ls.get("kk_my_spots", []), ids = new Set(my.map(s => s.id));
      (data.my || []).forEach(s => { if (!ids.has(s.id)) my.push(s); });
      ls.set("kk_my_spots", my);
      const favs = new Set(ls.get("kk_favs", [])); (data.favs || []).forEach(f => favs.add(f)); ls.set("kk_favs", [...favs]);
      const d = list(), dids = new Set(d.map(e => e.id));
      let n = 0;
      for (const e of data.diary || []) if (!dids.has(e.id)) { d.push(e); n++; if (data.photos && data.photos[e.id]) { try { const bl = await (await fetch(data.photos[e.id])).blob(); await putPhoto(e.id, bl); } catch (er) {} } }
      d.sort((x, y) => (y.date || "").localeCompare(x.date || ""));
      save(d);
      if (window.APP && APP.reloadMy) APP.reloadMy();
      render();
      $("#bkState").textContent = `Загружено: мест — ${(data.my || []).length}, записей дневника — ${n}.`;
    } catch (er) { st.textContent = "Это не файл резервной копии «Карты клёва»."; }
  }

  // ---------- Уведомления ----------
  const NKEY = "kk_notify";
  const nset = () => ls.get(NKEY, { bite: false, wind: false, bans: false });
  function notifyBlock() {
    const s = nset(), has = !!cap().LocalNotifications;
    return `${has ? "" : `<p class="hint">Уведомления работают в приложении на телефоне.</p>`}
      <label class="chk"><input type="checkbox" data-n="bite"${s.bite ? " checked" : ""}> Хороший клёв завтра — на моих местах и в избранном</label>
      <label class="chk"><input type="checkbox" data-n="wind"${s.wind ? " checked" : ""}> Сильный ветер завтра на моих местах</label>
      <label class="chk"><input type="checkbox" data-n="bans"${s.bans ? " checked" : ""}> За 3 дня до начала запрета (Архангельская обл.)</label>
      <p class="hint">Прогноз для уведомлений обновляется, когда вы открываете приложение. Открывайте его хотя бы раз в пару дней.</p>`;
  }
  function bindNotify() {
    document.querySelectorAll("[data-n]").forEach(c => c.onchange = async () => {
      const s = nset(); s[c.dataset.n] = c.checked; ls.set(NKEY, s);
      const LN = cap().LocalNotifications;
      if (c.checked && LN) { try { const p = await LN.requestPermissions(); if (p.display !== "granted") { c.checked = false; s[c.dataset.n] = false; ls.set(NKEY, s); alertBox("Разрешите уведомления для приложения в настройках телефона."); } } catch (e) {} }
      schedule();
    });
  }
  function alertBox(t) { const h = document.querySelector("#diaryScreen .hint"); if (h) h.textContent = t; }

  async function schedule() {
    const LN = cap().LocalNotifications;
    if (!LN || !window.APP || !APP.ratingFor) return;
    const s = nset();
    try {
      const pend = await LN.getPending();
      const old = (pend.notifications || []).filter(n => n.id >= 7000 && n.id < 7200).map(n => ({ id: n.id }));
      if (old.length) await LN.cancel({ notifications: old });
    } catch (e) {}
    const out = [];
    let id = 7000;
    const now = Date.now();
    const spots = APP.allSpots().filter(sp => sp.my || APP.state.favs.has(sp.id));
    const at = (dayStr, h) => { const d = new Date(dayStr + "T00:00"); d.setHours(h, 0, 0, 0); return d; };
    for (let di = 1; di <= 3; di++) {
      const good = [], windy = [];
      let dayStr = null;
      spots.forEach(sp => {
        const r = APP.ratingFor(sp.id, di);
        const days = APP.weatherFor(sp.id);
        if (!r || !days || !days[di + 1]) return;
        dayStr = days[di + 1].date;
        if (r.stars >= 4) good.push(sp.n);
        if (days[di + 1].wind >= 12) windy.push(sp.n + " — " + Math.round(days[di + 1].wind) + " м/с");
      });
      if (!dayStr) continue;
      const prev = new Date(at(dayStr, 19).getTime() - 86400000);
      if (prev.getTime() <= now) continue;
      if (s.bite && good.length) out.push({ id: id++, title: "Завтра хороший клёв", body: good.slice(0, 4).join(", ") + (good.length > 4 ? " и др." : ""), schedule: { at: prev, allowWhileIdle: true } });
      if (s.wind && windy.length) out.push({ id: id++, title: "Завтра сильный ветер", body: windy.slice(0, 3).join("; ") + ". На лодке лучше не выходить.", schedule: { at: new Date(prev.getTime() + 60000), allowWhileIdle: true } });
    }
    if (s.bans && window.RULES) {
      const y = new Date().getFullYear();
      Object.values(RULES.P).forEach(p => {
        if (!/^\d\d-\d\d$/.test(p.from)) return;
        [y, y + 1].forEach(yy => {
          const start = new Date(yy + "-" + p.from + "T10:00");
          const when = new Date(start.getTime() - 3 * 86400000);
          if (when.getTime() > now && when.getTime() - now < 60 * 86400000 && id < 7190)
            out.push({ id: id++, title: "Через 3 дня запрет", body: p.what + " — " + RULES.dates(p) + ". " + p.where, schedule: { at: when, allowWhileIdle: true } });
        });
      });
    }
    if (out.length) { try { await LN.schedule({ notifications: out }); } catch (e) {} }
  }

  window.DIARY = { list, render, openForm, schedule, getPhoto };
})();
