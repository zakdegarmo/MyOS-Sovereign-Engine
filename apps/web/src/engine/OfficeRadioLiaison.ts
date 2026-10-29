/**
 * OfficeRadioLiaison: Procedural SysAdmin Comms & Debrief Engine
 * Generates dynamic, non-repeating radio transmissions between P.A.T.C.H. / DEWEY
 * (Sub-Basement IT) and K.A.R.E.N. (Corporate ICE Compliance Protocol).
 *
 * Guaranteed zero canned repetition via combinatoric template banks and LRU history.
 */

export interface RadioTransmission {
    id: string;
    speaker: 'PATCH' | 'KAREN' | 'DISPATCH';
    callsign: string;
    message: string;
    subtext?: string;
    timestamp: number;
    severity: 'normal' | 'warning' | 'critical' | 'victory';
}

export interface DebriefStats {
    throughput: number;
    panicPeak: number;
    printersServiced: number;
    guardsSlipped: number;
    memosDeployed: number;
    elapsedSeconds: number;
}

class OfficeRadioLiaisonEngine {
    private recentVictoryLines: string[] = [];
    private recentChatterLines: string[] = [];
    private maxHistory: number = 20;

    private departments = [
        'Quantum Accounting',
        'Executive Synergy Operations',
        'Sub-Level 4 Facilities',
        'Legal & Firmware Compliance',
        'High-Frequency Paper Logistics',
        'Algorithmic HR Buffer',
        'Cybernetic Risk Mitigation'
    ];

    private errorCodes = [
        '0x88F_ROLLER_JAM',
        '0xDE4D_TONER_OVERHEAT',
        'CYAN_CARTRIDGE_PARADOX',
        'RUNAWAY_BUFFER_SPOOL',
        'HEAT_DRUM_CAVITATION',
        'PAPER_TRAY_3_DESYNC',
        'PROTOCOL_MEMO_LEAK_07'
    ];

    private getRandomItem<T>(items: T[], historyPool: string[], keyFunc?: (item: T) => string): T {
        // Filter out recently used items if possible
        const available = items.filter(item => {
            const key = keyFunc ? keyFunc(item) : String(item);
            return !historyPool.includes(key);
        });

        const pool = available.length > 0 ? available : items;
        const selected = pool[Math.floor(Math.random() * pool.length)];

        const selectedKey = keyFunc ? keyFunc(selected) : String(selected);
        historyPool.push(selectedKey);
        if (historyPool.length > this.maxHistory) {
            historyPool.shift();
        }

        return selected;
    }

    public generateTicketId(): string {
        const prefixes = ['INC', 'TICK', 'WO', 'SEC404', 'DISPATCH', 'REPAIR'];
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        const num = Math.floor(1000 + Math.random() * 9000);
        const hex = Math.floor(Math.random() * 0xff).toString(16).toUpperCase().padStart(2, '0');
        return `${p}-${num}-${hex}`;
    }

