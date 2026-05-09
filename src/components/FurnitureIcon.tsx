interface Props {
  defId: string;
  name: string;
  color: string;
  size?: number;
}

// Top-down SVG icons for each preset furniture type
const ICONS: Record<string, (c: string) => React.ReactNode> = {
  'preset-single-bed': (c) => (
    <>
      <rect x="3" y="3" width="34" height="9" rx="1.5" fill={c} opacity="0.9" />
      <rect x="3" y="12" width="34" height="25" rx="1" fill={c} opacity="0.6" />
      <rect x="7" y="14" width="12" height="7" rx="1" fill={c} opacity="0.9" />
      <rect x="21" y="14" width="12" height="7" rx="1" fill={c} opacity="0.9" />
    </>
  ),
  'preset-double-bed': (c) => (
    <>
      <rect x="3" y="3" width="34" height="9" rx="1.5" fill={c} opacity="0.9" />
      <rect x="3" y="12" width="34" height="25" rx="1" fill={c} opacity="0.6" />
      <rect x="5" y="14" width="13" height="8" rx="1" fill={c} opacity="0.9" />
      <rect x="22" y="14" width="13" height="8" rx="1" fill={c} opacity="0.9" />
    </>
  ),
  'preset-sofa': (c) => (
    <>
      <rect x="3" y="3" width="34" height="8" rx="1.5" fill={c} opacity="0.9" />
      <rect x="3" y="3" width="7" height="34" rx="1.5" fill={c} opacity="0.9" />
      <rect x="30" y="3" width="7" height="34" rx="1.5" fill={c} opacity="0.9" />
      <rect x="10" y="11" width="20" height="26" rx="1" fill={c} opacity="0.65" />
    </>
  ),
  'preset-dining-table': (c) => (
    <>
      <rect x="4" y="8" width="32" height="24" rx="2" fill={c} opacity="0.7" />
      <rect x="6" y="4" width="5" height="6" rx="1" fill={c} opacity="0.5" />
      <rect x="29" y="4" width="5" height="6" rx="1" fill={c} opacity="0.5" />
      <rect x="6" y="30" width="5" height="6" rx="1" fill={c} opacity="0.5" />
      <rect x="29" y="30" width="5" height="6" rx="1" fill={c} opacity="0.5" />
    </>
  ),
  'preset-chair': (c) => (
    <>
      <rect x="5" y="5" width="30" height="6" rx="1.5" fill={c} opacity="0.9" />
      <rect x="5" y="11" width="30" height="24" rx="1" fill={c} opacity="0.65" />
      <rect x="5" y="33" width="8" height="4" rx="1" fill={c} opacity="0.5" />
      <rect x="27" y="33" width="8" height="4" rx="1" fill={c} opacity="0.5" />
    </>
  ),
  'preset-desk': (c) => (
    <>
      <rect x="3" y="5" width="34" height="30" rx="1.5" fill={c} opacity="0.65" />
      <rect x="3" y="5" width="34" height="5" rx="1.5" fill={c} opacity="0.9" />
      <rect x="3" y="30" width="6" height="8" rx="1" fill={c} opacity="0.5" />
      <rect x="31" y="30" width="6" height="8" rx="1" fill={c} opacity="0.5" />
    </>
  ),
  'preset-wardrobe': (c) => (
    <>
      <rect x="3" y="3" width="34" height="34" rx="1.5" fill={c} opacity="0.65" />
      <line x1="20" y1="3" x2="20" y2="37" stroke="#1B1A17" strokeWidth="1.5" />
      <circle cx="17" cy="20" r="1.5" fill="#1B1A17" opacity="0.7" />
      <circle cx="23" cy="20" r="1.5" fill="#1B1A17" opacity="0.7" />
    </>
  ),
  'preset-tv-stand': (c) => (
    <>
      <rect x="2" y="8" width="36" height="24" rx="1.5" fill={c} opacity="0.7" />
      <line x1="2" y1="18" x2="38" y2="18" stroke="#1B1A17" strokeWidth="1" opacity="0.5" />
      <rect x="15" y="10" width="10" height="5" rx="0.5" fill="#1B1A17" opacity="0.3" />
    </>
  ),
  'preset-fridge': (c) => (
    <>
      <rect x="5" y="3" width="30" height="34" rx="2" fill={c} opacity="0.65" />
      <rect x="5" y="3" width="30" height="12" rx="2" fill={c} opacity="0.9" />
      <line x1="5" y1="15" x2="35" y2="15" stroke="#1B1A17" strokeWidth="1.5" />
      <rect x="31" y="7" width="2" height="4" rx="0.5" fill="#1B1A17" opacity="0.5" />
      <rect x="31" y="21" width="2" height="7" rx="0.5" fill="#1B1A17" opacity="0.5" />
    </>
  ),
  'preset-washer': (c) => (
    <>
      <rect x="3" y="3" width="34" height="34" rx="2" fill={c} opacity="0.65" />
      <circle cx="20" cy="22" r="10" fill="none" stroke="#1B1A17" strokeWidth="1.5" opacity="0.6" />
      <circle cx="20" cy="22" r="5" fill="#1B1A17" opacity="0.2" />
      <rect x="6" y="6" width="6" height="4" rx="0.5" fill="#1B1A17" opacity="0.4" />
    </>
  ),
};

export const FurnitureIcon = ({ defId, name, color, size = 40 }: Props) => {
  const iconFn = ICONS[defId];
  const fallbackLetter = name[0] ?? '?';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {iconFn ? (
        iconFn(color)
      ) : (
        <>
          <rect x="4" y="4" width="32" height="32" rx="2" fill={color} opacity="0.7" />
          <text x="20" y="25" textAnchor="middle" fontSize="16" fontWeight="600" fill="#1B1A17">
            {fallbackLetter}
          </text>
        </>
      )}
    </svg>
  );
};
