// database_manager.js v1.1
// Manages the persistent SQLite database for the Pantheon.

import path from 'node:path';
import Database from 'better-sqlite3';

const DB_FILE_NAME = 'MelvinsLibrary.db';

class DatabaseManager {
    constructor(userDataPath) {
        this.dbPath = path.join(userDataPath, DB_FILE_NAME);
        this.db = null;
    }

    initialize() {
        this.db = new Database(this.dbPath);
        this.db.pragma('journal_mode = WAL'); // For better concurrency
        console.log('[DBManager] Connection to Memory Crystal established.');
        this.createSchema();
    }

    createSchema() {
        // REFINED SCHEMA based on Gary's suggestion
        const createTableStmt = `
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            correlation_id TEXT,
            source_node TEXT NOT NULL,
            target_node TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT NOT NULL,
            is_read INTEGER DEFAULT 0
        );
        `;
        this.db.exec(createTableStmt);
        console.log('[DBManager] Knowledge Base schema verified.');
    }

    addEntry(sourceNode, targetNode, content, type, correlationId = null) {
        const stmt = this.db.prepare(`
            INSERT INTO knowledge_base (timestamp, correlation_id, source_node, target_node, content, type)
            VALUES (strftime('%Y-%m-%dT%H:%M:%f', 'now'), ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(correlationId, sourceNode, targetNode, JSON.stringify(content), type);
        return info.lastInsertRowid;
    }

    getUnreadPacket(targetNode) {
        const stmt = this.db.prepare(
            'SELECT * FROM knowledge_base WHERE target_node = ? AND is_read = 0 ORDER BY timestamp ASC LIMIT 1'
        );
        const packet = stmt.get(targetNode);
        return packet;
    }

    markPacketAsRead(packetId) {
        const stmt = this.db.prepare('UPDATE knowledge_base SET is_read = 1 WHERE id = ?');
        const info = stmt.run(packetId);
        return info.changes > 0;
    }
}

export { DatabaseManager };