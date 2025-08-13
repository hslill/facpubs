export default async function handler(req, res) {
  try {
    // Extract query params from front-end (optional)
    const { department = 'cardiology', start, end, limit = 10 } = req.query;

    // Build the Faculty Bibliography API URL
    const fbUrl = `https://library.med.nyu.edu/api/publications?department=${encodeURIComponent(department)}&sort=impact-factor&format=json&limit=${limit}` +
                  (start && end ? `&start=${start}&end=${end}` : '');

    // Fetch the data from the API server-side
    const response = await fetch(fbUrl);
    const data = await response.json();

    // Return JSON to front-end
    res.setHeader('Access-Control-Allow-Origin', '*'); // allows any origin
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
