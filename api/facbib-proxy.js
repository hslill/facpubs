import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { type, kid } = req.query;

  try {
    let apiUrl;

    switch (type) {
      case 'author':
        if (!kid) return res.status(400).json({ error: 'Missing KID parameter' });
        apiUrl = `https://library.med.nyu.edu/api/authors?kid=${encodeURIComponent(kid)}&format=json`;
        break;

      case 'publications':
        apiUrl = 'https://library.med.nyu.edu/api/publications?format=JSON&limit=0';
        break;

      default:
        return res.status(400).json({ error: 'Unknown type parameter' });
    }

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    // return JSON to client
    res.setHeader('Access-Control-Allow-Origin', '*'); // allow browser to access
    res.status(200).json(data);

  } catch (err) {
    console.error('Error in proxy:', err);
    res.status(500).json({ error: err.message });
  }
}

