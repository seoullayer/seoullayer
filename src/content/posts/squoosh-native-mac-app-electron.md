---
title: "Squoosh as a Native Mac App: The One Service I Chose Not to Self-Host"
description: "I had Squoosh running in Docker behind my reverse proxy, then took it back off the server and wrapped it as a standalone Mac app with Electron. The COOP/COEP headers that made it work, and why not every tool belongs on the homelab."
pubDatetime: 2026-06-03T00:00:00Z
tags: ["homelab", "self-hosting", "electron", "squoosh", "macos", "docker"]
featured: false
draft: false
---

*This post is part of the [Korean Apartment Homelab](/series) series.*

## Introduction

Almost every post in this series is about moving something onto the server. A smart home moved onto Home Assistant. File storage moved onto Nextcloud. Passwords moved onto Vaultwarden. The reflex of running a homelab is to ask, for any tool you use, whether you could host it yourself.

This post is the opposite. It is about a tool I did host, confirmed it worked, and then deliberately took back off the server.

The tool is [Squoosh](https://squoosh.app), Google's open-source image compressor. It does all of its work locally in the browser using WebAssembly codecs, which makes it a natural self-hosting candidate. I put it in a Docker container, placed it behind my reverse proxy, and reached it from any device in the apartment. It worked exactly as expected.

After living with that setup for a while, I concluded it was the wrong shape for how I actually used the tool. So I rebuilt it as a standalone macOS application with Electron instead. This is the story of why I made that call, and the specific technical problems that wrapping Squoosh involved.

---

## When Self-Hosting Is the Wrong Answer

The Docker version was not broken. It was just a poor fit, for three reasons that only became clear through daily use.

**Keeping a service alive for an occasional task is inefficient.** I use Squoosh to shrink one or two images at a time, a few times a week. A container running continuously for that is the same mismatch I wrote about in the [backup post](/posts/backup-strategy-proxmox-homelab): not everything deserves the same treatment. Some services earn a permanent place on the server because they need to be always available. An image compressor I open occasionally does not. The cost of keeping it hosted was small, but it was cost spent on the wrong thing.

**It added friction to my actual workflow.** To compress an image, I had to open a browser tab and navigate to an internal URL. That sounds trivial, but the browser is where I do most of my real work, with a dozen tabs already open. Bouncing over to Safari to drag in a file, then bouncing back, broke my focus every time. A standalone app lives in its own window, in the Dock, outside the browser. The tool moved to where the task happened rather than forcing the task into the browser.

**I wanted to keep image work out of my everyday browser session.** This one needs to be stated precisely, because it is easy to overclaim. Squoosh does not upload your images anywhere — that is true of both the Docker version and the desktop app, since all processing is client-side and local in both cases. So the desktop app is not "more private" in any meaningful sense. What it does give me is separation: image processing happens in its own isolated context rather than sharing the same browser session as everything else I have logged into. That is a hygiene preference, not a security upgrade, but it was a real part of why the standalone app felt better.

None of these are dramatic. Together they pointed clearly at the same conclusion: this particular tool belonged on my desktop, not on my server.

---

## Why Electron, Not Swift

My first attempt was a native macOS wrapper in Swift, using `WKWebView` to load Squoosh. It did not work, and the reason turned out to be fundamental rather than something I had misconfigured.

Squoosh leans heavily on WebAssembly codecs, and several of them (MozJPEG, AVIF, and others) use multithreading through `pthreads` and `SharedArrayBuffer`. Browsers only enable `SharedArrayBuffer` when the page is *cross-origin isolated*, which requires two specific HTTP response headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The problem with `WKWebView` is that attaching those headers to locally served content is awkward, so `SharedArrayBuffer` stays blocked and the multithreaded codecs break. Squoosh is also a PWA that uses a service worker, and `WKWebView`'s support for service workers in bundled app content is weak. The engine simply was not the environment Squoosh was built and tested against.

Electron sidesteps this by bundling Chromium directly. Squoosh is a Chrome Labs project, developed and tested against Chromium, so bundling that same engine means carrying the environment it already runs in. Compatibility problems largely disappear before they start.

One caveat worth flagging for anyone considering [Tauri](https://tauri.app) as the lighter alternative: on macOS, Tauri uses the system `WKWebView`, which means you inherit the exact same problem that blocked the Swift attempt. For Squoosh specifically, the Chromium-bundled approach is what makes it work.

---

## The Core: A Custom Scheme and Two Headers

Bundling Chromium gets you the right engine, but it does not automatically give you cross-origin isolation. You still have to supply the COOP and COEP headers yourself, the same ones `WKWebView` made difficult. This is the actual substance of the project, and everything else is cleanup around it.

The approach is to serve the static Squoosh build through a custom scheme registered as secure and fetch-capable, then inject the headers on every response. In the main process:

```js
const { protocol } = require("electron");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);
```

Then, when responding to requests on that scheme, set the two headers that turn on isolation:

```js
// inside the custom protocol handler / onHeadersReceived
headers["Cross-Origin-Opener-Policy"] = "same-origin";
headers["Cross-Origin-Embedder-Policy"] = "require-corp";
```

The way to confirm this actually worked is to open the app's developer tools and check a single value in the console:

```js
crossOriginIsolated; // should be true
```

If it returns `true`, `SharedArrayBuffer` is available and the multithreaded codecs run. If it returns `false`, the app still works — it falls back to single-threaded codecs — but some compression is noticeably slower and a few options may be unavailable. This one boolean is the difference between "it loads" and "it actually works the way Squoosh is supposed to."

A small confirmation that the approach is correct: the Squoosh static build ships a `_headers` file, which is how it configures COOP/COEP on its normal hosting platform. Electron does not apply that file automatically, which is exactly why we inject the same headers in code. Seeing that file in the build output told me I was setting the right things.

---

## Building Squoosh Itself

One practical warning before the wrapper details, because this is where the time actually goes. Google has effectively put Squoosh into maintenance mode, and building it from source has become finicky as a result, mostly around Node version sensitivity.

The repository pins a Node version in `.nvmrc` (it was `20.16.0` in my case). Match it with `nvm use`, then `npm install` followed by `npm run build`. The install will report a long list of vulnerabilities and an npm update notice — ignore both. Do **not** run `npm audit fix`, and especially not `--force`. This is an old project; changing dependency versions to silence the warnings is a reliable way to break the build, and since you are only producing a local static build, the practical risk from the warnings is negligible.

A successful build produces a `build/` directory containing `index.html`, a `c/` folder with the JS and WASM codecs, the service worker files, `manifest.json`, and that `_headers` file. Copy the contents of `build/` into a `squoosh/` subfolder next to the Electron `main.js`, and the wrapper loads it through the custom scheme.

---

## Polishing the App

With the core working, the rest was making it feel like a purpose-built tool rather than a wrapped web page. Each of these was handled in the Electron main process, so none of them required rebuilding Squoosh from source.

**Blocking analytics.** Squoosh calls Google Analytics by default. Rather than editing the build, I cancelled the outbound requests at the network layer, dropping anything headed to `google-analytics.com`, `googletagmanager.com`, and similar hosts. This is cleaner than patching source and keeps the app fully offline.

**Removing the intro UI.** Squoosh's landing screen has demo images and "Small / Simple / Secure" marketing sections that are pointless in a personal desktop tool. The trap here is that Squoosh's CSS class names include a build hash (`_demos-container_vzxu7_100`), so the hash changes every time you rebuild. Matching on the full class name would break on the next build. The stable part is the readable prefix, so a partial attribute selector survives rebuilds:

```css
[class*="demos-container"],
[class*="bottom-wave"],
section[class*="_info_"],
footer[class*="_footer_"] {
  display: none !important;
}
```

**Fixing garbled text (mojibake).** The compression ratio indicator was rendering `â†“90%` instead of `↓90%`. This is a classic encoding mismatch: `↓` is three bytes in UTF-8 (`E2 86 93`), and reading those bytes through a single-byte encoding such as Windows-1252 produces exactly those three characters. The cause was on my side — the custom scheme was serving text files without specifying a charset, so Chromium guessed wrong. The fix was to append `charset=utf-8` to the `Content-Type` for text file types (`.js`, `.html`, `.css`), forcing UTF-8 decoding. The original hosted Squoosh never showed this because its server sent the charset correctly.

**Replacing the app icon.** The packaged app shipped with the default Electron icon. macOS needs an `.icns` file, and you can build one from a PNG in the Squoosh build using only the system tools `sips` and `iconutil` — nothing extra to install. Squoosh's largest bundled icon is 512×512, so scaling it up to 1024 for the icon set leaves it very slightly soft; rendering the source SVG logo at 1024 is the sharper option if it bothers you, but the PNG was good enough for me.

After that, `npm run dist` produces a `.dmg` and a `.app` carrying the Squoosh icon, for both Apple Silicon and Intel.

---

## Closing: A Self-Hoster Choosing Not to Host

The pattern in this series has always been to reach for the homelab first. A problem appears, and the answer is usually another container or another VM. This was the rare case where the homelab was the wrong tool, and recognizing that was more useful than the build itself.

Squoosh on Docker was a perfectly good setup that solved a problem I did not really have. What I actually wanted was an image compressor that lived on my desktop, stayed out of my browser, and did not depend on a server being awake. A standalone Electron app delivered that, and the server got a little simpler for losing a service it never needed to run.

The editorial thread across this blog — what to expose, what to keep behind VPN, what to back up, how far to harden — has always been about matching the tool to the actual need rather than the maximal one. "Should I self-host this?" is a real question, and sometimes the honest answer is no. This is the post where the answer was no, and the homelab was better for it.

---

*The Electron wrapper is intentionally thin: a `main.js` that registers the scheme and injects headers, a `package.json` for packaging, plus an icon script. It is published at [github.com/seoullayer/squoosh-desktop](https://github.com/seoullayer/squoosh-desktop). The repository contains only the wrapper — Squoosh itself is built from its own source and dropped into a subfolder, as the README explains.*
