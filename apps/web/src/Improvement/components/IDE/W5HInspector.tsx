
import { User, Target, MapPin, Clock, HelpCircle, Activity, Sparkles } from 'lucide-react';

export interface W5HProfile {
    who: { question: string; context: string };
    what: { question: string; context: string };
    where: { question: string; context: string };
    when: { question: string; context: string };
    why: { question: string; context: string };
    how: { question: string; context: string };
}

export interface OntologyNode {
    type: 'RELATIONSHIP' | 'FACTOR';
    axiom_root?: string;
    parent?: string;
    w5h: W5HProfile;
}

interface W5HInspectorProps {
    nodeKey: string;
    data: OntologyNode;
}

export default function W5HInspector({ nodeKey, data }: W5HInspectorProps) {
    if (!data || !data.w5h) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-neon-blue">
                <Sparkles className="w-8 h-8 mb-2" />
                <span className="text-xs tracking-widest uppercase">No Semantic Definition Found</span>
                <span className="text-[10px] opacity-70 mt-1">{nodeKey}</span>
            </div>
        );
    }

    const { w5h, type } = data;

    const cards = [
        { id: 'who', icon: User, label: 'WHO', color: 'text-rose-400', content: w5h.who },
        { id: 'what', icon: Target, label: 'WHAT', color: 'text-amber-400', content: w5h.what },
        { id: 'where', icon: MapPin, label: 'WHERE', color: 'text-emerald-400', content: w5h.where },
        { id: 'when', icon: Clock, label: 'WHEN', color: 'text-cyan-400', content: w5h.when },
        { id: 'why', icon: HelpCircle, label: 'WHY', color: 'text-purple-400', content: w5h.why },
        { id: 'how', icon: Activity, label: 'HOW', color: 'text-blue-400', content: w5h.how },
    ];

    return (
        <div className="h-full overflow-y-auto p-6 bg-black/90 text-white">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 border-b border-white/10 pb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                        <h1 className="text-xl font-bold text-white tracking-widest uppercase">{nodeKey}</h1>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${type === 'RELATIONSHIP' ? 'border-neon-pink/50 text-neon-pink' : 'border-neon-blue/50 text-neon-blue'}`}>
                            {type}
                        </span>
                    </div>
                    <p className="text-xs text-white/40 font-mono">
                        {data.axiom_root ? `AXIOM: ${data.axiom_root}` : `PARENT: ${data.parent}`}
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card) => (
                        <div key={card.id} className="glass-panel p-4 border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex items-center gap-2 mb-3">
                                <card.icon className={`w-4 h-4 ${card.color} opacity-80`} />
                                <span className={`text-xs font-bold tracking-widest ${card.color} opacity-60`}>{card.label}</span>
                            </div>

                            <div className="mb-2">
                                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">{card.content.question}</p>
                                <p className="text-sm text-gray-300 leading-relaxed font-light">
                                    {card.content.context || <span className="italic opacity-30">Undefined.</span>}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