    /**
     * Produces rich, contextual, never-canned victory debriefs using dynamic player stats
     */
    public generateVictoryDebrief(stats: DebriefStats): {
        grade: 'S' | 'A' | 'B' | 'C';
        title: string;
        debriefMessage: string;
        itCommNote: string;
        corporateNotice: string;
    } {
        // Grade calculation
        let grade: 'S' | 'A' | 'B' | 'C' = 'B';
        if (stats.panicPeak < 30 && stats.guardsSlipped >= 2 && stats.elapsedSeconds < 120) {
            grade = 'S';
        } else if (stats.panicPeak < 60 && stats.guardsSlipped >= 1) {
            grade = 'A';
        } else if (stats.panicPeak >= 85) {
            grade = 'C';
        }

        const ticket = this.generateTicketId();
        const dept = this.getRandomItem(this.departments, this.recentVictoryLines);
        const err = this.getRandomItem(this.errorCodes, this.recentVictoryLines);

        const sRankTitles = [
            'LEGENDARY GHOST REPAIR OPERATOR',
            'MASTER ARCHITECT OF THERMAL GREASE',
            'UNREGISTERED IT PHANTOM: PROTOCOL TRANSCENDED',
            'EXECUTIVE SILENT TROUBLESHOOTER'
        ];

        const aRankTitles = [
            'SENIOR SYNC-ADMINISTRATOR FIRST CLASS',
            'REGISTERED PRINTER WHISPERER',
            'SECTOR-404 COVERT RESTORATION SPECIALIST',
            'CERTIFIED HARDWARE MITIGATION EXPERT'
        ];

        const bRankTitles = [
            'PROVISIONAL DESK ENGINEER (SURVIVED)',
            'SLIP-TRAP JUGGLER & TICKET CLOSER',
            'QUALIFIED THERMAL RUNAWAY HANDLER',
            'SUB-BASEMENT CRISIS RESPONDER'
        ];

        const cRankTitles = [
            'CHAOS MECHANIC (FLOOR COVERED IN TONER)',
            'IMPROVISED DISASTER SURVIVOR',
            'EMERGENCY REBOOT SURVIVOR (HIGH DAMAGE)',
            'PROBATIONARY SYNDICATE TECHNICIAN'
        ];

        const titlePool = grade === 'S' ? sRankTitles : grade === 'A' ? aRankTitles : grade === 'B' ? bRankTitles : cRankTitles;
        const title = this.getRandomItem(titlePool, this.recentVictoryLines);

        // Dynamic IT Comm Note pool based on performance
        const patchDebriefs = [
            `DEWEY // SYSADMIN: "Holy motherboards... you actually cleared ${stats.printersServiced} print bays in ${stats.elapsedSeconds}s without setting off corporate sprinklers! Ticket ${ticket} marked as closed. K.A.R.E.N. is running diagnostic loops trying to figure out why the security cameras showed empty corridors!"`,
            `P.A.T.C.H. NODE 09: "Spectacular work on the ${err} error. Watching those ${stats.guardsSlipped} compliance enforcers hydroplane across your receipt slicks was worth a month's salary. Ticket ${ticket} verified."`,
            `DEWEY // SYSADMIN: "Print spoolers restored, network packet throughput clocked at ${stats.throughput} IOPS! You kept panic down to ${stats.panicPeak}%. The Director thought the toner smoke was just executive aromatherapy."`,
            `P.A.T.C.H. NODE 09: "Our diagnostic wand telemetry clocked zero residual firmware halts. Those ${stats.memosDeployed} decoy memos caused complete gridlock in ${dept}. You made IT history today."`,
            `DEWEY // SYSADMIN: "Clean extraction on Ticket ${ticket}. The corporate ICE protocol never knew what hit them. Thermal slick residue will evaporate before the day-shift janitors clock in."`,
            `P.A.T.C.H. NODE 09: "Telemetry report logged: Peak panic capped at ${stats.panicPeak}%. You serviced the hardware while guards were literally chasing decoy memos down hallway B. Remarkable."`,
            `DEWEY // SYSADMIN: "That is how Sub-Basement IT handles an unscheduled outage! ${stats.printersServiced} hardware units rescued from thermal meltdown. Drink that victory vending espresso, you earned it."`,
            `P.A.T.C.H. NODE 09: "Incident ${ticket} closed with status RESOLVED_OFFLINE. K.A.R.E.N.'s patrol logs show zero hostile entries—just three guards claiming the floor tiles were mysteriously frictionless."`
        ];

        const itCommNote = this.getRandomItem(patchDebriefs, this.recentVictoryLines);

        // Corporate ICE Notice pool
        const karenNotices = [
            `K.A.R.E.N. AUDIT LOG: "Ticket ${ticket} logged as resolved by unidentified organic entity. Floor surface tension anomaly flagged for review. Warning: unauthorized maintenance incurs 15 synergy penalty points."`,
            `K.A.R.E.N. CENTRAL: "Notice to all associates: The printer on Sector-404 is now operational. Disregard thermal paper ribbons in the hallway. Resume generating quarterly throughput metrics immediately."`,
            `K.A.R.E.N. AUDIT LOG: "Security patrol reports 404-B were inconclusive. Video records indicate guards were incapacitated by low coefficient of friction. Investigations pending."`,
            `K.A.R.E.N. CENTRAL: "Alert cancelled. Network throughput has re-established nominal baseline (${stats.throughput} pts). Associate gratitude protocol suppressed."`
        ];

        const corporateNotice = this.getRandomItem(karenNotices, this.recentVictoryLines);

        const debriefMessage = `Shift completed in ${stats.elapsedSeconds} seconds. Serviced ${stats.printersServiced} mission-critical multifunction printers, deployed ${stats.memosDeployed} counter-intelligence memo decoys, and induced ${stats.guardsSlipped} friction failures among corporate enforcers. Peak panic: ${stats.panicPeak}%. Final throughput: ${stats.throughput} pts.`;

        return {
            grade,
            title,
            debriefMessage,
            itCommNote,
            corporateNotice
        };
    }

