// /api/facpubs.js
import fetch from 'node-fetch';

const PLACEHOLDER_COVER = 'https://via.placeholder.com/86x120.png?text=No+Cover';
const BROWZINE_API_URL = 'https://browzine-coverart-api.vercel.app/api/getLibrary';

export default async function handler(req, res) {
  try {
    const { department, limit } = req.query;

    // ===== DYNAMIC DATE RANGE (previous month) =====
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1st day of previous month
    const end   = new Date(now.getFullYear(), now.getMonth(), 0);      // last day of previous month
    const startStr = start.toISOString().split('T')[0]; // YYYY-MM-DD
    const endStr   = end.toISOString().split('T')[0];   // YYYY-MM-DD

    // ===== FETCH FACULTY BIBLIOGRAPHY DATA =====
    const fbUrl = `https://library.med.nyu.edu/api/publications` +
                  `?department=${encodeURIComponent(department || 'Orthopedic Surgery')}` +
                  `&sort=impact-factor&format=json&limit=${encodeURIComponent(limit || '10')}` +
                  `&start=${startStr}&end=${endStr}`;

    const fbResponse = await fetch(fbUrl);
    const fbText = await fbResponse.text();

    let fbData;
    try {
      fbData = JSON.parse(fbText);
    } catch {
      console.warn('FB API returned non-JSON, falling back to empty publications');
      fbData = { publications: [] };
    }

    const publications = fbData.publications || [];

    // ===== FETCH BROWZINE COVER IMAGES =====
    const enriched = await Promise.all(publications.map(async (pub) => {
      let cover_url = PLACEHOLDER_COVER;
      let cover_link = '';

      const issn = pub.issn || pub.journal_issn || ''; // some FB fields might be different

      if (issn) {
        try {
          const cleanIssn = issn.replace(/\[|\]|-/g, '').trim();
          const bzResponse = await fetch(`${BROWZINE_API_URL}?issn=${encodeURIComponent(cleanIssn)}`);
          const bzData = await bzResponse.json();

          if (bzData?.data?.length > 0) {
            const journal = bzData.data[0];
            cover_url  = journal.coverImageUrl || PLACEHOLDER_COVER;
            cover_link = journal.link || '';
          }
        } catch (err) {
          console.warn(`BrowZine fetch failed for ISSN ${issn}:`, err);
          // fallback to placeholder
        }
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
