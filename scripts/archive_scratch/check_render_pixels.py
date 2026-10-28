from PIL import Image
import numpy as np

im = Image.open('artifacts/volumetric_review/test_mannequin_only.png').convert('RGBA')
arr = np.array(im)
# Find non-transparent pixels
mask = arr[:, :, 3] > 200
rgb = arr[mask, :3]
mean_rgb = np.mean(rgb, axis=0)
print('Mean RGB of mannequin in render:', mean_rgb)
# Find lit pixels on forehead (Y between 50 and 150, X between 150 and 250)
head_box = arr[50:150, 150:250]
head_mask = head_box[:, :, 3] > 200
head_rgb = np.mean(head_box[head_mask, :3], axis=0)
print('Forehead mean RGB in render:', head_rgb)
