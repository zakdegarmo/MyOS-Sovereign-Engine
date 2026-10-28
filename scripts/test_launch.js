const { spawn } = require('child_process');

function launchViaShell(targetPath) {
    const psCmd = `
        $target = '${targetPath.replace(/'/g, "''")}';
        $dir = if (Test-Path $target -PathType Container) { $target } elseif (Test-Path $target) { Split-Path -Parent $target } else { '' };
        $sh = New-Object -ComObject Shell.Application;
        $sh.ShellExecute($target, '', $dir, 'open', 1);
    `.replace(/\r?\n\s*/g, ' ');

    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCmd], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
    });
    child.unref();
}

console.log('Testing launch of Blender 5.2.lnk...');
launchViaShell("C:\\Users\\zakde\\Desktop\\Blender 5.2.lnk");
