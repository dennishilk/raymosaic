<div align="center">

# RAYMOSAIC ✨

### Draw pictures with reflected light — right in your browser.

**448 tiny mirrors. One light source. A message made entirely of reflections.**

A free, local-first optical playground by [Dennis Hilk](https://dennishilk.com). Turn a heart, word, or drawing into a glowing projection, move the lamp to break it, then realign the mirrors and export the moment as an animated GIF.

**[Quick start](#try-it-locally)** · **[Project files and links](#keep-your-project-and-share-it)** · **[How it works](#the-physics-not-a-hidden-texture)** · **[Examples](#see-it-in-action)** · **[Limitations](#what-this-prototype-does-not-simulate)**

</div>

![RAYMOSAIC interface showing 448 mirrors projecting a warm golden heart onto a wall](examples/raymosaic-heart.webp)

> **Release candidate — not yet deployed to Dennis's website.** The browser source, versioned local projects, compressed share links, bilingual website entry points and export UI are in Mission 04 staging. Automated browser QA is tracked by the [test workflow](.github/workflows/raymosaic-browser-qa.yml); do not confuse an automated timing measurement with a human usability test. Nothing is deployed to Worldnode as part of repository changes.

## See it in action

<div align="center">

![An animated reflected-light projection gradually forming the letters NEBU](examples/raymosaic-scene-nebu.gif)

*An actual multi-frame GIF exported from RAYMOSAIC — not a static animation mockup.*

[20-second demo video](examples/raymosaic-20s-demo.mp4) · [Projection-only GIF](examples/raymosaic-nebu.gif) · [NEBU screenshot](examples/raymosaic-nebu.webp)

</div>

The original 3D composition is also available as the [heart screenshot](examples/raymosaic-heart.webp). All example imagery was generated from the application; no stock artwork or simulated screenshots were used.

## Try it locally

Requirements: **Python 3** (or any local static HTTP server) and a recent graphical browser. No npm install, account, API key, backend, or proprietary software is required.

```bash
# From the repository directory:
python3 -m http.server 8000
```

Open **http://localhost:8000**.

> For security and correct ES module loading, use a local HTTP server, not `file://`. Nothing is transmitted to RAYMOSAIC's servers — there is no RAYMOSAIC server.

On NixOS, you may instead enter the provided development environment with `nix develop` before running the command above.

### Your first minute

1. Watch the default heart form out of reflections.
2. Enter a short name such as `LUNA` in **Text** and choose **Create** or **Make a GIF gift** for the fastest export.
3. Turn on **Reveal light rays** and select a mirror to inspect it.
4. Move a **Light position** slider: the existing mirror orientations stay fixed, so the projection distorts.
5. Click **Recalculate mirrors** to solve for the new light position.
6. Click **Export & Share** to download a real looping GIF, or use **PNG** for a still image. For a longer-lived scene, use **Save project**, **Download project file** or **Copy link**.

## What you can do

| Create | Investigate | Share |
| --- | --- | --- |
| Heart, HELLO, lightning bolt and star presets | Orbit/zoom the 3D instrument | Animated looping GIF |
| Custom text (best with short words) | Select a mirror and inspect its geometry | Projection-only or full-scene GIF |
| Freehand drawing with brush, eraser, undo and clear | Reveal incident and outgoing rays | Square, portrait or landscape |
| Warm or cool light | Move the source; manually recalculate the array | PNG, project files, local save, compressed share links |

Everything is calculated and encoded locally. The browser offers native file sharing **only where the Web Share API supports it**; downloading always remains the fallback.

## Keep your project and share it

RAYMOSAIC project format **v1** is a local JSON file (extension `.raymosaic`). It contains the motif/text, an encoded 240 × 120 drawing mask, current and last-aligned light positions, camera, appearance and all **448 mirror normals**. Importing a project validates the version, lengths and numeric ranges before restoring it. The file format is human-inspectable and can be migrated explicitly in a future revision.

**Save project** and local autosave use the browser's local storage. **Restore last project** restores it after reopening the page. **Download project file** is the durable backup option — deleting site data also deletes the browser's own saved projects.

**Copy link** uses native browser gzip compression (where supported) and places only a compact, validated state in the URL **fragment**. The receiving browser deterministically recreates mirror orientations from the motif and last-aligned source position. Links are deliberately limited to about 1,850 characters; if a drawing is larger or compression is unsupported, use the project file instead. The fragment is not automatically submitted to the website as an upload, but it **is visible to anyone you send the complete link to**.

The original optics, animation, GIF worker and app UI remain in this repository. The public website hosts a **synchronized static copy of this exact source**, regenerated by its `scripts/sync-raymosaic.sh` script; do not edit two drifting implementations.

### GIF and phone compatibility

The **Make a GIF gift** shortcut prioritizes a 320-pixel short animation for practical mobile sharing. All frames are generated from the forward optics renderer and encoded in a cancelable background Worker. The existing export dialog supports larger formats and portrait or landscape orientation, but those require more memory and processing time. On capable browsers, the Web Share API passes a GIF file to the device's native share sheet; a plain download remains available. Messaging apps may re-encode GIFs or render previews differently.

A true **30-second name → GIF → WhatsApp** acceptance test still requires observation with a real user and a real phone, not just a headless timing test.

## Mission 05 — Make it feel magical

The **Drawing** tab now contains two explicitly labeled previews: your unchanged input sketch and a forward-rendered reflected-light preview. **Automatically mirror drawing** is enabled for new sketches; it reverses sampled target coordinates exactly once to compensate for the live scene's viewing direction, without altering the input canvas or the reflection law. Unchecking the option retains the legacy target orientation. The `mirrorDrawing` Boolean is an optional field in **project format v1**, defaulting to `false` for existing files and shared links.

**Share RAYMOSAIC ❤️** opens a separate, privacy-conscious dialog for the **public website URL**. Native app sharing (when supported), WhatsApp, Facebook, X, email, a user-selected Mastodon instance, and copy link are available through explicit clicks. This is distinct from **Share my creation**, which copies a compressed personal-project fragment and reveals that motif to its recipients, and from **Export & Share GIF**, which produces a local animation file. The public share dialog never reads or transmits the current sketch.

Mobile framing now places the optical stage beneath the intro text and adjusts camera target, distance and focal scale independently for portrait and short landscape viewports. A user-adjusted or loaded camera is not overridden by later orientation changes. The fixed toolbar respects safe areas and the document provides sufficient bottom space for form controls.

The GIF polish branch `polish-raymosaic-gif-export-20261017` is integrated, not replaced: projection-only exports have a quiet dark studio backdrop, scene GIFs omit distracting grid effects, and the small **RAYMOSAIC** signature can be switched off in the existing export dialog. No video export is advertised.

### Verification and device limits

`node --test tests/optics.test.mjs tests/project-state.test.mjs tests/mission05.test.mjs` covers legacy project compatibility, asymmetric target orientation, real forward reflection, sharing privacy and Mastodon hostname validation.

`node tests/browser-smoke.mjs` exercises Firefox/Chromium GIF formats, both branding states, PNG and project roundtrips. `node tests/mission05-browser.mjs` checks asymmetric drawing, local restoration, public sharing, translations and simulated 360×740, 390×844 and 844×390 viewports. `python3 tests/check-browser-exports.py` independently decodes generated media.

**A desktop browser with an emulated phone viewport is not a physical Android or iPhone.** Dennis has tested the app on his own Android smartphone; these automated tests do not claim to reproduce his device. An actual iOS and native messenger handoff test remains a manual release-quality check.

## The physics, not a hidden texture

The target image is sampled into discrete points. An **inverse solver** computes a suitable orientation for each mirror; it is then deliberately kept separate from the **forward projection**. The forward renderer sees mirror geometry and the lamp — **not the original drawing or text**.

For an incoming unit ray direction **i** (light → mirror) and unit mirror normal **n**, the outgoing direction is:

\[
\mathbf{r}=\mathbf{i}-2(\mathbf{i}\cdot\mathbf{n})\mathbf{n}
\]

To aim at a desired wall point, let **o** be the outgoing unit direction (mirror → target). The ideal normal used by the solver is:

\[
\mathbf{n}=\frac{\mathbf{o}-\mathbf{i}}{\lVert\mathbf{o}-\mathbf{i}\rVert}
\]

Each mirror is represented by a finite square. The forward model reflects rays from its center and corners, computes intersections with the projection plane, and draws a stylized spot from those intersections. If the source moves without recalculation, the projected light moves too. That cause-and-effect relationship is the point of the experiment.

For code and validation details, see [Architecture and optical assumptions](docs/ARCHITECTURE.md).

## What this prototype does *not* simulate

RAYMOSAIC uses ideal point illumination, perfect planar mirror reflections, sampled facet footprints and stylized smooth glow. It **does not** currently model diffraction, polarization, wavelength dispersion, inter-mirror occlusion, global illumination or self-shadowing. Mirror positions and tilt constraints are finite, so small detailed drawings cannot be reproduced perfectly. The scene is rendered using a lightweight **software perspective renderer on Canvas 2D** — not Three.js or WebGL.

This is a **geometrical-optics educational model**, not physical photometry. We value clear explanations over pretending to be more precise than we are.

## Source layout

```text
raymosaic/
├── index.html              # Browser interface
├── styles.css              # Responsive visual design
├── src/
│   ├── optics.mjs          # Pure vectors, reflection, inverse solver, plane intersections
│   ├── targets.js          # Presets, text and drawing target samples
│   ├── scene.js            # Canvas-perspective scene and forward projection
│   ├── main.js             # UI, animation, export and sharing
│   └── gif-worker.js       # GIF89a encoder in a Web Worker
├── tests/
│   ├── optics.test.mjs     # Numerical optics regression tests
│   ├── project-state.test.mjs # Version/link roundtrip and input validation
│   ├── browser-smoke.mjs   # Chromium + Firefox export and viewport tests
│   ├── check-browser-exports.py # Pillow checks on actual browser-generated media
│   └── validate-exports.py # Checks on bundled example media
├── examples/               # Real application screenshots, GIFs and video
├── docs/                   # Design notes and unpublished launch drafts
└── flake.nix               # Optional Nix development shell
```

Run the dependency-free numerical suite with:

```bash
node --test tests/optics.test.mjs
```

The six current tests cover the reflection law, known normals, forward-only intersections, inverse/forward consistency, invalid geometry and a recognizable asymmetric projection. The sample GIFs were independently decoded and checked for 30 frames and changing images. The image-validation script needs Pillow (`python3 -m pip install pillow` in an appropriate environment) and can be run with `python3 tests/validate-exports.py`.

### Known gaps before a public hosted launch

- Review the automated Firefox/Chromium test workflow results and any device-specific issues; an automated viewport test is not a real iOS/Android device test.
- Revisit mobile gesture usability, keyboard/screen-reader controls, lower-end GPU/CPU performance and repeated export memory behavior.
- Improve palette selection for larger GIFs and consider WebM as an additional output. MP4 and WebM **are not built-in export options** today.
- Consider a physically richer shadowing/occlusion mode while keeping the existing optical model independently testable.

## Privacy and licensing

No accounts. No analytics. No background uploads. Your typed words, drawings and exported frames are processed in your browser, and files are only shared if **you** take an explicit sharing action. See [Security and privacy](SECURITY.md).

Released under the [MIT License](LICENSE) (© 2026 Dennis Hilk). Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). Example media was produced from this project.

---

<div align="center">

*Make light draw.* 🌈

**Created by Dennis Hilk / NEBU** · [dennishilk.com](https://dennishilk.com)

</div>