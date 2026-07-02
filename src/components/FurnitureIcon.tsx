import React from 'react';

interface Props {
  iconType: string;
  name: string;
  color: string;
  width: number;  // cm (used for proportional rendering)
  height: number; // cm
}

export const FurnitureIcon: React.FC<Props> = ({ iconType, color, width: w, height: h }) => {
  switch (iconType) {
    case 'single_bed':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={4} fill={color} stroke="rgba(255,255,255,0.25)" strokeWidth={1}/>
          <rect x={3} y={3} width={w-6} height={12} rx={1} fill="rgba(0,0,0,0.15)"/>
          <rect x={3} y={15} width={w-6} height={h-18} rx={2} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={1}/>
          <rect x={w/2-20} y={18} width={40} height={18} rx={3} fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.08)" strokeWidth={1}/>
          <line x1={w/2-15} y1={27} x2={w/2+15} y2={27} stroke="rgba(0,0,0,0.12)" strokeWidth={0.8}/>
          <path d={`M 3 ${h*0.45} L ${w-3} ${h*0.45} M 3 ${h*0.45+4} L ${w-3} ${h*0.45+4}`} stroke="rgba(0,0,0,0.15)" strokeWidth={1} fill="none"/>
          <rect x={4} y={h-6} width={w-8} height={3} rx={0.5} fill="rgba(0,0,0,0.2)"/>
        </svg>
      );

    case 'double_bed':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={4} fill={color} stroke="rgba(255,255,255,0.25)" strokeWidth={1}/>
          <rect x={3} y={3} width={w-6} height={12} rx={1} fill="rgba(0,0,0,0.15)"/>
          <rect x={3} y={15} width={w-6} height={h-18} rx={2} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={1}/>
          <rect x={w*0.15} y={18} width={w*0.3} height={18} rx={3} fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.08)" strokeWidth={1}/>
          <rect x={w*0.55} y={18} width={w*0.3} height={18} rx={3} fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.08)" strokeWidth={1}/>
          <path d={`M 3 ${h*0.4} L ${w-3} ${h*0.4} M 3 ${h*0.4+4} L ${w-3} ${h*0.4+4}`} stroke="rgba(0,0,0,0.15)" strokeWidth={1} fill="none"/>
          <rect x={4} y={h-6} width={w-8} height={3} rx={0.5} fill="rgba(0,0,0,0.2)"/>
        </svg>
      );

    case 'sofa': {
      const armW = Math.min(16, w*0.1);
      const backD = Math.min(14, h*0.25);
      const innerW = w - armW*2;
      const numC = w > 140 ? 3 : w > 90 ? 2 : 1;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={4} fill={color} stroke="rgba(255,255,255,0.25)" strokeWidth={1}/>
          <rect x={1} y={1} width={w-2} height={backD} rx={2} fill="rgba(0,0,0,0.2)"/>
          <rect x={1} y={backD} width={armW} height={h-backD-1} rx={1} fill="rgba(0,0,0,0.12)"/>
          <rect x={w-armW-1} y={backD} width={armW} height={h-backD-1} rx={1} fill="rgba(0,0,0,0.12)"/>
          {numC > 1 && Array.from({length: numC-1}).map((_, i) => (
            <line key={i} x1={armW+((i+1)*innerW)/numC} y1={backD} x2={armW+((i+1)*innerW)/numC} y2={h-4} stroke="rgba(0,0,0,0.15)" strokeWidth={1}/>
          ))}
          <line x1={armW} y1={h-6} x2={w-armW} y2={h-6} stroke="rgba(0,0,0,0.08)" strokeDasharray="3 2"/>
        </svg>
      );
    }

    case 'dining_table':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={6} y={6} width={8} height={8} rx={1} fill="rgba(0,0,0,0.3)"/>
          <rect x={w-14} y={6} width={8} height={8} rx={1} fill="rgba(0,0,0,0.3)"/>
          <rect x={6} y={h-14} width={8} height={8} rx={1} fill="rgba(0,0,0,0.3)"/>
          <rect x={w-14} y={h-14} width={8} height={8} rx={1} fill="rgba(0,0,0,0.3)"/>
          <rect x={1} y={1} width={w-2} height={h-2} rx={3} fill={color} stroke="rgba(255,255,255,0.3)" strokeWidth={1}/>
          <line x1={4} y1={h/2} x2={w-4} y2={h/2} stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>
          <rect x={3} y={3} width={w-6} height={h-6} rx={2} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1}/>
        </svg>
      );

    case 'chair':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <circle cx={4} cy={4} r={3} fill="rgba(0,0,0,0.25)"/>
          <circle cx={w-4} cy={4} r={3} fill="rgba(0,0,0,0.25)"/>
          <circle cx={4} cy={h-4} r={3} fill="rgba(0,0,0,0.25)"/>
          <circle cx={w-4} cy={h-4} r={3} fill="rgba(0,0,0,0.25)"/>
          <rect x={2} y={5} width={w-4} height={h-8} rx={10} fill={color} stroke="rgba(255,255,255,0.25)" strokeWidth={1}/>
          <path d={`M 2 ${h*0.2} Q ${w/2} 1 ${w-2} ${h*0.2}`} stroke="rgba(0,0,0,0.25)" strokeWidth={4} fill="none" strokeLinecap="round"/>
        </svg>
      );

    case 'desk':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={2} fill={color} stroke="rgba(255,255,255,0.25)" strokeWidth={1}/>
          <line x1={3} y1={4} x2={w-3} y2={4} stroke="rgba(0,0,0,0.2)" strokeWidth={1.5}/>
          <path d={`M ${w*0.3} ${h*0.45} Q ${w/2} ${h*0.55} ${w*0.7} ${h*0.45}`} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1.5}/>
          <line x1={w-32} y1={4} x2={w-32} y2={h-2} stroke="rgba(0,0,0,0.15)" strokeDasharray="2 2"/>
          <rect x={2} y={2} width={5} height={5} fill="rgba(0,0,0,0.1)"/>
          <rect x={w-7} y={2} width={5} height={5} fill="rgba(0,0,0,0.1)"/>
        </svg>
      );

    case 'wardrobe':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={1} fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth={1}/>
          <rect x={3} y={3} width={w-6} height={h-6} fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.15)" strokeWidth={0.8}/>
          <line x1={w/2} y1={3} x2={w/2} y2={h-3} stroke="rgba(0,0,0,0.25)" strokeWidth={1}/>
          <rect x={w/2-4} y={h/2-12} width={2} height={24} rx={0.5} fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.15)" strokeWidth={0.5}/>
          <rect x={w/2+2} y={h/2-12} width={2} height={24} rx={0.5} fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.15)" strokeWidth={0.5}/>
          <line x1={10} y1={h/2} x2={w-10} y2={h/2} stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3"/>
        </svg>
      );

    case 'tv_stand':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={1.5} fill={color} stroke="rgba(255,255,255,0.25)" strokeWidth={1}/>
          <rect x={4} y={4} width={w-8} height={h-8} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1}/>
          <line x1={w*0.3} y1={4} x2={w*0.3} y2={h-4} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8}/>
          <line x1={w*0.7} y1={4} x2={w*0.7} y2={h-4} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8}/>
          <rect x={w/2-20} y={h/2-6} width={40} height={12} rx={1} fill="rgba(0,0,0,0.5)"/>
          <rect x={w/2-w*0.32} y={h/2-2} width={w*0.64} height={4} rx={0.5} fill="rgba(0,0,0,0.85)" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5}/>
        </svg>
      );

    case 'refrigerator':
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={2} fill={color} stroke="rgba(255,255,255,0.3)" strokeWidth={1.2}/>
          <rect x={3} y={2} width={w-6} height={4} fill="rgba(0,0,0,0.2)"/>
          <path d={`M 1 ${h-4} L ${w-1} ${h-4}`} stroke="rgba(0,0,0,0.15)" strokeWidth={1} fill="none"/>
          <line x1={w/2} y1={4} x2={w/2} y2={h-4} stroke="rgba(0,0,0,0.1)" strokeWidth={1}/>
          <rect x={w/2-4} y={h-3} width={2} height={2} fill="rgba(255,255,255,0.8)" stroke="rgba(0,0,0,0.2)" strokeWidth={0.5}/>
          <rect x={w/2+2} y={h-3} width={2} height={2} fill="rgba(255,255,255,0.8)" stroke="rgba(0,0,0,0.2)" strokeWidth={0.5}/>
          <rect x={5} y={10} width={w-10} height={h-20} rx={1} fill="rgba(255,255,255,0.06)"/>
        </svg>
      );

    case 'washing_machine': {
      const r1 = Math.min(w, h) * 0.3;
      const r2 = Math.min(w, h) * 0.22;
      const r3 = Math.min(w, h) * 0.15;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={3} fill={color} stroke="rgba(255,255,255,0.25)" strokeWidth={1.2}/>
          <rect x={3} y={3} width={w-6} height={12} rx={0.5} fill="rgba(0,0,0,0.12)"/>
          <circle cx={9} cy={9} r={2} fill="rgba(255,255,255,0.8)"/>
          <rect x={15} y={7} width={12} height={3} rx={0.5} fill="rgba(255,255,255,0.5)"/>
          <circle cx={w/2} cy={h/2+4} r={r1} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={2.5}/>
          <circle cx={w/2} cy={h/2+4} r={r2} fill="rgba(255,255,255,0.15)" stroke="rgba(0,0,0,0.1)" strokeWidth={1}/>
          <path d={`M ${w/2-r3} ${h/2} A ${r3} ${r3} 0 0 1 ${w/2+r3} ${h/2+8}`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} strokeLinecap="round"/>
        </svg>
      );
    }

    default:
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
          <rect x={1} y={1} width={w-2} height={h-2} rx={4} fill={color} fillOpacity={0.8} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5}/>
          <line x1={3} y1={3} x2={w-3} y2={h-3} stroke="rgba(0,0,0,0.06)" strokeWidth={1}/>
          <line x1={w-3} y1={3} x2={3} y2={h-3} stroke="rgba(0,0,0,0.06)" strokeWidth={1}/>
          <rect x={3} y={3} width={w-6} height={h-6} rx={2} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={1}/>
        </svg>
      );
  }
};
