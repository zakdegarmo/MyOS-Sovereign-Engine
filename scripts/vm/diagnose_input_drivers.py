import urllib.request
import tarfile
import io

def check_index(repo_version, branch):
    url = f"http://dl-cdn.alpinelinux.org/alpine/{repo_version}/{branch}/x86_64/APKINDEX.tar.gz"
    print(f"Fetching {url}...")
    try:
        req = urllib.request.urlopen(url, timeout=10)
        tf = tarfile.open(fileobj=io.BytesIO(req.read()), mode="r:gz")
        content = tf.extractfile("APKINDEX").read().decode("utf-8", errors="ignore")
        pkgs = []
        cur = {}
        for line in content.split("\n"):
            if line.startswith("P:"):
                cur["pkg"] = line[2:]
            elif line.startswith("V:"):
                cur["ver"] = line[2:]
            elif line.startswith("D:"):
                cur["deps"] = line[2:]
            elif line == "":
                if "pkg" in cur and ("input" in cur["pkg"] or "evdev" in cur["pkg"]):
                    pkgs.append(cur)
                cur = {}
        for p in pkgs:
            print(f"  {p['pkg']}-{p.get('ver')} | deps: {p.get('deps')}")
    except Exception as e:
        print(f"Failed {url}: {e}")

if __name__ == "__main__":
    check_index("v3.21", "main")
    check_index("v3.21", "community")
