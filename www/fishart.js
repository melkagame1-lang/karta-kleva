// Рисунки рыб (SVG, рисуются кодом — работают без интернета) и описание «как узнать».
(function () {
  // Внешний вид: look — как узнать, size — обычный размер
  const LOOK = {
    shchuka: ["Длинное тело-«торпеда», голова вытянутая, пасть широкая, как утиный клюв, с острыми зубами. Спинной плавник сдвинут далеко назад, к хвосту. Бока зеленоватые со светлыми пятнами.", "Обычно 0,5–3 кг, трофейная — больше 10 кг"],
    okun: ["Зеленовато-золотистые бока с 5–7 тёмными поперечными полосами. Два спинных плавника: первый колючий, с тёмным пятном на конце. Нижние плавники и хвост ярко-красные.", "100–400 г, «горбач» — до 1–2 кг"],
    sudak: ["Вытянутое серебристо-серое тело с размытыми тёмными полосами. Два спинных плавника в точках. Большие «стеклянные» глаза, во рту клыки.", "1–3 кг, бывает до 10 кг"],
    bersh: ["Похож на судака, но короче и выше, без больших клыков. Полосы на боках чёткие.", "200–800 г"],
    leshch: ["Очень высокое плоское тело, маленькая голова. Молодой — серебристый («подлещик»), крупный — бронзово-золотистый. Плавники тёмные, длинный анальный плавник снизу.", "0,5–3 кг, бывает до 6 кг"],
    plotva: ["Серебристая рыбка с синеватой спиной. Глаза с красным пятном, плавники оранжево-красные.", "50–300 г"],
    karp: ["Толстое золотисто-бронзовое тело с крупной чешуёй. Длинный спинной плавник, на верхней губе 4 коротких уса.", "1–10 кг, трофеи — больше 20 кг"],
    karas: ["Почти круглое, высокое тело, золотистое (золотой карась) или серебристое. Спинной плавник длинный, усов нет.", "100–700 г"],
    som: ["Огромная плоская голова, пасть-«ведро». Два длинных уса на верхней челюсти и четыре коротких снизу. Чешуи нет, кожа тёмная, пятнистая. Маленький спинной плавник и очень длинный нижний — до хвоста.", "5–30 кг, гиганты — больше 100 кг"],
    zhereh: ["Серебристая рыба с тёмной спиной и большой пастью без зубов. Хвост вильчатый, нижние плавники с красноватым оттенком.", "1–4 кг"],
    golavl: ["Толстое «бревно» с большой лобастой головой. Чешуя крупная, с тёмной окантовкой — получается сеточка. Нижние плавники оранжевые, хвост тёмный.", "300 г – 2 кг"],
    yaz: ["Высокое серебристо-золотистое тело, голова небольшая. Плавники розовато-красные.", "0,5–2 кг"],
    nalim: ["Длинное скользкое тело, как у сома, мраморно-бурое. На подбородке один ус. Два спинных плавника: короткий и очень длинный до хвоста. Хвост круглый.", "0,5–3 кг"],
    harius: ["Большой яркий спинной плавник-«парус» с пятнами. Серебристо-фиолетовые бока с мелкими тёмными точками. Есть маленький жировой плавник у хвоста.", "200–800 г"],
    lenok: ["Золотисто-бурое тело с тёмными круглыми пятнами, небольшой рот. Есть жировой плавник.", "1–3 кг"],
    taimen: ["Крупная хищная рыба: широкая голова, на боках тёмные пятна-крестики. Хвост и нижние плавники красноватые. Есть жировой плавник.", "5–30 кг"],
    sig: ["Серебристая рыба с маленькой головой и маленьким ртом. Есть жировой плавник, хвост глубоко вильчатый.", "0,5–2 кг"],
    omul: ["Как сиг, но тело длиннее и стройнее, спина темнее.", "300 г – 1 кг"],
    semga: ["Крупный серебристый лосось с мелкими чёрными крестиками выше боковой линии. Жировой плавник, хвост почти прямой.", "3–10 кг, бывает до 20 кг"],
    gorbusha: ["Серебристый лосось с чёрными овальными пятнами на хвосте. Во время нереста у самцов вырастает горб и крючковатые челюсти.", "1,5–2,5 кг"],
    kumzha: ["Тело с чёрными и красными пятнами (у речной формы), жировой плавник, хвост прямой. Морская кумжа — серебристая.", "0,5–3 кг"],
    treska: ["Пятнистая зеленовато-бурая рыба со светлой боковой линией. Три спинных плавника, два анальных, на подбородке ус.", "1–5 кг, бывает больше 10 кг"],
    piksha: ["Похожа на треску, но серая, боковая линия чёрная, над грудным плавником — тёмное пятно.", "1–3 кг"],
    kambala: ["Плоская рыба: лежит на боку, оба глаза на одной (верхней) стороне. Верх бурый с пятнами, низ белый. Плавники окаймляют всё тело.", "200 г – 1,5 кг"],
    koryushka: ["Стройная полупрозрачная серебристая рыбка, крупный рот с зубками. Есть жировой плавник. Свежая пахнет огурцом.", "15–25 см, 20–80 г"],
    navaga: ["Небольшая рыба из семейства тресковых: три спинных плавника, ус на подбородке, верхняя челюсть выступает. Спина буро-зелёная, бока светлые.", "15–30 см, 100–300 г"],
    bychok: ["Большая голова, толстые «щёки», пятнистое бурое тело. Брюшные плавники сросшиеся в присоску.", "10–20 см"],
    kefal: ["Вытянутая серебристая рыба с тёмными продольными полосками и тупой головой. Два спинных плавника.", "0,5–3 кг"],
    stavrida: ["Серебристо-синяя рыба с тонким хвостовым стеблем, вдоль боковой линии — ряд жёстких щитков.", "100–300 г"],
    tolstolobik: ["Крупная серебристая рыба с огромной головой, глаза расположены очень низко.", "3–15 кг"],
    amur: ["Вытянутое тело с крупной тёмно-окаймлённой чешуёй, оливково-золотистое. Голова небольшая.", "2–10 кг"],
    lin: ["Толстое оливково-зелёное тело с золотым отливом, мелкая чешуя, много слизи. Маленькие красные глаза, плавники закруглённые.", "300 г – 1,5 кг"],
    chehon: ["Прямая спина и выпуклое брюхо — тело похоже на саблю. Серебристая, рот смотрит вверх.", "200–500 г"],
    krasnoperka: ["Золотистые бока и ярко-красные плавники. Рот направлен вверх.", "100–400 г"],
    vobla: ["Похожа на плотву, но крупнее и выше. Морская, заходит в реки весной.", "150–500 г"],
    syrok: ["Сиговая рыба с высоким телом, верхняя челюсть выступает. Серебристая, есть жировой плавник.", "300 г – 1 кг"],
    seld: ["Узкая серебристая рыба с сине-зелёной спиной, один спинной плавник посередине, вильчатый хвост.", "15–25 см"],
    elec: ["Стройная серебристая рыбка с узкой головой, плавники желтоватые или розоватые.", "50–200 г"],
    ersh: ["Маленькая колючая рыбка, очень слизистая. Буро-пятнистая, большие глаза, спинной плавник с острыми шипами.", "20–80 г"],
    ryapushka: ["Мелкая стройная серебристая сиговая рыбка, нижняя челюсть выступает вперёд. Есть жировой плавник.", "30–100 г"]
  };

  // Параметры рисунка
  // h — половина высоты тела, b — множитель низа, ped — толщина хвостового стебля, m — где тело выше всего
  const S = {
    shchuka: { h: 15, b: 1, ped: 6, m: .45, p: 1.3, col: ["#3d5a2a", "#7c9a4a", "#e8e6c8"], fin: "#8a7a3a", tail: "round", tailH: 17,
      fins: [{ k: "d", s: .72, e: .86, hg: 13, sh: "round" }, { k: "a", s: .74, e: .86, hg: 11, sh: "round" }, { k: "v", s: .55, e: .62, hg: 8 }],
      marks: [{ k: "spots", n: 34, col: "#e3e2b8", r: [2.5, 4], area: "all" }], mouth: "duck" },
    okun: { h: 26, b: .95, ped: 6, m: .38, p: .8, col: ["#2f4a26", "#9fae4a", "#efe8c0"], fin: "#d9502b", tail: "fork", tailH: 18,
      fins: [{ k: "d", s: .25, e: .5, hg: 20, sh: "spiny", col: "#6a7a4a", spot: true }, { k: "d", s: .53, e: .72, hg: 14, col: "#7c8a54" }, { k: "a", s: .62, e: .74, hg: 11 }, { k: "v", s: .32, e: .4, hg: 12 }],
      marks: [{ k: "bars", n: 6, col: "#22331a", op: .55 }], mouth: "mid" },
    sudak: { h: 17, b: 1, ped: 6, m: .38, p: 1, col: ["#4a5550", "#a9b4ab", "#f0f0e8"], fin: "#9aa39a", tail: "fork", tailH: 16,
      fins: [{ k: "d", s: .25, e: .5, hg: 15, sh: "spiny", dots: true }, { k: "d", s: .53, e: .76, hg: 12, dots: true }, { k: "a", s: .62, e: .76, hg: 9 }, { k: "v", s: .3, e: .38, hg: 9 }],
      marks: [{ k: "bars", n: 7, col: "#3a443e", op: .3 }], mouth: "big", fang: true, eyeCol: "#d8e0e0" },
    bersh: { h: 20, b: 1, ped: 6, m: .38, p: .9, col: ["#4a5a4c", "#aab49a", "#f0eee0"], fin: "#a8a890", tail: "fork", tailH: 15,
      fins: [{ k: "d", s: .25, e: .5, hg: 16, sh: "spiny" }, { k: "d", s: .53, e: .74, hg: 12 }, { k: "a", s: .62, e: .74, hg: 9 }, { k: "v", s: .3, e: .38, hg: 9 }],
      marks: [{ k: "bars", n: 7, col: "#2e3a2e", op: .5 }], mouth: "mid" },
    leshch: { h: 36, b: 1, ped: 6, m: .45, p: .7, col: ["#5a4a2a", "#c2a060", "#ece0b8"], fin: "#4a4038", tail: "deep", tailH: 24,
      fins: [{ k: "d", s: .44, e: .55, hg: 22, sh: "tall" }, { k: "a", s: .5, e: .82, hg: 12 }, { k: "v", s: .38, e: .45, hg: 10 }],
      marks: [{ k: "scales", col: "#6a5428", op: .25 }], mouth: "down" },
    plotva: { h: 22, b: 1, ped: 6, m: .4, p: .8, col: ["#34507a", "#c9d2dc", "#f4f4f0"], fin: "#e0682c", tail: "fork", tailH: 16,
      fins: [{ k: "d", s: .42, e: .54, hg: 17, sh: "tall" }, { k: "a", s: .64, e: .74, hg: 10 }, { k: "v", s: .42, e: .48, hg: 10 }],
      marks: [{ k: "scales", col: "#7a8ca0", op: .25 }], mouth: "small", eyeCol: "#d83a2a" },
    karp: { h: 28, b: 1, ped: 8, m: .4, p: .7, col: ["#5a4520", "#c99a3a", "#f0d890"], fin: "#8a5a2a", tail: "fork", tailH: 20,
      fins: [{ k: "d", s: .36, e: .72, hg: 15 }, { k: "a", s: .68, e: .76, hg: 11 }, { k: "v", s: .42, e: .48, hg: 10 }],
      marks: [{ k: "scales", col: "#5a3c14", op: .4, big: true }], mouth: "small", barbels: [{ len: 6 }, { len: 4, low: true }] },
    karas: { h: 34, b: 1, ped: 8, m: .45, p: .65, col: ["#4a4a1e", "#c8a838", "#f2e2a0"], fin: "#9a7a2a", tail: "notch", tailH: 20,
      fins: [{ k: "d", s: .36, e: .7, hg: 16 }, { k: "a", s: .66, e: .74, hg: 11 }, { k: "v", s: .42, e: .48, hg: 10 }],
      marks: [{ k: "scales", col: "#6a5a14", op: .35, big: true }], mouth: "small" },
    som: { h: 20, b: 1.05, ped: 4, m: .2, p: .45, col: ["#2a2e24", "#5a6048", "#c8c4a8"], fin: "#3a3a30", tail: "round", tailH: 13,
      fins: [{ k: "d", s: .28, e: .33, hg: 9 }, { k: "a", s: .4, e: .97, hg: 9 }, { k: "v", s: .38, e: .43, hg: 7 }],
      marks: [{ k: "mottle", n: 30, col: "#1e2218", op: .5 }], mouth: "wide", barbels: [{ len: 40, up: true }, { len: 9, low: true }, { len: 7, low: true }], eyeR: 2 },
    zhereh: { h: 18, b: 1, ped: 6, m: .38, p: 1, col: ["#2e3e4e", "#c0c8d0", "#f4f4f4"], fin: "#9a7a72", tail: "deep", tailH: 18,
      fins: [{ k: "d", s: .42, e: .52, hg: 16, sh: "tall" }, { k: "a", s: .64, e: .76, hg: 10 }, { k: "v", s: .42, e: .48, hg: 9 }],
      marks: [{ k: "scales", col: "#7a8898", op: .2 }], mouth: "big" },
    golavl: { h: 19, b: 1, ped: 7, m: .38, p: .6, col: ["#3a4030", "#b0aa88", "#ece8d0"], fin: "#e07a3a", tail: "fork", tailH: 16,
      fins: [{ k: "d", s: .42, e: .53, hg: 14, col: "#4a4a3a" }, { k: "a", s: .64, e: .74, hg: 10 }, { k: "v", s: .42, e: .48, hg: 9 }],
      marks: [{ k: "scales", col: "#2a2a20", op: .55, big: true }], mouth: "big", tailCol: "#3a3a30" },
    yaz: { h: 24, b: 1, ped: 7, m: .4, p: .75, col: ["#3a4448", "#c8c4a8", "#f2eedc"], fin: "#d8705a", tail: "fork", tailH: 17,
      fins: [{ k: "d", s: .42, e: .54, hg: 16 }, { k: "a", s: .64, e: .74, hg: 10 }, { k: "v", s: .42, e: .48, hg: 10 }],
      marks: [{ k: "scales", col: "#8a8670", op: .25 }], mouth: "small" },
    nalim: { h: 14, b: 1, ped: 5, m: .25, p: .5, col: ["#3a3220", "#8a7a4a", "#d8ccaa"], fin: "#5a4e30", tail: "round", tailH: 12,
      fins: [{ k: "d", s: .32, e: .4, hg: 8, sh: "round" }, { k: "d", s: .42, e: .95, hg: 8 }, { k: "a", s: .45, e: .95, hg: 7 }, { k: "v", s: .16, e: .2, hg: 9 }],
      marks: [{ k: "mottle", n: 40, col: "#2a2414", op: .55 }], mouth: "wide", barbels: [{ len: 9, chin: true }] },
    harius: { h: 18, b: 1, ped: 5, m: .38, p: .9, col: ["#3a3a4a", "#a8a4b8", "#eeeef2"], fin: "#8a6a7a", tail: "fork", tailH: 15,
      fins: [{ k: "d", s: .3, e: .6, hg: 26, sh: "sail", col: "#5a4a7a", dots: true, dotCol: "#e85a5a" }, { k: "ad", s: .76, e: .8, hg: 5 }, { k: "a", s: .66, e: .74, hg: 9 }, { k: "v", s: .44, e: .5, hg: 10, col: "#c86a5a" }],
      marks: [{ k: "spots", n: 10, col: "#2a2a30", r: [1, 1.8], area: "front" }], mouth: "small" },
    lenok: { h: 19, b: 1, ped: 6, m: .4, p: .9, col: ["#4a3a22", "#b89a5a", "#ece0c0"], fin: "#9a7a5a", tail: "fork", tailH: 15,
      fins: [{ k: "d", s: .38, e: .5, hg: 15 }, { k: "ad", s: .76, e: .8, hg: 5 }, { k: "a", s: .66, e: .74, hg: 9 }, { k: "v", s: .44, e: .5, hg: 9 }],
      marks: [{ k: "spots", n: 26, col: "#2a1e10", r: [1.6, 2.8], area: "top" }], mouth: "small" },
    taimen: { h: 17, b: 1, ped: 7, m: .38, p: .8, col: ["#3a3030", "#9a8a80", "#ece0d8"], fin: "#c0503a", tail: "notch", tailH: 16,
      fins: [{ k: "d", s: .38, e: .5, hg: 13, col: "#6a5a50" }, { k: "ad", s: .76, e: .8, hg: 5 }, { k: "a", s: .66, e: .74, hg: 10 }, { k: "v", s: .44, e: .5, hg: 9 }],
      marks: [{ k: "xspots", n: 34, col: "#1e1414", area: "top" }], mouth: "big" },
    sig: { h: 19, b: 1, ped: 5, m: .4, p: 1, col: ["#3a4a5a", "#c8d0d8", "#f6f6f6"], fin: "#9aa0a8", tail: "deep", tailH: 18,
      fins: [{ k: "d", s: .4, e: .52, hg: 15, sh: "tall" }, { k: "ad", s: .76, e: .8, hg: 5 }, { k: "a", s: .66, e: .74, hg: 9 }, { k: "v", s: .44, e: .5, hg: 9 }],
      marks: [{ k: "scales", col: "#8a98a8", op: .2 }], mouth: "tiny" },
    omul: { h: 16, b: 1, ped: 5, m: .4, p: 1, col: ["#2a3a48", "#b8c4cc", "#f4f4f4"], fin: "#8a96a0", tail: "deep", tailH: 17,
      fins: [{ k: "d", s: .4, e: .52, hg: 14, sh: "tall" }, { k: "ad", s: .76, e: .8, hg: 5 }, { k: "a", s: .66, e: .74, hg: 9 }, { k: "v", s: .44, e: .5, hg: 9 }],
      marks: [{ k: "scales", col: "#7a8898", op: .2 }], mouth: "small" },
    semga: { h: 20, b: 1, ped: 7, m: .4, p: .9, col: ["#2a3a4a", "#c8d0d8", "#f6f6f4"], fin: "#7a8a98", tail: "notch", tailH: 18,
      fins: [{ k: "d", s: .38, e: .5, hg: 14 }, { k: "ad", s: .76, e: .8, hg: 5 }, { k: "a", s: .66, e: .74, hg: 10 }, { k: "v", s: .44, e: .5, hg: 9 }],
      marks: [{ k: "xspots", n: 14, col: "#1a2028", area: "top" }], mouth: "big" },
    gorbusha: { h: 21, b: 1, ped: 6, m: .38, p: .9, col: ["#2a3a48", "#c0c8cc", "#f4f4f2"], fin: "#7a8a90", tail: "fork", tailH: 17,
      fins: [{ k: "d", s: .38, e: .5, hg: 14 }, { k: "ad", s: .76, e: .8, hg: 5 }, { k: "a", s: .66, e: .74, hg: 10 }, { k: "v", s: .44, e: .5, hg: 9 }],
      marks: [{ k: "spots", n: 10, col: "#1a1e22", r: [1.4, 2.4], area: "back" }], tailSpots: true, mouth: "big" },
    kumzha: { h: 19, b: 1, ped: 7, m: .4, p: .85, col: ["#4a4030", "#b8a880", "#f0e8d4"], fin: "#8a7a5a", tail: "square", tailH: 16,
      fins: [{ k: "d", s: .38, e: .5, hg: 14, dots: true, dotCol: "#2a2014" }, { k: "ad", s: .76, e: .8, hg: 5, col: "#c8603a" }, { k: "a", s: .66, e: .74, hg: 10 }, { k: "v", s: .44, e: .5, hg: 9 }],
      marks: [{ k: "spots", n: 22, col: "#1e1610", r: [1.6, 2.6], area: "top" }, { k: "spots", n: 9, col: "#d8442a", r: [1.6, 2.2], area: "mid", ring: true }], mouth: "big" },
    treska: { h: 21, b: 1.05, ped: 6, m: .35, p: .7, col: ["#4a4a2a", "#a8a070", "#ece8d4"], fin: "#7a7450", tail: "square", tailH: 15,
      fins: [{ k: "d", s: .3, e: .42, hg: 13, sh: "round" }, { k: "d", s: .46, e: .62, hg: 11, sh: "round" }, { k: "d", s: .66, e: .8, hg: 10, sh: "round" }, { k: "a", s: .46, e: .62, hg: 9 }, { k: "a", s: .66, e: .8, hg: 9 }, { k: "v", s: .2, e: .25, hg: 9 }],
      marks: [{ k: "mottle", n: 50, col: "#3a3418", op: .45 }, { k: "lateral", col: "#f4f0dc", op: .9 }], mouth: "big", barbels: [{ len: 7, chin: true }] },
    piksha: { h: 20, b: 1.05, ped: 6, m: .35, p: .75, col: ["#3a3e44", "#a4a8b0", "#eeeef0"], fin: "#5a5e66", tail: "notch", tailH: 15,
      fins: [{ k: "d", s: .3, e: .42, hg: 16, sh: "tall" }, { k: "d", s: .46, e: .62, hg: 11, sh: "round" }, { k: "d", s: .66, e: .8, hg: 10, sh: "round" }, { k: "a", s: .46, e: .62, hg: 9 }, { k: "a", s: .66, e: .8, hg: 9 }, { k: "v", s: .2, e: .25, hg: 9 }],
      marks: [{ k: "lateral", col: "#1a1c20", op: .9 }, { k: "blotch", t: .27, col: "#1a1c20" }], mouth: "small", barbels: [{ len: 4, chin: true }] },
    kambala: { flat: true, col: ["#6a5434", "#8a6c44"], spot: "#e07a2a" },
    koryushka: { h: 12, b: 1, ped: 4, m: .4, p: 1.1, col: ["#5a7a6a", "#d0dcd4", "#f4f6f4"], fin: "#a8b8b0", tail: "deep", tailH: 14,
      fins: [{ k: "d", s: .44, e: .54, hg: 12, sh: "tall" }, { k: "ad", s: .78, e: .81, hg: 4 }, { k: "a", s: .64, e: .78, hg: 8 }, { k: "v", s: .44, e: .5, hg: 7 }],
      marks: [{ k: "stripe", col: "#a8c0e0", op: .6 }], mouth: "big", glass: true },
    navaga: { h: 15, b: 1.05, ped: 4, m: .32, p: .7, col: ["#4a5034", "#b0b494", "#f0eee0"], fin: "#8a8a68", tail: "square", tailH: 12,
      fins: [{ k: "d", s: .28, e: .38, hg: 10, sh: "round" }, { k: "d", s: .42, e: .6, hg: 9, sh: "round" }, { k: "d", s: .64, e: .82, hg: 8, sh: "round" }, { k: "a", s: .42, e: .6, hg: 7 }, { k: "a", s: .64, e: .82, hg: 7 }, { k: "v", s: .18, e: .22, hg: 8 }],
      marks: [{ k: "mottle", n: 26, col: "#3a3c24", op: .3, area: "top" }], mouth: "over", barbels: [{ len: 4, chin: true }] },
    bychok: { h: 18, b: .9, ped: 6, m: .2, p: .4, col: ["#4a3e2a", "#8a7a58", "#d8ccb0"], fin: "#6a5e40", tail: "round", tailH: 13,
      fins: [{ k: "d", s: .3, e: .42, hg: 11, sh: "round" }, { k: "d", s: .45, e: .8, hg: 10 }, { k: "a", s: .5, e: .8, hg: 8 }, { k: "v", s: .2, e: .3, hg: 7 }],
      marks: [{ k: "mottle", n: 28, col: "#2a2014", op: .5 }], mouth: "wide" },
    kefal: { h: 16, b: 1, ped: 6, m: .38, p: .7, col: ["#3a4a5a", "#c4ccd4", "#f6f6f6"], fin: "#8a96a0", tail: "fork", tailH: 15,
      fins: [{ k: "d", s: .36, e: .44, hg: 11, sh: "spiny" }, { k: "d", s: .58, e: .68, hg: 10 }, { k: "a", s: .58, e: .7, hg: 9 }, { k: "v", s: .36, e: .42, hg: 8 }],
      marks: [{ k: "stripes", n: 5, col: "#5a6a7a", op: .5 }], mouth: "small" },
    stavrida: { h: 16, b: 1, ped: 3, m: .38, p: .9, col: ["#2a4a6a", "#c0ccd8", "#f6f6f6"], fin: "#a0b0c0", tail: "deep", tailH: 17,
      fins: [{ k: "d", s: .3, e: .42, hg: 11, sh: "spiny" }, { k: "d", s: .45, e: .82, hg: 7 }, { k: "a", s: .5, e: .82, hg: 6 }, { k: "v", s: .3, e: .35, hg: 8 }],
      marks: [{ k: "scutes", col: "#6a7a8a" }], mouth: "big" },
    tolstolobik: { h: 25, b: 1, ped: 7, m: .4, p: .55, col: ["#4a5460", "#c8ccd0", "#f4f4f2"], fin: "#9aa0a8", tail: "fork", tailH: 18,
      fins: [{ k: "d", s: .44, e: .52, hg: 14 }, { k: "a", s: .62, e: .76, hg: 9 }, { k: "v", s: .42, e: .48, hg: 9 }],
      marks: [], mouth: "up", eyeLow: true, bigHead: true },
    amur: { h: 17, b: 1, ped: 7, m: .4, p: .7, col: ["#3a4428", "#a8a060", "#e8e0b8"], fin: "#6a6a40", tail: "fork", tailH: 15,
      fins: [{ k: "d", s: .4, e: .5, hg: 13 }, { k: "a", s: .66, e: .74, hg: 9 }, { k: "v", s: .42, e: .48, hg: 9 }],
      marks: [{ k: "scales", col: "#2a2a14", op: .5, big: true }], mouth: "small" },
    lin: { h: 21, b: 1, ped: 9, m: .4, p: .6, col: ["#2e3a1a", "#6a7a2a", "#b8b064"], fin: "#3e4a20", tail: "square", tailH: 15,
      fins: [{ k: "d", s: .42, e: .54, hg: 13, sh: "round" }, { k: "a", s: .62, e: .72, hg: 10, sh: "round" }, { k: "v", s: .4, e: .48, hg: 12, sh: "round" }],
      marks: [], mouth: "small", eyeCol: "#c8402a", barbels: [{ len: 3 }] },
    chehon: { h: 14, b: 1.5, ped: 4, m: .3, p: 1, col: ["#3a4a58", "#ccd4dc", "#f6f6f6"], fin: "#a8b0b8", tail: "deep", tailH: 15, flatTop: true,
      fins: [{ k: "d", s: .66, e: .74, hg: 10 }, { k: "a", s: .48, e: .84, hg: 9 }, { k: "v", s: .42, e: .46, hg: 7 }],
      marks: [], mouth: "up" },
    krasnoperka: { h: 23, b: 1, ped: 6, m: .42, p: .8, col: ["#4a4a28", "#d0b858", "#f2e8c0"], fin: "#e0402a", tail: "fork", tailH: 16,
      fins: [{ k: "d", s: .48, e: .58, hg: 15, sh: "tall" }, { k: "a", s: .64, e: .74, hg: 10 }, { k: "v", s: .4, e: .46, hg: 10 }],
      marks: [{ k: "scales", col: "#8a7a30", op: .3 }], mouth: "up" },
    vobla: { h: 24, b: 1, ped: 6, m: .4, p: .8, col: ["#3a4a5a", "#c4ccd0", "#f4f4f0"], fin: "#c8704a", tail: "fork", tailH: 16,
      fins: [{ k: "d", s: .42, e: .54, hg: 17, sh: "tall" }, { k: "a", s: .64, e: .74, hg: 10 }, { k: "v", s: .42, e: .48, hg: 10 }],
      marks: [{ k: "scales", col: "#7a8890", op: .25 }], mouth: "small", eyeCol: "#d8603a" },
    syrok: { h: 22, b: 1, ped: 5, m: .4, p: .9, col: ["#3a4656", "#c8d0d8", "#f6f6f6"], fin: "#9aa0a8", tail: "deep", tailH: 18,
      fins: [{ k: "d", s: .4, e: .52, hg: 16, sh: "tall" }, { k: "ad", s: .76, e: .8, hg: 5 }, { k: "a", s: .66, e: .74, hg: 9 }, { k: "v", s: .44, e: .5, hg: 9 }],
      marks: [{ k: "scales", col: "#8a98a8", op: .2 }], mouth: "over" },
    seld: { h: 14, b: 1, ped: 4, m: .4, p: 1, col: ["#24486a", "#c4d0dc", "#f6f8f8"], fin: "#9aaab8", tail: "deep", tailH: 15,
      fins: [{ k: "d", s: .42, e: .52, hg: 11, sh: "tall" }, { k: "a", s: .72, e: .8, hg: 6 }, { k: "v", s: .46, e: .5, hg: 7 }],
      marks: [{ k: "scales", col: "#8898a8", op: .2 }], mouth: "up" },
    elec: { h: 15, b: 1, ped: 5, m: .4, p: 1, col: ["#3a4652", "#c8d0d4", "#f4f4f2"], fin: "#d8c890", tail: "deep", tailH: 15,
      fins: [{ k: "d", s: .42, e: .52, hg: 13, sh: "tall" }, { k: "a", s: .64, e: .74, hg: 9 }, { k: "v", s: .42, e: .48, hg: 9 }],
      marks: [{ k: "scales", col: "#7a8890", op: .2 }], mouth: "small" },
    ersh: { h: 19, b: .95, ped: 5, m: .32, p: .6, col: ["#4a4a2a", "#a49a68", "#e8e0c4"], fin: "#8a8458", tail: "fork", tailH: 13,
      fins: [{ k: "d", s: .25, e: .74, hg: 15, sh: "spiny", dots: true }, { k: "a", s: .62, e: .72, hg: 9 }, { k: "v", s: .3, e: .36, hg: 9 }],
      marks: [{ k: "mottle", n: 30, col: "#2a2814", op: .5 }], mouth: "small", eyeR: 6.5 },
    ryapushka: { h: 13, b: 1, ped: 4, m: .4, p: 1, col: ["#3a4a5a", "#ccd4dc", "#f6f6f6"], fin: "#a0a8b0", tail: "deep", tailH: 14,
      fins: [{ k: "d", s: .4, e: .52, hg: 12, sh: "tall" }, { k: "ad", s: .76, e: .8, hg: 4 }, { k: "a", s: .66, e: .76, hg: 8 }, { k: "v", s: .44, e: .5, hg: 8 }],
      marks: [], mouth: "up" }
  };

  // Генератор псевдослучайных чисел — чтобы пятна всегда были на тех же местах
  function rng(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  const X0 = 16, X1 = 190, CY = 50;
  const memo = {};
  function draw(id, cls) {
    const k = id + "|" + (cls || "");
    if (memo[k]) return memo[k];
    return (memo[k] = drawRaw(id, cls));
  }
  function drawRaw(id, cls) {
    const P = S[id];
    if (!P) return "";
    if (P.flat) return drawFlat(id, P, cls);
    const L = X1 - X0;
    // половина высоты в точке t (0 — нос, 1 — хвостовой стебель)
    const f = t => {
      const r = P.ped / P.h;
      if (t < P.m) return P.h * Math.pow(Math.sin(Math.PI / 2 * t / P.m), P.p);
      return P.h * (r + (1 - r) * Math.pow(Math.cos(Math.PI / 2 * (t - P.m) / (1 - P.m)), 1.15));
    };
    const top = t => CY - (P.flatTop ? Math.min(f(t), P.h * .9) * .8 : f(t));
    const bot = t => CY + f(t) * P.b * (P.flatTop ? 1 : 1);
    const xt = t => X0 + t * L;
    const N = 48;
    let pts = [];
    for (let i = 0; i <= N; i++) { const t = i / N; pts.push([xt(t), top(t)]); }
    for (let i = N; i >= 0; i--) { const t = i / N; pts.push([xt(t), bot(t)]); }
    const body = "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";
    const gid = "g_" + id + "_" + Math.floor(Math.random() * 1e6);
    const R = rng(id);
    const fin = P.fin, out = "rgba(20,24,20,.55)";
    let back = "", front = "", marks = "";

    // Хвост
    const ty = P.tailH, tx = X1 + 30, py = P.ped;
    const tc = P.tailCol || fin;
    let tailD;
    if (P.tail === "fork") tailD = `M${X1 - 2} ${CY - py} L${tx} ${CY - ty} Q${X1 + 16} ${CY} ${tx} ${CY + ty} L${X1 - 2} ${CY + py} Z`;
    else if (P.tail === "deep") tailD = `M${X1 - 2} ${CY - py} L${tx + 2} ${CY - ty} Q${X1 + 8} ${CY} ${tx + 2} ${CY + ty} L${X1 - 2} ${CY + py} Z`;
    else if (P.tail === "notch") tailD = `M${X1 - 2} ${CY - py} L${tx} ${CY - ty} Q${X1 + 22} ${CY} ${tx} ${CY + ty} L${X1 - 2} ${CY + py} Z`;
    else if (P.tail === "square") tailD = `M${X1 - 2} ${CY - py} L${tx - 2} ${CY - ty} Q${tx + 2} ${CY} ${tx - 2} ${CY + ty} L${X1 - 2} ${CY + py} Z`;
    else tailD = `M${X1 - 2} ${CY - py} C${tx + 4} ${CY - ty * 1.3} ${tx + 4} ${CY + ty * 1.3} ${X1 - 2} ${CY + py} Z`;
    back += `<path d="${tailD}" fill="${tc}" stroke="${out}" stroke-width=".8"/>`;
    // лучи хвоста
    if (false) for (let i = -3; i <= 3; i++) back += `<line x1="${X1}" y1="${CY + i * py / 4}" x2="${tx - 6}" y2="${CY + i * ty / 3.6}" stroke="${out}" stroke-width=".4" opacity=".5"/>`;
    if (P.tailSpots) for (let i = 0; i < 9; i++) back += `<ellipse cx="${X1 + 8 + R() * 18}" cy="${CY + (R() - .5) * ty * 1.4}" rx="2" ry="1.3" fill="#1a1e22"/>`;

    // Плавники
    (P.fins || []).forEach(fn => {
      const c = fn.col || fin;
      const x1 = xt(fn.s), x2 = xt(fn.e), w = x2 - x1;
      if (fn.k === "d" || fn.k === "ad") {
        const y1 = top(fn.s) + 1.5, y2 = top(fn.e) + 1.5;
        let d;
        if (fn.k === "ad") d = `M${x1} ${y1} Q${x1 + w * .3} ${y1 - fn.hg} ${x2 + 3} ${y2 - fn.hg * .6} Q${x2} ${y2} ${x2} ${y2} Z`;
        else if (fn.sh === "sail") d = `M${x1} ${y1} C${x1 + w * .05} ${y1 - fn.hg} ${x1 + w * .7} ${y1 - fn.hg * 1.15} ${x2 + 6} ${y2 - fn.hg * .5} L${x2} ${y2} Z`;
        else if (fn.sh === "tall") d = `M${x1} ${y1} L${x1 + w * .25} ${y1 - fn.hg} Q${x1 + w * .7} ${y1 - fn.hg * .9} ${x2 + 3} ${y2 - fn.hg * .25} L${x2} ${y2} Z`;
        else if (fn.sh === "round") d = `M${x1} ${y1} Q${x1 + w * .5} ${y1 - fn.hg * 1.5} ${x2 + 2} ${y2} Z`;
        else if (fn.sh === "spiny") {
          d = `M${x1} ${y1}`;
          const n = Math.max(5, Math.round(w / 4));
          for (let i = 0; i <= n; i++) { const xx = x1 + w * i / n; const yy = top(fn.s + (fn.e - fn.s) * i / n) + 1.5; const hh = fn.hg * (i < n * .3 ? .7 + i / n : 1 - (i - n * .3) / n * .7); d += ` L${xx.toFixed(1)} ${(yy - hh).toFixed(1)} L${(xx + w / n / 2).toFixed(1)} ${(yy - hh * .55).toFixed(1)}`; }
          d += ` L${x2} ${y2} Z`;
        } else d = `M${x1} ${y1} L${x1 + w * .15} ${y1 - fn.hg} L${x2 - w * .1} ${y2 - fn.hg * .55} L${x2} ${y2} Z`;
        back += `<path d="${d}" fill="${c}" stroke="${out}" stroke-width=".7"/>`;
        if (fn.dots && false) { const dc = fn.dotCol || "#1e1e1a"; for (let i = 0; i < Math.round(w / 3.5); i++) back += `<circle cx="${(x1 + 3 + R() * (w - 4)).toFixed(1)}" cy="${(y1 - 2 - R() * fn.hg * .7).toFixed(1)}" r="${(.8 + R() * .8).toFixed(1)}" fill="${dc}" opacity=".8"/>`; }
        if (fn.spot) back += `<ellipse cx="${x2 - w * .18}" cy="${y2 - fn.hg * .45}" rx="${w * .1}" ry="${fn.hg * .25}" fill="#1a1a14"/>`;
      } else if (fn.k === "a") {
        const y1 = bot(fn.s) - 1.5, y2 = bot(fn.e) - 1.5;
        const d = fn.sh === "round" ? `M${x1} ${y1} Q${x1 + w * .5} ${y1 + fn.hg * 1.5} ${x2 + 2} ${y2} Z` : `M${x1} ${y1} L${x1 + w * .2} ${y1 + fn.hg} L${x2 - w * .05} ${y2 + fn.hg * .5} L${x2} ${y2} Z`;
        back += `<path d="${d}" fill="${c}" stroke="${out}" stroke-width=".7"/>`;
      } else if (fn.k === "v") {
        const y1 = bot(fn.s) - 2;
        const d = fn.sh === "round" ? `M${x1} ${y1} Q${x1 + w} ${y1 + fn.hg * 1.3} ${x2 + 6} ${y1 + 2} Z` : `M${x1} ${y1} L${x2 + 6} ${y1 + fn.hg} L${x2 + 2} ${y1 + 1} Z`;
        back += `<path d="${d}" fill="${c}" stroke="${out}" stroke-width=".7"/>`;
      }
    });

    // Узоры на теле (обрезаются по контуру)
    (P.marks || []).forEach(mk => {
      if (mk.k === "spots" || mk.k === "xspots" || mk.k === "mottle") {
        const n = Math.min(mk.n || 20, 14);
        for (let i = 0; i < n; i++) {
          let t = .12 + R() * .82;
          let lo = 0, hi = 1;
          if (mk.area === "top" || mk.area === "back") { lo = 0; hi = .5; }
          if (mk.area === "front") { t = .14 + R() * .35; lo = .2; hi = .6; }
          if (mk.area === "mid") { lo = .35; hi = .65; }
          if (mk.area === "back") t = .45 + R() * .5;
          const v = lo + R() * (hi - lo);
          const x = xt(t), y = top(t) + (bot(t) - top(t)) * v;
          if (mk.k === "xspots") marks += `<path d="M${(x - 1.6).toFixed(1)} ${(y - 1.6).toFixed(1)} l3.2 3.2 m0 -3.2 l-3.2 3.2" stroke="${mk.col}" stroke-width="1.1" stroke-linecap="round"/>`;
          else if (mk.k === "mottle") marks += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(2 + R() * 4).toFixed(1)}" ry="${(1.5 + R() * 2.5).toFixed(1)}" fill="${mk.col}" opacity="${mk.op || .5}"/>`;
          else { const r = mk.r[0] + R() * (mk.r[1] - mk.r[0]); marks += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * (mk.ring ? 1 : 1.3)).toFixed(1)}" ry="${r.toFixed(1)}" fill="${mk.col}"${mk.ring ? ' stroke="#f4ece0" stroke-width=".8"' : ""}/>`; }
        }
      } else if (mk.k === "bars") {
        for (let i = 0; i < mk.n; i++) {
          const t = .22 + i * (.6 / mk.n), w = .035;
          marks += `<path d="M${xt(t)} ${top(t) - 2} L${xt(t + w)} ${top(t + w) - 2} L${xt(t + w * .6)} ${CY + f(t) * .55} L${xt(t)} ${CY + f(t) * .5} Z" fill="${mk.col}" opacity="${mk.op}"/>`;
        }
      } else if (mk.k === "scales") {
        return; // чешуя не рисуется — так рисунок лёгкий
        const st = mk.big ? 7 : 5;
        for (let x = X0 + 34; x < X1 - 6; x += st) for (let y = CY - 40; y < CY + 40; y += st * .8) {
          const off = (Math.round((y - CY) / (st * .8)) % 2) * st / 2;
          marks += `<path d="M${x + off - st / 2} ${y} q${st / 2} ${st * .55} ${st} 0" fill="none" stroke="${mk.col}" stroke-width="${mk.big ? .9 : .6}" opacity="${mk.op}"/>`;
        }
      } else if (mk.k === "lateral") {
        let d = ""; for (let i = 0; i <= 30; i++) { const t = .2 + i / 30 * .78; d += (i ? " L" : "M") + xt(t).toFixed(1) + " " + (top(t) + (CY - top(t)) * .45).toFixed(1); }
        marks += `<path d="${d}" fill="none" stroke="${mk.col}" stroke-width="1.3" opacity="${mk.op}"/>`;
      } else if (mk.k === "stripe") {
        marks += `<path d="M${xt(.18)} ${CY - 1} L${xt(.95)} ${CY}" stroke="${mk.col}" stroke-width="3" opacity="${mk.op}"/>`;
      } else if (mk.k === "stripes") {
        for (let i = 0; i < mk.n; i++) { const v = .12 + i * .14; let d = ""; for (let j = 0; j <= 20; j++) { const t = .2 + j / 20 * .76; d += (j ? " L" : "M") + xt(t).toFixed(1) + " " + (top(t) + (bot(t) - top(t)) * v).toFixed(1); } marks += `<path d="${d}" fill="none" stroke="${mk.col}" stroke-width="1.4" opacity="${mk.op}"/>`; }
      } else if (mk.k === "blotch") {
        marks += `<ellipse cx="${xt(mk.t)}" cy="${CY - f(mk.t) * .35}" rx="5" ry="4" fill="${mk.col}"/>`;
      } else if (mk.k === "scutes") {
        for (let i = 0; i < 26; i++) { const t = .3 + i / 26 * .68; marks += `<path d="M${xt(t)} ${CY - 2} l2 -2 l2 2 l-2 2 Z" fill="${mk.col}" opacity=".7"/>`; }
      }
    });

    // Голова: жаберная крышка, глаз, рот
    const te = P.bigHead ? .1 : .085, ex = xt(te), ey = P.eyeLow ? CY + 2 : top(te) + (CY - top(te)) * .55;
    const er = P.eyeR || Math.max(3.2, Math.min(5.5, P.h * .2));
    const gt = P.bigHead ? .27 : .2;
    const gx = xt(gt);
    front += `<path d="M${gx - 4} ${top(gt) + 3} Q${gx + 5} ${CY} ${gx - 4} ${bot(gt) - 3}" fill="none" stroke="${out}" stroke-width="1"/>`;
    front += `<circle cx="${ex}" cy="${ey}" r="${er}" fill="${P.eyeCol || "#e8e2c8"}" stroke="${out}" stroke-width=".6"/><circle cx="${ex - er * .15}" cy="${ey}" r="${er * .55}" fill="#111"/><circle cx="${ex - er * .35}" cy="${ey - er * .3}" r="${er * .18}" fill="#fff"/>`;
    const mx = X0, my = CY + (P.mouth === "up" ? -1 : P.mouth === "down" ? 4 : 2);
    const ml = { tiny: 4, small: 7, mid: 11, big: 16, wide: 18, duck: 22, over: 9, up: 8, down: 7 }[P.mouth] || 8;
    front += `<path d="M${mx + 1} ${my} Q${mx + ml * .6} ${my + 2} ${mx + ml} ${my + (P.mouth === "up" ? 3 : 1)}" fill="none" stroke="${out}" stroke-width="1.2" stroke-linecap="round"/>`;
    if (P.fang) front += `<path d="M${mx + 5} ${my} l1 3 l1 -3" fill="#fff" stroke="${out}" stroke-width=".4"/>`;
    (P.barbels || []).forEach((b, i) => {
      if (b.chin) front += `<path d="M${mx + 10} ${bot(.06) - 1} q-2 ${b.len * .6} ${-1} ${b.len}" fill="none" stroke="${fin}" stroke-width="1.4" stroke-linecap="round"/>`;
      else if (b.up) front += `<path d="M${mx + 4} ${my - 1} q${-10} ${-8} ${-6} ${b.len * .3} t${8} ${b.len * .45}" fill="none" stroke="${P.col[0]}" stroke-width="1.6" stroke-linecap="round"/>`;
      else front += `<path d="M${mx + 6 + i * 3} ${my + (b.low ? 2 : 0)} q-3 ${b.len * .5} ${-1} ${b.len}" fill="none" stroke="${P.col[0]}" stroke-width="1" stroke-linecap="round"/>`;
    });

    return `<svg class="${cls || "fishart"}" viewBox="0 0 236 100" role="img" aria-label="${(window.FISH[id] || {}).n || ""}">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${P.col[0]}"/><stop offset=".45" stop-color="${P.col[1]}"/><stop offset="1" stop-color="${P.col[2]}"/>
        </linearGradient>
        <clipPath id="${gid}c"><path d="${body}"/></clipPath>
      </defs>
      ${back}
      <path d="${body}" fill="url(#${gid})" ${P.glass ? 'opacity=".9"' : ""}/>
      <g clip-path="url(#${gid}c)">${marks}</g>
      <path d="${body}" fill="none" stroke="${out}" stroke-width="1"/>
      ${front}
    </svg>`;
  }

  // Камбала — вид сверху
  function drawFlat(id, P, cls) {
    const R = rng(id);
    let spots = "";
    for (let i = 0; i < 16; i++) spots += `<circle cx="${(70 + R() * 100).toFixed(1)}" cy="${(30 + R() * 40).toFixed(1)}" r="${(2 + R() * 2).toFixed(1)}" fill="${P.spot}" opacity=".9"/>`;
    return `<svg class="${cls || "fishart"}" viewBox="0 0 236 100" role="img" aria-label="Камбала">
      <ellipse cx="118" cy="50" rx="92" ry="40" fill="${P.col[1]}" stroke="rgba(20,24,20,.55)" stroke-width=".8" opacity=".75"/>
      <path d="M202 50 L228 30 Q222 50 228 70 Z" fill="${P.col[1]}" stroke="rgba(20,24,20,.55)" stroke-width=".8"/>
      <ellipse cx="116" cy="50" rx="80" ry="31" fill="${P.col[0]}" stroke="rgba(20,24,20,.55)" stroke-width="1"/>
      <path d="M60 30 Q50 50 60 70" fill="none" stroke="rgba(20,24,20,.5)" stroke-width="1"/>
      ${spots}
      <circle cx="48" cy="40" r="4" fill="#e8e2c8" stroke="#333" stroke-width=".5"/><circle cx="47" cy="40" r="2.2" fill="#111"/>
      <circle cx="52" cy="50" r="4" fill="#e8e2c8" stroke="#333" stroke-width=".5"/><circle cx="51" cy="50" r="2.2" fill="#111"/>
      <path d="M38 56 q4 4 8 2" fill="none" stroke="rgba(20,24,20,.6)" stroke-width="1.2"/>
    </svg>`;
  }

  window.FISHART = { draw, LOOK };
})();
