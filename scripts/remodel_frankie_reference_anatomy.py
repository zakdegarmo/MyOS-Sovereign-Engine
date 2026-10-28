import bpy
import math
import os

OUTPUT_BLEND = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew\frankie_textured_master.blend"

print("================================================================")
print("=== REMODELING FRANKIE GALLAGHER TO MATCH REFERENCE ANATOMY ===")
print("================================================================")

# Open current textured master
if os.path.exists(OUTPUT_BLEND):
    bpy.ops.wm.open_mainfile(filepath=OUTPUT_BLEND)
else:
    base = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew\frankie_humanoid_master.blend"
    bpy.ops.wm.open_mainfile(filepath=base)

arm = bpy.data.objects.get("Armature")
if not arm:
    for o in bpy.data.objects:
        if o.type == 'ARMATURE':
            arm = o
            break

CX, CY = 0.0, 0.0

# ─────────────────────────────────────────────────────────────────────────────
# 1. FIX TAIL BONES & ARMATURE (Side Billowing S-Curve, NOT Marge Simpson Afro!)
# In the reference, tail curves out to character's right (viewer's left, X < 0)
# and arches comfortably over the side/shoulder at Z <= 1.40, completely clearing the head.
# ─────────────────────────────────────────────────────────────────────────────
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones

tail_bone_coords = [
    ('Tail.1',   (CX - 0.12, CY + 0.18, 0.60), (CX - 0.28, CY + 0.24, 0.76)),
    ('Tail.2',   (CX - 0.28, CY + 0.24, 0.76), (CX - 0.52, CY + 0.26, 0.98)),
    ('Tail.3',   (CX - 0.52, CY + 0.26, 0.98), (CX - 0.60, CY + 0.22, 1.22)),
    ('Tail.4',   (CX - 0.60, CY + 0.22, 1.22), (CX - 0.48, CY + 0.16, 1.40)),
    ('Tail.Tip', (CX - 0.48, CY + 0.16, 1.40), (CX - 0.30, CY + 0.10, 1.45)),
]
for bname, h_pos, t_pos in tail_bone_coords:
    b = eb.get(bname)
    if b:
        b.head = h_pos
        b.tail = t_pos

bpy.ops.object.mode_set(mode='OBJECT')
print("[OK] Tail bones redirected to natural side-billowing S-curve.")

# ─────────────────────────────────────────────────────────────────────────────
# 2. CLEAN COMIC MATERIALS (Kill TV static, smooth painterly comic cel tones)
# ─────────────────────────────────────────────────────────────────────────────
def make_clean_cel_material(name, color_base, color_shadow=None):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfDiffuse")
    bsdf.inputs["Color"].default_value = (color_base[0], color_base[1], color_base[2], 1.0)
    bsdf.inputs["Roughness"].default_value = 1.0

    s2rgb = nodes.new("ShaderNodeShaderToRGB")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"

    if len(color_base) == 3:
        color_base = (color_base[0], color_base[1], color_base[2], 1.0)

    if color_shadow is None:
        color_shadow = (color_base[0] * 0.42, color_base[1] * 0.42, color_base[2] * 0.45, 1.0)
    elif len(color_shadow) == 3:
        color_shadow = (color_shadow[0], color_shadow[1], color_shadow[2], 1.0)

    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = color_shadow
    ramp.color_ramp.elements[1].position = 0.36
    ramp.color_ramp.elements[1].color = color_base

    links.new(bsdf.outputs["BSDF"], s2rgb.inputs["Shader"])
    links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], out.inputs["Surface"])
    return mat

