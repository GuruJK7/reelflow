/** Mascota Nocturno — robot geométrico plano con visor cyan (versión Remotion). */
export const Nocturno: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 96 96" style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="48" y1="20" x2="48" y2="11" stroke="#22d3ee" strokeWidth="2.5" />
    <circle cx="48" cy="8" r="3.5" fill="#6366f1" />
    <rect x="22" y="20" width="52" height="40" rx="10" fill="#121826" stroke="#1f2937" strokeWidth="2" />
    <rect x="29" y="30" width="38" height="18" rx="7" fill="#22d3ee" />
    <circle cx="41" cy="39" r="3.2" fill="#0a0e17" />
    <circle cx="55" cy="39" r="3.2" fill="#0a0e17" />
    <rect x="29" y="63" width="38" height="22" rx="7" fill="#121826" stroke="#1f2937" strokeWidth="2" />
    <rect x="40" y="69" width="16" height="4" rx="2" fill="#22d3ee" />
  </svg>
);
