// Настраивает подпись release-сборки и номер версии в android/app/build.gradle.
// Пароль ключа берётся из переменной окружения SIGNING_PASSWORD (секрет GitHub).
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "android", "app", "build.gradle");
let g = fs.readFileSync(file, "utf8");

const run = parseInt(process.env.BUILD_NUMBER || "1", 10);
const code = 100 + run;
const name = "1." + run;
g = g.replace(/versionCode\s+\d+/, "versionCode " + code);
g = g.replace(/versionName\s+"[^"]*"/, 'versionName "' + name + '"');

if (!g.includes("signingConfigs {")) {
  g = g.replace(/(\n\s*buildTypes\s*\{)/, `
    signingConfigs {
        release {
            storeFile file("../../signing/karta-kleva-release.jks")
            storePassword System.getenv("SIGNING_PASSWORD")
            keyAlias "karta-kleva"
            keyPassword System.getenv("SIGNING_PASSWORD")
        }
    }
$1`);
  g = g.replace(/(buildTypes\s*\{\s*release\s*\{)/, "$1\n            signingConfig signingConfigs.release");
}
fs.writeFileSync(file, g);
console.log("build.gradle: версия " + name + " (" + code + "), подпись release настроена");
