import os
import sys
import urllib.request
import zipfile
import shutil
import tempfile

PACKS = {
    "pants01": "https://files2.makehumancommunity.org/asset_packs/pants01/pants01_cc0.zip",
    "suits01": "https://files2.makehumancommunity.org/asset_packs/suits01/suits01_cc0.zip",
    "dress01": "https://files2.makehumancommunity.org/asset_packs/dress01/dress01_cc0.zip",
    "shoes01": "https://files2.makehumancommunity.org/asset_packs/shoes01/shoes01_cc0.zip",
    "makehuman_system_assets": "https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip"
}

def get_mpfb_user_data():
    try:
        from bl_ext.blender_org.mpfb.services import LocationService
        return LocationService.get_user_data()
    except Exception:
        appdata = os.environ.get("APPDATA", "")
        return os.path.join(appdata, "Blender Foundation", "Blender", "5.2", "extensions", ".user", "blender_org", "mpfb", "data")

def extract_pack(zip_path, target_dir):
    try:
        from bl_ext.blender_org.mpfb.services import AssetService
        err = AssetService.fix_and_extract_asset_pack_zip(zip_path, target_dir)
        if err:
            print(f"[WARN] MPFB extraction returned: {err}, falling back to zipfile extraction")
            with zipfile.ZipFile(zip_path, "r") as z:
                z.extractall(target_dir)
    except Exception as e:
        print(f"[INFO] Using standard zipfile extraction: {e}")
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(target_dir)

def main():
    target_dir = get_mpfb_user_data()
    os.makedirs(target_dir, exist_ok=True)
    print(f"Target MPFB User Data Directory: {target_dir}")

    for pack_name, url in PACKS.items():
        print(f"\n--- Downloading pack: {pack_name} ---")
        tmp_zip = os.path.join(tempfile.gettempdir(), f"{pack_name}.zip")
        try:
            print(f"Fetching {url} -> {tmp_zip}")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as resp, open(tmp_zip, 'wb') as out_file:
                total_size = int(resp.headers.get('content-length', 0))
                downloaded = 0
                block_size = 1024 * 1024  # 1MB blocks
                while True:
                    chunk = resp.read(block_size)
                    if not chunk:
                        break
                    out_file.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\rProgress: {downloaded / (1024*1024):.1f} MB / {total_size / (1024*1024):.1f} MB ({percent:.1f}%)", end="", flush=True)
                    else:
                        print(f"\rProgress: {downloaded / (1024*1024):.1f} MB", end="", flush=True)
            print("\nDownload complete. Extracting...")
            extract_pack(tmp_zip, target_dir)
            print(f"Pack {pack_name} successfully installed!")
        except Exception as ex:
            print(f"\n[ERROR] Failed to install {pack_name}: {ex}")
        finally:
            if os.path.exists(tmp_zip):
                try:
                    os.remove(tmp_zip)
                except Exception:
                    pass

    print("\n--- All Packs Processed ---")
    try:
        from bl_ext.blender_org.mpfb.services import AssetService
        AssetService.rescan_pack_metadata()
        clothes = AssetService.get_asset_list("clothes", "mhclo")
        print(f"\nTotal Clothes Loaded in MPFB: {len(clothes)}")
        print("Sample wardrobe items:")
        for name in list(clothes.keys())[:15]:
            print(f"  * {name}")
    except Exception as e:
        print("Note: Run inside Blender to query AssetService directly.")

if __name__ == "__main__":
    main()
