/** The app's sunflower mark — same drawing as the tab icon. */
export function Sunflower({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const outer = Array.from({ length: 12 }, (_, i) => i * 30);
  const inner = Array.from({ length: 12 }, (_, i) => i * 30 + 15);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
    >
      <g transform="translate(32 32)">
        <g fill="#F2B61E">
          {outer.map((r) => (
            <ellipse key={r} rx="6.5" ry="15" cy="-16" transform={`rotate(${r})`} />
          ))}
        </g>
        <g fill="#FFD04A">
          {inner.map((r) => (
            <ellipse key={r} rx="5" ry="12" cy="-13" transform={`rotate(${r})`} />
          ))}
        </g>
        <circle r="13.5" fill="#5B3A1A" />
        <circle r="10.5" fill="#7A4E22" />
        <circle r="7" fill="#5B3A1A" />
        <circle r="2.2" cx="-4" cy="-2" fill="#8E6030" />
        <circle r="2.2" cx="4" cy="-3" fill="#8E6030" />
        <circle r="2.2" cx="0" cy="4.5" fill="#8E6030" />
      </g>
    </svg>
  );
}
