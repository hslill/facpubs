// /api/facpubs.js
export default async function handler(req, res) {
  try {
    const { department, start, end, limit } = req.query;

    const url = `https://library.med.nyu.edu/api/publications?department=${encodeURIComponent(department || 'cardiology')}` +
                `&sort=impact-factor&format=json&limit=${encodeURIComponent(limit || '10')}` +
                (start ? `&start=${encodeURIComponent(start)}` : '') +
                (end ? `&end=${encodeURIComponent(end)}` : '');

    // Use global fetch (no import needed)
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch FB API' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
