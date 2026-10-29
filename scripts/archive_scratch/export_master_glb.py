import bpy, os, shutil

# Set pose to POSE frame 0 for clean GLB default
arm = bpy.data.objects['Armature']
arm.data.pose_position = 'POSE'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

# Ensure active adventurer clothes, hair, body are visible
for name in ['Mannequin', 'Modular_Adventurer_Pants', 'Modular_Adventurer_Tunic', 'Modular_Adventurer_Boots', 'Modular_Hair_Adventurer', 'Chibi_Face_Decal', 'Modular_1H_Sword', 'Modular_Round_Shield']:
    o = bpy.data.objects.get(name)
    if o:
        o.hide_viewport = False
        o.hide_render = False

# Ensure modular alternate gear is hidden in default adventurer setup
for name in ['Modular_Mage_Hat', 'Modular_2H_Staff', 'Modular_Knight_Cape']:
    o = bpy.data.objects.get(name)
    if o:
        o.hide_viewport = True
        o.hide_render = True

out_glb = os.path.abspath('mannequin_chibi_master.glb')
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=False,
    export_animations=True,
    export_skins=True,
    export_morph=True,
    export_apply=False
)
print('Exported master GLB to:', out_glb)

web_public_glb = os.path.abspath('apps/web/public/mannequin_chibi_master.glb')
if os.path.exists(os.path.dirname(web_public_glb)):
    shutil.copyfile(out_glb, web_public_glb)
    print('Copied GLB to:', web_public_glb)

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print('Saved final scene state to mannequin_chibi_basic_rigTest4.blend')
