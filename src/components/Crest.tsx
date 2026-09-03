export default function Crest({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="crestGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8d4a0" />
          <stop offset="50%" stopColor="#c9a961" />
          <stop offset="100%" stopColor="#8f7538" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="47" stroke="url(#crestGold)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="41" stroke="url(#crestGold)" strokeWidth="0.75" strokeDasharray="2 3" />
      <path
        d="M50 16 L74 26 V50 C74 66 62 78 50 84 C38 78 26 66 26 50 V26 Z"
        stroke="url(#crestGold)"
        strokeWidth="1.5"
        fill="rgba(201,169,97,0.08)"
      />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="40"
        fontWeight="600"
        fill="url(#crestGold)"
      >
        A
      </text>
      <path d="M36 70 Q50 76 64 70" stroke="url(#crestGold)" strokeWidth="1" />
      <circle cx="50" cy="10" r="1.5" fill="#c9a961" />
      <circle cx="50" cy="90" r="1.5" fill="#c9a961" />
      <circle cx="10" cy="50" r="1.5" fill="#c9a961" />
      <circle cx="90" cy="50" r="1.5" fill="#c9a961" />
    </svg>
  );
}
