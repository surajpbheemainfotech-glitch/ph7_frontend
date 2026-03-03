 export default function Confetti({ pieces }) {
  return (
<>
      {pieces.map(c => (
<div
          key={c.id}
          className="fixed top-0 pointer-events-none z-50 rounded-sm"
          style={{
            left: `${c.x}%`,
            width: c.w,
            height: c.h,
            background: c.color,
            animation: `fall ${c.duration}s ease-in ${c.delay}s forwards`,
            transform: `rotate(${c.rotate}deg)`,
          }}
        />
      ))}
</>
  );
}