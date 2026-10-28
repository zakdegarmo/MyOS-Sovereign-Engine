import base64
import os

sheet_squirrel = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\stoner_squirrel_idle.png"
sheet_bee = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee_idle.png"
out_html = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\playable_squirrel_stage.html"
pub_html = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\playable_squirrel_stage.html"

with open(sheet_squirrel, "rb") as f:
    b64_sq = base64.b64encode(f.read()).decode("utf-8")

with open(sheet_bee, "rb") as f:
    b64_bee = base64.b64encode(f.read()).decode("utf-8")

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Green Acorn - Snoop & Doob-bee</title>
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
          🐿️🐝
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-bold text-emerald-400 tracking-wider text-base uppercase font-mono">The Green Acorn Botanicals</h1>
            <span class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">DOOB-BEE MUTATION ACTIVE</span>
          </div>
          <p class="text-xs text-zinc-400">GenX 2D AI &rarr; Human Steering &rarr; 3D Blender Rig &rarr; 2.5D Real-Time Sprite Canvas</p>
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
          <span id="speakerIcon">🌿</span> <span id="speakerName">Snoop Nutty Nut</span>
        </div>
        <div id="speechText" class="italic leading-relaxed font-sans text-zinc-200">"Buzzzz... welcome to the botanical hive..."</div>
      </div>

      <!-- Controls HUD Overlay -->
      <div class="absolute bottom-3 left-3 bg-zinc-950/80 border border-zinc-800 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-mono text-zinc-400 flex items-center gap-3">
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">W A S D</kbd> / <kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">&uarr;&larr;&darr;&rarr;</kbd> Move Squirrel</span>
        <span class="text-zinc-600">|</span>
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">Space</kbd> Spark Joint</span>
        <span class="text-zinc-600">|</span>
        <span><kbd class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">E</kbd> Talk to Doob-bee</span>
      </div>

      <!-- Live Vitals HUD -->
      <div class="absolute top-3 right-3 bg-zinc-950/80 border border-zinc-800 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-2">
        <span class="text-amber-400">HIVE VIBE:</span>
        <div class="w-24 h-2 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
          <div id="chillBar" class="h-full bg-amber-400 transition-all duration-300" style="width: 95%;"></div>
        </div>
      </div>
    </div>

    <!-- Interactive Dialogue Input -->
    <div class="mt-3 flex items-center gap-2">
      <div class="relative flex-1">
        <input id="chatInput" type="text" placeholder="Talk to Doob-bee and Snoop about nectar terps, wing physics, or cosmic buzz..." 
          class="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition font-sans">
      </div>
      <button id="btnSend" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition cursor-pointer font-mono">
        Ask &rarr;
      </button>
    </div>

  </div>

  <script>
    // Embedded Spritesheets
    const sqImg = new Image();
    sqImg.src = "data:image/png;base64,{b64_sq}";

    const beeImg = new Image();
    beeImg.src = "data:image/png;base64,{b64_bee}";

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Player (Squirrel)
    const player = {{
      x: 320,
      y: 330,
      speed: 3.2,
      dirRow: 2,
      frame: 0,
      animTimer: 0,
      animSpeed: 8,
      isMoving: false,
      chill: 95
    }};

    // Hovering NPC (Doob-bee)
    const doobBee = {{
      x: 520,
      baseY: 260,
      y: 260,
      dirRow: 2, // South
      frame: 0,
      animTimer: 0,
      animSpeed: 4, // Fast buzzing wings!
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
        triggerDialogue();
      }}
    }});
    window.addEventListener("keyup", (e) => {{
      keys[e.key.toLowerCase()] = false;
    }});

    // Particles
    const particles = [];
    function triggerPuff() {{
      player.chill = Math.min(100, player.chill + 5);
      updateChillBar();
      playPuffSound();

      // Puff from player
      for (let i = 0; i < 14; i++) {{
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2.0;
        particles.push({{
          x: player.x,
          y: player.y - 45,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          radius: 5 + Math.random() * 7,
          alpha: 0.85,
          color: "rgba(220, 252, 231,",
          growth: 0.22
        }});
      }}

      // Puff from Doob-bee joint
      for (let i = 0; i < 12; i++) {{
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 1.8;
        particles.push({{
          x: doobBee.x + 10,
          y: doobBee.y - 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0,
          radius: 4 + Math.random() * 6,
          alpha: 0.9,
          color: "rgba(254, 240, 138,",
          growth: 0.25
        }});
      }}
      showRandomQuote();
    }}

    const beeQuotes = [
      "Buzzzzz... that sweet cosmic nectar is 100% organic wildflower haze, man.",
      "Two golden wings, purple anime eyes, and a fat joint... I have reached peak evolution.",
      "Gravity? Never heard of her. I just flap fast and stay high, brother.",
      "Yo squirrel bro, did you know bees communicate through dance? Mine is just a continuous chill bob.",
      "Pollinating the universe, one puff at a time.",
      "Check out that cherry glow... matches the golden amber in these wings."
    ];

    function showRandomQuote() {{
      const q = beeQuotes[Math.floor(Math.random() * beeQuotes.length)];
      setSpeechBubble("Doob-bee", "🐝", q);
    }}

    function triggerDialogue() {{
      showRandomQuote();
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
      
      const bx = Math.min(bounds.width - 240, Math.max(20, doobBee.x * scaleX - 100));
      const by = Math.max(20, (doobBee.y - 120) * scaleY);
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

    function drawEnvironment() {{
      // Wall
      const gradWall = ctx.createLinearGradient(0, 0, 0, 240);
      gradWall.addColorStop(0, "#09090b");
      gradWall.addColorStop(1, "#18181b");
      ctx.fillStyle = gradWall;
      ctx.fillRect(0, 0, canvas.width, 240);

      // Neon Sign
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "bold 24px monospace";
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 25;
      ctx.fillText("✨ THE GREEN ACORN BOTANICALS & HONEY HIVE ✨", canvas.width / 2, 65);
      ctx.font = "11px monospace";
      ctx.fillStyle = "#6ee7b7";
      ctx.shadowBlur = 10;
      ctx.fillText("FEATURING SNOOP NUTTY NUT & DOOB-BEE • EST. 2026", canvas.width / 2, 90);
      ctx.restore();

      // Shelves with Jars
      const shelfY = 125;
      ctx.fillStyle = "#27272a";
      ctx.fillRect(60, shelfY, 680, 10);
      const strains = ["#fbbf24", "#10b981", "#a7f3d0", "#f59e0b", "#c084fc", "#34d399"];
      for (let i = 0; i < 15; i++) {{
        const jx = 80 + i * 44;
        const color = strains[i % strains.length];
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.fillRect(jx, shelfY - 26, 26, 26);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.strokeRect(jx, shelfY - 26, 26, 26);
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(jx + 13, shelfY - 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#78350f";
        ctx.fillRect(jx + 2, shelfY - 30, 22, 4);
      }}

      // Floor
      const gradFloor = ctx.createLinearGradient(0, 240, 0, canvas.height);
      gradFloor.addColorStop(0, "#271c14");
      gradFloor.addColorStop(1, "#140e0a");
      ctx.fillStyle = gradFloor;
      ctx.fillRect(0, 240, canvas.width, canvas.height - 240);

      // Floor lines
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

      // Counter
      ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
      ctx.fillRect(50, 310, 240, 110);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 310, 240, 110);
      ctx.fillStyle = "#451a03";
      ctx.fillRect(46, 304, 248, 8);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "10px monospace";
      ctx.fillText("ROYAL JELLY RESIN 🍯", 65, 335);
      ctx.fillText("PINECONE KUSH 🌲", 65, 360);
      ctx.fillText("DOOB-BEE SPECIAL RESERVE 🐝", 65, 385);
    }}

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
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      }}

      // Doob-bee joint ambient smoke trail
      if (Math.random() < 0.25) {{
        particles.push({{
          x: doobBee.x - 4,
          y: doobBee.y - 36,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.8 - Math.random() * 0.4,
          radius: 2 + Math.random() * 4,
          alpha: 0.4,
          color: "rgba(254, 240, 138,",
          growth: 0.12
        }});
      }}
    }}

    function updateEntities() {{
      // Player Move
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

      // Doob-bee Hover Float & Wing Flutter
      doobBee.floatTimer += 0.05;
      doobBee.y = doobBee.baseY + Math.sin(doobBee.floatTimer) * 12;
      
      // Face player if close
      const dx = player.x - doobBee.x;
      if (Math.abs(dx) > 40) {{
        doobBee.dirRow = dx < 0 ? 1 : 3; // West or East
      }} else {{
        doobBee.dirRow = 2; // South
      }}

      doobBee.animTimer += 1;
      if (doobBee.animTimer >= doobBee.animSpeed) {{
        doobBee.animTimer = 0;
        doobBee.frame = (doobBee.frame + 1) % 8;
      }}
    }}

    function drawEntities() {{
      const tileW = 128;
      const tileH = 128;

      // Draw Doob-bee Shadow
      ctx.save();
      ctx.beginPath();
      const shadowScale = 1.0 - (doobBee.baseY - doobBee.y) * 0.02;
      ctx.ellipse(doobBee.x, doobBee.baseY + 50, 24 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fill();
      ctx.restore();

      // Draw Doob-bee Sprite
      if (beeImg.complete && beeImg.naturalWidth > 0) {{
        const bsx = doobBee.frame * tileW;
        const bsy = doobBee.dirRow * tileH;
        const bdw = tileW * 0.9;
        const bdh = tileH * 0.9;
        ctx.drawImage(beeImg, bsx, bsy, tileW, tileH, doobBee.x - bdw / 2, doobBee.y - bdh + 8, bdw, bdh);
      }}

      // Draw Player Shadow
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(player.x, player.y - 2, 28, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fill();
      ctx.restore();

      // Draw Player Sprite
      if (sqImg.complete && sqImg.naturalWidth > 0) {{
        const psx = player.frame * tileW;
        const psy = player.dirRow * tileH;
        const pdw = tileW * 0.9;
        const pdh = tileH * 0.9;
        ctx.drawImage(sqImg, psx, psy, tileW, tileH, player.x - pdw / 2, player.y - pdh + 8, pdw, pdh);
      }}
    }}

    function loop() {{
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawEnvironment();
      updateEntities();
      drawEntities();
      updateAndDrawParticles();
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
      filter.frequency.setValueAtTime(700, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, now);
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
      osc.frequency.setValueAtTime(85 + Math.random() * 15, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    }}

    const bassNotes = [55, 55, 65.4, 73.4, 82.4, 73.4, 65.4, 49.0];
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
      }}, 320);
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
    document.getElementById("btnPuff").addEventListener("click", triggerPuff);

    // Chat with Doob-bee
    const chatInput = document.getElementById("chatInput");
    const btnSend = document.getElementById("btnSend");
    function sendChat() {{
      const val = chatInput.value.trim();
      if (!val) return;
      chatInput.value = "";
      setSpeechBubble("Doob-bee", "🐝", "Buzzz... meditating on that cloud...");

      fetch("http://localhost:11434/api/generate", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{
          model: "gemma4:latest",
          prompt: `You are Doob-bee, a hilarious, ultra-chill anthropomorphic honey bee with two golden wings, big violet anime eyes, and a burning joint. Answer this friend in 1-2 funny, bee-and-flower-themed chill sentences: "${{val}}"`,
          stream: false
        }})
      }})
      .then(res => res.json())
      .then(data => {{
        if (data.response) setSpeechBubble("Doob-bee", "🐝", data.response.trim());
      }})
      .catch(err => {{
        const fallbacks = [
          `"${{val}}"? Bro, my wings are vibrating at 300Hz just thinking about that...`,
          `That sounds like pure golden honeycomb wisdom. Take another puff!`,
          `Listen closely to the buzzing: peace, pollen, and good vibes, man.`
        ];
        setSpeechBubble("Doob-bee", "🐝", fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      }});
    }}

    btnSend.addEventListener("click", sendChat);
    chatInput.addEventListener("keydown", (e) => {{
      if (e.key === "Enter") sendChat();
    }});

    setTimeout(() => {{
      setSpeechBubble("Doob-bee", "🐝", "Buzzz! Yo squirrel! The wings of C, body of A, and stripes of B... I am born! Spark up!");
    }}, 600);
  </script>
</body>
</html>
'''

with open(out_html, "w", encoding="utf-8") as f:
    f.write(html)
with open(pub_html, "w", encoding="utf-8") as f:
    f.write(html)

print("Playable stage successfully updated with both characters!")
