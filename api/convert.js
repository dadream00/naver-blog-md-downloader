import cheerio from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).send('URL is required');
      return;
    }

    let html = await (await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })).text();

    const $ = cheerio.load(html);
    const markdown = NodeHtmlMarkdown.translate($.html());

    res.setHeader('Content-Disposition', 'attachment; filename="post.md"');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(markdown);
  } catch (error) {
    console.error(error);
    res.status(500).send('변환 실패: ' + error.message);
  }
}
