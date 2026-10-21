// Добавляет в Android-проект разрешения на интернет и геолокацию (кнопка «Я» на карте).
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "android", "app", "src", "main", "AndroidManifest.xml");
let xml = fs.readFileSync(file, "utf8");
const perms = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.POST_NOTIFICATIONS"
];
for (const p of perms) {
  if (!xml.includes(`"${p}"`)) {
    xml = xml.replace("</manifest>", `    <uses-permission android:name="${p}" />\n</manifest>`);
  }
}
fs.writeFileSync(file, xml);
console.log("AndroidManifest.xml: разрешения добавлены");
