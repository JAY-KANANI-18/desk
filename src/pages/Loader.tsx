
// Progress ring
export function RingSpinner({ size = 44, color = "#4f46e5", strokeWidth = 2.5 }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center justify-center  h-screen">
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * 0.25}
        style={{
            transformOrigin: "center",
            animation: "ringSpin 1s linear infinite",
        }}
        />
      <style>{`@keyframes ringSpin { to { transform: rotate(360deg); } }`}</style>
    </svg>
        </div>
  );
}