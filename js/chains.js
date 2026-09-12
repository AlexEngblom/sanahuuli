// Fetching chain data. Paths are relative to the site root so they work
// both locally (npx serve) and on GitHub Pages.

export async function fetchManifest() {
  const response = await fetch('data/chains/manifest.json');
  if (!response.ok) {
    throw new Error(`Failed to load chain manifest (${response.status})`);
  }
  return response.json();
}

export async function fetchChain(id) {
  const response = await fetch(`data/chains/${encodeURIComponent(id)}.json`);
  if (!response.ok) {
    throw new Error(`Chain not found: ${id}`);
  }
  return response.json();
}
