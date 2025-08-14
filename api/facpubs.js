const PLACEHOLDER_COVER = 'https://via.placeholder.com/86x120.png?text=No+Cover';
const BROWZINE_API_URL = 'https://browzine-coverart-api.vercel.app/api/getLibrary';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ===== EZproxy URL wrapping the NYU API =====
    const fbUrl = 'https://login.ezproxy.med.nyu.edu/login?url=' +
                  encodeURIComponent('https://library.med.nyu.edu/api/publications?department=nursing&year-range=2021-2025&format=json');

    let fbData = { publications: [] };
    let isAuthenticated = true;

    try {
      const fbResp = await fetch(fbUrl, { credentials: 'include' });
      if (!fbResp.ok) {
        isAuthenticated = false; // Likely not logged in
      } else {
        fbData = await fbResp.json();
      }
    } catch (err) {
      console.warn('FB API fetch/parse failed:', err);
      isAuthenticated = false;
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in via NYU EZproxy to access publications.'
      });
    }

    const publications = Array.isArray(fbData.publications) ? fbData.publications : [];

    // ===== Parallel BrowZine fetches =====
    const enriched = await Promise.all(
      publications.map(async (pub) => {
        let cover_url = PLACEHOLDER_COVER;
        let cover_link = '';

        const issn = pub.issn || pub.journal_issn || '';
        if (issn) {
          const cleanIssn = issn.replace(/\[|\]|-/g, '').trim();
          try {
            const bzResp = await fetch(`${BROWZINE_API_URL}?issn=${encodeURIComponent(cleanIssn)}`);
            const bzData = await bzResp.json();
            if (bzData?.data?.length > 0) {
              const journal = bzData.data[0];
              cover_url = journal.coverImageUrl || PLACEHOLDER_COVER;
              cover_link = journal.link || '';
            }
          } catch (err) {
            console.warn(`BrowZine fetch failed for ISSN ${issn}:`, err);
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
      })
    );

    // Send enriched publications
    res.status(200).json(enriched);

  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.error(err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}
