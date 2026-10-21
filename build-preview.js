// Собирает один HTML-файл для предпросмотра (демо-погода, всё встроено)
const fs = require("fs"), p = f => fs.readFileSync(__dirname + "/" + f, "utf8");
const html = p("www/index.html");
const app = html.split("<!--APP-->")[1].split("<!--/APP-->")[0];
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];
const js = ["www/config.js", "www/lib/leaflet.js", "www/basemap.js", "www/data.js", "www/pits.js", "www/catches.js", "www/forecast.js", "www/fishart.js", "www/photos.js", "www/tips.js", "www/rules.js", "src/demo.js", "www/diary.js", "www/app.js", "www/ui2.js"]
  .map(f => "<script>\n" + p(f).replace(/<\/script/g, "<\\/script") + "\n</script>").join("\n");
const out = `<title>Карта клёва</title>\n${fonts}\n<style>\n${p("www/lib/leaflet.css").replace(/url\([^)]*\)/g, "none")}\n${p("www/style.css")}\n</style>\n${app}\n${js}\n`;
fs.writeFileSync(__dirname + "/preview.html", out);
console.log("preview.html", out.length);
