import base64
import os

lounge_img_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew\lounge_template_1.jpg"
frank_img_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew\crazed_frank_squirrel.png"
squirrel_sheet_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\stoner_squirrel_idle.png"
bee_sheet_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_juiced_idle.png"

out_html = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\hemp_crew_lounge.html"
pub_html = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\hemp_crew_lounge.html"

def to_b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

b64_bg = to_b64(lounge_img_path)
b64_frank = to_b64(frank_img_path)
b64_sq = to_b64(squirrel_sheet_path)
b64_bee = to_b64(bee_sheet_path)

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Hemp Crew - Lounge 1 (Frankie 'Nuts' Gallagher)</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @keyframes crazyTwitch {{
      0%, 100% {{ transform: rotate(0deg) scale(1); }}
      25% {{ transform: rotate(-2deg) scale(1.02); }}
      75% {{ transform: rotate(2deg) scale(0.98); }}
    }}
    canvas {{
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }}
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-3 select-none">
  <div class="bg-zinc-950 text-zinc-100 border border-amber-600/40 rounded-2xl p-4 shadow-2xl max-w-5xl mx-auto overflow-hidden">
    
    <!-- Top Header -->
    <div class="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
          🍻🐿️
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-bold text-amber-400 tracking-wider text-base uppercase font-mono">The Hemp Crew • Lounge 1</h1>
            <span class="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-mono font-bold">FRANK GALLAGHER CANON</span>
          </div>
          <p class="text-xs text-zinc-400">Underground Comix Adult Sitcom Universe • Interactive 2.5D Lounge Engine</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="btnAudio" class="px-3 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/30 text-amber-300 hover:bg-amber-950/50 text-xs font-mono transition flex items-center gap-1.5 cursor-pointer">
          <span id="audioIcon">🔈</span> <span id="audioStatus">Play Funk Groove</span>
        </button>
        <button id="btnPuff" class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-900/40 transition cursor-pointer flex items-center gap-1">
          💨 Spark Joint (Space)
        </button>
      </div>
    </div>

    <!-- Canvas Stage Container -->
    <div class="relative w-full aspect-[1024/819] max-h-[540px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-inner">
      <canvas id="gameCanvas" width="1024" height="819" class="w-full h-full block"></canvas>
      
      <!-- Speech Bubble -->
      <div id="speechBubble" class="absolute pointer-events-none transition-all duration-300 opacity-0 translate-y-2 max-w-sm bg-zinc-950/95 border border-amber-500/60 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs text-amber-200 shadow-2xl z-20">
        <div class="flex items-center gap-1.5 font-bold text-[11px] text-amber-400 mb-1">
          <span id="speakerIcon">🐿️</span> <span id="speakerName">Frankie 'Nuts' Gallagher</span>
        </div>
        <div id="speechText" class="italic leading-relaxed font-sans text-zinc-100 font-medium">"Listen to me! The government wants my nuts, but they can pry 'em from my cold furry paws!"</div>
      </div>

      <!-- Controls Overlay -->
      <div class="absolute bottom-3 left-3 bg-zinc-950/85 border border-zinc-800 backdrop-blur-sm px-3.5 py-1.5 rounded-lg text-[11px] font-mono text-zinc-400 flex items-center gap-3 z-10">
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">W A S D</kbd> Stroll Lounge</span>
        <span class="text-zinc-600">|</span>
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">Space</kbd> Smoke</span>
        <span class="text-zinc-600">|</span>
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">E</kbd> Listen to Frankie's Rants</span>
      </div>

      <!-- Live Vitals HUD -->
      <div class="absolute top-3 right-3 bg-zinc-950/85 border border-zinc-800 backdrop-blur-sm px-3.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-2 z-10">
        <span class="text-red-400 font-bold">FRANK'S BLOOD ALCOHOL / THC:</span>
        <span class="text-amber-300 font-bold">0.42% (LETHAL)</span>
      </div>
    </div>

    <!-- Interactive Dialogue Input with Local Gemma -->
    <div class="mt-3 flex items-center gap-2">
      <div class="relative flex-1">
        <input id="chatInput" type="text" placeholder="Confront Frankie Gallagher about his scam schemes, alimony, or missing weed..." 
          class="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition font-sans">
      </div>
      <button id="btnSend" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition cursor-pointer font-mono">
        Rant &rarr;
      </button>
    </div>

  </div>

  <script>
    // Asset Preloading
    const bgImg = new Image();
    bgImg.src = "data:image/jpeg;base64,{b64_bg}";

    const frankImg = new Image();
    frankImg.src = "data:image/png;base64,{b64_frank}";

    const sqImg = new Image();
    sqImg.src = "data:image/png;base64,{b64_sq}";

    const beeImg = new Image();
    beeImg.src = "data:image/png;base64,{b64_bee}";

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Player (The Chill Hoodie Squirrel)
    const player = {{
      x: 350,
      y: 640,
      speed: 3.5,
      dirRow: 2,
      frame: 0,
      animTimer: 0,
      animSpeed: 8,
      isMoving: false
    }};

    // Frankie 'Nuts' Gallagher (Center of Rug)
    const frank = {{
      x: 520,
      y: 560,
      width: 175,
      height: 155,
      twitchTimer: 0,
      twitchOffset: 0,
      twitchRot: 0,
      cackleTimer: 0
    }};

    // The Juiced Doob-bee (Buzzing around pool table)
    const doobBee = {{
      x: 720,
      baseY: 480,
      y: 480,
      dirRow: 1, // West
      frame: 0,
      animTimer: 0,
      animSpeed: 4,
      floatTimer: 0
    }};

    const keys = {{}};
    window.addEventListener("keydown", (e) => {{
      keys[e.key.toLowerCase()] = true;
      if (e.key === " ") {{
        e.preventDefault();
        triggerPuff();
      }}
      if (e.key.toLowerCase() === "e") {{
        triggerFrankRant();
      }}
    }});
    window.addEventListener("keyup", (e) => {{
      keys[e.key.toLowerCase()] = false;
    }});

    // Smoke Particles
    const particles = [];
    function triggerPuff() {{
      playPuffSound();
      for (let i = 0; i < 18; i++) {{
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2.2;
        particles.push({{
          x: player.x,
          y: player.y - 65,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.9,
          radius: 6 + Math.random() * 8,
          alpha: 0.9,
          color: "rgba(220, 252, 231,",
          growth: 0.22
        }});
      }}
      // Frank exhales too
      for (let i = 0; i < 12; i++) {{
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 1.8;
        particles.push({{
          x: frank.x - 20,
          y: frank.y - 80,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          radius: 5 + Math.random() * 7,
          alpha: 0.85,
          color: "rgba(254, 240, 138,",
          growth: 0.25
        }});
      }}
      triggerFrankRant();
    }}

    const frankRants = [
      "The IRS thinks they can tax my nut reserves?! I haven't filed a return since 1994, and I'm not starting now!",
      "Fiona thinks she runs the tree! She doesn't run squat! I built this branch with my bare claws!",
      "Doob-bee! Spark the blunt, brother! The DEA is disguised as pigeons on the skylight!",
      "Listen to me, you put your liquid assets into sunflower seed futures and you never talk to the cops!",
      "I'm an invalid! My tail has lumbar displacement! Where's my disability check?!",
      "They said I couldn't wear a three-piece suit to an underground dispensary. Who's laughing now?!"
    ];

    function triggerFrankRant() {{
      const r = frankRants[Math.floor(Math.random() * frankRants.length)];
      setSpeechBubble("Frankie 'Nuts' Gallagher", "🐿️", r);
    }}

    const speechBubble = document.getElementById("speechBubble");
    const speechText = document.getElementById("speechText");
    const speakerName = document.getElementById("speakerName");
    const speakerIcon = document.getElementById("speakerIcon");
    let bubbleTimeout = null;

    function setSpeechBubble(name, icon, text) {{
      speakerName.textContent = name;
      speakerIcon.textContent = icon;
      speechText.textContent = `"${{text}}"`;
      speechBubble.style.opacity = "1";
      speechBubble.style.transform = "translateY(0)";
      
      const bounds = canvas.getBoundingClientRect();
      const scaleX = bounds.width / canvas.width;
      const scaleY = bounds.height / canvas.height;
      
      const bx = Math.min(bounds.width - 320, Math.max(20, (frank.x - 80) * scaleX));
      const by = Math.max(20, (frank.y - 180) * scaleY);
      speechBubble.style.left = `${{bx}}px`;
      speechBubble.style.top = `${{by}}px`;

      if (bubbleTimeout) clearTimeout(bubbleTimeout);
      bubbleTimeout = setTimeout(() => {{
        speechBubble.style.opacity = "0";
        speechBubble.style.transform = "translateY(8px)";
      }}, 6500);
    }}

    function updateEntities() {{
      // Move Player
      let moveX = 0;
      let moveY = 0;
      if (keys["w"] || keys["arrowup"]) {{ moveY -= 1; player.dirRow = 0; }}
      if (keys["s"] || keys["arrowdown"]) {{ moveY += 1; player.dirRow = 2; }}
      if (keys["a"] || keys["arrowleft"]) {{ moveX -= 1; player.dirRow = 1; }}
      if (keys["d"] || keys["arrowright"]) {{ moveX += 1; player.dirRow = 3; }}

      player.isMoving = (moveX !== 0 || moveY !== 0);
      if (player.isMoving) {{
        if (moveX !== 0 && moveY !== 0) {{ moveX *= 0.7071; moveY *= 0.7071; }}
        player.x += moveX * player.speed;
        player.y += moveY * player.speed;

        // Realistic walkable lounge area
        player.x = Math.max(240, Math.min(880, player.x));
        player.y = Math.max(480, Math.min(740, player.y));
        player.animTimer += 1.4;
        if (Math.random() < 0.1) playStepSound();
      }} else {{
        player.animTimer += 0.8;
      }}
      if (player.animTimer >= player.animSpeed) {{
        player.animTimer = 0;
        player.frame = (player.frame + 1) % 8;
      }}

      // Frank's Manic Twitching Physics
      frank.twitchTimer += 0.15;
      if (Math.random() < 0.08) {{
        frank.twitchRot = (Math.random() - 0.5) * 0.08;
        frank.twitchOffset = (Math.random() - 0.5) * 6;
      }} else {{
        frank.twitchRot *= 0.85;
        frank.twitchOffset *= 0.85;
      }}

      // Doob-bee Hovering near pool table
      doobBee.floatTimer += 0.06;
      doobBee.y = doobBee.baseY + Math.sin(doobBee.floatTimer) * 14;
      doobBee.x = 720 + Math.cos(doobBee.floatTimer * 0.5) * 35;
      
      const dx = player.x - doobBee.x;
      doobBee.dirRow = dx < 0 ? 1 : 3;

      doobBee.animTimer += 1;
      if (doobBee.animTimer >= doobBee.animSpeed) {{
        doobBee.animTimer = 0;
        doobBee.frame = (doobBee.frame + 1) % 8;
      }}
    }}

    function drawScene() {{
      // 1. Draw High-Res Hemp Crew Lounge Background
      if (bgImg.complete && bgImg.naturalWidth > 0) {{
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      }}

      // 2. Ambient smoke drifting under timber rafters
      for (let i = particles.length - 1; i >= 0; i--) {{
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += p.growth;
        p.alpha -= 0.007;
        if (p.alpha <= 0) {{
          particles.splice(i, 1);
          continue;
        }}
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${{p.color}}${{p.alpha}})`;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }}

      // 3. Draw Frankie 'Nuts' Gallagher (On Persian Rug)
      if (frankImg.complete && frankImg.naturalWidth > 0) {{
        ctx.save();
        ctx.translate(frank.x, frank.y + frank.twitchOffset);
        ctx.rotate(frank.twitchRot);
        
        // Shadow on rug
        ctx.beginPath();
        ctx.ellipse(0, 55, 65, 20, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();

        ctx.drawImage(
          frankImg, 
          -frank.width / 2, 
          -frank.height / 2 - 10, 
          frank.width, 
          frank.height
        );
        ctx.restore();
      }}

      // 4. Draw Doob-bee (Buzzing with juiced wings & joint)
      const tileW = 128;
      const tileH = 128;
      if (beeImg.complete && beeImg.naturalWidth > 0) {{
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(doobBee.x, doobBee.baseY + 45, 25, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fill();

        const bsx = doobBee.frame * tileW;
        const bsy = doobBee.dirRow * tileH;
        ctx.drawImage(beeImg, bsx, bsy, tileW, tileH, doobBee.x - 55, doobBee.y - 95, 110, 110);
        ctx.restore();
      }}

      // 5. Draw Player (Chill Hoodie Squirrel)
      if (sqImg.complete && sqImg.naturalWidth > 0) {{
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(player.x, player.y - 2, 30, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fill();

        const psx = player.frame * tileW;
        const psy = player.dirRow * tileH;
        ctx.drawImage(sqImg, psx, psy, tileW, tileH, player.x - 60, player.y - 110, 120, 120);
        ctx.restore();
      }}
    }}

    function loop() {{
      updateEntities();
      drawScene();
      requestAnimationFrame(loop);
    }}
    requestAnimationFrame(loop);

    // Audio Engine
    let audioCtx = null;
    let isPlayingAudio = false;
    let beatTimer = null;

    function initAudio() {{
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }}

    function playPuffSound() {{
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);
      osc.type = "sine";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    }}

    function playStepSound() {{
      initAudio();
      if (!audioCtx || !isPlayingAudio) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(75 + Math.random() * 20, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    }}

    const funkBass = [43.65, 43.65, 51.91, 58.27, 65.41, 58.27, 51.91, 38.89];
    let step = 0;
    function startFunkGroove() {{
      initAudio();
      if (audioCtx.state === "suspended") audioCtx.resume();
      isPlayingAudio = true;
      document.getElementById("audioStatus").textContent = "Pause Groove";
      document.getElementById("audioIcon").textContent = "🔊";

      beatTimer = setInterval(() => {{
        if (!isPlayingAudio) return;
        const now = audioCtx.currentTime;
        if (step % 4 === 0) {{
          const kick = audioCtx.createOscillator();
          const kGain = audioCtx.createGain();
          kick.frequency.setValueAtTime(110, now);
          kick.frequency.exponentialRampToValueAtTime(30, now + 0.22);
          kGain.gain.setValueAtTime(0.45, now);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          kick.connect(kGain);
          kGain.connect(audioCtx.destination);
          kick.start(now);
          kick.stop(now + 0.23);
        }}
        const freq = funkBass[step % funkBass.length];
        const bass = audioCtx.createOscillator();
        const bGain = audioCtx.createGain();
        const bFilt = audioCtx.createBiquadFilter();
        bFilt.type = "lowpass";
        bFilt.frequency.value = 260;
        bass.type = "sawtooth";
        bass.frequency.setValueAtTime(freq, now);
        bGain.gain.setValueAtTime(0.20, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        bass.connect(bFilt);
        bFilt.connect(bGain);
        bGain.connect(audioCtx.destination);
        bass.start(now);
        bass.stop(now + 0.39);
        step++;
      }}, 300);
    }}

    function stopFunkGroove() {{
      isPlayingAudio = false;
      if (beatTimer) clearInterval(beatTimer);
      document.getElementById("audioStatus").textContent = "Play Funk Groove";
      document.getElementById("audioIcon").textContent = "🔈";
    }}

    document.getElementById("btnAudio").addEventListener("click", () => {{
      if (isPlayingAudio) stopFunkGroove();
      else startFunkGroove();
    }});
    document.getElementById("btnPuff").addEventListener("click", triggerPuff);

    // Chat with Frankie Gallagher via Local Gemma
    const chatInput = document.getElementById("chatInput");
    const btnSend = document.getElementById("btnSend");

    function sendFrankChat() {{
      const val = chatInput.value.trim();
      if (!val) return;
      chatInput.value = "";
      setSpeechBubble("Frankie Gallagher", "🐿️", "Hold on! Don't look now, but I think you're wearing a wire...");

      fetch("http://localhost:11434/api/generate", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{
          model: "gemma4:latest",
          prompt: `You are Frankie 'Nuts' Gallagher, a crazed, scheming, unwashed anthropomorphic squirrel in a wrinkled suit and tie sitting in the center of a Persian rug in an underground weed lounge called The Hemp Crew. You talk exactly like Frank Gallagher from Shameless—paranoid about the government and IRS, exploiting everyone, hilarious, unhinged, obsessed with nuts, beer, and weed. Answer this question in 1-2 punchy, hilarious sentences: "${{val}}"`,
          stream: false
        }})
      }})
      .then(res => res.json())
      .then(data => {{
        if (data.response) setSpeechBubble("Frankie Gallagher", "🐿️", data.response.trim());
      }})
      .catch(err => {{
        const fallbacks = [
          `"${{val}}"? Look around you, kid! The whole system is rigged! Now pass me that pint before I call my lawyer!`,
          `Don't talk to me about morals! I sacrificed my best acorn years so you punks could play pool in peace!`,
          `Quiet down! You want the tree wardens busting in here?! Hand me another roach!`
        ];
        setSpeechBubble("Frankie Gallagher", "🐿️", fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      }});
    }}

    btnSend.addEventListener("click", sendFrankChat);
    chatInput.addEventListener("keydown", (e) => {{
      if (e.key === "Enter") sendFrankChat();
    }});

    setTimeout(() => {{
      setSpeechBubble("Frankie Gallagher", "🐿️", "Hey! You! Don't step on my rug! I traded three forged prescription slips and a vintage Rolex for this Persian masterpiece!");
    }}, 800);
  </script>
</body>
</html>
'''

with open(out_html, "w", encoding="utf-8") as f:
    f.write(html)
with open(pub_html, "w", encoding="utf-8") as f:
    f.write(html)

print("Hemp Crew Lounge stage successfully created!")
