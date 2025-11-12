import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Allow all origins (or restrict to your dev domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, kid } = req.query;

  let apiUrl;

  switch (type) {
    case 'author':
      if (!kid) {
        return res.status(400).json({ error: 'Missing KID parameter' });
      }
      apiUrl = `https://library.med.nyu.edu/api/authors?kid=${encodeURIComponent(kid)}&format=json`;
      break;

    case 'publications':
      apiUrl = 'https://library.med.nyu.edu/api/publications?format=JSON&limit=0';
      break;

    default:
      return res.status(400).json({ error: 'Unknown type parameter' });
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Respond with JSON
    res.status(200).json(data);
  } catch (err) {
    console.error('Error in proxy:', err);
    res.status(500).json({ error: err.message });
  }
}
