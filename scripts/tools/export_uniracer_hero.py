import bpy
import os

def export_hero_uniracer():
    blend_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\uniracer_model.blend"
    out_glb = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\uniracer_hero.glb"
    
    os.makedirs(os.path.dirname(out_glb), exist_ok=True)
    
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')
    
    # Target collection: New_Uniracer_Model
    coll = bpy.data.collections.get('New_Uniracer_Model')
    if not coll:
        raise RuntimeError("Collection 'New_Uniracer_Model' not found in blend file!")
        
    for obj in coll.objects:
        obj.select_set(True)
        print(f"Selected for export: {obj.name} ({obj.type})")
        
    arm = bpy.data.objects.get('Uniracer_Rig')
    if arm:
        bpy.context.view_layer.objects.active = arm
        
    print(f"Exporting {len(coll.objects)} objects to {out_glb}...")
    
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        use_selection=True,
        export_format='GLB',
        export_apply=False, # keep bone parenting and rig hierarchy intact
        export_yup=True,
        export_materials='EXPORT',
        export_armature_object_remove=False
    )
    
    print("Export complete! File size:", os.path.getsize(out_glb), "bytes")

if __name__ == '__main__':
    export_hero_uniracer()
