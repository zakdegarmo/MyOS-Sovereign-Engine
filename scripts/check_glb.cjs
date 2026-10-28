const fs = require('fs');
const d = fs.readFileSync('apps/web/public/models/uniracer_hero.glb');
const jsonLen = d.readUInt32LE(12);
const json = JSON.parse(d.slice(20, 20 + jsonLen).toString('utf8'));
console.log('Animations:', (json.animations || []).map(a => a.name));
