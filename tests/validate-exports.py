#!/usr/bin/env python3
"""Independently validate bundled GIFs (and an optional locally exported PNG).

Run: python3 tests/validate-exports.py  # requires Pillow
"""
from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parent.parent / 'examples'
for name in ('raymosaic-nebu.gif', 'raymosaic-scene-nebu.gif'):
    with Image.open(root / name) as im:
        assert im.format == 'GIF' and im.n_frames > 1 and im.info.get('loop') == 0
        images = []
        for i in range(im.n_frames):
            im.seek(i)
            images.append(im.convert('RGB'))
        changes = sum(ImageChops.difference(a, b).getbbox() is not None for a, b in zip(images, images[1:]))
        assert changes >= 5, f'{name}: animation did not meaningfully change'
        print(f'{name}: {im.size}, {im.n_frames} frames, {changes} changed transitions, loops')

png = root / 'raymosaic-export.png'
if png.is_file():
    with Image.open(png) as image:
        image.load()
        assert image.format == 'PNG' and image.size == (1600, 900)
        print(f'{png.name}: valid {image.size}')
else:
    print('PNG validation skipped: optional exported PNG not included in this checkout')