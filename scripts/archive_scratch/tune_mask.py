import bpy

man = bpy.data.objects['Mannequin']
grp_vis = man.vertex_groups['Body_Visible']

# We know Island 15 and Island 42 are the upper arms that clip through sleeves
# Let's hide 15 and 42:
# In apply_island_mask.py:
# Let's inspect Island 15 and 42 verts
# We can re-run with is_forearm_hand = (dx_max > 0.33 and z_min >= 0.85 and idx not in [15, 42])