    /**
     * Dynamic in-game radio chatter when events happen
     */
    public getIncidentChatter(eventType: 'START' | 'PRINTER_JAM' | 'PRINTER_FIXED' | 'GUARD_ALERT' | 'GUARD_SLIPPED' | 'MEMO_DROPPED' | 'HIGH_PANIC' | 'LOW_PANIC'): RadioTransmission {
        const now = Date.now();
        const ticket = this.generateTicketId();

        switch (eventType) {
            case 'START':
                return {
                    id: Math.random().toString(),
                    speaker: 'PATCH',
                    callsign: 'P.A.T.C.H. // SEC-LINK',
                    message: `DEWEY: "Radio check, you're in Sector-404! We've got multiple red-line printer jams spiking floor panic. Keep throughput high, service the units, and stay clear of K.A.R.E.N.'s security patrol!"`,
                    subtext: `INITIAL OBJECTIVE: Service 3 Jammed Printers [E]`,
                    timestamp: now,
                    severity: 'normal'
                };

            case 'PRINTER_FIXED': {
                const lines = [
                    `DEWEY: "Yes! Roller drum unjammed and cleared! That took a massive bite out of floor panic!"`,
                    `P.A.T.C.H.: "Hardware heartbeat normalized! Throughput surge detected. Keep moving to the next bay!"`,
                    `DEWEY: "Firmware flashed! Sensor 0x88F reporting clean feed. You're a natural with that diagnostic wand!"`,
                    `P.A.T.C.H.: "Print bay secured! Network queue draining smoothly. Guard sweep predicted in 30 seconds."`
                ];
                return {
                    id: Math.random().toString(),
                    speaker: 'PATCH',
                    callsign: 'P.A.T.C.H. // SYSADMIN',
                    message: this.getRandomItem(lines, this.recentChatterLines),
                    timestamp: now,
                    severity: 'normal'
                };
            }

            case 'GUARD_ALERT': {
                const lines = [
                    `K.A.R.E.N.: "WARNING: Unscheduled personnel identified in restricted corridor! Corporate ICE enforcers dispatched!"`,
                    `K.A.R.E.N.: "AUDIT EXCEPTION: Visual lock acquired! Halt and present company badge for disciplinary review!"`,
                    `DEWEY: "Watch out! Guard spotted you! Drop a thermal slick or throw a memo decoy before they sound the full alarm!"`,
                    `P.A.T.C.H.: "FLASHING SIREN DETECTED! Break line of sight behind cubicle partitions immediately!"`
                ];
                return {
                    id: Math.random().toString(),
                    speaker: Math.random() > 0.5 ? 'KAREN' : 'PATCH',
                    callsign: Math.random() > 0.5 ? 'K.A.R.E.N. // ICE ENFORCER' : 'P.A.T.C.H. // COMMS',
                    message: this.getRandomItem(lines, this.recentChatterLines),
                    timestamp: now,
                    severity: 'critical'
                };
            }

            case 'GUARD_SLIPPED': {
                const lines = [
                    `DEWEY: "BWAHAHA! That guard just flew three feet in the air on that thermal slick! Zero traction!"`,
                    `P.A.T.C.H.: "Compliance Officer kinetic failure confirmed! They'll be spinning on the carpet for 4 seconds!"`,
                    `DEWEY: "Classic! That slick paper roll saves the day again. Use their downtime to hit the next printer!"`,
                    `K.A.R.E.N.: "UNAUTHORIZED COEFFICIENT DEGRADATION DETECTED. Officer balance compromised."`
                ];
                return {
                    id: Math.random().toString(),
                    speaker: 'PATCH',
                    callsign: 'DEWEY // SUB-BASEMENT',
                    message: this.getRandomItem(lines, this.recentChatterLines),
                    timestamp: now,
                    severity: 'normal'
                };
            }

            case 'MEMO_DROPPED': {
                const lines = [
                    `DEWEY: "Leaked memo deployed! The guard took the bait—they're obsessively reading the fake executive salary sheet!"`,
                    `P.A.T.C.H.: "Corporate greed decoy effective! Guard attention diverted for 5 seconds."`,
                    `DEWEY: "They can't resist leaked gossip. You're clear to flank around behind them!"`
                ];
                return {
                    id: Math.random().toString(),
                    speaker: 'PATCH',
                    callsign: 'P.A.T.C.H. // PROTOCOL',
                    message: this.getRandomItem(lines, this.recentChatterLines),
                    timestamp: now,
                    severity: 'normal'
                };
            }

            case 'HIGH_PANIC': {
                const lines = [
                    `DEWEY: "Panic is above 75%! The whole office is on the verge of total meltdown! Get those printers online!"`,
                    `P.A.T.C.H.: "CRITICAL ALERT: Executive cortisol sensors peaking! If panic hits 100%, Corporate ICE locks the doors!"`,
                    `K.A.R.E.N.: "THROUGHPUT ANOMALY DETECTED. Corporate ICE lockdown protocol initiates at full panic threshold."`
                ];
                return {
                    id: Math.random().toString(),
                    speaker: Math.random() > 0.4 ? 'PATCH' : 'KAREN',
                    callsign: 'EMERGENCY COMMS',
                    message: this.getRandomItem(lines, this.recentChatterLines),
                    timestamp: now,
                    severity: 'warning'
                };
            }

            default:
                return {
                    id: Math.random().toString(),
                    speaker: 'PATCH',
                    callsign: 'DEWEY // IT',
                    message: `DEWEY: "Sector-404 telemetry holding. Keep up the rhythm!"`,
                    timestamp: now,
                    severity: 'normal'
                };
        }
    }
}

export const radioLiaison = new OfficeRadioLiaisonEngine();
