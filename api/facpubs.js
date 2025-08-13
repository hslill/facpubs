// /api/facpubs.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    // Get query parameters from request (e.g., topic, start/end date)
    const { department, start, end, limit } = req.query;

    // Build the FB API URL
    const url = `https://library.med.nyu.edu/api/publications?department=${encodeURIComponent(department || 'cardiology')}` +
                `&sort=impact-factor&format=json&limit=${encodeURIComponent(limit || '10')}` +
                (start ? `&start=${encodeURIComponent(start)}` : '') +
                (end ? `&end=${encodeURIComponent(end)}` : '');

    // Fetch data from Faculty Bibliography API
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch FB API' });
    }

    const data = await response.json();

    // Return JSON to frontend
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
