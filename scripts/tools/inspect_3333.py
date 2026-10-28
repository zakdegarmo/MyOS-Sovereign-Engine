import asyncio
from playwright.async_api import async_playwright
import os

async def inspect_3333():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        # Navigate to 3333
        await page.goto("http://localhost:3333/", wait_until="networkidle")
        await asyncio.sleep(2)
        
        # Capture screenshot
        out_dir = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
        screenshot_path = os.path.join(out_dir, "prismos_3333_live.png")
        await page.screenshot(path=screenshot_path)
        print("SCREENSHOT_SAVED:", screenshot_path)
        
        # Get chat messages / text in CortexSidebar
        cortex_text = await page.evaluate("""() => {
            const sidebar = document.querySelector('[data-cortex-scroll]');
            return sidebar ? sidebar.innerText : 'No sidebar found';
        }""")
        # Write text to utf-8 file
        text_out = os.path.join(out_dir, "prismos_3333_text.txt")
        with open(text_out, "w", encoding="utf-8") as f:
            f.write(cortex_text)
        print("TEXT_SAVED:", text_out)
        
        # Check console / UI state
        title = await page.title()
        print("PAGE TITLE:", title)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_3333())
