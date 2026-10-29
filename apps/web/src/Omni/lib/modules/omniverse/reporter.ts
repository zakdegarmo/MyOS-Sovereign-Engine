import * as fs from 'fs';
import * as path from 'path';

export interface CouncilLogEntry {
    agent: string;
    action: string;
    details: string;
    timestamp: number;
}

export class CouncilReporter {
    private logs: CouncilLogEntry[] = [];
    private sessionStart: number;

    constructor() {
        this.sessionStart = Date.now();
    }

    public log(agent: string, action: string, details: string) {
        this.logs.push({
            agent,
            action,
            details,
            timestamp: Date.now()
        });
    }

    public async generateReport(summary: string): Promise<string> {
        const dateStr = new Date(this.sessionStart).toISOString().slice(0, 10);
        const fileName = `session_${dateStr}_${this.sessionStart}.md`;
        const dir = path.join(process.cwd(), 'chronicles');

        // Ensure directory exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let content = `# Council Session Report: ${dateStr}\n\n`;
        content += `**Topic**: ${summary}\n\n`;
        content += `## Transcript\n`;

        this.logs.forEach(log => {
            const timeOffset = ((log.timestamp - this.sessionStart) / 1000).toFixed(2);
            content += `### [${timeOffset}s] ${log.agent}: ${log.action}\n`;
            content += `>${log.details.replace(/\n/g, '\n> ')}\n\n`;
        });

        const filePath = path.join(dir, fileName);
        await fs.promises.writeFile(filePath, content);

        return filePath;
    }
}
