// Вкладки «Рыбы» и «Советы» и нижняя навигация
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const FISH = window.FISH;
  const MONTHS = ["Я", "Ф", "М", "А", "М", "И", "И", "А", "С", "О", "Н", "Д"];

  // ---------- Вкладки ----------
  const tabs = document.querySelectorAll(".tabs button");
  function show(tab) {
    document.body.dataset.tab = tab;
    tabs.forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    $("#fishScreen").hidden = tab !== "fish";
    $("#tipsScreen").hidden = tab !== "tips";
    $("#rulesScreen").hidden = tab !== "rules";
    if (tab === "rules") renderRules();
    if (tab === "map" && window.APP) APP.showMapTab();
    if (tab === "fish" && !$("#fishScreen").dataset.ready) renderFishList();
    if (tab === "tips" && !$("#tipsScreen").dataset.ready) renderTips();
  }
  tabs.forEach(b => b.onclick = () => show(b.dataset.tab));

  // ---------- Рыбы ----------
  const fs = () => $("#fishScreen .scr");
  function renderFishList(q) {
    const scr = $("#fishScreen"); scr.dataset.ready = "1";
    const box = fs();
    const query = (q || "").toLowerCase();
    const ids = Object.keys(FISH).sort((a, b) => FISH[a].n.localeCompare(FISH[b].n, "ru"))
      .filter(id => !query || FISH[id].n.toLowerCase().includes(query));
    box.innerHTML = `<header class="scrhead"><h1>Рыбы</h1><p>Как выглядит, где живёт, на что ловить. Нажмите на рыбу, чтобы открыть фото.</p>
      <input type="search" id="fishQ" placeholder="Найти рыбу" value="${esc(q || "")}" aria-label="Найти рыбу" autocomplete="off">
      <div class="acts"><button type="button" class="ghost" id="dlPhotos">Сохранить фото для офлайна</button></div></header>
      <ul class="fishgrid">${ids.map(id => `<li><button type="button" class="ftile" data-id="${id}">
        <span class="fimg" data-fish="${id}">${FISHART.draw(id, "fishart")}</span>
        <b>${FISH[id].n}</b><small>${FISH[id].pred ? "хищник" : "мирная"} · ${esc(FISHART.LOOK[id] ? FISHART.LOOK[id][1] : "")}</small></button></li>`).join("")}</ul>
      ${window.FISH_DEMO ? `<p class="foot">В этом предпросмотре нет интернета, поэтому вместо фотографий показаны схемы. В приложении на телефоне загрузятся настоящие фото.</p>` : `<p class="foot">Фото — iNaturalist и Wikimedia Commons, свободные лицензии; автор указан под каждым снимком.</p>`}`;
    const qi = $("#fishQ");
    qi.oninput = () => { const v = qi.value; renderFishList(v); const n = $("#fishQ"); n.focus(); n.setSelectionRange(v.length, v.length); };
    box.querySelectorAll(".ftile").forEach(b => b.onclick = () => openFish(b.dataset.id));
    box.querySelectorAll(".fimg").forEach(n => photoInto(n, n.dataset.fish));
    $("#dlPhotos").onclick = async () => {
      const b = $("#dlPhotos");
      if (window.FISH_DEMO) { b.textContent = "В предпросмотре недоступно"; return; }
      b.disabled = true;
      await PHOTOS.preloadAll((d, t) => { b.textContent = `Сохраняю фото… ${d} из ${t}`; });
      b.textContent = "Фото сохранены";
    };
  }

  async function photoInto(node, id) {
    const list = await PHOTOS.get(id);
    if (!list.length || !node.isConnected) return;
    const img = new Image(); img.alt = FISH[id].n; img.loading = "lazy"; img.src = list[0].src;
    img.onload = () => { node.innerHTML = ""; node.appendChild(img); node.classList.add("photo"); };
  }

  async function openFish(id) {
    show("fish");
    const f = FISH[id], look = FISHART.LOOK[id] || ["", ""];
    const box = fs();
    const spots = (window.SPOTS || []).filter(s => s.f.includes(id));
    const now = new Date().getMonth();
    box.innerHTML = `<button type="button" class="back" id="fBackList">‹ Все рыбы</button>
      <div class="gallery" id="gal"><figure class="gimg">${FISHART.draw(id, "fishart big")}<figcaption>${window.FISH_DEMO ? "Схема. В приложении здесь будут настоящие фото." : "Загружаю фото…"}</figcaption></figure></div>
      <header class="fhead"><h1>${f.n}</h1><p class="latin">${esc(PHOTOS.LATIN[id] || "")}</p>
        <p class="meta"><span class="tag">${f.pred ? "Хищник" : "Мирная рыба"}</span><span>${esc(look[1])}</span></p></header>
      <section class="card"><h3>Как узнать</h3><p>${esc(look[0])}</p>
        ${window.RULES && RULES.SIZES[id] ? `<p class="hint">Минимальный размер в Архангельской области — ${RULES.SIZES[id]} см${RULES.SIZE_NOTE[id] ? " (" + esc(RULES.SIZE_NOTE[id]) + ")" : ""}. Меньше — отпустите.</p>` : ""}</section>
      <section class="card"><h3>На что ловить</h3><ul>${f.bait.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
        <h4>Как ловить</h4><p>${esc(f.method)}</p><h4>Совет</h4><p>${esc(f.tip)}</p></section>
      <section class="card"><h3>Когда клюёт</h3>
        <div class="months">${f.m.map((v, i) => `<span class="mo${i === now ? " now" : ""}"><i style="height:${6 + v * 8}px" class="a${v}"></i><small>${MONTHS[i]}</small></span>`).join("")}</div>
        <p class="hint">Чем выше столбик, тем лучше клюёт в этом месяце. Оранжевая буква — текущий месяц.</p></section>
      <section class="card"><h3>Где ловить</h3>${spots.length ? `<ul class="spotlinks">${spots.map(s => `<li><button type="button" data-id="${s.id}">${esc(s.n)}<small>${esc(s.r)}</small></button></li>`).join("")}</ul>` : "<p>В базе пока нет мест с этой рыбой.</p>"}</section>`;
    box.scrollTop = 0;
    $("#fBackList").onclick = () => renderFishList();
    box.querySelectorAll(".spotlinks button").forEach(b => b.onclick = () => {
      show("map"); const s = window.SPOTS.find(x => x.id === b.dataset.id); if (s && window.APP) APP.openSpot(s);
    });
    const list = await PHOTOS.get(id);
    const gal = $("#gal");
    if (!gal) return;
    if (list.length) {
      gal.innerHTML = list.map(p => `<figure class="gimg"><img src="${esc(p.src)}" alt="${esc(f.n)}" loading="lazy"><figcaption><a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.credit)}</a></figcaption></figure>`).join("");
      if (list.length > 1) gal.insertAdjacentHTML("afterend", `<p class="hint gcount">Листайте фото влево — ${list.length} шт.</p>`);
    } else if (!window.FISH_DEMO) {
      const cap = gal.querySelector("figcaption"); if (cap) cap.textContent = "Фото не загрузилось — нет интернета. Показана схема.";
    }
  }

  // ---------- Советы ----------
  function renderTips() {
    const scr = $("#tipsScreen"); scr.dataset.ready = "1";
    const box = $("#tipsScreen .scr");
    const T = window.TIPS;
    const sections = [["rigs", "Монтажи"], ["knots", "Узлы"], ["weights", "Грузы"], ["depth", "Глубины"], ["safety", "Безопасность"], ["rules", "Правила"]];
    box.innerHTML = `<header class="scrhead"><h1>Советы</h1><p>Как собрать снасть, привязать крючок, подобрать груз и найти рыбу на глубине.</p>
      <nav class="chips" aria-label="Разделы">${sections.map(([id, t]) => `<button type="button" class="chip" data-go="${id}">${t}</button>`).join("")}</nav></header>

      <section id="t-rigs"><h2>Монтажи оснастки</h2><p class="hint">Нажмите на снасть — откроется схема и порядок сборки.</p>
      ${T.GROUPS.map(([g, gt]) => `<h3 class="sub">${gt}</h3>` + T.RIGS.filter(r => r.group === g).map(r => `<details class="rigcard"><summary><span><b>${r.name}</b><small>${esc(r.fish)}</small></span><span class="lvl">${r.diff}</span></summary>
        <div class="rigbody"><div class="rigart">${r.art()}</div><h4>Как собрать</h4><ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol><p class="tipline">${esc(r.tip)}</p></div></details>`).join("")).join("")}</section>

      <section id="t-knots"><h2>Рыболовные узлы</h2><p class="hint">Перед затягиванием всегда смачивайте узел водой — леска не перегреется и не ослабнет.</p>
      ${T.KNOTS.map(k => `<details class="rigcard"><summary><span><b>${k.name}</b><small>${esc(k.use)}</small></span>${k.str ? `<span class="str" title="Прочность узла"><i style="width:${k.str}%"></i><small>${k.str}%</small></span>` : ""}</summary>
        <div class="rigbody"><ol>${k.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></div></details>`).join("")}
      <p class="hint">Прочность — сколько процентов прочности лески сохраняет узел.</p></section>

      <section id="t-weights"><h2>Какой груз ставить</h2>
      <div class="tablewrap"><table><thead><tr><th>Ловля</th><th>Вес</th><th>Какой груз</th><th>Подсказка</th></tr></thead>
      <tbody>${T.WEIGHTS.map(w => `<tr><td>${w[0]}</td><td class="num">${w[1]}</td><td>${w[2]}</td><td>${w[3]}</td></tr>`).join("")}</tbody></table></div>
      <div class="card"><h3>Главное правило</h3><p>Груз должен держать снасть там, где вы её поставили, но быть как можно легче. Сносит течением — добавьте вес. Рыба бросает насадку — облегчите.</p></div></section>

      <section id="t-depth"><h2>Глубины: где стоит рыба</h2><p>${esc(T.DEPTH_GUIDE.intro)}</p>
      <div class="card">${T.profileSvg("lake")}<p class="hint">Озеро или водохранилище в разрезе.</p></div>
      <dl class="deflist">${T.DEPTH_GUIDE.where.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>
      <div class="card">${T.profileSvg("river")}<p class="hint">Река в разрезе.</p></div>
      <h3 class="sub">Как узнать глубину без эхолота</h3>
      <dl class="deflist">${T.DEPTH_GUIDE.measure.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>
      <p class="hint">Глубины морей можно включить на карте кнопкой «Глубины». Средняя и максимальная глубина каждого места — в его карточке.</p></section>

      <section id="t-safety"><h2>Безопасность</h2><ul class="bul">${T.SAFETY.map(s => `<li>${esc(s)}</li>`).join("")}</ul></section>
      <section id="t-rules"><h2>Правила</h2><ul class="bul">${T.RULES.map(s => `<li>${esc(s)}</li>`).join("")}</ul></section>`;
    box.querySelectorAll("[data-go]").forEach(b => b.onclick = () => {
      const t = document.getElementById("t-" + b.dataset.go); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ---------- Запреты ----------
  function renderRules() {
    const R = window.RULES, box = $("#rulesScreen .scr");
    const today = new Date();
    const order = { on: 0, maybe: 1, soon: 2, off: 3 };
    const dated = Object.entries(R.P).map(([k, p]) => Object.assign({ k, st: R.status(p, today), dates: R.dates(p) }, p)).sort((a, b) => order[a.st.k] - order[b.st.k]);
    const active = dated.filter(r => r.st.k === "on" || r.st.k === "maybe");
    const item = r => `<li class="st-${r.st ? r.st.k : "perm"}"><span class="badge">${r.st ? r.st.text : "Действует всегда"}</span><b>${esc(r.what)}</b><small>${r.dates ? esc(r.dates) + " · " : ""}${esc(r.where)}</small></li>`;
    const ds = today.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    box.innerHTML = `<header class="scrhead"><h1>Запреты</h1><p>Архангельская область, на сегодня — ${ds} Статус каждого запрета считается автоматически по дате.</p></header>
      <section class="card"><h3>${active.length ? "Сейчас действует" : "Сезонных запретов сейчас нет"}</h3>
        ${active.length ? `<ul class="rlist">${active.map(item).join("")}</ul>` : "<p>Ловить удочкой и спиннингом можно, соблюдая общие правила, размеры и нормы.</p>"}</section>
      <section><h2>Новости рыбоохраны</h2><p class="hint" id="newsState">Загружаю с официальных сайтов…</p><ul class="news" id="newsList"></ul>
        <div class="acts">${R.NEWS.map(n => `<a class="ghost" href="${n.url}" target="_blank" rel="noopener">${esc(n.n)}</a>`).join("")}</div></section>
      <section><h2>Все сезонные запреты</h2><ul class="rlist">${dated.map(item).join("")}</ul></section>
      <section><h2>Всегда действует</h2><ul class="rlist">${Object.values(R.Z).map(item).join("")}</ul></section>
      <section><h2>Минимальный размер рыбы</h2><p class="hint">Длина от кончика рыла до начала хвостового плавника. Рыбу меньше — сразу отпустите.</p>
        <div class="tablewrap"><table><tbody>${Object.entries(R.SIZES).sort((a, b) => b[1] - a[1]).map(([id, v]) => `<tr><td>${FISH[id] ? FISH[id].n : id}</td><td class="num">${v} см</td></tr>`).join("")}
        ${Object.entries(R.SIZE_NOTE).map(([id, t]) => `<tr><td>${FISH[id] ? FISH[id].n : id}</td><td class="num">${esc(t)}</td></tr>`).join("")}</tbody></table></div></section>
      <section><h2>Сколько можно поймать за день</h2><div class="tablewrap"><table><tbody>${R.NORMS.map(n => `<tr><td>${n[0]}</td><td class="num">${n[1]}</td></tr>`).join("")}</tbody></table></div>
        <p class="hint">Больше одной нормы за день на водоёме нельзя. Норма набрана — ловлю прекращают (можно ловить и отпускать).</p></section>
      <section><h2>Другие регионы</h2><p>Для остальных мест на карте действуют правила своего бассейна. Нерестовый запрет обычно с апреля по июнь, даты разные в каждом регионе.</p>
        <ul class="bul">${Object.values(R.BASIN).filter(b => b.n !== "Северный бассейн").map(b => `<li>${b.n}</li>`).join("")}</ul>
        <div class="acts"><a class="ghost" href="https://fish.gov.ru/" target="_blank" rel="noopener">Росрыболовство</a></div></section>
      <p class="foot">Источник: <a href="${R.DOC_NORTH.url}" target="_blank" rel="noopener">${esc(R.DOC_NORTH.title)}</a>. Приложение — подсказка, а не официальный документ. Перед поездкой сверяйтесь с действующими правилами и новостями рыбоохраны.</p>`;
    showNews();
  }
  async function showNews() {
    const R = window.RULES, st = $("#newsState"), ul = $("#newsList");
    const draw = (items, note) => {
      if (!ul) return;
      ul.innerHTML = items.slice(0, 12).map(n => `<li class="${n.hot ? "hot" : ""}">${n.hot ? '<span class="badge">Важно</span>' : ""}<a href="${esc(n.href)}" target="_blank" rel="noopener">${esc(n.t)}</a><small>${esc(n.date ? n.date + " · " : "")}${esc(n.src)}</small></li>`).join("");
      st.textContent = note;
    };
    const c = R.cachedNews();
    if (c && c.items) draw(c.items, "Показаны новости от " + new Date(c.at).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + ". Обновляю…");
    if (window.FISH_DEMO) { st.textContent = "В этом предпросмотре нет интернета. В приложении здесь будут свежие новости с официальных сайтов Росрыболовства — откройте их по ссылкам ниже."; return; }
    const items = await R.loadNews();
    if (items.length) draw(items, "Обновлено только что. Отмечены новости о запретах, нересте, льде и правилах.");
    else if (!c) st.textContent = "Не удалось загрузить новости. Проверьте интернет или откройте сайты рыбоохраны по ссылкам ниже.";
    else st.textContent = "Нет интернета — показаны сохранённые новости.";
  }

  window.UI2 = { openFish, show };
  show("map");
})();
