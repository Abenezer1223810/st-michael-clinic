export function StethoscopePattern({ stroke = 'white', opacity = 0.1, id = 'stethoscope-pattern' }) {
  return (
    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      <pattern id={id} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <g
          fill="none"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(22 23) scale(2.67)"
        >
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <path d="M8 15v1a6 6 0 0 0 6 6a6 6 0 0 0 6-6v-4" />
          <path d="M20 11a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2Z" />
        </g>
      </pattern>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
