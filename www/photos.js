// Настоящие фотографии рыб: iNaturalist (только свободные лицензии), запасной вариант — Википедия.
(function () {
  const LATIN = {
    shchuka: "Esox lucius", okun: "Perca fluviatilis", sudak: "Sander lucioperca", bersh: "Sander volgensis",
    leshch: "Abramis brama", plotva: "Rutilus rutilus", karp: "Cyprinus carpio", karas: "Carassius carassius",
    som: "Silurus glanis", zhereh: "Leuciscus aspius", golavl: "Squalius cephalus", yaz: "Leuciscus idus",
    nalim: "Lota lota", harius: "Thymallus thymallus", lenok: "Brachymystax lenok", taimen: "Hucho taimen",
    sig: "Coregonus lavaretus", omul: "Coregonus migratorius", semga: "Salmo salar", gorbusha: "Oncorhynchus gorbuscha",
    kumzha: "Salmo trutta", treska: "Gadus morhua", piksha: "Melanogrammus aeglefinus", kambala: "Platichthys flesus",
    koryushka: "Osmerus eperlanus", navaga: "Eleginus nawaga", bychok: "Neogobius melanostomus", kefal: "Mugil cephalus",
    stavrida: "Trachurus mediterraneus", tolstolobik: "Hypophthalmichthys molitrix", amur: "Ctenopharyngodon idella",
    lin: "Tinca tinca", chehon: "Pelecus cultratus", krasnoperka: "Scardinius erythrophthalmus", vobla: "Rutilus caspicus",
    syrok: "Coregonus peled", seld: "Clupea pallasii", elec: "Leuciscus leuciscus", ersh: "Gymnocephalus cernua",
    ryapushka: "Coregonus albula"
  };
  const OK_LIC = ["cc0", "cc-by", "cc-by-sa", "cc-by-nc", "cc-by-nc-sa", "cc-by-nd", "cc-by-nc-nd", "pd"];
  const KEY = "kk_photo_v1_";
  const TTL = 30 * 86400000;
  const mem = {};

  function cacheGet(id) {
    try { const v = JSON.parse(localStorage.getItem(KEY + id)); if (v && Date.now() - v.at < TTL) return v.list; } catch (e) {}
    return null;
  }
  function cacheSet(id, list) { try { localStorage.setItem(KEY + id, JSON.stringify({ at: Date.now(), list })); } catch (e) {} }
  async function j(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }
  const size = (url, s) => url ? url.replace(/\/(square|small|medium|large|original|thumb)\.(jpe?g|png)/i, "/" + s + ".$2") : url;

  async function fromINat(latin) {
    const s = await j("https://api.inaturalist.org/v1/taxa?rank=species,subspecies&is_active=true&per_page=3&q=" + encodeURIComponent(latin));
    const t = (s.results || []).find(r => r.name && r.name.toLowerCase() === latin.toLowerCase()) || (s.results || [])[0];
    if (!t) return [];
    let photos = [];
    try {
      const full = await j("https://api.inaturalist.org/v1/taxa/" + t.id);
      photos = ((full.results && full.results[0] && full.results[0].taxon_photos) || []).map(tp => tp.photo);
    } catch (e) {}
    if (!photos.length && t.default_photo) photos = [t.default_photo];
    return photos
      .filter(p => p && OK_LIC.includes(String(p.license_code || "").toLowerCase()))
      .slice(0, 5)
      .map(p => ({
        src: size(p.medium_url || p.url, "medium"),
        big: size(p.large_url || p.medium_url || p.url, "large"),
        credit: (p.attribution || "").replace(/\s*\(c\)\s*/i, "© "),
        link: "https://www.inaturalist.org/photos/" + p.id
      }));
  }

  async function fromWiki(latin) {
    const s = await j("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(latin.replace(/ /g, "_")));
    const img = (s.originalimage && s.originalimage.source) || (s.thumbnail && s.thumbnail.source);
    if (!img) return [];
    const thumb = s.thumbnail ? s.thumbnail.source.replace(/\/\d+px-/, "/640px-") : img;
    return [{ src: thumb, big: img, credit: "Фото: Википедия / Wikimedia Commons", link: s.content_urls && s.content_urls.desktop ? s.content_urls.desktop.page : "https://commons.wikimedia.org" }];
  }

  async function get(id) {
    if (mem[id]) return mem[id];
    const c = cacheGet(id);
    if (c && c.length) return (mem[id] = c);
    const latin = LATIN[id];
    if (!latin || window.FISH_DEMO) return [];
    let list = [];
    try { list = await fromINat(latin); } catch (e) {}
    if (!list.length) { try { list = await fromWiki(latin); } catch (e) {} }
    if (list.length) { cacheSet(id, list); mem[id] = list; }
    return list;
  }

  // Заранее скачать фото всех рыб (чтобы открывались без интернета)
  async function preloadAll(onProgress) {
    const ids = Object.keys(LATIN);
    let done = 0;
    for (const id of ids) {
      const list = await get(id);
      await Promise.all(list.slice(0, 3).map(p => new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = p.src; })));
      done++; if (onProgress) onProgress(done, ids.length);
    }
  }

  window.PHOTOS = { get, preloadAll, LATIN };
})();
