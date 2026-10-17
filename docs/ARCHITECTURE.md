# Optical model and architecture

RAYMOSAIC is a browser-based geometrical-optics teaching prototype. Its defining constraint: **the wall projection cannot be a pasted copy of the input image**.

## Two deliberately separate paths

1. The **creative target path** in `src/targets.js` samples a heart, word or drawing into desired wall coordinates. This is input to the inverse solver only.
2. The **inverse geometry path** in `src/optics.mjs` computes an orientation for each mirror from the source position, mirror center and assigned wall target.
3. The **forward path** uses these mirror normals, the light-source position, finite square facets and a projection plane to calculate intersections. `src/scene.js` visualizes these forward intersections rather than painting a copy of the target.

For a unit incident ray **i** from source to mirror and unit normal **n**, reflection is

`r = i - 2 * dot(i, n) * n`.

For a desired unit outgoing direction **o** from mirror to wall, the ideal mirror normal is `normalize(o - i)`. The exact sign of the normal does not affect perfect specular reflection; the chosen orientation follows the implementation's facing convention. Degenerate normals and rays that fail to intersect the wall in the forward direction are rejected.

## Why moving the source matters

After optimizing mirror normals for one source position, moving that source changes the incident ray directions while leaving the normals untouched. The wall pattern therefore deforms. **Recalculate mirrors** recomputes the normals for the new source position. This is a useful falsifiability test of the model: a fake overlay would remain unchanged.

## Finite mirror footprint

Mirrors have finite square areas. Center and corner rays approximate the reflected-light footprint on the wall. The glow drawn around the footprint is illustrative; it is **not** a simulation of diffraction, a calibrated flux measurement, or a perfect continuous optical integral.

## Simplifications and limits

- Ideal point light with simplified brightness response, not an extended source.
- Ideal planar metallic mirrors, not wavelength-dependent reflectance.
- No self-shadowing, inter-mirror occlusion, global illumination, diffraction, polarization or atmospheric scattering.
- Finite mirror count and tilt limits constrain the resolution and reachable image patterns.
- Canvas 2D software perspective rendering, not a GPU-based ray tracer or WebGL.
- GIF palette quantization, resolution, file size and browser memory influence output quality.

These assumptions should be preserved or explicitly revised when making scientific claims.

## Verification

The numerical suite at `tests/optics.test.mjs` includes: known reflection cases, forward-plane intersections, invalid normals/tilt, inverse-to-forward consistency, and reconstruction of an asymmetric pattern without supplying the target to the forward renderer. Run it with `node --test tests/optics.test.mjs`.

The independent output check in `tests/validate-exports.py` decodes produced media with Pillow and checks frame count/differences. It is not a substitute for cross-browser UX, performance and accessibility testing.

## Principles for future work

Keep the forward optics engine separate from targets and UI. Add richer physical assumptions only with clear tests and documentation. Favor inspectability, locally generated media and an understandable mathematical model over visual cheats.

## Export rendering boundary

`src/export-renderer.js` selects one of two explicit paths. Projection mode calls only `drawProjectionOnly`: solid black and sprites at actual forward intersections. Full-scene mode calls `drawScene` with an independent perspective camera, retaining the wall frame, mirror array and lamp. Neither path receives target text or a drawing mask. The optional signature is the only export typography.

`projectionBounds` evaluates every accepted forward center-ray intersection for every solved message scene. One isotropic transform fits their union, with a footprint limit that keeps the entire stylized glow inside the frame. The same center and scale are retained through transitions. Signature space is reserved only when requested. Transient rays outside the completed-motif bounds can leave the image during reorientation; the view does not chase them.

The GIF worker disables ordered dithering for projection mode. Dialog changes revoke the old object URL and remove stale previews/downloads. Settings are disabled while an export is running, then restored on completion, cancellation or failure. Closing the dialog clears its generated file.
