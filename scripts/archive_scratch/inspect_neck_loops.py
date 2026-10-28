import bpy, bmesh

man = bpy.data.objects['Mannequin']
bm = bmesh.new()
bm.from_mesh(man.data)
bm.verts.ensure_lookup_table()

mw = man.matrix_world

# Let's find vertices around z=0.90 to 1.05 and inspect edge loops
neck_verts = [v for v in bm.verts if 0.90 <= (mw @ v.co).z <= 1.02 and abs((mw @ v.co).x - 0.007) < 0.12]
print(f"Neck verts count: {len(neck_verts)}")

# Check their Z values grouped into discrete levels (loops)
z_vals = sorted(list(set(round((mw @ v.co).z, 3) for v in neck_verts)))
print("Distinct Z levels at neck:", z_vals)
