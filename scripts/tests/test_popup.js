const { execFile } = require('child_process');

function testTarget(target) {
    const escapedTarget = target.replace(/'/g, "''");
    // This is the exact code from our fixed agent-bridge.js
    const popupScript = `
        $ws = New-Object -ComObject WScript.Shell
        $res = $ws.Popup('An agent is requesting to launch: ' + '${escapedTarget}' + "\`n\`nDo you want to allow this?", 5, "Security Confirmation", 36)
        if ($res -eq 6) { exit 0 } else { exit 1 }
    `;
    
    console.log(`--- Testing target: ${target} ---`);
    console.log(`Generated PowerShell Script:\n${popupScript}\n`);

    return new Promise((resolve) => {
        const child = execFile('powershell.exe', ['-NoProfile', '-Command', popupScript], (error, stdout, stderr) => {
            console.log(`Exit code/Error:`, error ? error.code : 0);
            console.log(`Stdout:`, stdout);
            console.log(`Stderr:`, stderr);
            resolve();
        });
    });
}

async function runTests() {
    // 1. Test normal target
    await testTarget('notepad');
    
    // 2. Test target with single quotes
    await testTarget("note'pad");
    
    // 3. Test command injection attempt
    await testTarget('" + (Start-Process calc) + "');
}

runTests();
