// Test the Alchemist Engine
const { AlchemyEncoder } = require('./dist/sys/AlchemyEncoder');

const uuid = '010aef1f-2c08-48e1-8d18-8a9df985d7f6';
const glyphs = AlchemyEncoder.distill(uuid);
console.log(`Existential ID: ${uuid}`);
console.log(`Semantic Glyphs: ${glyphs}`);

const b1 = AlchemyEncoder.pack(42);
console.log(`Pack(42) Bytes:`, b1);
const v1 = AlchemyEncoder.unpack(b1);
console.log(`Unpack(42): ${v1}`);

const b2 = AlchemyEncoder.pack(10000); // Test Magnitude Shift
console.log(`Pack(10000) Bytes:`, b2);
const v2 = AlchemyEncoder.unpack(b2);
console.log(`Unpack(10000): ${v2}`);
