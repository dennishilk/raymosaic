from pathlib import Path
from PIL import Image, ImageChops
root=Path(__file__).resolve().parent/'artifacts'
for engine in ('chromium','firefox'):
 path=root/f'long-love-{engine}.gif'
 with Image.open(path) as im:
  assert im.format=='GIF' and im.n_frames>60,(path,im.n_frames)
  frames=[]
  for i in [0,im.n_frames//4,im.n_frames//2,im.n_frames*3//4,im.n_frames-1]:
   im.seek(i);frames.append(im.convert('RGB').copy())
  differences=sum(ImageChops.difference(frames[i],frames[i+1]).getbbox() is not None for i in range(4))
  assert differences>=3,(engine,differences)
  print(engine,'actual optical sequence GIF:',im.n_frames,'frames',im.size,'distinct quarter frames:',differences)
 with Image.open(root/f'long-love-{engine}.png') as im:
  im.load();assert im.format=='PNG' and im.size==(1600,900)
