import bpy, os, math

flesh_base = os.path.abspath("flesh_base_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=flesh_base)

p = os.path.abspath("mannequin_chibi_basic_rigTest2.blend")
with bpy.data.libraries.load(p) as (df, dt):
    dt.objects = ["Modular_Hair_Adventurer"]

hair = bpy.data.objects.get("Modular_Hair_Adventurer")
bpy.context.scene.collection.objects.link(hair)
hair.hide_render = False
hair.hide_viewport = False

min_z = min(v.co.z for v in hair.data.vertices)
mid_y = sum(v.co.y for v in hair.data.vertices) / len(hair.data.vertices)
mid_x = sum(v.co.x for v in hair.data.vertices) / len(hair.data.vertices)
for v in hair.data.vertices:
    v.co.x -= mid_x
    v.co.y -= mid_y
    v.co.z -= min_z

hair.rotation_euler = (math.radians(-90), 0, math.radians(180))
hair.location = (0.0, -0.015, 1.05)
hair.scale = (1.68, 1.68, 1.68)
bpy.context.view_layer.update()

arm = bpy.data.objects["Armature"]
bpy.ops.object.select_all(action="DESELECT")
hair.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
arm.data.bones.active = arm.data.bones["Head"]
bpy.ops.object.parent_set(type="BONE")

# Warm chestnut / golden brown cel shader (Locke Cole / Bartz style)
mat = bpy.data.materials.new(name="M_Hair_Adventurer_Cel")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()
out = nodes.new("ShaderNodeOutputMaterial")
diff = nodes.new("ShaderNodeBsdfDiffuse")
diff.inputs["Roughness"].default_value = 0.0
s2rgb = nodes.new("ShaderNodeShaderToRGB")
ramp = nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.interpolation = "CONSTANT"
r_elems = ramp.color_ramp.elements
r_elems[0].position = 0.0
r_elems[0].color = (0.35, 0.18, 0.08, 1.0) # Deep warm brown shadow
r_elems[1].position = 0.35
r_elems[1].color = (0.78, 0.48, 0.22, 1.0) # Warm chestnut highlight
links.new(diff.outputs["BSDF"], s2rgb.inputs["Shader"])
links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
links.new(ramp.outputs["Color"], out.inputs["Surface"])

hair.data.materials.clear()
hair.data.materials.append(mat)

outline = hair.modifiers.new(name="Hair_Outline", type="SOLIDIFY")
outline.thickness = -0.007
outline.use_flip_normals = True
outline.material_offset = 1
outline.material_offset_rim = 1

mat_out = bpy.data.materials.get("LPC_Outline_Mat")
if mat_out:
    hair.data.materials.append(mat_out)

scene = bpy.context.scene
scene.render.filepath = os.path.abspath("artifacts/verification/test_adventurer_fitted.png")
bpy.ops.render.render(write_still=True)
print("Rendered fitted adventurer hair preview!")
