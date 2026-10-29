import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

# Create or get vertex group Body_Visible
grp = man.vertex_groups.get('Body_Visible')
if not grp:
    grp = man.vertex_groups.new(name='Body_Visible')

# Clean existing
for v in man.data.vertices:
    wco = mw @ v.co
    dx = abs(wco.x - 0.007)
    z = wco.z
    
    is_head_neck = (z >= 0.94 and dx < 0.09)
    is_hand_arm  = (dx >= 0.26 and z >= 0.70)
    is_foot_shin = (z <= 0.20)
    
    if is_head_neck or is_hand_arm or is_foot_shin:
        grp.add([v.index], 1.0, 'REPLACE')
    else:
        grp.add([v.index], 0.0, 'REPLACE')

print('Body_Visible group created!')

# Add or configure Mask modifier
mask_mod = man.modifiers.get('Body_Mask')
if not mask_mod:
    mask_mod = man.modifiers.new('Body_Mask', 'MASK')
mask_mod.vertex_group = 'Body_Visible'
mask_mod.invert_vertex_group = False

# Ensure Collision modifier exists on Mannequin for cloth physics
col_mod = man.modifiers.get('Collision')
if not col_mod:
    col_mod = man.modifiers.new('Collision', 'COLLISION')

print('Configured Body_Mask and Collision modifiers on Mannequin!')
