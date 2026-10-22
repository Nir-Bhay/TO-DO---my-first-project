process.env.AWS_EXECUTION_ENV ||= "AWS_Lambda_nodejs20.x";

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import chromiumPkg from "@sparticuz/chromium";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(REMOTION_ROOT, "..");
const WEB_MEDIA_DIR = path.resolve(REPO_ROOT, "reeldrop/web/media");

fs.mkdirSync(WEB_MEDIA_DIR, { recursive: true });

const mode = process.argv[2] || "all";

async function main() {
  const browserExecutable = await chromiumPkg.executablePath();
  console.log("Bundling Remotion 60 FPS composition...");
  const bundleLocation = await bundle({
    entryPoint: path.join(REMOTION_ROOT, "src/index.js"),
    publicDir: path.join(REMOTION_ROOT, "public")
  });

  const chromeOptions = { gl: "angle", disableWebSecurity: true };

  const comp16x9 = await selectComposition({
    serveUrl: bundleLocation,
    id: "VeloraLaunchDemo16x9",
    browserExecutable,
    chromiumOptions: chromeOptions
  });

  const comp9x16 = await selectComposition({
    serveUrl: bundleLocation,
    id: "VeloraSocialReel9x16",
    browserExecutable,
    chromiumOptions: chromeOptions
  });

  // Render crisp JPEG-compressed PNG/JPEG stills + posters into web/media/
  const keyStills = [
    [156, "still-01-opening.png"],
    [390, "still-02-crop-action.png"],
    [660, "still-03-autadm-result.png"],
    [1340, "still-04-closing-card.png"]
  ];

  for (const [frame, name] of keyStills) {
    const out = path.join(WEB_MEDIA_DIR, name);
    await renderStill({
      composition: comp16x9,
      serveUrl: bundleLocation,
      output: out,
      frame,
      imageFormat: "jpeg",
      jpegQuality: 90,
      browserExecutable,
      chromiumOptions: chromeOptions
    });
    console.log(`Rendered keyframe ${name} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
  }

  await renderStill({
    composition: comp16x9,
    serveUrl: bundleLocation,
    output: path.join(WEB_MEDIA_DIR, "velora-launch-poster-16x9.png"),
    frame: 156,
    imageFormat: "jpeg",
    jpegQuality: 90,
    browserExecutable,
    chromiumOptions: chromeOptions
  });

  await renderStill({
    composition: comp9x16,
    serveUrl: bundleLocation,
    output: path.join(WEB_MEDIA_DIR, "velora-intro-poster.png"),
    frame: 156,
    imageFormat: "jpeg",
    jpegQuality: 90,
    browserExecutable,
    chromiumOptions: chromeOptions
  });

  if (mode === "stills") {
    return;
  }

  const concurrency = Math.max(1, os.cpus().length);
  const mp4Wide = path.join(WEB_MEDIA_DIR, "velora-launch-demo-16x9.mp4");
  const mp4Vert = path.join(WEB_MEDIA_DIR, "velora-social-reel-9x16.mp4");

  console.log(`Rendering 16:9 60 FPS Launch Film (${comp16x9.durationInFrames} frames @ ${comp16x9.fps}fps, concurrency=${concurrency})...`);
  await renderMedia({
    composition: comp16x9,
    serveUrl: bundleLocation,
    codec: "h264",
    audioCodec: "aac",
    audioBitrate: "192k",
    crf: 23,
    pixelFormat: "yuv420p",
    concurrency,
    outputLocation: mp4Wide,
    browserExecutable,
    chromiumOptions: chromeOptions
  });
  console.log(`16:9 complete -> ${(fs.statSync(mp4Wide).size / 1024 / 1024).toFixed(2)} MB`);

  console.log(`Rendering 9:16 60 FPS Social Reel (${comp9x16.durationInFrames} frames @ ${comp9x16.fps}fps, concurrency=${concurrency})...`);
  await renderMedia({
    composition: comp9x16,
    serveUrl: bundleLocation,
    codec: "h264",
    audioCodec: "aac",
    audioBitrate: "192k",
    crf: 23,
    pixelFormat: "yuv420p",
    concurrency,
    outputLocation: mp4Vert,
    browserExecutable,
    chromiumOptions: chromeOptions
  });
  console.log(`9:16 complete -> ${(fs.statSync(mp4Vert).size / 1024 / 1024).toFixed(2)} MB`);

  // Create lightweight symlinks instead of duplicating multi-MB binaries!
  for (const [linkPath, relTarget] of [
    [path.join(REPO_ROOT, "velora-launch-demo-16x9.mp4"), "reeldrop/web/media/velora-launch-demo-16x9.mp4"],
    [path.join(REPO_ROOT, "velora-social-reel-1080x1920.mp4"), "reeldrop/web/media/velora-social-reel-9x16.mp4"]
  ]) {
    try {
      fs.unlinkSync(linkPath);
    } catch {}
    fs.symlinkSync(relTarget, linkPath);
  }
  console.log("Symlinks updated cleanly.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
