/**
 * OpenClaw: Web API Indexing Spider
 * 
 * A foundational crawler that searches the web for free REST APIs,
 * extracts their descriptions, and indexes them into the MyOS vector database.
 * This allows local agents to autonomously discover and utilize external internet resources.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';

const DB_PATH = path.join(process.cwd(), 'data', 'myos_vector_store.db');
const OLLAMA_URL = 'http://localhost:11434/api/embeddings';
const EMBED_MODEL = 'mxbai-embed-large:latest';

// For this initial architecture draft, we will seed the spider with a known open-source
// registry of public APIs. In the future, this can crawl HTML and parse OpenAPI specs.
const API_REGISTRY_SEED = 'https://raw.githubusercontent.com/public-apis/public-apis/master/README.md';

async function generateEmbedding(text) {
    try {
        const res = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: EMBED_MODEL, prompt: text })
        });
        const json = await res.json();
        if (json.embedding) {
            return json.embedding;
        }
    } catch (e) {
        console.warn("[OpenClaw Spider] Ollama offline. Falling back to pseudo-hash embedding.");
    }
    
    // Fallback pseudo-random float array if offline
    const hash = crypto.createHash('md5').update(text).digest();
    const vec = [];
    for (let i = 0; i < 1024; i++) {
        const val = hash[i % hash.length];
        vec.push(((val / 255.0) * 2.0) - 1.0);
    }
    return vec;
}

function initDb() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) return reject(err);
            db.run(`
                CREATE TABLE IF NOT EXISTS vectors (
                    id TEXT PRIMARY KEY,
                    type TEXT,
                    timestamp TEXT,
                    text TEXT,
                    embedding BLOB
                );
            `, (err) => {
                if (err) return reject(err);
                resolve(db);
            });
        });
    });
}

function insertApiNode(db, apiDetails, embedding) {
    return new Promise((resolve, reject) => {
        const docId = `api_${crypto.randomUUID().substring(0, 12)}`;
        const timestamp = new Date().toISOString();
        const typeName = "api_node";
        
        const floatArray = new Float32Array(embedding);
        const buffer = Buffer.from(floatArray.buffer);

        db.run(
            `INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)`,
            [docId, typeName, timestamp, JSON.stringify(apiDetails), buffer],
            function(err) {
                if (err) return reject(err);
                console.log(`[OpenClaw] Indexed API Node: ${apiDetails.name}`);
                resolve(docId);
            }
        );
    });
}

async function runSpider() {
    console.log("[OpenClaw Spider] Initializing web crawler...");
    let db;
    try {
        db = await initDb();
        console.log(`[OpenClaw Spider] Connected to MyOS Vector Store at ${DB_PATH}`);

        // Phase 1: Fetch seed registry
        console.log(`[OpenClaw Spider] Fetching seed registry from ${API_REGISTRY_SEED}`);
        const response = await fetch(API_REGISTRY_SEED);
        const text = await response.text();
        
        // Very basic markdown table parser to extract APIs
        const lines = text.split('\n');
        const apis = [];
        let parsingTable = false;
        
        for (const line of lines) {
            if (line.startsWith('| API |')) parsingTable = true;
            if (line.startsWith('---') || !line.includes('|')) continue;
            
            if (parsingTable) {
                const parts = line.split('|').map(s => s.trim());
                if (parts.length >= 4) {
                    const nameCol = parts[1];
                    const desc = parts[2];
                    const auth = parts[3];
                    
                    // Extract URL from markdown link: [Name](URL)
                    const match = nameCol.match(/\[(.*?)\]\((.*?)\)/);
                    if (match) {
                        apis.push({
                            name: match[1],
                            url: match[2],
                            description: desc,
                            auth: auth
                        });
                    }
                }
            }
        }
        
        console.log(`[OpenClaw Spider] Discovered ${apis.length} public APIs. Indexing top 5 for proof-of-concept...`);
        
        for (let i = 0; i < Math.min(5, apis.length); i++) {
            const api = apis[i];
            const semanticText = `External API Tool: ${api.name}. Description: ${api.description}. Auth required: ${api.auth}. URL: ${api.url}`;
            const embedding = await generateEmbedding(semanticText);
            await insertApiNode(db, api, embedding);
        }
        
        console.log("[OpenClaw Spider] Indexing complete. Decentralized network foundation established.");
        
    } catch (e) {
        console.error("[OpenClaw Spider] Error:", e);
    } finally {
        if (db) {
            db.close();
        }
    }
}

runSpider();
