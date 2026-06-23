import { useStore } from '../store/useStore';

interface Props {
  onUndo: () => void;
  onDownload: () => void;
  canUndo: boolean;
  onMenuToggle: () => void;
  menuOpen: boolean;
  isMobile: boolean;
}

export const Header = ({ onUndo, onDownload, canUndo, onMenuToggle, menuOpen, isMobile }: Props) => {
  const { unit, toggleUnit } = useStore();

  return (
    <header style={{
      background: '#1F1E1B',
      borderBottom: '1px solid #35342F',
      padding: '0 16px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            aria-label="メニュー"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: menuOpen ? '#C8A458' : '#9A8760',
              padding: '4px 6px', borderRadius: 6,
              display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
              transition: 'color 0.15s',
            }}
          >
            {/* Three-bar icon */}
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                display: 'block', width: 18, height: 1.5,
                background: 'currentColor', borderRadius: 2,
                transition: 'transform 0.2s, opacity 0.2s',
                ...(menuOpen && i === 0 ? { transform: 'translateY(5.5px) rotate(45deg)' } : {}),
                ...(menuOpen && i === 1 ? { opacity: 0 } : {}),
                ...(menuOpen && i === 2 ? { transform: 'translateY(-5.5px) rotate(-45deg)' } : {}),
              }} />
            ))}
          </button>
        )}

        {/* Logo mark + title */}
        <span style={{
          display: 'inline-block', width: 3, height: 20,
          background: 'linear-gradient(180deg, #C8A458 0%, #A8843A 100%)',
          borderRadius: 2, flexShrink: 0,
        }} />
        <h1 style={{
          fontSize: isMobile ? 15 : 17,
          fontWeight: 500,
          fontFamily: "'Cormorant Garamond', 'Noto Serif JP', Georgia, serif",
          letterSpacing: '0.06em',
          color: '#E0D9CA',
          margin: 0,
          whiteSpace: 'nowrap',
        }}>
          Interior Planner
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
        {/* Unit toggle */}
        <button
          onClick={toggleUnit}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#272520', border: '1px solid #35342F',
            borderRadius: 8, padding: '5px 10px',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            color: '#7A7468',
          }}
        >
          <span style={{ color: unit === 'cm' ? '#C8A458' : '#4A4840', fontWeight: unit === 'cm' ? 700 : 400 }}>cm</span>
          <span style={{ color: '#4A4840', margin: '0 1px' }}>|</span>
          <span style={{ color: unit === 'm' ? '#C8A458' : '#4A4840', fontWeight: unit === 'm' ? 700 : 400 }}>m</span>
        </button>

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="元に戻す"
          style={{
            display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 6,
            background: '#272520', border: '1px solid #35342F',
            borderRadius: 8, padding: isMobile ? '5px 10px' : '5px 14px',
            fontSize: 12, fontWeight: 500, cursor: canUndo ? 'pointer' : 'not-allowed',
            color: canUndo ? '#E0D9CA' : '#4A4840',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => canUndo && ((e.currentTarget as HTMLButtonElement).style.background = '#2E2C28')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#272520')}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 8C3 5.24 5.24 3 8 3c2.21 0 4.1 1.34 4.9 3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M3 4.5V8H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isMobile && <span>Undo</span>}
        </button>

        {/* Download */}
        <button
          onClick={onDownload}
          aria-label="ダウンロード"
          style={{
            display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 6,
            background: '#C8A458', border: 'none',
            borderRadius: 8, padding: isMobile ? '5px 10px' : '5px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            color: '#1B1A17',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#D4B068')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#C8A458')}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {!isMobile && <span>Download</span>}
        </button>
      </div>
    </header>
  );
};
