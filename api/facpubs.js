// /api/facpubs.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const { department, limit } = req.query;

    // ===== DYNAMIC DATE RANGE =====
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1st day of previous month
    const end = new Date(now.getFullYear(), now.getMonth(), 0);       // last day of previous month

    const startStr = start.toISOString().split('T')[0]; // YYYY-MM-DD
    const endStr   = end.toISOString().split('T')[0];   // YYYY-MM-DD

    // ===== BUILD API URL =====
    const fbUrl = `https://library.med.nyu.edu/api/publications` +
                  `?department=${encodeURIComponent(department || 'Orthopedic Surgery')}` +
                  `&sort=impact-factor&format=json&limit=${encodeURIComponent(limit || '10')}` +
                  `&start=${startStr}&end=${endStr}`;

    // ===== FETCH DATA =====
    const response = await fetch(fbUrl);

    const text = await response.text();

    // Try parsing JSON, fall back if plain text returned
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn('FB API returned non-JSON, falling back:', text);
      data = { publications: [] };
    }

    res.status(200).json(data);

  } catch (err) {
    console.error('ERROR IN FUNCTION:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}
