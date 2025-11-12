import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, kid } = req.query;

  // Only support 'author' type with a valid KID
  if (type !== 'author' || !kid) {
    return res.status(400).json({ error: 'Invalid type or missing KID' });
  }

  // Original internal API endpoint
  const apiUrl = `https://library.med.nyu.edu/api/authors?kid=${encodeURIComponent(kid)}&format=json`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
