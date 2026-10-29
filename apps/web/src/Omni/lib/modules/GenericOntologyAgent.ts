import { BaseAgent } from './BaseAgent';
import type { AgentConfig } from './BaseAgent';

export class GenericOntologyAgent extends BaseAgent {
    constructor(config: AgentConfig) {
        super(config);
    }

    // Can add specific logic here if needed, or just use BaseAgent's monitor
}
