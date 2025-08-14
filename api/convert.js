import fetch from 'node-fetch';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      res.status(400).send('URL이 필요합니다.');
      return;
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();

    // 그냥 전체 HTML을 마크다운으로 변환
    const markdown = NodeHtmlMarkdown.translate(html);

    res.setHeader('Content-Disposition', 'attachment; filename="post.md"');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.status(200).send(markdown);
  } catch (error) {
    console.error(error);
    res.status(500).send(`변환 실패: ${error.message}`);
  }
}
