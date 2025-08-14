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

    // 첫 페이지 HTML 가져오기
    let html = await (await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })).text();

    // iframe 추출
    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
    if (iframeMatch && iframeMatch[1]) {
      const iframeUrl = iframeMatch[1].startsWith('http')
        ? iframeMatch[1]
        : 'https://blog.naver.com' + iframeMatch[1];
      html = await (await fetch(iframeUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })).text();
    }

    const $ = cheerio.load(html);

    // 본문 추출
    let content = $('#postViewArea').html() || $('.se-main-container').html();

    if (!content) {
      res.status(404).send('본문을 찾을 수 없습니다. 공개 글인지 확인하세요.');
      return;
    }

    // 변환
    const markdown = NodeHtmlMarkdown.translate(content || '');

    res.setHeader('Content-Disposition', 'attachment; filename="post.md"');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(markdown);

  } catch (error) {
    console.error('변환 오류:', error);
    res.status(500).send('변환 중 오류가 발생했습니다.');
  }
}
