const PLACEHOLDER_COVER = 'https://via.placeholder.com/86x120.png?text=No+Cover';
const BROWZINE_API_URL = 'https://browzine-coverart-api.vercel.app/api/getLibrary';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Fetch from your public Vercel endpoint
    const apiUrl = 'https://facpubs.vercel.app/api/facpubs';
    const apiResp = await fetch(apiUrl);
    if (!apiResp.ok) throw new Error(`Failed to fetch publications: ${apiResp.status}`);
    const fbData = await apiResp.json();

    const publications = Array.isArray(fbData) ? fbData : [];

    // Parallel BrowZine fetches
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

    res.status(200).json(enriched);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}
