// One-off confetti shower for a won game. Pure DOM, no library: a fixed,
// click-through layer of colored pieces that fall once and then remove
// themselves. The fall itself is a CSS animation (see .confetti).

// Same colors as the rainbow the board turns into.
const COLORS = ['#ff5f6d', '#ffb347', '#f9f871', '#5cf29c', '#4fc3f7', '#9a7cf5', '#ff5fd2'];

export function launchConfetti(pieces = 80) {
  // Falling pieces are pure motion — skip them when the player asked for less.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  let longest = 0;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('span');
    const duration = 2.2 + Math.random() * 1.8;
    const delay = Math.random() * 0.8;
    longest = Math.max(longest, duration + delay);
    const size = 6 + Math.random() * 6;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 1.6}px`;
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.animationDuration = `${duration}s`;
    piece.style.animationDelay = `${delay}s`;
    // Sideways drift and spin, both random in direction.
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 30}vw`);
    const turns = (1 + Math.random() * 3) * (Math.random() < 0.5 ? -1 : 1);
    piece.style.setProperty('--spin', `${turns * 360}deg`);
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), (longest + 0.2) * 1000);
}
