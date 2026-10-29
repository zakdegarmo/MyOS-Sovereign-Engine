import urllib.request
import tarfile
import io
import os
import sys

PACKAGES = [
    # community
    ("community", "libevdev-1.13.3-r0.apk"),
    ("community", "mtdev-1.1.7-r0.apk"),
    ("community", "libinput-libs-1.27.0-r0.apk"),
    ("community", "libinput-1.27.0-r0.apk"),
    ("community", "xf86-input-libinput-1.5.0-r0.apk"),
    ("community", "xf86-input-evdev-2.10.6-r2.apk"),
    ("community", "xinput-1.6.4-r2.apk"),
]

BASE_URL = "http://dl-cdn.alpinelinux.org/alpine/v3.21/{branch}/x86_64/{pkg}"

def download_and_extract(target_dir):
    os.makedirs(target_dir, exist_ok=True)
    for branch, pkg in PACKAGES:
        url = BASE_URL.format(branch=branch, pkg=pkg)
        print(f"Downloading {pkg} from {branch}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            data = urllib.request.urlopen(req, timeout=15).read()
            with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tf:
                for member in tf.getmembers():
                    # Skip control files (.PKGINFO, .SIGN.*)
                    if member.name.startswith("."):
                        continue
                    tf.extract(member, path=target_dir)
            print(f"  Successfully extracted {pkg}")
        except Exception as e:
            print(f"  Error extracting {pkg}: {e}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "/tmp/pimg"
    download_and_extract(target)
