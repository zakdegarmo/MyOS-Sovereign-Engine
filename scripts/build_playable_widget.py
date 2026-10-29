import base64
import os

sheet_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\stoner_squirrel_idle.png"
out_html = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\playable_squirrel_stage.html"

with open(sheet_path, "rb") as f:
    b64_data = base64.b64encode(f.read()).decode("utf-8")

html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Green Acorn - Playable 2.5D Dispensary</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @keyframes neonGlow {{
      0%, 100% {{ text-shadow: 0 0 10px #10b981, 0 0 20px #10b981, 0 0 40px #059669; }}
      50% {{ text-shadow: 0 0 5px #10b981, 0 0 15px #047857; }}
    }}
    .neon-text {{
      animation: neonGlow 2.5s infinite ease-in-out;
    }}
    canvas {{
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }}
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-3 select-none">
  <div class="bg-zinc-950 text-zinc-100 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto overflow-hidden">
    
    <!-- Top Header -->
    <div class="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-xl shadow-inner">
          🐿️
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-bold text-emerald-400 tracking-wider text-base uppercase font-mono">The Green Acorn</h1>
            <span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">PLAYABLE 2.5D STAGE</span>
          </div>
          <p class="text-xs text-zinc-400">GenX 2D AI &rarr; 3D Blender Rig &rarr; 2.5D Real-Time Sprite Canvas</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="btnAudio" class="px-3 py-1.5 rounded-lg bg-zinc-900 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/50 text-xs font-mono transition flex items-center gap-1.5 cursor-pointer">
          <span id="audioIcon">🔈</span> <span id="audioStatus">Play Chill Lo-Fi</span>
        </button>
        <button id="btnPuff" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition cursor-pointer flex items-center gap-1">
          💨 Take a Puff (Space)
        </button>
      </div>
    </div>

    <!-- Canvas Stage Container -->
    <div class="relative w-full aspect-[16/9] max-h-[460px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-inner">
      <canvas id="gameCanvas" width="800" height="450" class="w-full h-full block"></canvas>
      
      <!-- In-Game Speech Bubble Overlay -->
      <div id="speechBubble" class="absolute pointer-events-none transition-all duration-300 opacity-0 translate-y-2 max-w-xs bg-zinc-950/90 border border-emerald-400/50 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs text-emerald-200 shadow-2xl">
        <div class="flex items-center gap-1.5 font-bold text-[11px] text-emerald-400 mb-0.5">
          <span>🌿</span> <span>Snoop Nutty Nut</span>
        </div>
        <div id="speechText" class="italic leading-relaxed font-sans text-zinc-200">"Yo bro, welcome to the canopy..."</div>
      </div>

      <!-- Controls HUD Overlay -->
      <div class="absolute bottom-3 left-3 bg-zinc-950/80 border border-zinc-800 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-mono text-zinc-400 flex items-center gap-3">
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">W A S D</kbd> / <kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">&uarr;&larr;&darr;&rarr;</kbd> Move</span>
        <span class="text-zinc-600">|</span>
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">Space</kbd> Puff Smoke</span>
        <span class="text-zinc-600">|</span>
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">E</kbd> Talk to Snoop</span>
      </div>

      <!-- Live Vitals HUD -->
      <div class="absolute top-3 right-3 bg-zinc-950/80 border border-zinc-800 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-2">
        <span class="text-emerald-400">CHILL LEVEL:</span>
        <div class="w-24 h-2 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
          <div id="chillBar" class="h-full bg-emerald-400 transition-all duration-300" style="width: 85%;"></div>
        </div>
      </div>
    </div>

    <!-- Interactive Dialogue Input -->
    <div class="mt-3 flex items-center gap-2">
      <div class="relative flex-1">
        <input id="chatInput" type="text" placeholder="Ask Snoop Nutty Nut anything about weed strains or cosmic philosophy..." 
          class="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-sans">
      </div>
      <button id="btnSend" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer font-mono">
        Ask &rarr;
      </button>
    </div>

  </div>

  <script>
    // Embedded 4-Row x 8-Col Spritesheet
    const SPRITE_B64 = "data:image/png;base64,{b64_data}";
    const spriteImg = new Image();
    spriteImg.src = SPRITE_B64;

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Game State
    const player = {{
      x: 400,
      y: 280,
      speed: 3.2,
      dirRow: 2, // 0: N, 1: W, 2: S, 3: E
      frame: 0,
      animTimer: 0,
      animSpeed: 8, // ticks per frame
      isMoving: false,
      chill: 85,
      puffCooldown: 0
    }};

    const keys = {{}};
    window.addEventListener("keydown", (e) => {{
      keys[e.key.toLowerCase()] = true;
      if (e.key === " ") {{
        e.preventDefault();
        triggerPuff();
      }}
      if (e.key.toLowerCase() === "e") {{
        triggerDialogue();
      }}
    }});
    window.addEventListener("keyup", (e) => {{
      keys[e.key.toLowerCase()] = false;
    }});

    // Particle System (Smoke Puffs)
    const particles = [];
    function triggerPuff() {{
      player.chill = Math.min(100, player.chill + 5);
      updateChillBar();
      playPuffSound();

      const count = 18;
      for (let i = 0; i < count; i++) {{
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2.0;
        particles.push({{
          x: player.x + (Math.random() - 0.5) * 16,
          y: player.y - 45 + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          radius: 6 + Math.random() * 8,
          alpha: 0.85,
          color: Math.random() > 0.3 ? "rgba(220, 252, 231," : "rgba(167, 243, 208,",
          growth: 0.25 + Math.random() * 0.2
        }});
      }}
      showRandomQuote();
    }}

    // Dialogue quotes
    const quotes = [
      "Yo man, this Pinecone Kush is 99% pure resin, 1% acorn fiber...",
      "Did you ever think about it? The trees aren't static... they're just moving in slow motion.",
      "Harvested this fresh batch straight from the ancient Redwood canopy. Cosmic terps, brother.",
      "Gravity is just a suggestion, bro. That's why they call this engine Antigravity.",
      "One puff for the squirrel, one giant leap for squirrelkind.",
      "Check out that neon glow... reminds me of the northern lights over Lake Tahoe."
    ];

    function showRandomQuote() {{
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      setSpeechBubble(q);
    }}

    function triggerDialogue() {{
      showRandomQuote();
    }}

    const speechBubble = document.getElementById("speechBubble");
    const speechText = document.getElementById("speechText");
    let bubbleTimeout = null;

    function setSpeechBubble(text) {{
      speechText.textContent = `"${{text}}"`;
      speechBubble.style.opacity = "1";
      speechBubble.style.transform = "translateY(0)";
      
      // Position above player
      const bounds = canvas.getBoundingClientRect();
      const scaleX = bounds.width / canvas.width;
      const scaleY = bounds.height / canvas.height;
      
      const bx = Math.min(bounds.width - 240, Math.max(20, player.x * scaleX - 100));
      const by = Math.max(20, (player.y - 120) * scaleY);
      speechBubble.style.left = `${{bx}}px`;
      speechBubble.style.top = `${{by}}px`;

      if (bubbleTimeout) clearTimeout(bubbleTimeout);
      bubbleTimeout = setTimeout(() => {{
        speechBubble.style.opacity = "0";
        speechBubble.style.transform = "translateY(8px)";
      }}, 5000);
    }}

    function updateChillBar() {{
      document.getElementById("chillBar").style.width = `${{player.chill}}%`;
    }}

    // Dispensary Room Environment Drawing
    function drawEnvironment() {{
      // Background Wall (Dark Industrial Dispensary Brick)
      const gradWall = ctx.createLinearGradient(0, 0, 0, 240);
      gradWall.addColorStop(0, "#09090b");
      gradWall.addColorStop(1, "#18181b");
      ctx.fillStyle = gradWall;
      ctx.fillRect(0, 0, canvas.width, 240);

      // Brick pattern lines
      ctx.strokeStyle = "rgba(39, 39, 42, 0.4)";
      ctx.lineWidth = 1;
      for (let y = 20; y < 240; y += 22) {{
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }}

      // Neon Sign on Wall
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "bold 26px monospace";
      ctx.fillStyle = "#34d399";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 25;
      ctx.fillText("✨ THE GREEN ACORN BOTANICALS ✨", canvas.width / 2, 70);
      ctx.font = "12px monospace";
      ctx.fillStyle = "#6ee7b7";
      ctx.shadowBlur = 10;
      ctx.fillText("420 ACORN AVE • PREMIUM FOREST HARVEST • SINCE 2026", canvas.width / 2, 95);
      ctx.restore();

      // Dispensary Back Shelves with Glowing Jars
      const shelfY = 125;
      ctx.fillStyle = "#27272a";
      ctx.fillRect(80, shelfY, 640, 10);
      ctx.fillStyle = "#18181b";
      ctx.fillRect(80, shelfY + 10, 640, 4);

      // Glowing Glass Jars on Shelf
      const strains = ["#10b981", "#34d399", "#a7f3d0", "#059669", "#6ee7b7", "#f59e0b", "#8b5cf6"];
      for (let i = 0; i < 14; i++) {{
        const jx = 105 + i * 44;
        const color = strains[i % strains.length];
        
        // Jar glass
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.fillRect(jx, shelfY - 26, 26, 26);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.strokeRect(jx, shelfY - 26, 26, 26);

        // Nug fill with glow
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(jx + 13, shelfY - 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Wooden lid
        ctx.fillStyle = "#78350f";
        ctx.fillRect(jx + 2, shelfY - 30, 22, 4);
      }}

      // Wooden Floor (2.5D Isometric Plank Perspective)
      const gradFloor = ctx.createLinearGradient(0, 240, 0, canvas.height);
      gradFloor.addColorStop(0, "#271c14");
      gradFloor.addColorStop(1, "#140e0a");
      ctx.fillStyle = gradFloor;
      ctx.fillRect(0, 240, canvas.width, canvas.height - 240);

      // Floor plank lines
      ctx.strokeStyle = "rgba(60, 42, 30, 0.4)";
      ctx.lineWidth = 1.5;
      for (let y = 240; y < canvas.height; y += 30) {{
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }}
      for (let x = 0; x < canvas.width; x += 90) {{
        ctx.beginPath();
        ctx.moveTo(x, 240);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }}

      // Display Counter Glass Case (Foreground Left)
      ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
      ctx.fillRect(60, 310, 260, 110);
      ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 310, 260, 110);
      // Counter top wood rim
      ctx.fillStyle = "#451a03";
      ctx.fillRect(56, 304, 268, 8);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px monospace";
      ctx.fillText("FEATURED: PINECONE KUSH 🌲", 75, 335);
      ctx.fillText("COSMIC ACORN DELIGHT 🌰", 75, 360);
      ctx.fillText("REDWOOD CANOPY HAZE 🍃", 75, 385);
    }}

    // Ambient Lighting & Particle Update
    function updateAndDrawParticles() {{
      for (let i = particles.length - 1; i >= 0; i--) {{
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += p.growth;
        p.alpha -= 0.008;

        if (p.alpha <= 0) {{
          particles.splice(i, 1);
          continue;
        }}

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${{p.color}}${{p.alpha}})`;
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      }}

      // Subtle ambient smoke rising from counter
      if (Math.random() < 0.15) {{
        particles.push({{
          x: 180 + (Math.random() - 0.5) * 40,
          y: 300,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.6 - Math.random() * 0.4,
          radius: 3 + Math.random() * 4,
          alpha: 0.35,
          color: "rgba(167, 243, 208,",
          growth: 0.15
        }});
      }}
    }}

    // Player Update & Render
    function updatePlayer() {{
      let moveX = 0;
      let moveY = 0;

      if (keys["w"] || keys["arrowup"]) {{
        moveY -= 1;
        player.dirRow = 0; // North (Back)
      }}
      if (keys["s"] || keys["arrowdown"]) {{
        moveY += 1;
        player.dirRow = 2; // South (Front)
      }}
      if (keys["a"] || keys["arrowleft"]) {{
        moveX -= 1;
        player.dirRow = 1; // West (Left)
      }}
      if (keys["d"] || keys["arrowright"]) {{
        moveX += 1;
        player.dirRow = 3; // East (Right)
      }}

      player.isMoving = (moveX !== 0 || moveY !== 0);

      if (player.isMoving) {{
        // Normalize diagonal speed
        if (moveX !== 0 && moveY !== 0) {{
          moveX *= 0.7071;
          moveY *= 0.7071;
        }}
        player.x += moveX * player.speed;
        player.y += moveY * player.speed;

        // Boundaries
        player.x = Math.max(60, Math.min(canvas.width - 60, player.x));
        player.y = Math.max(250, Math.min(canvas.height - 40, player.y));

        player.animTimer += 1.5;
        if (Math.random() < 0.1) playStepSound();
      }} else {{
        player.animTimer += 0.8;
      }}

      if (player.animTimer >= player.animSpeed) {{
        player.animTimer = 0;
        player.frame = (player.frame + 1) % 8;
      }}
    }}

    function drawPlayer() {{
      const tileW = 128;
      const tileH = 128;
      const sx = player.frame * tileW;
      const sy = player.dirRow * tileH;

      // Drop Shadow at feet
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(player.x, player.y - 2, 28, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fill();
      ctx.restore();

      // Draw Sprite from base64 sheet
      if (spriteImg.complete && spriteImg.naturalWidth > 0) {{
        const drawScale = 0.9;
        const dw = tileW * drawScale;
        const dh = tileH * drawScale;
        const dx = player.x - dw / 2;
        const dy = player.y - dh + 8;

        ctx.drawImage(spriteImg, sx, sy, tileW, tileH, dx, dy, dw, dh);
      }} else {{
        // Loading placeholder
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(player.x, player.y - 30, 20, 0, Math.PI * 2);
        ctx.fill();
      }}
    }}

    // Main Game Loop
    function loop() {{
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawEnvironment();
      updatePlayer();
      drawPlayer();
      updateAndDrawParticles();
      requestAnimationFrame(loop);
    }}
    requestAnimationFrame(loop);

    // Procedural Web Audio Synthesizer (Lo-Fi Chillhop & Sound FX)
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
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.35);

      osc.type = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

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
      osc.frequency.setValueAtTime(80 + Math.random() * 20, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    }}

    // Lo-Fi Beat Engine
    const bassNotes = [55, 55, 65.4, 73.4, 82.4, 73.4, 65.4, 49.0]; // A1, C2, D2, E2...
    let step = 0;

    function startLoFiBeat() {{
      initAudio();
      if (audioCtx.state === "suspended") audioCtx.resume();
      isPlayingAudio = true;
      document.getElementById("audioStatus").textContent = "Pause Lo-Fi";
      document.getElementById("audioIcon").textContent = "🔊";

      beatTimer = setInterval(() => {{
        if (!isPlayingAudio) return;
        const now = audioCtx.currentTime;

        // Kick on 0, 4
        if (step % 4 === 0) {{
          const kick = audioCtx.createOscillator();
          const kGain = audioCtx.createGain();
          kick.frequency.setValueAtTime(120, now);
          kick.frequency.exponentialRampToValueAtTime(35, now + 0.2);
          kGain.gain.setValueAtTime(0.4, now);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          kick.connect(kGain);
          kGain.connect(audioCtx.destination);
          kick.start(now);
          kick.stop(now + 0.21);
        }}

        // Bass Note
        const freq = bassNotes[step % bassNotes.length];
        const bass = audioCtx.createOscillator();
        const bGain = audioCtx.createGain();
        const bFilt = audioCtx.createBiquadFilter();
        bFilt.type = "lowpass";
        bFilt.frequency.value = 220;

        bass.type = "sawtooth";
        bass.frequency.setValueAtTime(freq, now);
        bGain.gain.setValueAtTime(0.18, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        bass.connect(bFilt);
        bFilt.connect(bGain);
        bGain.connect(audioCtx.destination);
        bass.start(now);
        bass.stop(now + 0.41);

        step++;
      }}, 320); // ~94 BPM chillhop groove
    }}

    function stopLoFiBeat() {{
      isPlayingAudio = false;
      if (beatTimer) clearInterval(beatTimer);
      document.getElementById("audioStatus").textContent = "Play Chill Lo-Fi";
      document.getElementById("audioIcon").textContent = "🔈";
    }}

    document.getElementById("btnAudio").addEventListener("click", () => {{
      if (isPlayingAudio) stopLoFiBeat();
      else startLoFiBeat();
    }});

    document.getElementById("btnPuff").addEventListener("click", () => {{
      triggerPuff();
    }});

    // Chat with Snoop Nutty Nut
    const chatInput = document.getElementById("chatInput");
    const btnSend = document.getElementById("btnSend");

    function sendChat() {{
      const val = chatInput.value.trim();
      if (!val) return;
      chatInput.value = "";
      
      setSpeechBubble("Thinking about that... *takes a slow puff*");

      // Attempt call to local Ollama if available
      fetch("http://localhost:11434/api/generate", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{
          model: "gemma4:latest",
          prompt: `You are Snoop Nutty Nut, an ultra-chill, hilarious anthropomorphic red squirrel who runs a cozy dispensary called The Green Acorn. Answer this customer's question in 1-2 funny, chill, squirrel-and-cannabis themed sentences: "${{val}}"`,
          stream: false
        }})
      }})
      .then(res => res.json())
      .then(data => {{
        if (data.response) setSpeechBubble(data.response.trim());
      }})
      .catch(err => {{
        // Fallback procedural responses if Ollama is busy
        const fallbacks = [
          `"${{val}}"? Bro, that's heavy. Let me meditate on this acorn for a second...`,
          `That reminds me of the great acorn drought of '24. Peace and terpenes, my friend.`,
          `Listen closely: the trees already have the answers, man. Take another puff.`
        ];
        setSpeechBubble(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      }});
    }}

    btnSend.addEventListener("click", sendChat);
    chatInput.addEventListener("keydown", (e) => {{
      if (e.key === "Enter") sendChat();
    }});

    // Greet on load
    setTimeout(() => {{
      setSpeechBubble("Sup! Welcome to The Green Acorn! Use WASD to stroll around, or hit Space to spark up.");
    }}, 600);

  </script>
</body>
</html>
'''

with open(out_html, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Playable Generative UI stage built successfully at: {out_html}")