def make_bloodshot_sclera_material(name):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    
    # Procedural Capillaries mapped softly
    tex_coord = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 14.0
    noise.inputs["Detail"].default_value = 4.0
    noise.inputs["Roughness"].default_value = 0.60
    links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "LINEAR"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.97, 0.96, 0.92, 1.0) # Sallow white sclera
    ramp.color_ramp.elements[1].position = 0.60
    ramp.color_ramp.elements[1].color = (0.94, 0.90, 0.82, 1.0)
    
    # Crimson vein stops
    e_vein = ramp.color_ramp.elements.new(0.64)
    e_vein.color = (0.85, 0.08, 0.08, 1.0)
    e_vein2 = ramp.color_ramp.elements.new(0.68)
    e_vein2.color = (0.97, 0.96, 0.92, 1.0)

    bsdf = nodes.new("ShaderNodeBsdfDiffuse")
    bsdf.inputs["Roughness"].default_value = 1.0

    s2rgb = nodes.new("ShaderNodeShaderToRGB")
    cel = nodes.new("ShaderNodeValToRGB")
    cel.color_ramp.interpolation = "CONSTANT"
    cel.color_ramp.elements[0].position = 0.0
    cel.color_ramp.elements[0].color = (0.65, 0.65, 0.65, 1.0)
    cel.color_ramp.elements[1].position = 0.35
    cel.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)

    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = 1.0

    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Color"])
    links.new(bsdf.outputs["BSDF"], s2rgb.inputs["Shader"])
    links.new(s2rgb.outputs["Color"], cel.inputs["Fac"])
    links.new(ramp.outputs["Color"], mix.inputs[6])
    links.new(cel.outputs["Color"], mix.inputs[7])
    links.new(mix.outputs[2], out.inputs["Surface"])
    return mat

mat_black_fur   = make_clean_cel_material("Black_Fur",   (0.14, 0.13, 0.16), (0.05, 0.05, 0.06))
mat_tail_fur    = make_clean_cel_material("Tail_Fur",    (0.30, 0.30, 0.34), (0.14, 0.14, 0.16)) # Distinct ash-slate
mat_suit_char   = make_clean_cel_material("Suit_Grey",   (0.38, 0.39, 0.42), (0.18, 0.19, 0.22))
mat_shirt_off   = make_clean_cel_material("Shirt_Off",   (0.96, 0.94, 0.90), (0.70, 0.68, 0.62))
mat_tie_black   = make_clean_cel_material("Tie_Black",   (0.06, 0.05, 0.07), (0.02, 0.02, 0.02))
mat_sclera_blood= make_bloodshot_sclera_material("Eye_Bloodshot")
mat_eye_bag     = make_clean_cel_material("Eye_Bags",    (0.52, 0.25, 0.23), (0.28, 0.12, 0.10))
mat_pupil_blk   = make_clean_cel_material("Eye_Pupil",   (0.01, 0.01, 0.01), (0.0, 0.0, 0.0))
mat_teeth_clean = make_clean_cel_material("Teeth_Corn",  (0.96, 0.94, 0.86), (0.75, 0.70, 0.55))
mat_nose_reddish= make_clean_cel_material("Nose_Reddish",(0.78, 0.34, 0.30), (0.42, 0.15, 0.12))
mat_muzzle_tan  = make_clean_cel_material("Muzzle_Tan",  (0.80, 0.60, 0.42), (0.48, 0.32, 0.18))
mat_mouth_dark  = make_clean_cel_material("Mouth_Dark",  (0.04, 0.01, 0.02), (0.02, 0.00, 0.01))

print("[OK] Clean comic shaders compiled.")

# ─────────────────────────────────────────────────────────────────────────────
# 3. REPOSITION & RESHAPE TAIL MESH (Clear the head!)
# ─────────────────────────────────────────────────────────────────────────────
tail_mesh_specs = [
    ("Tail_Part_0", "Tail.1",   (CX - 0.20, CY + 0.20, 0.68), 0.20, (1.0, 1.1, 1.0),   -15),
    ("Tail_Part_1", "Tail.2",   (CX - 0.38, CY + 0.25, 0.88), 0.28, (1.1, 1.2, 1.1),   -22),
    ("Tail_Part_2", "Tail.3",   (CX - 0.58, CY + 0.26, 1.08), 0.36, (1.2, 1.3, 1.2),   -18),
    ("Tail_Part_3", "Tail.4",   (CX - 0.55, CY + 0.20, 1.30), 0.38, (1.25, 1.35, 1.2),  10),
    ("Tail_Part_4", "Tail.Tip", (CX - 0.44, CY + 0.14, 1.42), 0.30, (1.2, 1.25, 1.15),  28),
    ("Tail_Part_5", "Tail.Tip", (CX - 0.30, CY + 0.08, 1.45), 0.22, (1.1, 1.15, 1.1),   45),
]

