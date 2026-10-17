from pathlib import Path
from PIL import Image, ImageChops, ImageStat
root=Path(__file__).resolve().parent/'artifacts'
def light_box(image):
    rgb=image.convert('RGB')
    w,h=rgb.size
    region=rgb.crop((0,0,w,int(h*.89)))
    mask=region.convert('L').point(lambda v:255 if v>100 else 0)
    return mask.getbbox()
for browser in ['chromium','firefox']:
    before=Image.open(root/f'overdrive-baseline-{browser}.png').convert('RGB')
    before_box=light_box(before)
    assert before_box is not None,'legacy drawing had no light'
    variants=['square','scene','love']+(['portrait','landscape'] if browser=='chromium' else [])
    for variant in variants:
        path=root/f'overdrive-{browser}-{variant}.gif'
        with Image.open(path) as im:
            assert im.format=='GIF' and im.n_frames>=30,(path,im.n_frames)
            expected={'square':(320,320),'scene':(320,320),'love':(320,320),'portrait':(180,320),'landscape':(320,180)}[variant]
            assert im.size==expected,(path,im.size)
            samples=[]
            for i in range(0,im.n_frames,max(1,im.n_frames//12)):
                im.seek(i);frame=im.convert('RGB').copy();box=light_box(frame)
                if box:samples.append((box,frame))
            assert samples,'empty light artwork '+str(path)
            strongest=max(samples,key=lambda item:(item[0][2]-item[0][0])*(item[0][3]-item[0][1]))
            box,frame=strongest;frame.save(root/f'overdrive-{browser}-{variant}-preview.png')
            w,h=im.size
            if variant in ('square','portrait','landscape','love'):
                assert 0<=box[0]<box[2]<=w
                assert 0<=box[1]<box[3]<=int(h*.89)
                assert box[2]-box[0]>w*.28,'motif too narrow '+str(path)
            if variant=='square':
                before_w=before_box[2]-before_box[0];after_w=box[2]-box[0]
                assert after_w>=before_w*1.02,(browser,before_w,after_w)
                print(browser,'real forward-hit GIF framing: legacy luminous width',before_w,'new',after_w,'gain %',round((after_w/before_w-1)*100,1))
            if variant=='love':
                assert im.n_frames>40,'the multi-scene ending was lost'
                a=frame
                im.seek(im.n_frames-1);b=im.convert('RGB')
                assert ImageChops.difference(a,b).getbbox() is not None
            print(browser,variant,'GIF independently decoded:',im.size,im.n_frames,'frames, bright bounds',box)
