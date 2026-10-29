import bpy, bmesh, mathutils, math

def run():
    print('Starting Adventurer Outfit creation...')
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    
    # Ensure Rest pose for exact geometric alignment
    prev_pose = arm.data.pose_position
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    
    # 1. Create or organize collections
    col_clothes = bpy.data.collections.get('Modular_Clothes')
    if not col_clothes:
        col_clothes = bpy.data.collections.new('Modular_Clothes')
        bpy.context.scene.collection.children.link(col_clothes)
        
    col_hair = bpy.data.collections.get('Modular_Hair')
    if not col_hair:
        col_hair = bpy.data.collections.new('Modular_Hair')
        bpy.context.scene.collection.children.link(col_hair)

    # 2. Materials
    # Tunic Material (Forest Green cloth + Brown Leather Belt)
    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    if not mat_tunic:
        mat_tunic = bpy.data.materials.new('M_Adventurer_Tunic')
        mat_tunic.use_nodes = True
        bsdf = mat_tunic.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.12, 0.38, 0.22, 1.0) # Forest green
        bsdf.inputs['Roughness'].default_value = 0.65

    mat_belt = bpy.data.materials.get('M_Adventurer_Belt')
    if not mat_belt:
        mat_belt = bpy.data.materials.new('M_Adventurer_Belt')
        mat_belt.use_nodes = True
        bsdf = mat_belt.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.28, 0.16, 0.08, 1.0) # Dark leather
        bsdf.inputs['Roughness'].default_value = 0.4

    mat_buckle = bpy.data.materials.get('M_Adventurer_Buckle')
    if not mat_buckle:
        mat_buckle = bpy.data.materials.new('M_Adventurer_Buckle')
        mat_buckle.use_nodes = True
        bsdf = mat_buckle.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.85, 0.70, 0.20, 1.0) # Brass gold
        bsdf.inputs['Metallic'].default_value = 0.8
        bsdf.inputs['Roughness'].default_value = 0.3

    # Pants Material (Slate traveler breeches)
    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    if not mat_pants:
        mat_pants = bpy.data.materials.new('M_Adventurer_Pants')
        mat_pants.use_nodes = True
        bsdf = mat_pants.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.22, 0.20, 0.25, 1.0) # Slate charcoal
        bsdf.inputs['Roughness'].default_value = 0.7

    # Boots Material (Rich saddle brown leather + tan cuffs)
    mat_boots = bpy.data.materials.get('M_Adventurer_Boots')
    if not mat_boots:
        mat_boots = bpy.data.materials.new('M_Adventurer_Boots')
        mat_boots.use_nodes = True
        bsdf = mat_boots.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.32, 0.18, 0.10, 1.0) # Saddle brown
        bsdf.inputs['Roughness'].default_value = 0.5

    mat_cuff = bpy.data.materials.get('M_Adventurer_BootCuff')
    if not mat_cuff:
        mat_cuff = bpy.data.materials.new('M_Adventurer_BootCuff')
        mat_cuff.use_nodes = True
        bsdf = mat_cuff.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.65, 0.52, 0.36, 1.0) # Tan cuff
        bsdf.inputs['Roughness'].default_value = 0.6

    # Hair Material (Warm anime golden chestnut)
    mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
    if not mat_hair:
        mat_hair = bpy.data.materials.new('M_Hair_Adventurer')
        mat_hair.use_nodes = True
        bsdf = mat_hair.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.78, 0.52, 0.22, 1.0) # Anime chestnut blonde
        bsdf.inputs['Roughness'].default_value = 0.45

    print('Materials created.')
run()
