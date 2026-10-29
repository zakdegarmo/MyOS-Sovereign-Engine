const { execFile } = require('child_process');
console.log('Launching notepad with stdio: ignore...');
execFile('cmd.exe', ['/c', 'start', '', 'notepad'], { stdio: 'ignore' }, (err, stdout, stderr) => {
    console.log('Finished immediately! Result:', { err, stdout, stderr });
    process.exit(0);
});
