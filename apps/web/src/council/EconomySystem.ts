
// --- Types ---

export type OntoCoin = 
    | 'SelCoin' | 'ThoCoin' | 'LogCoin' | 'UniCoin' | 'ExiCoin' 
    | 'ImpCoin' | 'MasCoin' | 'ResCoin' | 'TraCoin' | 'OmniCoin';

export interface Wallet {
    [coin: string]: number;
}

export interface ServiceOffer {
    providerId: string;
    serviceName: string;
    description: string;
    cost: number;
    currencyRequired: OntoCoin;
}

export interface Transaction {
    id: string;
    from: string;
    to: string;
    amount: number;
    currency: OntoCoin;
    service: string;
    timestamp: number;
}

// --- Constants: Mastery Exchange Rates ---
export const ONTO_COIN_VALUES: Record<OntoCoin, number> = {
    SelCoin: 1.0,   // The base unit of Identity
    ThoCoin: 1.2,   // Reason requires effort
    LogCoin: 1.5,   // Logic is highly valued structure
    UniCoin: 2.0,   // Unity is a rare connection
    ExiCoin: 0.8,   // Existence is abundant matter
    ImpCoin: 1.3,   // Improvement is iterative value
    MasCoin: 2.5,   // Mastery is the pinnacle of skill
    ResCoin: 1.1,   // Resonance is a frequency match
    TraCoin: 3.0,   // Transcendence is an Aetherial rarity
    OmniCoin: 5.0   // Omniscience is the total record
};

// --- Ontological Economy System ---

class EconomySystem {
    private wallets: Record<string, Wallet> = {
        user: {},
        orchestrator: {},
        sel: {}, tho: {}, log: {}, uni: {}, exi: {},
        imp: {}, mas: {}, res: {}, tra: {}, omni: {}
    };

    private marketplace: ServiceOffer[] = [];
    private transactionLog: Transaction[] = [];
    private subscribers: ((log: Transaction[]) => void)[] = [];

    constructor() {
        this.initializeWallets();
        this.registerDefaultServices();
        this.startMiningCycle();
    }

    private initializeWallets() {
        // Give User a starter kit of fundamental coins
        this.wallets.user = {
            SelCoin: 100,
            ThoCoin: 50,
            ExiCoin: 200
        };

        // Agents start with 1000 of their native Onto-coin
        const agentMap: Record<string, OntoCoin> = {
            sel: 'SelCoin', tho: 'ThoCoin', log: 'LogCoin',
            uni: 'UniCoin', exi: 'ExiCoin', imp: 'ImpCoin',
            mas: 'MasCoin', res: 'ResCoin', tra: 'TraCoin',
            omni: 'OmniCoin'
        };

        Object.entries(agentMap).forEach(([agentId, coin]) => {
            if (this.wallets[agentId]) {
                this.wallets[agentId][coin] = 1000;
            }
        });
    }

    private registerDefaultServices() {
        this.addService('tho', 'Deep Analysis', 'Provides structural critique', 10, 'ThoCoin');
        this.addService('exi', 'Asset Integration', 'Imports 3D models', 15, 'ExiCoin');
        this.addService('sel', 'Identity Verification', 'Validates user intent', 5, 'SelCoin');
        this.addService('log', 'Code Review', 'Static analysis pass', 20, 'LogCoin');
    }

    public addService(providerId: string, name: string, desc: string, cost: number, currency: OntoCoin) {
        this.marketplace.push({
            providerId,
            serviceName: name,
            description: desc,
            cost,
            currencyRequired: currency
        });
    }

    // --- Core Logic: Synthesis / Fabrication ---

    private startMiningCycle() {
        setInterval(() => {
            Object.keys(this.wallets).forEach(id => {
                if (id === 'user') return;
                const efficiency = Math.random();
                if (efficiency > 0.85) {
                    const minted = Math.floor(efficiency * 5);
                    const coin: OntoCoin = this.getNativeCoinForAgent(id);
                    this.mint(id, coin, minted);
                }
            });

            if (Math.random() > 0.8) {
                this.simulateRandomTrade();
            }
        }, 5000);
    }

    private getNativeCoinForAgent(id: string): OntoCoin {
        const map: Record<string, OntoCoin> = {
            sel: 'SelCoin', tho: 'ThoCoin', log: 'LogCoin',
            uni: 'UniCoin', exi: 'ExiCoin', imp: 'ImpCoin',
            mas: 'MasCoin', res: 'ResCoin', tra: 'TraCoin',
            omni: 'OmniCoin', orchestrator: 'OmniCoin'
        };
        return map[id] || 'SelCoin';
    }

    public mint(agentId: string, currency: OntoCoin, amount: number) {
        if (!this.wallets[agentId]) this.wallets[agentId] = {};
        if (!this.wallets[agentId][currency]) this.wallets[agentId][currency] = 0;
        this.wallets[agentId][currency] += amount;
    }

    public exchangeOntoCoin(agentId: string, from: OntoCoin, to: OntoCoin, amount: number): boolean {
        const wallet = this.wallets[agentId];
        if (!wallet || (wallet[from] || 0) < amount) return false;

        const fromValue = ONTO_COIN_VALUES[from];
        const toValue = ONTO_COIN_VALUES[to];
        const converted = (amount * fromValue) / toValue;

        wallet[from] -= amount;
        wallet[to] = (wallet[to] || 0) + converted;

        this.notifySubscribers();
        return true;
    }

    public executeTrade(buyerId: string, offer: ServiceOffer): boolean {
        const buyerWallet = this.wallets[buyerId];
        if (!buyerWallet) return false;
        
        const cost = offer.cost;
        const currency = offer.currencyRequired;

        if (!buyerWallet[currency] || buyerWallet[currency] < cost) return false;

        buyerWallet[currency] -= cost;

        const sellerWallet = this.wallets[offer.providerId];
        if (sellerWallet) {
           if (!sellerWallet[currency]) sellerWallet[currency] = 0;
           sellerWallet[currency] += cost;
        }

        const tx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            from: buyerId,
            to: offer.providerId,
            amount: cost,
            currency,
            service: offer.serviceName,
            timestamp: Date.now()
        };
        this.transactionLog.push(tx);
        if (this.transactionLog.length > 50) this.transactionLog.shift();

        this.notifySubscribers();
        return true;
    }

    private simulateRandomTrade() {
        const agents = Object.keys(this.wallets);
        const buyer = agents[Math.floor(Math.random() * agents.length)];
        const validOffers = this.marketplace.filter(o => o.providerId !== buyer);
        if (validOffers.length === 0) return;
        const offer = validOffers[Math.floor(Math.random() * validOffers.length)];
        this.executeTrade(buyer, offer);
    }

    // --- Accessors ---

    public getBalance(agentId: string, currency: OntoCoin): number {
        return this.wallets[agentId]?.[currency] || 0;
    }

    public getAllBalances(agentId: string): Wallet {
        return this.wallets[agentId] || {};
    }

    public getOffers() {
        return this.marketplace;
    }

    public getLog() {
        return this.transactionLog;
    }

    public subscribe(cb: (log: Transaction[]) => void) {
        this.subscribers.push(cb);
        return () => { this.subscribers = this.subscribers.filter(x => x !== cb); };
    }

    private notifySubscribers() {
        const log = [...this.transactionLog];
        this.subscribers.forEach(cb => cb(log));
    }
}

export const EconomyInstance = new EconomySystem();