for name, bname, pos, rad, sc, rot_y in tail_mesh_specs:
    o = bpy.data.objects.get(name)
    if o:
        o.location = pos
        o.scale = (rad * sc[0] * 3.5, rad * sc[1] * 3.5, rad * sc[2] * 3.5)
        o.rotation_euler = (0, math.radians(rot_y), math.radians(15))
        o.data.materials.clear()
        o.data.materials.append(mat_tail_fur)

# Tuft flourishes on the side
for tname, pos, rot in [
    ("Tail_Tuft_2", (CX - 0.72, CY + 0.26, 1.10), (0, math.radians(45), math.radians(-30))),
    ("Tail_Tuft_3", (CX - 0.68, CY + 0.22, 1.32), (0, math.radians(30), math.radians(-20)))
]:
    o = bpy.data.objects.get(tname)
    if o:
        o.location = pos
        o.rotation_euler = rot
        o.data.materials.clear()
        o.data.materials.append(mat_tail_fur)

print("[OK] Tail meshes repositioned to viewer's left side curve.")

# ─────────────────────────────────────────────────────────────────────────────
# 4. BIG BULGING CRAZED EYES & DERANGED PUPILS
# ─────────────────────────────────────────────────────────────────────────────
for side, sign in [("L", 1), ("R", -1)]:
    ex = CX + sign * 0.16
    
    # Eyeball: LARGE, bulging forward and spherical
    eb_obj = bpy.data.objects.get(f"Eyeball_{side}")
    if eb_obj:
        eb_obj.location = (ex, CY - 0.29, 1.25)
        eb_obj.scale = (0.24, 0.20, 0.25)
        eb_obj.data.materials.clear()
        eb_obj.data.materials.append(mat_sclera_blood)

    # Move droopy eyelid UP into a furrowed brow fold so eyes are WIDE OPEN
    lid_obj = bpy.data.objects.get(f"Eyelid_Top_{side}")
    if lid_obj:
        lid_obj.location = (ex, CY - 0.31, 1.37) # High up over the eye
        lid_obj.scale = (0.22, 0.12, 0.08)
        lid_obj.data.materials.clear()
        lid_obj.data.materials.append(mat_black_fur)

    # Eye Bags: prominent hungover bags underneath
    bag_obj = bpy.data.objects.get(f"Eye_Bag_{side}")
    if bag_obj:
        bag_obj.location = (ex, CY - 0.31, 1.14)
        bag_obj.scale = (0.22, 0.10, 0.08)
        bag_obj.data.materials.clear()
        bag_obj.data.materials.append(mat_eye_bag)

    # Pupils: prominent, crazy, dilated
    pup_obj = bpy.data.objects.get(f"Pupil_{side}")
    if pup_obj:
        pup_x = ex + sign * 0.015 # Slightly wall-eyed deranged gaze
        pup_obj.location = (pup_x, CY - 0.40, 1.25)
        pup_obj.scale = (0.09, 0.05, 0.09)
        pup_obj.data.materials.clear()
        pup_obj.data.materials.append(mat_pupil_blk)

print("[OK] Bulging crazed eyes sculpted.")

# ─────────────────────────────────────────────────────────────────────────────
# 5. WIDE CRAZED TOOTHY GRIN (Matching Reference)
# ─────────────────────────────────────────────────────────────────────────────
# Mouth dark cavity: wide clenched grin
mouth = bpy.data.objects.get("Mouth_Dark_Cavity")
if mouth:
    mouth.location = (CX, CY - 0.33, 1.07)
    mouth.scale = (0.42, 0.14, 0.22)
    mouth.data.materials.clear()
    mouth.data.materials.append(mat_mouth_dark)

# Upper Buck Incisors: prominent, centered in the wide grin
for bname, sign in [("Upper_Buck_L", -1), ("Upper_Buck_R", 1)]:
    t = bpy.data.objects.get(bname)
    if t:
        t.location = (CX + sign * 0.038, CY - 0.385, 1.075)
        t.scale = (0.055, 0.032, 0.095)
        t.data.materials.clear()
        t.data.materials.append(mat_teeth_clean)

