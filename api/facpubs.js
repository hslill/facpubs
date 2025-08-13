// /api/facpubs.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const { department, start, end, limit } = req.query;

    const url = `https://library.med.nyu.edu/api/publications?department=${encodeURIComponent(department || 'cardiology')}` +
                `&sort=impact-factor&format=json&limit=${encodeURIComponent(limit || '10')}` +
                (start ? `&start=${encodeURIComponent(start)}` : '') +
                (end ? `&end=${encodeURIComponent(end)}` : '');

    const response = await fetch(url);

    const text = await response.text();

    // Try parsing JSON, fall back if plain text returned
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn('FB API returned non-JSON, falling back:', text);
      data = { publications: [] }; // consistent shape
    }

    res.status(200).json(data);

  } catch (err) {
    console.error('ERROR IN FUNCTION:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}
