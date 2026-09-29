import {
  copyFile,
  mkdir
} from "node:fs/promises";

await mkdir("dist", {
  recursive: true
});

await mkdir("dist/sidepanel", {
  recursive: true
});

await copyFile(
  "src/manifest.json",
  "dist/manifest.json"
);

await copyFile(
  "src/sidepanel/sidepanel.html",
  "dist/sidepanel/sidepanel.html"
);

await copyFile(
  "src/sidepanel/sidepanel.css",
  "dist/sidepanel/sidepanel.css"
);
