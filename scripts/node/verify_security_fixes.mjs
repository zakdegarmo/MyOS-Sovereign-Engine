import path from 'path';
import fs from 'fs/promises';

const PROJECT_ROOT = path.resolve('.');

function isPathInside(parentPath, childPath) {
    const prefixLower = path.resolve(parentPath).toLowerCase();
    const resolvedLower = path.resolve(childPath).toLowerCase();
    if (resolvedLower === prefixLower) return true;
    return resolvedLower.startsWith(prefixLower + path.sep);
}

function isSafePath(targetPath) {
    const resolved = path.isAbsolute(targetPath) 
        ? path.resolve(targetPath) 
        : path.resolve(PROJECT_ROOT, targetPath);
        
    const lowerResolved = resolved.toLowerCase();
    
    const isInsideProject = isPathInside(PROJECT_ROOT, resolved);
    const isOnNDrive = lowerResolved.startsWith('n:');
    const isOnEDrive = lowerResolved.startsWith('e:');
    const isGeminiDir = isPathInside('c:\\users\\zakde\\.gemini', resolved);
    const isDownloadsDir = isPathInside('c:\\users\\zakde\\downloads', resolved);
    const isDesktopDir = isPathInside('c:\\users\\zakde\\desktop', resolved);
    
    return isInsideProject || isOnNDrive || isOnEDrive || isGeminiDir || isDownloadsDir || isDesktopDir;
}

function checkWhitelist(target) {
    if (/[&|;$\n\r`<>\/]/.test(target)) {
        return { allowed: false, reason: 'Forbidden characters' };
    }
    const whitelist = new Set(['notepad', 'calc', 'explorer', 'cmd', 'powershell', 'taskmgr', 'mspaint', 'write']);
    const targetName = path.basename(target).toLowerCase();
    const nameWithoutExt = targetName.endsWith('.exe') ? targetName.slice(0, -4) : targetName;

    const isBareName = !target.includes('\\') && !target.includes('/');
    const isWhitelisted = isBareName && whitelist.has(nameWithoutExt);
    return { allowed: isWhitelisted };
}

async function testSafePath() {
    console.log('--- Testing isSafePath ---');
    const testCases = [
        { path: 'apps/web/agent-bridge.js', expected: true },
        { path: 'c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS', expected: true },
        { path: 'c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS-malicious-sibling', expected: false },
        { path: 'c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS-malicious-sibling\\file.txt', expected: false },
        { path: 'c:\\users\\zakde\\.gemini', expected: true },
        { path: 'c:\\users\\zakde\\.gemini\\config.json', expected: true },
        { path: 'c:\\users\\zakde\\.geminianother', expected: false },
        { path: 'c:\\users\\zakde\\downloads', expected: true },
        { path: 'c:\\users\\zakde\\downloads\\test.exe', expected: true },
        { path: 'c:\\users\\zakde\\downloads-malicious', expected: false },
        { path: 'n:\\some\\path', expected: true },
        { path: 'e:\\another\\path', expected: true },
    ];

    let passed = true;
    for (const tc of testCases) {
        const result = isSafePath(tc.path);
        if (result !== tc.expected) {
            console.error(`FAIL: Path "${tc.path}" expected ${tc.expected}, got ${result}`);
            passed = false;
        } else {
            console.log(`PASS: Path "${tc.path}" correctly resolved to ${result}`);
        }
    }
    return passed;
}

async function testWhitelist() {
    console.log('\n--- Testing Whitelist Basename Bypass ---');
    const testCases = [
        { target: 'notepad', expected: true },
        { target: 'calc', expected: true },
        { target: 'calc.exe', expected: true },
        { target: 'C:\\Users\\zakde\\Downloads\\calc.exe', expected: false },
        { target: 'C:\\Windows\\System32\\cmd.exe', expected: false },
        { target: 'explorer.exe', expected: true },
        { target: 'explorer', expected: true },
        { target: 'untrusted.exe', expected: false },
    ];

    let passed = true;
    for (const tc of testCases) {
        const result = checkWhitelist(tc.target).allowed;
        if (result !== tc.expected) {
            console.error(`FAIL: Target "${tc.target}" expected ${tc.expected}, got ${result}`);
            passed = false;
        } else {
            console.log(`PASS: Target "${tc.target}" correctly resolved to ${result}`);
        }
    }
    return passed;
}

async function runTests() {
    const safePathPassed = await testSafePath();
    const whitelistPassed = await testWhitelist();
    if (safePathPassed && whitelistPassed) {
        console.log('\nAll security unit tests passed successfully!');
    } else {
        console.error('\nSome security unit tests failed!');
        process.exit(1);
    }
}

runTests();
