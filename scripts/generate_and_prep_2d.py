import json
import base64
import urllib.request
import os
import sys

URL = "http://127.0.0.1:8000/api/generate"
STRIP_URL = "http://127.0.0.1:8000/api/strip-background"

prompt = (
    "chibi anthropomorphic cute red squirrel wearing green hoodie with cannabis leaf, "
    "holding acorn, bushy squirrel tail, standing full body front view, "
    "clean solid white background, stylized miniature character concept, vibrant colors"
)

negative_prompt = (
    "cropped, out of frame, cut off, partial body, zoomed in, close up, "
    "blurry, watermark, text, low quality, detailed photo, realism, noise"
)

payload = {
    "prompt": prompt,
    "negative_prompt": negative_prompt,
    "guidance_scale": 7.5,
    "inference_steps": 28,
    "width": 512,
    "height": 512,
    "use_gemma": False,
    "use_lora": True,
    "lora_scale": 0.7
}

print(f"Sending generation request to GenX: {prompt[:60]}...")
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(URL, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        res_json = json.loads(resp.read().decode('utf-8'))
        raw_b64 = res_json['image_base64']
        print("Image generated successfully!")

        out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test"
        os.makedirs(out_dir, exist_ok=True)
        raw_path = os.path.join(out_dir, "squirrel_raw.png")
        with open(raw_path, "wb") as f:
            f.write(base64.b64decode(raw_b64))
        print(f"Raw image saved to {raw_path}")

        # Now call strip-background endpoint (flood / chroma)
        strip_payload = {
            "image_base64": raw_b64,
            "method": "flood",
            "tolerance": 35
        }
        strip_req = urllib.request.Request(STRIP_URL, data=json.dumps(strip_payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(strip_req, timeout=30) as s_resp:
            s_json = json.loads(s_resp.read().decode('utf-8'))
            strip_b64 = s_json['image_base64']
            strip_path = os.path.join(out_dir, "squirrel_transparent.png")
            with open(strip_path, "wb") as f:
                f.write(base64.b64decode(strip_b64))
            print(f"Transparent image saved to {strip_path}")

except Exception as e:
    print(f"Error during generation: {e}")
    sys.exit(1)
