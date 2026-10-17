"""Decode actual browser downloads independently of Canvas and the GIF encoder."""
from pathlib import Path
import json
from PIL import Image, ImageChops
root=Path(__file__).resolve().parent/'artifacts'
manifest=json.loads((root/'mission08-manifest.json').read_text())
assert len(manifest)==44, len(manifest)
results=[]
def light_box(image):
    return image.convert('L').point(lambda v:255 if v>100 else 0).getbbox()
for item in manifest:
    path=root/item['file']
    expected={'square':(320,320),'portrait':(180,320),'landscape':(320,180)}[item['aspect']]
    with Image.open(path) as im:
        assert im.format=='GIF' and im.size==expected and im.info.get('loop')==0, item
        assert im.n_frames>=30, (path,im.n_frames)
        frames=[]
        # Decode EVERY frame; corruption in transitions or the ending must fail.
        for i in range(im.n_frames):
            im.seek(i);frame=im.convert('RGB');frame.load()
            assert im.info.get('duration',0)>0, (path,i)
            frames.append(frame.copy())
        assert sum(ImageChops.difference(frames[0],f).getbbox() is not None for f in frames)>2, path
        if item['mode']=='projection':
            for f in frames:
                # Warm-light-only output cannot contain the cool blue physical wall,
                # metal mirror surfaces or light-source apparatus. Background is exact black.
                assert f.getpixel((0,0))==(0,0,0), (path,'background')
                assert not any(b>r+8 for r,g,b in f.getdata()), (path,'physical scene geometry leaked')
            held=frames[20] if item['segments']==1 else frames[len(frames)//2]
            if item['segments']==1:
                # All three aspect ratios must fill width, preserve black outer margins,
                # and remain optically centered (not a distant instrument photograph).
                w,h=held.size;art=held.crop((0,0,w,int(h*.85)))
                box=light_box(art);assert box, path
                assert box[2]-box[0]>w*.78, (path,box,'motif too small')
                assert box[0]>0 and box[2]<w, (path,'clipped light')
                assert abs((box[0]+box[2])/2-w/2)<w*.05, (path,'not centered')
                assert len(set(held.crop((0,0,w,8)).getdata()))==1, (path,'background noise')
            if item['segments']>1:
                assert im.n_frames>item['segments']*12, (path,'sequence truncated')
                assert ImageChops.difference(frames[len(frames)//2],frames[-1]).getbbox(), (path,'ending missing')
        else:
            assert any(b>r+8 for r,g,b in frames[20].getdata()), (path,'full apparatus disappeared')
        results.append({**item,'dimensions':im.size,'frames':im.n_frames,'bytes':path.stat().st_size})
# Signature really is optional in both independent rendering modes.
for browser in ['chromium','firefox']:
    for mode in ['projection','scene']:
        a=Image.open(root/f'mission08-{browser}-666-square-{mode}-signed.gif')
        b=Image.open(root/f'mission08-{browser}-666-square-{mode}-clean.gif')
        a.seek(20);b.seek(20)
        assert ImageChops.difference(a.convert('RGB').crop((0,280,180,320)),b.convert('RGB').crop((0,280,180,320))).getbbox()
    png=Image.open(root/f'mission08-{browser}-scene.png');png.load()
    assert png.format=='PNG' and png.size==(1600,900)
# Before images are optional in CI; they come from an untouched Mission 07 checkout.
comparisons=[]
for browser in ['chromium','firefox']:
    before=root/f'before-{browser}-projection.gif'
    if before.exists():
        a=Image.open(before);a.seek(20);a=a.convert('RGB')
        b=Image.open(root/f'mission08-{browser}-666-square-projection-clean.gif');b.seek(20);b=b.convert('RGB')
        ab,bb=light_box(a),light_box(b)
        assert bb[2]-bb[0]>ab[2]-ab[0]
        panel=Image.new('RGB',(640,320));panel.paste(a,(0,0));panel.paste(b,(320,0));panel.save(root/f'mission08-{browser}-before-after.png')
        comparisons.append({'browser':browser,'before_width':ab[2]-ab[0],'after_width':bb[2]-bb[0],
                            'gain_percent':round(((bb[2]-bb[0])/(ab[2]-ab[0])-1)*100,1)})
(root/'mission08-decoded.json').write_text(json.dumps({'exports':results,'comparisons':comparisons},indent=2)+'\n')
print(f'PASS: {len(results)} GIFs independently decoded; real animation, exact-black projection backgrounds, no scene-blue geometry, tight framing, all formats/modes/densities, both signatures, complete sequences, PNG.')
for comparison in comparisons: print(comparison)
