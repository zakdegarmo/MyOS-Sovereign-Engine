const fs = require('fs');

function inspectFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf16le');
        if (!content.trim().startsWith('{') && !content.trim().startsWith('[')) {
            content = fs.readFileSync(filePath, 'utf8');
        }
        // Remove BOM if present
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        console.log("=== File:", filePath, "Length:", content.length);
        if (content.length === 0) {
            console.log("EMPTY FILE (0 bytes)");
            return;
        }
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
            console.log("Root Type: Array, Length:", data.length);
            if (data.length > 0) {
                console.log("Sample Item Keys:", Object.keys(data[0]));
            }
        } else if (typeof data === 'object' && data !== null) {
            console.log("Root Type: Object, Keys count:", Object.keys(data).length);
            for (const key of Object.keys(data)) {
                const val = data[key];
                if (Array.isArray(val)) {
                    console.log(`  ${key}: Array[${val.length}]`);
                    if (val.length > 0 && typeof val[0] === 'object') {
                        console.log(`    Sample item[0] keys:`, Object.keys(val[0]));
                    } else if (val.length > 0) {
                        console.log(`    Sample item[0] val:`, JSON.stringify(val[0]).slice(0, 100));
                    }
                } else if (typeof val === 'object' && val !== null) {
                    console.log(`  ${key}: Object{${Object.keys(val).join(', ')}}`);
                } else {
                    console.log(`  ${key}: ${typeof val} = ${JSON.stringify(val).slice(0, 100)}`);
                }
            }
        }
    } catch (e) {
        console.error("Error inspecting:", e.message);
    }
}

const args = process.argv.slice(2);
args.forEach(inspectFile);
