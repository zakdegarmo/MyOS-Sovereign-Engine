import bpy

man = bpy.data.objects['Mannequin']
arm = bpy.data.objects['Armature']
arm.data.pose_position = 'POSE'
act = bpy.data.actions.get('Walk_Loop')
arm.animation_data.action = act
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

# Evaluated mesh depsgraph
depsgraph = bpy.context.evaluated_depsgraph_get()
man_eval = man.evaluated_get(depsgraph)
mw = man_eval.matrix_world

xs = [v.co.x for v in man_eval.data.vertices]
ys = [v.co.y for v in man_eval.data.vertices]
zs = [v.co.z for v in man_eval.data.vertices]

# In world coords:
w_pts = [mw @ v.co for v in man_eval.data.vertices]
w_xs = [p.x for p in w_pts]
w_ys = [p.y for p in w_pts]
w_zs = [p.z for p in w_pts]

print(f"Pose Walk_Loop Frame 0 World Bounds:")
print(f"  X: [{min(w_xs):.3f}, {max(w_xs):.3f}], mean={sum(w_xs)/len(w_xs):.3f}")
print(f"  Y: [{min(w_ys):.3f}, {max(w_ys):.3f}], mean={sum(w_ys)/len(w_ys):.3f}")
print(f"  Z: [{min(w_zs):.3f}, {max(w_zs):.3f}], mean={sum(w_zs)/len(w_zs):.3f}")
