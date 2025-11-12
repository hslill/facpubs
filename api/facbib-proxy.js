export default async function handler(req, res) {
  // Allow all origins (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // preflight
  }

  const API_TOKEN = process.env.FACBIB_API_TOKEN;
  if (!API_TOKEN) return res.status(500).json({ error: 'API token not set' });

  const { type, kid } = req.query;

  let apiUrl;
  let headers = { 'x-api-token': API_TOKEN };

  switch (type) {
    case 'author':
      if (!kid) return res.status(400).json({ error: 'Missing KID parameter' });
      apiUrl = `https://facbib.nyumc.org/api/v2/authors/${encodeURIComponent(kid)}`;
      break;

    case 'publications':
      apiUrl = 'https://facbib.nyumc.org/api/v2/publications?limit=0';
      break;

    default:
      return res.status(400).json({ error: 'Unknown type parameter' });
  }

  try {
    const response = await fetch(apiUrl, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    console.error('Error in proxy:', err);
    res.status(500).json({ error: err.message });
  }
}
