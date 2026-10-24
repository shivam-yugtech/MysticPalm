/** Palm geometry shared by the camera guide, the sample hero and the report overlay. */
export const PALM_LINES = {
  life: 'M78 150 C66 176 68 206 86 228',
  head: 'M140 168 C120 178 96 180 72 174',
  heart: 'M142 146 C120 140 96 146 78 158',
  fate: 'M108 232 C110 204 106 180 112 158',
} as const;

export const LINE_COLORS: Record<keyof typeof PALM_LINES, string> = {
  life: '#f2c14e',
  head: '#8ab6ff',
  heart: '#f48ca6',
  fate: '#5ce0b3',
};

export function HandGuide({ lined = false, className = '' }: { lined?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 280"
      className={`hand ${className}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="hand__outline" strokeLinejoin="round" strokeLinecap="round">
        <rect x="56" y="110" width="96" height="128" rx="40" />
        <rect x="61" y="74" width="22" height="64" rx="11" />
        <rect x="86" y="56" width="23" height="82" rx="11.5" />
        <rect x="112" y="68" width="22" height="70" rx="11" />
        <rect x="137" y="90" width="20" height="48" rx="10" />
        <rect x="20" y="146" width="27" height="70" rx="13.5" transform="rotate(-30 33.5 181)" />
        <path d="M78 238v22M100 238v26M122 238v26" opacity=".55" />
        <path d="M74 138c8 5 16 7 26 7M116 132c6 2 11 4 16 8" opacity=".35" />
      </g>

      {lined && (
        <g className="hand__lines" strokeLinecap="round">
          {(Object.keys(PALM_LINES) as (keyof typeof PALM_LINES)[]).map((id) => (
            <path
              key={id}
              d={PALM_LINES[id]}
              className={`hand__line hand__line--${id}`}
              stroke={LINE_COLORS[id]}
              strokeWidth="2.2"
            />
          ))}
        </g>
      )}
    </svg>
  );
}
