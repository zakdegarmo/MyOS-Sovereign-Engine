const { exec } = require('child_process');
const cmd = `
$desktopPath = 'C:\\Users\\zakde\\Desktop'
if (-not (Test-Path $desktopPath)) {
    $desktopPath = [System.Environment]::GetFolderPath('Desktop')
}
$wsh = New-Object -ComObject WScript.Shell
$files = Get-ChildItem -Path $desktopPath -File
$results = foreach ($file in $files) {
    $isLnk = $file.Extension -eq '.lnk'
    $target = $null
    if ($isLnk) {
        try {
            $shortcut = $wsh.CreateShortcut($file.FullName)
            $target = $shortcut.TargetPath
        } catch {}
    }
    [PSCustomObject]@{
        name = $file.Name
        path = $file.FullName
        isShortcut = [bool]$isLnk
        target = $target
    }
}
if ($results) {
    ConvertTo-Json -InputObject @($results) -Compress
} else {
    '[]'
}
`;

exec(cmd, { shell: 'powershell.exe' }, (err, stdout, stderr) => {
    console.log('Error:', err);
    console.log('Stdout:', stdout);
    console.log('Stderr:', stderr);
});
