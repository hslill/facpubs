const PLACEHOLDER_COVER = 'https://via.placeholder.com/86x120.png?text=No+Cover';
const BROWZINE_API_URL = 'https://browzine-coverart-api.vercel.app/api/getLibrary';
const NYU_API_URL = 'https://library.med.nyu.edu/api/publications?department=nursing&year-range=2021-2025&format=json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Fetch live NYU publications
    const resp = await fetch(NYU_API_URL);
    if (!resp.ok) throw new Error(`Failed to fetch NYU API: ${resp.status}`);
    const fbData = await resp.json();
    const publications = Array.isArray(fbData.publications) ? fbData.publications : [];

    // Enrich with BrowZine covers
    const enriched = await Promise.all(publications.map(async (pub) => {
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
    }));

    res.status(200).json(enriched);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}
