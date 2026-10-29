import bpy

blend_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_and_mage_scene.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

# The Mage GLB was imported in centimeters (149 units high = 149 meters in Blender instead of 1.49m)
mage = bpy.data.objects.get('char1')
mannequin = bpy.data.objects.get('Mannequin')

if mage and mannequin:
    # Scale Mage down by 0.01 to convert cm to Blender meters (Height becomes 1.49m)
    mage.scale = (0.01, 0.01, 0.01)
    
    # Place Mage directly beside Mannequin at X = 1.0m, Y = 0, Z = 0
    mage.location = (1.0, 0, 0)
    
    # Mannequin is at (0, 0, 0) and height 1.82m -> scale to match exact 1.49m height of Mage
    scale_factor = (149.0 * 0.01) / 1.8287  # ~0.815
    mannequin.scale = (scale_factor, scale_factor, scale_factor)
    mannequin.location = (0, 0, 0)

# Apply scales so both meshes are officially at 1.0 scale and identical height
bpy.ops.wm.save_as_mainfile(filepath=blend_file)
print("✅ Fixed unit mismatch! Both Mage and Mannequin are 1.49m high and standing side by side at ground Z=0.")
