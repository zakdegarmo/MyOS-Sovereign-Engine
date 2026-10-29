const { execFile } = require('child_process');
console.log('Launching notepad...');
execFile('cmd.exe', ['/c', 'start', '', 'notepad'], (err, stdout, stderr) => {
    console.log('Result:', { err, stdout, stderr });
});
