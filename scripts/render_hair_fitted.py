import bpy, os

flesh_base = os.path.abspath("flesh_base_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=flesh_base)

p = os.path.abspath("mannequin_chibi_basic_rigTest2.blend")
with bpy.data.libraries.load(p) as (df, dt):
    dt.objects = ["Modular_Hair_Adventurer"]

hair = bpy.data.objects.get("Modular_Hair_Adventurer")
bpy.context.scene.collection.objects.link(hair)
hair.hide_render = False
hair.hide_viewport = False

# Let's inspect where the hair vertices are before scaling/moving
# In rigTest2, the hair was centered at (0,0,0)
# Our head cranium is at (0.0, 0.00, 1.04) with radius (rx=0.25, ry=0.23, rz=0.22)
hair.location = (0.0, -0.01, 1.07)
hair.scale = (1.55, 1.55, 1.55)

# Material setup with vibrant anime hair cel-shader
mat = bpy.data.materials.new(name="M_Hair_Cel")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()
out = nodes.new("ShaderNodeOutputMaterial")
diff = nodes.new("ShaderNodeBsdfDiffuse")
s2rgb = nodes.new("ShaderNodeShaderToRGB")
ramp = nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.interpolation = "CONSTANT"
r_elems = ramp.color_ramp.elements
r_elems[0].position = 0.0
r_elems[0].color = (0.55, 0.28, 0.08, 1.0) # Shadow chestnut/gold
r_elems[1].position = 0.35
r_elems[1].color = (0.95, 0.72, 0.22, 1.0) # Highlight golden anime hair
links.new(diff.outputs["BSDF"], s2rgb.inputs["Shader"])
links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
links.new(ramp.outputs["Color"], out.inputs["Surface"])

hair.data.materials.clear()
hair.data.materials.append(mat)

# Ink outline
outline = hair.modifiers.new(name="Hair_Outline", type="SOLIDIFY")
outline.thickness = -0.007
outline.use_flip_normals = True
outline.material_offset = 1
outline.material_offset_rim = 1

mat_out = bpy.data.materials.get("LPC_Outline_Mat")
if mat_out:
    hair.data.materials.append(mat_out)

scene = bpy.context.scene
scene.render.filepath = os.path.abspath("artifacts/verification/test_hair_unhidden.png")
bpy.ops.render.render(write_still=True)
print("Rendered unhidden hair preview!")
