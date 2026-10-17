# RAYMOSAIC — launch kit (draft only; NOT published)

> **Warning:** This is a local engineering prototype; do **not** announce it as a released public product until the browser and mobile acceptance testing is completed and a public hosting destination has been authorized.

## One-sentence pitch

**RAYMOSAIC — Draw pictures with reflected light, right in your browser.**

## Proposed GitHub description

A privacy-first optical playground: align hundreds of tiny mirrors, bend reflected light into an image, inspect the physics, and save your own animated GIF.

## English Mastodon draft

I built a little experiment with 448 mirrors and a point light. ✨

Type a word, and each mirror turns until the reflected rays form your message on a wall. Move the light source and the picture falls apart. Hit Recalculate and the optics put it back together.

The animation exports as a real, shareable GIF. Everything runs in the browser, with no uploads.

RAYMOSAIC — [add live link when authorized]

#OpenSource #CreativeCoding #Optics #WebGraphics #Linux

## Deutscher Mastodon-Entwurf

448 kleine Spiegel, eine Lichtquelle — und plötzlich steht „NEBU“ als Lichtbild auf einer Wand. ✨

Bei RAYMOSAIC wird das Motiv nicht einfach eingeblendet: Die Ausrichtung jedes Spiegels wird berechnet, und die sichtbaren Punkte entstehen aus simulierten Reflexionen. Verschiebst du das Licht, verändert sich die Projektion.

Dein eigenes Motiv kannst du als animiertes GIF speichern. Direkt im Browser, ohne Upload.

RAYMOSAIC — [Link nach Freigabe ergänzen]

#OpenSource #Linux #Optik #CreativeCoding #Webentwicklung

## X draft

448 mirrors. One light. Your message — made of simulated reflections. ✨

Move the lamp: the image breaks. Recalculate: it returns. Export the whole thing as an animated GIF.

RAYMOSAIC — [link]

## Reddit / Hacker News submission draft

**Show HN: RAYMOSAIC — draw words using simulated reflections from 448 mirrors**

This is a dependency-free, browser-based optics experiment. A geometric solver points each mirror toward a target on a projection wall, while a separate forward renderer computes where the reflected rays actually land. Move the light to break the image, then recalculate the normals. It also encodes real looping GIFs in a Web Worker so you can share the result. The model is idealized (point light, flat mirrors, no occlusion), and the visualization is a Canvas software 3D scene rather than WebGL. I'd love feedback on the optical model and usability.

## Included preview media

- `../examples/raymosaic-heart.png` — full application, heart preset.
- `../examples/raymosaic-nebu.png` — custom text.
- `../examples/raymosaic-nebu.gif` — **actual 30-frame projection-only animation**, 320×320, loops forever.
- `../examples/raymosaic-scene-nebu.gif` — **actual 30-frame cinematic 3D scene animation**, 320×320, loops forever.
- `../examples/raymosaic-20s-demo.mp4` — 20-second silent local browser recording, based on interactions with light movement and recalculation; final frame held briefly.
- `../examples/raymosaic-export.png` — PNG file exported from the application.

## Alt text

**Heart screenshot:** Dark, minimalist 3D optical instrument with hundreds of metallic square mirrors on a grid and a golden heart projected onto an angled wall. Two panels offer presets and light controls.

**NEBU screenshot:** A grid of metallic mirrors aims reflected golden light toward the wall, producing the word NEBU. The custom-text tab and physical light-source controls are visible.

**GIF:** Against a dark backdrop, golden light spots move across a wall and gradually arrange themselves into the word NEBU, before dissolving and repeating.

**Video:** Screen recording of the interactive RAYMOSAIC browser instrument. Golden reflections form a heart and then the text NEBU. Ray paths are toggled, the light is moved so the projected picture distorts, and the mirrors are recalculated to reform the message.

## Suggested metadata when hosted

The included HTML already contains title, meta description, canonical-neutral Open Graph title/description, and a color theme. Add production `og:url`, `og:image`, `twitter:card` and image dimensions only once the final public URL and hosted image have been chosen. Do not ship an invented live link.

## Pre-launch checklist

1. Verify native static HTTP module loading in Firefox and Chromium on Linux (the automated browser test was run with the same sources inlined because the test browser forbids localhost navigation).
2. Verify 3D performance on weaker hardware and scroll/touch gestures on iPhone and Android.
3. Validate browser sharing availability; Chrome/Firefox desktop typically offer download as a fallback.
4. Test GIF loops, frame count, memory usage, and file size for every quality preset. A compact 30-frame NEBU example was independently decoded.
5. Confirm license/assets attribution and security/privacy review.
6. Add public URL, OG preview, and a distribution method only after authorization.