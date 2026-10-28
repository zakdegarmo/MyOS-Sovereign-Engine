const { execFile } = require('child_process');
console.log('Launching notepad with detached and ignore...');
const child = execFile('cmd.exe', ['/c', 'start', '', 'notepad'], {
    detached: true,
    stdio: 'ignore'
}, (err, stdout, stderr) => {
    console.log('Callback fired!', { err });
});
child.unref();
setTimeout(() => {
    console.log('Exiting parent after 1s');
    process.exit(0);
}, 1000);
