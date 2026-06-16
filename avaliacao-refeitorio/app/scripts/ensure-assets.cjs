const fs = require("fs");
const path = require("path");
const outDir = path.join(process.cwd(), "assets", "images");
fs.mkdirSync(outDir, { recursive: true });
const png1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axXGNkAAAAASUVORK5CYII=", "base64");
for (const name of [
  "icon.png",
  "splash-icon.png",
  "favicon.png",
  "android-icon-foreground.png",
  "android-icon-background.png",
  "android-icon-monochrome.png"
]) {
  const file = path.join(outDir, name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, png1x1);
}
