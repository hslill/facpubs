import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_TOKEN = process.env.FACBIB_API_TOKEN;
  if (!API_TOKEN) return res.status(500).json({ error: 'API token not set' });

  const { type, kid } = req.query;

  if (type !== 'author' || !kid) {
    return res.status(400).json({ error: 'Invalid type or missing KID' });
  }

  const apiUrl = `https://facbib.nyumc.org/api/v2/authors/${encodeURIComponent(kid)}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-token': API_TOKEN
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
