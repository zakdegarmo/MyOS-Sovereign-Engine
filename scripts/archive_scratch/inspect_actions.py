import bpy

print(f"Total actions in blend: {len(bpy.data.actions)}")
for a in bpy.data.actions:
    print(f"Action: '{a.name}', frames: {a.frame_range[0]:.0f} to {a.frame_range[1]:.0f}")
