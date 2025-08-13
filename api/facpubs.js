// /api/facpubs.js
export default async function handler(req, res) {
  try {
    const { department, start, end, limit } = req.query;

    const url = `https://library.med.nyu.edu/api/publications?department=${encodeURIComponent(department || 'cardiology')}` +
                `&sort=impact-factor&format=json&limit=${encodeURIComponent(limit || '10')}` +
                (start ? `&start=${encodeURIComponent(start)}` : '') +
                (end ? `&end=${encodeURIComponent(end)}` : '');

    const response = await fetch(url);

    // Log status
    console.log('FB API status:', response.status);

    const text = await response.text();
    console.log('FB API body:', text);

    // Try parsing JSON
    const data = JSON.parse(text);

    res.status(200).json(data);
  } catch (err) {
    console.error('ERROR IN FUNCTION:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}
