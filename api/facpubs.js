const PLACEHOLDER_COVER = 'https://via.placeholder.com/86x120.png?text=No+Cover';
const BROWZINE_API_URL = 'https://browzine-coverart-api.vercel.app/api/getLibrary';
const STATIC_JSON_URL = 'https://raw.githubusercontent.com/yourusername/yourrepo/main/facpubs.json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const resp = await fetch(STATIC_JSON_URL);
    if (!resp.ok) throw new Error(`Failed to fetch static JSON: ${resp.status}`);
    const fbData = await resp.json();
    const publications = Array.isArray(fbData.publications) ? fbData.publications : [];

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

