# Contributing to RAYMOSAIC

Thanks for helping make light draw! RAYMOSAIC is an experimental optics-and-visualization project. Bug reports, accessibility findings, browser compatibility tests, and small focused pull requests are especially welcome.

## Run and test

Serve the repository root with `python3 -m http.server 8000`, then open `http://localhost:8000`. Run `node --test tests/optics.test.mjs` for the dependency-free optical math suite. There is also an optional Nix development environment (`nix develop`).

## Engineering principles

1. **No fake projection:** the target image may guide the inverse solver, but never draw the target directly on the output wall. The forward renderer uses actual simulated ray intersections.
2. Keep optical math independent of DOM, target rasterization and Canvas rendering.
3. Include numerical tests for changes to reflection, normals, mirror limits or intersections.
4. Test actual browser behavior for UI and export changes. Decode exported GIFs with a separate library and check frame differences.
5. Protect user privacy. Do not add analytics, network uploads, accounts or unlicensed third-party assets without a documented discussion.
6. Document approximations rather than describing the model as laboratory-grade.

## Pull requests

Please explain what changed, how you tested it and whether it affects the independent forward model. For UI work, a small screenshot or screen recording is helpful. Keep changes reasonably focused.

See [README.md](README.md) for current limitations and the roadmap to a public hosted demo.