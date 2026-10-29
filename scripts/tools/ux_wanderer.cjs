/**
 * UX Wanderer Agent ("Zak In Silico")
 * 
 * Drives headless Chrome through MyOS, simulates authentic user exploration,
 * captures DOM state and screenshots, passes them to local Ollama (myos-cortex:latest),
 * and compiles an empirical Form vs Function usability assessment.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://127.0.0.1:5173/';
const AUTOPSY_DIR = path.resolve(__dirname, '../../data/ux_autopsy');

if (!fs.existsSync(AUTOPSY_DIR)) {
  fs.mkdirSync(AUTOPSY_DIR, { recursive: true });
}

// Helper to query Ollama locally without cloud tokens
function queryLocalCortex(prompt, base64Image = null) {
  return new Promise((resolve, reject) => {
    const payload = {
      model: 'myos-cortex:latest',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.4,
        num_predict: 800
      }
    };
    if (base64Image) {
      payload.images = [base64Image];
    }

    const postData = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 90000
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.response || '');
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (err) => {
      console.warn('Ollama error, falling back:', err.message);
      resolve(`[Cortex unreachable: ${err.message}]`);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve('[Cortex query timed out]');
    });

    req.write(postData);
    req.end();
  });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runWanderer() {
  console.log('🚀 [UX Wanderer] Launching Chrome in simulated user session...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl']
  });

  const page = await browser.newPage();
  const evaluationSteps = [];

  try {
    console.log(`🌐 [UX Wanderer] Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 25000 }).catch(async () => {
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    });

    await delay(3500); // Allow Three.js Canvas and R3F scene to stabilize

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: INITIAL DESKTOP LANDING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('📸 [Step 1] Inspecting Initial Desktop Landing...');
    const step1ShotPath = path.join(AUTOPSY_DIR, 'step_01_landing.png');
    await page.screenshot({ path: step1ShotPath });
    const step1Base64 = fs.readFileSync(step1ShotPath).toString('base64');

    const step1Dom = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
        text: (b.innerText || '').trim(),
        ariaLabel: b.getAttribute('aria-label') || '',
        title: b.getAttribute('title') || '',
        className: b.className.slice(0, 60)
      })).filter(b => b.text || b.ariaLabel || b.title);

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, span, div'))
        .filter(el => el.children.length === 0 && (el.innerText || '').trim().length > 3 && (el.innerText || '').trim().length < 50)
        .slice(0, 30)
        .map(el => (el.innerText || '').trim());

      return { buttonCount: buttons.length, buttons: buttons.slice(0, 25), sampleText: headings.slice(0, 15) };
    });

    console.log(`🔍 Found ${step1Dom.buttonCount} interactive buttons on initial load.`);
    console.log('🧠 Querying Cortex on Step 1 Landing...');

    const prompt1 = `You are the local GPU Cortex of MyOS, observing a user who just booted into the desktop at http://127.0.0.1:5173/.
Look at the attached screenshot and DOM telemetry:
- Button count: ${step1Dom.buttonCount}
- Visible buttons: ${JSON.stringify(step1Dom.buttons.map(b => b.text || b.ariaLabel || b.title))}
- Sample text elements: ${JSON.stringify(step1Dom.sampleText)}

Answer with uncompromising honesty:
1. First 3 Seconds: What does the user's eye land on first? Is the primary purpose of this operating system immediately evident, or does it look like a collection of disparate widgets?
2. Usability Bottleneck: If a user sits down wanting to DO WORK (open files, chat with an AI agent, launch a game, or inspect system state), where is the friction?
3. Form vs Function: Rate Form (1-10) and Function (1-10) and explain why.`;

    const cortexEval1 = await queryLocalCortex(prompt1, step1Base64);
    evaluationSteps.push({
      step: 1,
      title: 'Initial Landing & First Glance',
      screenshot: 'step_01_landing.png',
      dom: step1Dom,
      cortexAnalysis: cortexEval1
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: MOVEMENT & SPATIAL EXPLORATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🚶 [Step 2] Simulating Avatar Movement (W, A, D)...');
    // Focus the canvas or body
    await page.keyboard.down('KeyW');
    await delay(1200);
    await page.keyboard.up('KeyW');
    await delay(200);
    await page.keyboard.down('KeyD');
    await delay(600);
    await page.keyboard.up('KeyD');
    await delay(800);

    const step2ShotPath = path.join(AUTOPSY_DIR, 'step_02_movement.png');
    await page.screenshot({ path: step2ShotPath });
    const step2Base64 = fs.readFileSync(step2ShotPath).toString('base64');

    console.log('🧠 Querying Cortex on Step 2 Movement & Spatial Traversal...');
    const prompt2 = `The user tried walking around the 3D Desktop Grid using WASD.
Attached is the screenshot of the avatar and camera state after moving.
How does the spatial 3D navigation feel compared to traditional OS window managers? Does having an avatar walking on a grid enhance the OS function, or does it create cognitive overhead for launching tools?`;

    const cortexEval2 = await queryLocalCortex(prompt2, step2Base64);
    evaluationSteps.push({
      step: 2,
      title: 'Avatar Movement & Spatial Ergonomics',
      screenshot: 'step_02_movement.png',
      cortexAnalysis: cortexEval2
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: SYSTEM HUD & DRAWER INTERACTION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🎛️ [Step 3] Clicking HUD and App Triggers...');
    const clickedButtons = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button'));
      const clicked = [];
      // Look for SystemHUD / Dock / Apps buttons
      for (const btn of candidates) {
        const text = (btn.innerText || '').toLowerCase();
        const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
        if (text.includes('warp') || text.includes('dock') || text.includes('app') || text.includes('council') || text.includes('dimension') || text.includes('env') || aria.includes('menu')) {
          btn.click();
          clicked.push(btn.innerText || btn.getAttribute('aria-label') || 'Button');
          break;
        }
      }
      return clicked;
    });

    await delay(1200);
    const step3ShotPath = path.join(AUTOPSY_DIR, 'step_03_hud_interact.png');
    await page.screenshot({ path: step3ShotPath });
    const step3Base64 = fs.readFileSync(step3ShotPath).toString('base64');

    console.log('🧠 Querying Cortex on Step 3 HUD & Menu Ergonomics...');
    const prompt3 = `The user clicked: ${JSON.stringify(clickedButtons)}.
Attached is the resulting screen state.
Critique the interface hierarchy:
- Are windows, panels, and HUDs cleanly compartmentalized?
- Does clicking a button create a clear tactile mental model of where you are in the OS?`;

    const cortexEval3 = await queryLocalCortex(prompt3, step3Base64);
    evaluationSteps.push({
      step: 3,
      title: 'HUD & Navigation Controls',
      screenshot: 'step_03_hud_interact.png',
      clicked: clickedButtons,
      cortexAnalysis: cortexEval3
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: MARIO 64 PORTAL & DIMENSION SWAPPING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('🌀 [Step 4] Testing Portal & Realm Selection...');
    const portalClicked = await page.evaluate(() => {
      // Look for realm triggers or warp buttons
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const b of buttons) {
        const t = (b.innerText || '').toLowerCase();
        if (t.includes('printer') || t.includes('cinema') || t.includes('yawning') || t.includes('glyphrider') || t.includes('soundstage')) {
          b.click();
          return b.innerText;
        }
      }
      return null;
    });

    await delay(2000);
    const step4ShotPath = path.join(AUTOPSY_DIR, 'step_04_portal_transition.png');
    await page.screenshot({ path: step4ShotPath });
    const step4Base64 = fs.readFileSync(step4ShotPath).toString('base64');

    console.log('🧠 Querying Cortex on Step 4 Realm Transition...');
    const prompt4 = `The user attempted a portal transition (Target: ${portalClicked || 'Direct Realm/Stage'}).
Attached is the resulting 3D environment.
Assess:
1. Transition Quality: Did the environment hotswap cleanly?
2. Coherence: Does moving between realms feel like an integrated OS feature or disconnected mini-demos?
3. What is the grand vision for how these realms should serve real user productivity and creation?`;

    const cortexEval4 = await queryLocalCortex(prompt4, step4Base64);
    evaluationSteps.push({
      step: 4,
      title: 'Portal Transitions & Sovereign Realms',
      screenshot: 'step_04_portal_transition.png',
      portalClicked: portalClicked,
      cortexAnalysis: cortexEval4
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: OVERALL SYNTHESIS & FOCUSED FUNCTION ROADMAP
    // ─────────────────────────────────────────────────────────────────────────
    console.log('✨ [Step 5] Cortex Final Usability Autopsy & Synthesis...');
    const finalPrompt = `You have observed the entire UX walk of MyOS across landing, movement, HUD interaction, and realm transitions.
Zak is experiencing cognitive burnout and feels that while the FORM of MyOS is extraordinary, the FUNCTION feels oversaturated, nonplussed, and lacking a clear central focus.

Synthesize a definitive, empathetic, highly technical assessment:
1. The Core Diagnosis: Why does MyOS currently feel unfocused despite having world-class engineering? (e.g. absence of a unified "Command Bar" or "Daily Driver Verb", cognitive noise from simultaneous paradigms, lack of a single starting action).
2. The "Zak Persona" Reality Check: When Zak opens MyOS, what does he actually need to achieve in the first 60 seconds without clicking through 10 menus?
3. Actionable Usability Roadmap (Top 3 Tactical Fixes): Exactly what should we build next to marry the breathtaking FORM with razor-sharp FUNCTION?`;

    const finalSynthesis = await queryLocalCortex(finalPrompt, null);

    // Save final report
    const fullReport = {
      timestamp: new Date().toISOString(),
      userAgent: 'ZakInSilico/UX-Wanderer',
      steps: evaluationSteps,
      cortexFinalSynthesis: finalSynthesis
    };

    fs.writeFileSync(path.join(AUTOPSY_DIR, 'ux_autopsy_report.json'), JSON.stringify(fullReport, null, 2));

    // Also write a clean markdown summary
    let md = `# MyOS UX Autopsy: Form vs Function Assessment\n\n`;
    md += `**Timestamp**: ${fullReport.timestamp}\n`;
    md += `**Observer Substrate**: Local GPU Cortex (\`myos-cortex:latest\` on localhost:11434)\n`;
    md += `**Browser Driver**: Puppeteer Chrome Headless Engine\n\n`;
    md += `---\n\n## 🏛️ Cortex Final Usability Synthesis\n\n${finalSynthesis}\n\n`;
    md += `---\n\n## 🔍 Step-by-Step Behavioral Observations\n\n`;

    for (const s of evaluationSteps) {
      md += `### Step ${s.step}: ${s.title}\n`;
      md += `![Screenshot](/${s.screenshot})\n\n`;
      md += `**Cortex Feedback**:\n${s.cortexAnalysis}\n\n`;
    }

    fs.writeFileSync(path.join(AUTOPSY_DIR, 'UX_ASSESSMENT.md'), md);
    console.log('✅ [UX Wanderer] Autopsy complete! Report saved to data/ux_autopsy/UX_ASSESSMENT.md');

  } catch (err) {
    console.error('❌ [UX Wanderer] Error during run:', err);
  } finally {
    await browser.close();
  }
}

runWanderer();
