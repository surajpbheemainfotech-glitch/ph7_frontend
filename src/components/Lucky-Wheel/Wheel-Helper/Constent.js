export const SLICES = [
  { label: "₹10",    amount: 10,  color: "#FF7B2C", isLuck: false },
  { label: "₹50",    amount: 50,  color: "#9B59B6", isLuck: false },
  { label: "₹30",    amount: 30,  color: "#1ABC9C", isLuck: false },
  { label: "₹20",    amount: 20,  color: "#F39C12", isLuck: false },
  { label: "₹50",    amount: 50,  color: "#E74C3C", isLuck: false },
  { label: "Better\nLuck!", amount: 0, color: "#E91E8C", isLuck: true },
  { label: "₹50",    amount: 50,  color: "#F39C12", isLuck: false },
  { label: "₹100",   amount: 100, color: "#27AE60", isLuck: false },
  { label: "₹50",    amount: 50,  color: "#3498DB", isLuck: false },
  { label: "Better\nLuck!", amount: 0, color: "#F1C40F", isLuck: true },
];
 
export const TOTAL            = SLICES.length;
export const SLICE_DEG        = 360 / TOTAL;
export const BULB_COUNT       = 28;
export const SPIN_COST        = 10;
export const INITIAL_COINS    = 100;
export const API_URL          = "https://jsonplaceholder.typicode.com/posts";
export const COOLDOWN_SECONDS = 24 * 60 * 60;
 
export function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
 
export function wedge(cx, cy, r, s, e) {
  const p1 = polar(cx, cy, r, s);
  const p2 = polar(cx, cy, r, e);
  return `M${cx},${cy} L${p1.x},${p1.y} A${r},${r} 0 0 1 ${p2.x},${p2.y} Z`;
}