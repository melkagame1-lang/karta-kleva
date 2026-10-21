// Запреты и правила любительского рыболовства.
// Подробно — Архангельская область (Правила рыболовства для Северного бассейна, приказ Минсельхоза России от 13.05.2021 № 292).
// Статус («действует сейчас» / «скоро» / «закончился») считается автоматически по сегодняшней дате.
(function () {
  const DOC_NORTH = {
    title: "Правила рыболовства для Северного рыбохозяйственного бассейна (приказ Минсельхоза России от 13.05.2021 № 292, с изменениями)",
    url: "https://base.garant.ru/400833905/"
  };

  // Сроки. from/to — "ММ-ДД". ice — «от ледостава до ледохода» (дату не посчитать точно)
  const P = {
    netsSouth: { from: "04-25", to: "06-08", what: "Весенний нерестовый запрет на сети, неводы и другие объячеивающие и стационарные орудия",
      where: "Каргопольский, Няндомский, Коношский, Вельский, Устьянский, Шенкурский, Верхнетоемский, Котласский, Красноборский, Вилегодский, Ленский районы" },
    netsMid: { from: "05-01", to: "06-14", what: "Весенний нерестовый запрет на сети, неводы и другие объячеивающие и стационарные орудия",
      where: "Приморский район (включая Архангельск, Северодвинск, Новодвинск), Онежский, Плесецкий, Виноградовский, Холмогорский, Пинежский районы" },
    netsNorth: { from: "05-15", to: "06-28", what: "Весенний нерестовый запрет на сети, неводы и другие объячеивающие и стационарные орудия",
      where: "Лешуконский и Мезенский районы" },
    coast: { from: "08-10", to: "10-10", what: "Запрет на сети и стационарные орудия на побережье (кроме лова сельди, корюшки и наваги)",
      where: "Побережье Онежского, Двинского, Мезенского заливов и Горла Белого моря" },
    dvinaNets: { from: "08-10", to: "10-10", what: "Запрет на сети", where: "Северная Двина и Вычегда" },
    yamy: { from: "10-01", to: "ice", what: "Запрет ловли на зимовальных ямах (с 1 октября до ледохода)",
      where: "Зимовальные ямы Северной Двины и Вычегды — например, Архангельская (1–3 км от устья), Усть-Пинежская (93–95 км), Усть-Вычегодская, Сольвычегодская" },
    onegaMezenNets: { from: "ice", to: "ice", what: "Запрет на сети с начала ледостава до ледохода", where: "Реки Онега и Мезень с притоками" },
    seld: { from: "05-10", to: "06-10", what: "Запрет любительского лова сельди беломорской",
      where: "Онежский залив, включая 3-км зону вокруг Соловецких островов и остров Жижгин" },
    navagaUna: { from: "01-20", to: "01-31", what: "Запрет любительского лова наваги",
      where: "Унская губа (между мысами Яреньгский Рог и Красногорский Рог) и губа Ухта" }
  };

  // Постоянные ограничения (без дат)
  const Z = {
    delta: { what: "Особая зона дельты Северной Двины: разрешены только ручные крючковые снасти — не более 10 одинарных крючков на человека",
      where: "Северная часть дельты: у островов Лебедин, Мурловой, Торосов, Камбалий, Холоповец, Волок, Лясомин, Гремиха и др.; Сафроновская губа, Горбы" },
    salmon: { what: "Сёмужья река: ловля только ручными крючковыми снастями с ограничением числа крючков, подлёдный лов — не более 4 крючков на снасть. Сёмгу, кумжу без путёвки ловить нельзя",
      where: "Солза, Сюзьма, Куя, Мудьюга, Лая, Летняя и Зимняя Золотица, Пинега (до устья Шукши), Вага, Устья, Онега (участки), Мезень, Кулой и другие нерестовые реки сёмги" },
    nets200: { what: "Нельзя ловить ближе 200 м от ставных неводов, рыбоучётных заграждений и других стационарных орудий", where: "Все водоёмы области" },
    license: { what: "Сёмгу, нельму, тайменя, стерлядь, арктического омуля можно ловить только по путёвке. Молодь сёмги и кумжи — запрещено всегда", where: "Все водоёмы области" },
    restricted: { what: "Режимная территория: нужен пропуск", where: "Ненокса (полигон) — дальше деревни Солза без пропуска не проезжайте" },
    hatchery: { what: "Нельзя ловить ближе 0,5 км от рыбоводного завода и мест выпуска молоди", where: "Рыбоводный завод на реке Солза" }
  };

  // Какие правила к какому месту
  const SPOT_RULES = {
    "sev-yagry": ["netsMid", "coast", "nets200"],
    "sev-yagorka": ["netsMid", "coast"],
    "sev-kosy": ["netsMid", "delta", "coast", "nets200"],
    "sev-delta": ["netsMid", "delta", "dvinaNets", "nets200"],
    "sev-solza": ["netsMid", "salmon", "hatchery", "restricted", "license"],
    "sev-beloe": ["netsMid"],
    "arh-dvina": ["netsMid", "yamy", "dvinaNets", "delta"],
    "arh-mechka": ["netsMid"],
    "arh-onega": ["netsMid", "onegaMezenNets", "seld", "coast", "salmon", "license"],
    "arh-lacha": ["netsSouth"],
    "arh-kenozero": ["netsMid"],
    "arh-leksh": ["netsSouth"],
    "arh-kozhozero": ["netsMid"],
    "arh-pinega": ["netsMid", "salmon", "license"],
    "arh-vaga": ["netsSouth", "salmon", "license"],
    "arh-kotlas": ["netsSouth", "yamy", "dvinaNets"],
    "arh-mezen": ["netsNorth", "onegaMezenNets", "coast", "salmon", "license"],
    "arh-solovki": ["seld", "coast"],
    "sev-paranikha": ["netsMid", "coast", "nets200"],
    "sev-kudma": ["netsMid"],
    "sev-kudmozero": ["netsMid"],
    "sev-unskaya": ["navagaUna", "netsMid", "coast", "nets200", "salmon"],
    "arh-suhoe": ["netsMid", "delta", "coast", "nets200"],
    "arh-yuras": ["netsMid"],
    "arh-vyselki": ["netsMid", "dvinaNets", "yamy"],
    "arh-slobodskoe": ["netsMid"],
    "arh-travnoe": ["netsMid"],
    "arh-chidvozero": ["netsMid"]
  };

  // Минимальные размеры (см, от кончика рыла до основания средних лучей хвоста) — Архангельская область
  const SIZES = { shchuka: 35, nalim: 35, kumzha: 40, yaz: 26, golavl: 25, leshch: 25, sig: 22, harius: 20, navaga: 17,
    kambala: 16, koryushka: 14, plotva: 14, ryapushka: 14, krasnoperka: 15, treska: 23 };
  const SIZE_NOTE = { navaga: "18 см — в Мезенском заливе и Воронке Белого моря", seld: "11 см — в Двинском заливе", okun: "14 см — в озере Лача" };

  // Суточные нормы вылова (Архангельская область)
  const NORMS = [
    ["Щука", "15 кг"],
    ["Кумжа, сиг, хариус, лещ", "10 кг каждого вида"],
    ["Сиг в границах морского порта Архангельск", "2 кг"],
    ["Треска, пикша, камбала и др. (Белое море)", "50 кг вместе"],
    ["Все остальные виды", "25 кг вместе или 1 рыба тяжелее 25 кг"]
  ];

  // Бассейны для остальных мест (подробных дат нет — ведём на официальные правила)
  const BASIN = {
    north: { n: "Северный бассейн", url: DOC_NORTH.url },
    west: { n: "Западный бассейн", url: "https://fish.gov.ru/" },
    volga: { n: "Волжско-Каспийский бассейн", url: "https://fish.gov.ru/" },
    azov: { n: "Азово-Черноморский бассейн", url: "https://fish.gov.ru/" },
    wsib: { n: "Западно-Сибирский бассейн", url: "https://fish.gov.ru/" },
    esib: { n: "Восточно-Сибирский бассейн", url: "https://fish.gov.ru/" },
    baikal: { n: "Байкальский бассейн", url: "https://fish.gov.ru/" },
    fareast: { n: "Дальневосточный бассейн", url: "https://fish.gov.ru/" }
  };
  const SPOT_BASIN = {
    "volga-delta": "volga", ahtuba: "volga", "volga-saratov": "volga", kuibyshev: "volga", rybinsk: "volga", ivankovo: "volga", mozhaisk: "volga",
    ozerna: "volga", "oka-ryazan": "volga", seliger: "volga", "kama-perm": "volga", ural: "volga",
    ilmen: "west", ladoga: "west", onega: "west", vuoksa: "west", finsky: "west", chudskoe: "west", kurshsky: "west",
    "don-rostov": "azov", tsimla: "azov", "azov-yeysk": "azov", kuban: "azov", sochi: "azov",
    pechora: "north", "kola-varzuga": "north", kandalaksha: "north", teriberka: "north",
    "irtysh-omsk": "wsib", chany: "wsib", "ob-novosib": "wsib", teletskoe: "wsib",
    enisei: "esib", lena: "esib", baikal: "baikal",
    "amur-hab": "fareast", hanka: "fareast", vladivostok: "fareast", sahalin: "fareast", kamchatka: "fareast", magadan: "fareast"
  };

  // Официальные источники новостей (загружаются в приложении)
  const NEWS = [
    { n: "Североморское ТУ Росрыболовства (Архангельская и Мурманская обл.)", url: "https://murmansk.fish.gov.ru/press/news/" },
    { n: "Росрыболовство — новости", url: "https://fish.gov.ru/news/" }
  ];

  // ---------- статус по дате ----------
  function md(s, y) { const [m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function status(p, today) {
    today = today || new Date();
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const y = t.getFullYear();
    if (p.from === "ice") {
      const m = t.getMonth();
      return m >= 10 || m <= 3 ? { k: "maybe", text: "Действует, пока стоит лёд" } : { k: "off", text: "Сейчас не действует — только подо льдом" };
    }
    if (p.to === "ice") {
      const start = md(p.from, y);
      const m = t.getMonth();
      if (t >= start || m <= 3) return { k: "on", text: "Действует сейчас — до ледохода" };
      const days = Math.round((start - t) / 86400000);
      return days <= 30 ? { k: "soon", text: `Начнётся через ${days} ${dn(days)}` } : { k: "off", text: "Сейчас не действует" };
    }
    let a = md(p.from, y), b = md(p.to, y);
    if (b < a) { if (t <= b) a = md(p.from, y - 1); else b = md(p.to, y + 1); }
    if (t >= a && t <= b) {
      const left = Math.round((b - t) / 86400000);
      return { k: "on", text: left === 0 ? "Действует — последний день" : `Действует сейчас — ещё ${left} ${dn(left)}` };
    }
    if (t > b) { a = md(p.from, y + 1); }
    const days = Math.round((a - t) / 86400000);
    return days <= 30 ? { k: "soon", text: `Начнётся через ${days} ${dn(days)}` } : { k: "off", text: "Сейчас не действует" };
  }
  function dn(n) { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? "день" : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? "дня" : "дней"; }
  const MON = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  function fmt(s) { if (s === "ice") return null; const [m, d] = s.split("-").map(Number); return d + " " + MON[m - 1]; }
  function dates(p) {
    if (p.from === "ice") return "от ледостава до ледохода";
    if (p.to === "ice") return "с " + fmt(p.from) + " до ледохода";
    return "с " + fmt(p.from) + " по " + fmt(p.to);
  }

  function forSpot(id) {
    const keys = SPOT_RULES[id];
    if (!keys) return null;
    return keys.map(k => P[k] ? Object.assign({ key: k, dated: true, dates: dates(P[k]), st: status(P[k]) }, P[k]) : Object.assign({ key: k, dated: false }, Z[k]));
  }

  // ---------- новости ----------
  const NEWS_KEY = "kk_news_v1";
  const KW = /запрет|нерест|лёд|лед|любительск|рыбалк|рыболов|правил|штраф|ограничен|выпуск|путёвк|путевк/i;
  async function loadNews() {
    const out = [];
    for (const src of NEWS) {
      try {
        const r = await fetch(src.url);
        if (!r.ok) continue;
        const html = await r.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const seen = new Set();
        doc.querySelectorAll("a[href]").forEach(a => {
          const href = new URL(a.getAttribute("href"), src.url).href;
          const text = (a.textContent || "").replace(/\s+/g, " ").trim();
          if (text.length < 30 || seen.has(href) || !/\/news\/./.test(href) || href === src.url) return;
          seen.add(href);
          const ctx = (a.closest("article, li, div") || a).textContent || "";
          const dm = ctx.match(/(\d{1,2})[.\s](\d{2}|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)[.\s](20\d\d)/i);
          out.push({ t: text, href, src: src.n, date: dm ? dm[0] : "", hot: KW.test(text) });
        });
      } catch (e) {}
    }
    const items = out.slice(0, 30);
    if (items.length) { try { localStorage.setItem(NEWS_KEY, JSON.stringify({ at: Date.now(), items })); } catch (e) {} }
    return items;
  }
  function cachedNews() { try { return JSON.parse(localStorage.getItem(NEWS_KEY)); } catch (e) { return null; } }

  window.RULES = { P, Z, SPOT_RULES, SIZES, SIZE_NOTE, NORMS, BASIN, SPOT_BASIN, NEWS, DOC_NORTH, status, dates, forSpot, loadNews, cachedNews };
})();
