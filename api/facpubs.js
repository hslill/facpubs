// /api/facpubs.js (optimized with parallel BrowZine fetches)
import fetch from 'node-fetch';

const PLACEHOLDER_COVER = 'https://via.placeholder.com/86x120.png?text=No+Cover';
const BROWZINE_API_URL = 'https://browzine-coverart-api.vercel.app/api/getLibrary';

export default async function handler(req, res) {
  // ===== CORS HEADERS =====
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { department, limit } = req.query;

    // ===== DYNAMIC DATE RANGE (previous month) =====
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0);
    const startStr = start.toISOString().split('T')[0];
    const endStr   = end.toISOString().split('T')[0];

    // ===== FETCH FACULTY BIBLIOGRAPHY DATA =====
    const fbUrl = `https://library.med.nyu.edu/api/publications` +
                  `?department=${encodeURIComponent(department || 'Orthopedic Surgery')}` +
                  `&sort=impact-factor&format=json&limit=${encodeURIComponent(limit || '10')}` +
                  `&start=${startStr}&end=${endStr}`;

    const fbResponse = await fetch(fbUrl);
    const fbText = await fbResponse.text();

let fbData = { publications: [] };
try {
  fbData = JSON.parse(fbText);
} catch(err) {
  console.warn('FB API returned non-JSON, using empty publications');
}

const publications = Array.isArray(fbData.publications) ? fbData.publications : [];

    // ===== PARALLEL BROWZINE FETCHES =====
    const enriched = await Promise.all(publications.map(async (pub) => {
      let cover_url = PLACEHOLDER_COVER;
      let cover_link = '';

      const issn = pub.issn || pub.journal_issn || '';

      if (issn) {
        const cleanIssn = issn.replace(/\[|\]|-/g, '').trim();
        try {
          const bzPromise = fetch(`${BROWZINE_API_URL}?issn=${encodeURIComponent(cleanIssn)}`)
            .then(resp => resp.json())
            .then(bzData => {
              if (bzData?.data?.length > 0) {
                const journal = bzData.data[0];
                cover_url  = journal.coverImageUrl || PLACEHOLDER_COVER;
                cover_link = journal.link || '';
              }
            })
            .catch(err => {
              console.warn(`BrowZine fetch failed for ISSN ${issn}:`, err);
            });
          await bzPromise; // wait for this specific ISSN fetch
        } catch {}
      }

      return {
        cover_url,
        cover_link,
        authors_html: pub.authors || '',
        year: pub.publication_year || '',
        article_link: pub.url || '',
        title_html: pub.title || '',
        journal_html: pub.journal || '',
        vol: pub.volume || '',
        issue: pub.issue || '',
        pages: pub.pages || '',
        doi_url: pub.doi ? `https://doi.org/${pub.doi}` : ''
      };
    }));

    // ===== RETURN ENRICHED JSON =====
    res.status(200).json(enriched);

  } catch (err) {
    console.error('ERROR IN /api/facpubs:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}