# Flanking lateral teeth to complete the manic full-row grin
lateral_teeth_data = [
    ("Tooth_Lat_L1", "Head", (CX - 0.105, CY - 0.365, 1.075), (0.045, 0.028, 0.080)),
    ("Tooth_Lat_L2", "Head", (CX - 0.165, CY - 0.335, 1.075), (0.040, 0.025, 0.070)),
    ("Tooth_Lat_R1", "Head", (CX + 0.105, CY - 0.365, 1.075), (0.045, 0.028, 0.080)),
    ("Tooth_Lat_R2", "Head", (CX + 0.165, CY - 0.335, 1.075), (0.040, 0.025, 0.070)),
    # Lower row
    ("Tooth_Low_L1", "Jaw",  (CX - 0.075, CY - 0.360, 1.025), (0.040, 0.025, 0.065)),
    ("Tooth_Low_R1", "Jaw",  (CX + 0.075, CY - 0.360, 1.025), (0.040, 0.025, 0.065)),
]

for tname, bname, pos, sc in lateral_teeth_data:
    t = bpy.data.objects.get(tname)
    if not t:
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        t = bpy.context.active_object
        t.name = tname
        t.parent = arm
        t.parent_type = 'BONE'
        t.parent_bone = bname
    t.location = pos
    t.scale = sc
    t.data.materials.clear()
    t.data.materials.append(mat_teeth_clean)

# Lower central incisors
for bname, sign in [("Lower_Tooth_L", -1), ("Lower_Tooth_R", 1)]:
    t = bpy.data.objects.get(bname)
    if t:
        t.location = (CX + sign * 0.024, CY - 0.370, 1.025)
        t.scale = (0.035, 0.025, 0.065)
        t.data.materials.clear()
        t.data.materials.append(mat_teeth_clean)

print("[OK] Full wide toothy grin sculpted.")

# ─────────────────────────────────────────────────────────────────────────────
# 6. ASSIGN SMOOTH CLEAN COMIC MATERIALS TO SUIT & FUR (No TV static)
# ─────────────────────────────────────────────────────────────────────────────
suit_objects = [
    "Pelvis_Suit", "Trouser_Thigh_L", "Trouser_Thigh_R", "Trouser_Shin_L", "Trouser_Shin_R",
    "Torso_Belly", "Jacket_Chest", "Lapel_L", "Lapel_R", "Shoulder_Pad_L", "Shoulder_Pad_R",
    "Sleeve_Upper_L", "Sleeve_Upper_R", "Sleeve_Lower_L", "Sleeve_Lower_R"
]
for sname in suit_objects:
    o = bpy.data.objects.get(sname)
    if o:
        o.data.materials.clear()
        o.data.materials.append(mat_suit_char)

fur_objects = [
    "Head_Base", "Neck_Fur", "Chin_Goatee", "Foot_Paw_L", "Foot_Paw_R", "Hand_Paw_L", "Hand_Paw_R",
    "Cheek_Tuft_L_0", "Cheek_Tuft_L_1", "Cheek_Tuft_L_2",
    "Cheek_Tuft_R_0", "Cheek_Tuft_R_1", "Cheek_Tuft_R_2",
    "Crown_Spike_0", "Crown_Spike_1", "Crown_Spike_2",
    "Ear_L_Base", "Ear_R_Base", "Eyebrow_L", "Eyebrow_R"
]
for fname in fur_objects:
    o = bpy.data.objects.get(fname)
    if o:
        o.data.materials.clear()
        o.data.materials.append(mat_black_fur)

# Save the remodeled 3D master
bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
print(f"[OK] Saved remodeled master to: {OUTPUT_BLEND}")

# ─────────────────────────────────────────────────────────────────────────────
# 7. RENDER FRONT & ISO PREVIEW STILLS TO VERIFY
# ─────────────────────────────────────────────────────────────────────────────
ARTIFACT_DIR = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True

cam = bpy.data.objects.get("Camera")
if not cam:
    cam_data = bpy.data.cameras.new("Camera")
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam)
scene.camera = cam

# Front Full Body Still
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.45
cam.location = (0.0, -3.5, 1.05)
cam.rotation_euler = (math.radians(90), 0, 0)

front_path = os.path.join(ARTIFACT_DIR, "frankie_remodel_front_test.png")
scene.render.filepath = front_path
bpy.ops.render.render(write_still=True)
print(f"Rendered front still to: {front_path}")

print("=== REMODELING AND PREVIEW RENDER COMPLETE ===")
