import React from 'react';

interface Props {
  defId: string;
  name: string;
  color: string;
  size?: number;
}

// Each renderer receives actual rendering dimensions (w, h) so shapes are always proportionally correct
export const ICON_RENDERERS: Record<string, (c: string, w: number, h: number) => React.ReactNode> = {
  'preset-single-bed': (c, w, h) => {
    const headH = Math.min(h * 0.2, 18);
    const footH = Math.min(h * 0.07, 6);
    const pillowW = w * 0.58;
    const pillowH = Math.min((h - headH - footH) * 0.32, 14);
    const pillowX = (w - pillowW) / 2;
    const pillowY = headH + (h - headH - footH) * 0.09;
    return (
      <>
        <rect x={0} y={0} width={w} height={h} rx={4} fill={c} opacity={0.6}/>
        <rect x={0} y={0} width={w} height={headH} rx={4} fill={c}/>
        <rect x={0} y={headH - 1.5} width={w} height={3} fill="rgba(0,0,0,0.13)"/>
        <rect x={0} y={h - footH} width={w} height={footH} rx={2} fill={c} opacity={0.85}/>
        <rect x={pillowX} y={pillowY} width={pillowW} height={pillowH} rx={3}
          fill="rgba(255,255,255,0.32)" stroke="rgba(0,0,0,0.07)" strokeWidth={0.5}/>
        <line x1={6} y1={pillowY + pillowH + 6} x2={w - 6} y2={pillowY + pillowH + 6}
          stroke="rgba(0,0,0,0.09)" strokeWidth={1.5}/>
      </>
    );
  },

  'preset-double-bed': (c, w, h) => {
    const headH = Math.min(h * 0.2, 18);
    const footH = Math.min(h * 0.07, 6);
    const gap = Math.max(w * 0.04, 4);
    const pillowW = (w - gap * 3) / 2;
    const pillowH = Math.min((h - headH - footH) * 0.32, 14);
    const pillowY = headH + (h - headH - footH) * 0.09;
    return (
      <>
        <rect x={0} y={0} width={w} height={h} rx={4} fill={c} opacity={0.6}/>
        <rect x={0} y={0} width={w} height={headH} rx={4} fill={c}/>
        <rect x={0} y={headH - 1.5} width={w} height={3} fill="rgba(0,0,0,0.13)"/>
        <rect x={0} y={h - footH} width={w} height={footH} rx={2} fill={c} opacity={0.85}/>
        <rect x={gap} y={pillowY} width={pillowW} height={pillowH} rx={3}
          fill="rgba(255,255,255,0.32)" stroke="rgba(0,0,0,0.07)" strokeWidth={0.5}/>
        <rect x={gap * 2 + pillowW} y={pillowY} width={pillowW} height={pillowH} rx={3}
          fill="rgba(255,255,255,0.32)" stroke="rgba(0,0,0,0.07)" strokeWidth={0.5}/>
        <line x1={6} y1={pillowY + pillowH + 6} x2={w - 6} y2={pillowY + pillowH + 6}
          stroke="rgba(0,0,0,0.09)" strokeWidth={1.5}/>
      </>
    );
  },

  'preset-sofa': (c, w, h) => {
    const armW = Math.min(w * 0.13, 20);
    const backH = Math.min(h * 0.3, 22);
    const r = 5;
    const seatW = w - armW * 2;
    const seatH = h - backH;
    const cushions = seatW > 100 ? 3 : seatW > 55 ? 2 : 1;
    const cushionW = seatW / cushions;
    return (
      <>
        <rect x={armW} y={backH} width={seatW} height={seatH} rx={r * 0.6} fill={c} opacity={0.6}/>
        <rect x={0} y={0} width={w} height={backH + r} rx={r} fill={c}/>
        <rect x={2} y={3} width={w - 4} height={backH - 3} rx={r - 1} fill="rgba(255,255,255,0.06)"/>
        <rect x={0} y={backH} width={armW} height={seatH} rx={r} fill={c} opacity={0.9}/>
        <rect x={w - armW} y={backH} width={armW} height={seatH} rx={r} fill={c} opacity={0.9}/>
        {Array.from({ length: cushions - 1 }, (_, i) => (
          <line key={i}
            x1={armW + cushionW * (i + 1)} y1={backH + 5}
            x2={armW + cushionW * (i + 1)} y2={h - 5}
            stroke="rgba(0,0,0,0.2)" strokeWidth={1}/>
        ))}
        <rect x={armW + 3} y={backH + 3} width={seatW - 6} height={Math.min(seatH * 0.25, 8)} rx={2}
          fill="rgba(255,255,255,0.07)"/>
      </>
    );
  },

  'preset-dining-table': (c, w, h) => {
    const leg = Math.min(Math.min(w, h) * 0.1, 8);
    const r = 4;
    return (
      <>
        <rect x={leg / 2} y={leg / 2} width={w - leg} height={h - leg} rx={r} fill={c} opacity={0.75}/>
        <rect x={leg / 2 + 3} y={leg / 2 + 3} width={w - leg - 6} height={h - leg - 6} rx={r - 1}
          fill="rgba(255,255,255,0.07)"/>
        <rect x={0} y={0} width={leg} height={leg} rx={2} fill={c}/>
        <rect x={w - leg} y={0} width={leg} height={leg} rx={2} fill={c}/>
        <rect x={0} y={h - leg} width={leg} height={leg} rx={2} fill={c}/>
        <rect x={w - leg} y={h - leg} width={leg} height={leg} rx={2} fill={c}/>
      </>
    );
  },

  'preset-chair': (c, w, h) => {
    const backH = Math.min(h * 0.22, 14);
    const leg = Math.min(Math.min(w, h) * 0.13, 8);
    const seatY = backH + leg * 0.4;
    const seatH = h - seatY - leg * 0.5;
    return (
      <>
        <rect x={leg * 0.5} y={seatY} width={w - leg} height={seatH} rx={3} fill={c} opacity={0.72}/>
        <rect x={leg * 0.4} y={0} width={w - leg * 0.8} height={backH + 4} rx={3} fill={c}/>
        <rect x={leg * 0.5} y={h - leg} width={leg} height={leg} rx={1} fill={c} opacity={0.6}/>
        <rect x={w - leg * 1.5} y={h - leg} width={leg} height={leg} rx={1} fill={c} opacity={0.6}/>
        <rect x={leg * 0.5 + 2} y={seatY + 2} width={w - leg - 4} height={Math.min(seatH * 0.25, 6)} rx={2}
          fill="rgba(255,255,255,0.08)"/>
      </>
    );
  },

  'preset-desk': (c, w, h) => {
    const backD = Math.min(h * 0.14, 10);
    const leg = Math.min(w * 0.06, 6);
    return (
      <>
        <rect x={0} y={0} width={w} height={h} rx={3} fill={c} opacity={0.68}/>
        <rect x={0} y={0} width={w} height={backD} rx={3} fill={c}/>
        <rect x={2} y={backD} width={w - 4} height={2} fill="rgba(0,0,0,0.15)"/>
        <rect x={3} y={backD + 4} width={w - 6} height={Math.min((h - backD) * 0.18, 8)} rx={2}
          fill="rgba(255,255,255,0.07)"/>
        <rect x={leg} y={h - leg * 1.3} width={leg} height={leg * 1.3} rx={1} fill="rgba(0,0,0,0.18)"/>
        <rect x={w - leg * 2} y={h - leg * 1.3} width={leg} height={leg * 1.3} rx={1} fill="rgba(0,0,0,0.18)"/>
      </>
    );
  },

  'preset-wardrobe': (c, w, h) => {
    const r = 3;
    const mid = w / 2;
    const handleH = Math.min(h * 0.14, 14);
    const handleW = Math.min(w * 0.04, 3.5);
    const handleY = (h - handleH) / 2;
    return (
      <>
        <rect x={0} y={0} width={w} height={h} rx={r} fill={c} opacity={0.75}/>
        <rect x={2} y={2} width={w - 4} height={Math.min(h * 0.04, 4)} rx={r - 1} fill="rgba(0,0,0,0.1)"/>
        <line x1={mid} y1={3} x2={mid} y2={h - 3} stroke="rgba(0,0,0,0.22)" strokeWidth={1.5}/>
        <rect x={mid - handleW * 3.5} y={handleY} width={handleW} height={handleH} rx={handleW / 2}
          fill="rgba(0,0,0,0.28)"/>
        <rect x={mid + handleW * 2.5} y={handleY} width={handleW} height={handleH} rx={handleW / 2}
          fill="rgba(0,0,0,0.28)"/>
        <rect x={2} y={h - Math.min(h * 0.05, 5)} width={w - 4} height={Math.min(h * 0.05, 5)} rx={1}
          fill="rgba(0,0,0,0.1)"/>
      </>
    );
  },

  'preset-tv-stand': (c, w, h) => {
    const shelfY = h * 0.48;
    const legW = w * 0.22;
    const legH = Math.min(h * 0.18, 6);
    return (
      <>
        <rect x={0} y={0} width={w} height={shelfY - 1} rx={3} fill={c} opacity={0.9}/>
        <rect x={0} y={shelfY} width={w} height={h - shelfY} rx={3} fill={c} opacity={0.72}/>
        <rect x={2} y={shelfY - 1} width={w - 4} height={2} fill="rgba(0,0,0,0.22)"/>
        <rect x={3} y={3} width={w - 6} height={Math.min(shelfY * 0.3, 6)} rx={2}
          fill="rgba(255,255,255,0.06)"/>
        <rect x={w * 0.08} y={h - legH} width={legW} height={legH} rx={2} fill="rgba(0,0,0,0.22)"/>
        <rect x={w * 0.7} y={h - legH} width={legW} height={legH} rx={2} fill="rgba(0,0,0,0.22)"/>
      </>
    );
  },

  'preset-fridge': (c, w, h) => {
    const freezerH = Math.min(h * 0.3, 32);
    const handleW = Math.min(w * 0.07, 5);
    const handleHSmall = Math.min(freezerH * 0.45, 12);
    const handleHBig = Math.min((h - freezerH) * 0.4, 22);
    const handleX = w * 0.78;
    return (
      <>
        <rect x={0} y={0} width={w} height={h} rx={3} fill={c} opacity={0.72}/>
        <rect x={0} y={0} width={w} height={freezerH} rx={3} fill={c}/>
        <rect x={2} y={freezerH} width={w - 4} height={2} fill="rgba(0,0,0,0.2)"/>
        <rect x={handleX} y={(freezerH - handleHSmall) / 2} width={handleW} height={handleHSmall}
          rx={handleW / 2} fill="rgba(0,0,0,0.28)"/>
        <rect x={handleX} y={freezerH + (h - freezerH - handleHBig) / 2} width={handleW} height={handleHBig}
          rx={handleW / 2} fill="rgba(0,0,0,0.22)"/>
        <rect x={3} y={freezerH + 8} width={w - 6} height={Math.min((h - freezerH) * 0.15, 10)} rx={2}
          fill="rgba(255,255,255,0.07)"/>
      </>
    );
  },

  'preset-washer': (c, w, h) => {
    const panelH = Math.min(h * 0.22, 16);
    const drumR = Math.min(w, h - panelH) * 0.37;
    const cx = w / 2;
    const cy = panelH + (h - panelH) / 2;
    return (
      <>
        <rect x={0} y={0} width={w} height={h} rx={3} fill={c} opacity={0.75}/>
        <rect x={0} y={0} width={w} height={panelH} rx={3} fill={c}/>
        <rect x={2} y={panelH} width={w - 4} height={2} fill="rgba(0,0,0,0.18)"/>
        <circle cx={w * 0.25} cy={panelH / 2} r={Math.min(panelH * 0.22, 3)} fill="rgba(0,0,0,0.3)"/>
        <circle cx={w * 0.45} cy={panelH / 2} r={Math.min(panelH * 0.22, 3)} fill="rgba(0,0,0,0.3)"/>
        <circle cx={cx} cy={cy} r={drumR} fill="rgba(0,0,0,0.1)" stroke="rgba(0,0,0,0.2)" strokeWidth={1.5}/>
        <circle cx={cx} cy={cy} r={drumR * 0.56}
          fill="rgba(255,255,255,0.06)" stroke="rgba(0,0,0,0.14)" strokeWidth={1}/>
        <circle cx={cx - drumR * 0.18} cy={cy - drumR * 0.18} r={drumR * 0.2} fill="rgba(255,255,255,0.13)"/>
      </>
    );
  },
};

export const FurnitureIcon = ({ defId, name, color, size = 40 }: Props) => {
  const iconFn = ICON_RENDERERS[defId];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, borderRadius: 4 }}
    >
      {iconFn ? (
        iconFn(color, size, size)
      ) : (
        <>
          <rect x={0} y={0} width={size} height={size} rx={4} fill={color} opacity={0.75}/>
          <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size * 0.42}
            fontWeight="500" fill="rgba(0,0,0,0.4)">
            {name[0] ?? '?'}
          </text>
        </>
      )}
    </svg>
  );
};
