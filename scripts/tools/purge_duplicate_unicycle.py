import bpy
import os

target_files = [
    r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\uniracer_model.blend",
    r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\models\uniracer_model.blend"
]

for blend_path in target_files:
    if not os.path.exists(blend_path):
        continue
    print(f"Purging reference clutter from {blend_path}...")
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    # 1. Find and delete all .001 objects and reference collection
    ref_col = bpy.data.collections.get('Original_Handcrafted_Reference')
    if ref_col:
        for obj in list(ref_col.objects):
            print(f"  Removing reference object: {obj.name}")
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(ref_col)
        print("  Deleted collection 'Original_Handcrafted_Reference'")
        
    # Also remove any leftover .001 objects that might be unparented
    for obj in list(bpy.data.objects):
        if '.001' in obj.name:
            print(f"  Removing stray object: {obj.name}")
            bpy.data.objects.remove(obj, do_unlink=True)
            
    # Remove unused meshes/materials
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
            
    bpy.ops.wm.save_mainfile(filepath=blend_path)
    print(f"Saved clean {blend_path}!")
    
    # Verify remaining objects
    print(f"Remaining scene objects in {os.path.basename(blend_path)}:")
    for obj in bpy.context.scene.objects:
        print(f"  - {obj.name} ({obj.type}, parent={obj.parent.name if obj.parent else 'None'})")
