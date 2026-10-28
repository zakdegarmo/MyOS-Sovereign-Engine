import socket

code = """
import bpy

print(">>> LIVE BRIDGE RECEIVED EXECUTION COMMAND <<<")

# Force Redraw & Update
bpy.ops.import_scene.gltf(filepath=r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\meshy ai glb\\rigged\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped_Character_output.glb")

# Scale all mannequin meshes
for obj in bpy.data.objects:
    if 'icosphere' in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)
    elif 'mannequin' in obj.name.lower() or obj.name == 'Cylinder':
        obj.scale = (0.75, 0.75, 0.75)

# Offset mage
for obj in bpy.context.selected_objects:
    obj.location.x += 1.2

# Force Tag Redraw
for win in bpy.context.window_manager.windows:
    for area in win.screen.areas:
        if area.type == 'VIEW_3D':
            area.tag_redraw()

print(">>> VIEWPORT REDRAW FORCED <<<")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("COMMAND_SENT_WITH_REDRAW")
