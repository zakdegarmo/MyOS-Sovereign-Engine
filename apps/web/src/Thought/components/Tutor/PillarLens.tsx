import React from 'react';
import { PILLARS } from './constants';
import { PillarId } from './types';

const PillarLens: React.FC = () => {
  return (
    <div className="flex justify-center gap-3 p-2 flex-wrap">
      {Object.values(PILLARS).map((pillar) => (
        <div key={pillar.id} className="group relative cursor-help">
          <div className={`text-2xl opacity-40 hover:opacity-100 transition-all hover:scale-110 ${pillar.color}`}>
            {pillar.symbol}
          </div>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs hidden group-hover:block z-50 pointer-events-none">
            <strong className={`block mb-1 ${pillar.color}`}>{pillar.name}</strong>
            <p className="text-slate-300">{pillar.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PillarLens;
