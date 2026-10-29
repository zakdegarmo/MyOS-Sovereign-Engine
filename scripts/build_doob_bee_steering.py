import base64
import os

out_html = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\doob_bee_steering_station.html"
cand_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee"

def get_b64(fname):
    p = os.path.join(cand_dir, fname)
    with open(p, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

b64_a = get_b64("candidate_a_clean.png")
b64_b = get_b64("candidate_b_clean.png")
b64_c = get_b64("candidate_c_clean.png")

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Doob-bee A/B/C Steering Station</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    .card-glow:hover {{
      box-shadow: 0 0 25px rgba(16, 185, 129, 0.35);
      border-color: rgba(52, 211, 153, 0.8);
    }}
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-3 select-none">
  <div class="bg-zinc-950 text-zinc-100 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl max-w-5xl mx-auto">
    
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-2xl">🐝💨</span>
          <h1 class="text-lg font-bold text-amber-400 font-mono tracking-wide uppercase">The "Doob-bee" • A/B/C Visual Steering Station</h1>
          <span class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-mono font-semibold">HUMAN-IN-THE-LOOP</span>
        </div>
        <p class="text-xs text-zinc-400">Generated locally via GenX SD v1.5 + LPC LoRA on RTX 4060 Ti. Select a candidate or steer mutations before 3D Blender filming.</p>
      </div>
      <div class="text-right">
        <span class="text-[11px] font-mono text-zinc-500">SPEED: <span class="text-emerald-400">17.2s for 3 variants</span></span>
      </div>
    </div>

    <!-- Candidate Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      
      <!-- Candidate A -->
      <div id="cardA" class="card-glow bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-sm text-amber-300 font-mono">CANDIDATE A</span>
            <span class="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">Aviator Chibi</span>
          </div>
          <div class="relative w-full aspect-square bg-zinc-950/80 rounded-lg p-2 border border-zinc-800/80 flex items-center justify-center overflow-hidden mb-3">
            <img src="data:image/png;base64,{b64_a}" class="max-h-full object-contain drop-shadow-md hover:scale-105 transition duration-200" alt="Candidate A">
          </div>
          <div class="text-xs space-y-1 text-zinc-300 mb-3">
            <p><strong class="text-zinc-400">Silhouette:</strong> Fuzzy capsule body, upright boots</p>
            <p><strong class="text-zinc-400">Accessories:</strong> Brass aviator goggles, toothy grin</p>
            <p><strong class="text-zinc-400">Vibe:</strong> Quirky minion mascot, comic timing</p>
          </div>
        </div>
        <button onclick="selectCandidate('A')" class="w-full py-2 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold font-mono tracking-wider transition shadow cursor-pointer">
          &check; CHOOSE A &rarr; 3D RIG
        </button>
      </div>

      <!-- Candidate B -->
      <div id="cardB" class="card-glow bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-sm text-amber-300 font-mono">CANDIDATE B</span>
            <span class="text-[10px] bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">Chubby Stoned</span>
          </div>
          <div class="relative w-full aspect-square bg-zinc-950/80 rounded-lg p-2 border border-zinc-800/80 flex items-center justify-center overflow-hidden mb-3">
            <img src="data:image/png;base64,{b64_b}" class="max-h-full object-contain drop-shadow-md hover:scale-105 transition duration-200" alt="Candidate B">
          </div>
          <div class="text-xs space-y-1 text-zinc-300 mb-3">
            <p><strong class="text-zinc-400">Silhouette:</strong> Round chubby bumblebee, high striping</p>
            <p><strong class="text-zinc-400">Face:</strong> Red sleepy eyes, chill relaxed smile</p>
            <p><strong class="text-zinc-400">Vibe:</strong> 100% genuine stoner bee, maximum chill</p>
          </div>
        </div>
        <button onclick="selectCandidate('B')" class="w-full py-2 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold font-mono tracking-wider transition shadow cursor-pointer">
          &check; CHOOSE B &rarr; 3D RIG
        </button>
      </div>

      <!-- Candidate C -->
      <div id="cardC" class="card-glow bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-sm text-amber-300 font-mono">CANDIDATE C</span>
            <span class="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded border border-purple-700/50">Anime Figurine</span>
          </div>
          <div class="relative w-full aspect-square bg-zinc-950/80 rounded-lg p-2 border border-zinc-800/80 flex items-center justify-center overflow-hidden mb-3">
            <img src="data:image/png;base64,{b64_c}" class="max-h-full object-contain drop-shadow-md hover:scale-105 transition duration-200" alt="Candidate C">
          </div>
          <div class="text-xs space-y-1 text-zinc-300 mb-3">
            <p><strong class="text-zinc-400">Silhouette:</strong> Oversized chibi head, giant honey wing</p>
            <p><strong class="text-zinc-400">Face:</strong> Big expressive violet anime eyes</p>
            <p><strong class="text-zinc-400">Vibe:</strong> Stylized collectible vinyl toy aesthetic</p>
          </div>
        </div>
        <button onclick="selectCandidate('C')" class="w-full py-2 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold font-mono tracking-wider transition shadow cursor-pointer">
          &check; CHOOSE C &rarr; 3D RIG
        </button>
      </div>

    </div>

    <!-- Steer / Mutate Controls -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
      <div class="flex-1 w-full">
        <label class="block text-[11px] font-mono text-zinc-400 mb-1">STEER OR MUTATE CANDIDATES (e.g. "Take B's chubby body and give him A's goggles"):</label>
        <input id="steerInput" type="text" placeholder="Type micro-adjustments or mutation notes here..." 
          class="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition">
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-4">
        <button onclick="submitSteer()" class="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono transition shadow cursor-pointer whitespace-nowrap">
          &infin; MUTATE NEXT ROUND
        </button>
      </div>
    </div>

    <!-- Feedback Notification Banner -->
    <div id="statusBanner" class="mt-3 text-center text-xs font-mono text-emerald-400 opacity-0 transition-opacity duration-300">
      Candidate Selected! Forwarding to Blender Headless Rig...
    </div>

  </div>

  <script>
    function selectCandidate(letter) {{
      const banner = document.getElementById("statusBanner");
      banner.textContent = `Candidate ${{letter}} Approved! Transmitting to Blender Headless Rig & Sprite-Inator...`;
      banner.style.opacity = "1";

      // Highlight selected card
      ["A", "B", "C"].forEach(l => {{
        const el = document.getElementById(`card${{l}}`);
        if (l === letter) {{
          el.classList.add("border-emerald-500", "bg-emerald-950/20", "ring-2", "ring-emerald-400");
        }} else {{
          el.classList.remove("border-emerald-500", "bg-emerald-950/20", "ring-2", "ring-emerald-400");
          el.style.opacity = "0.5";
        }}
      }});
    }}

    function submitSteer() {{
      const text = document.getElementById("steerInput").value.trim();
      if (!text) return;
      const banner = document.getElementById("statusBanner");
      banner.textContent = `Steering Note Received: "${{text}}" - Ready for local B-Team generation.`;
      banner.style.opacity = "1";
    }}
  </script>
</body>
</html>
'''

with open(out_html, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Steering Station built at: {out_html}")
