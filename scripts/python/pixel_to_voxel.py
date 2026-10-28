import os
import sys
from PIL import Image

def convert_to_voxel_obj(image_path, obj_path):
    print(f"🧱 Voxelizing {image_path}...")
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    vertices = []
    faces = []
    uvs = []

    # 1x1x1 cube centered at origin
    cube_verts = [
        (-0.5, -0.5, 0.5), (0.5, -0.5, 0.5), (0.5, 0.5, 0.5), (-0.5, 0.5, 0.5),
        (-0.5, -0.5, -0.5), (0.5, -0.5, -0.5), (0.5, 0.5, -0.5), (-0.5, 0.5, -0.5)
    ]
    
    # 6 faces mapping to the 8 vertices
    cube_faces = [
        (1, 2, 3, 4), (5, 8, 7, 6), (1, 5, 6, 2),
        (2, 6, 7, 3), (3, 7, 8, 4), (5, 1, 4, 8)
    ]

    voxel_count = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 128:
                # Calculate UV based on pixel center. 
                # This guarantees the voxel samples the exact solid color of this pixel.
                u = (x + 0.5) / width
                v = 1.0 - ((y + 0.5) / height)
                
                # Center the mesh on X/Y axis
                vx = x - (width / 2)
                vy = (height / 2) - y
                vz = 0

                v_start = len(vertices)
                for cv in cube_verts:
                    vertices.append((cv[0] + vx, cv[1] + vy, cv[2] + vz))
                
                uvs.append((u, v))
                vt_idx = len(uvs) # 1-indexed for OBJ
                
                for cf in cube_faces:
                    faces.append([
                        (v_start + cf[0], vt_idx),
                        (v_start + cf[1], vt_idx),
                        (v_start + cf[2], vt_idx),
                        (v_start + cf[3], vt_idx)
                    ])
                
                voxel_count += 1

    with open(obj_path, 'w') as f:
        f.write(f"# Voxelized from {os.path.basename(image_path)}\n")
        f.write(f"mtllib {os.path.splitext(os.path.basename(obj_path))[0]}.mtl\n") 
        f.write("usemtl Material\n")
        
        for v in vertices:
            f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
        
        for uv in uvs:
            f.write(f"vt {uv[0]:.6f} {uv[1]:.6f}\n")
            
        for face in faces:
            # Format: f v1/vt1 v2/vt2 v3/vt3 v4/vt4
            f.write(f"f {face[0][0]}/{face[0][1]} {face[1][0]}/{face[1][1]} {face[2][0]}/{face[2][1]} {face[3][0]}/{face[3][1]}\n")

    # Write a simple MTL file so standard 3D viewers load the original PNG texture onto the model
    mtl_path = os.path.splitext(obj_path)[0] + ".mtl"
    with open(mtl_path, 'w') as mtl:
        mtl.write("newmtl Material\n")
        mtl.write("Ka 1.000000 1.000000 1.000000\n")
        mtl.write("Kd 1.000000 1.000000 1.000000\n")
        mtl.write("Ks 0.000000 0.000000 0.000000\n")
        mtl.write(f"map_Kd {os.path.abspath(image_path)}\n")

    print(f"✅ Created 3D Voxel Model! {voxel_count} micro-cubes saved to {obj_path} and {mtl_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python pixel_to_voxel.py <input.png> <output.obj>")
    else:
        convert_to_voxel_obj(sys.argv[1], sys.argv[2])
