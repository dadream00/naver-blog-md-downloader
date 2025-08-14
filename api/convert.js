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

    // 1. 블로그 첫 HTML 가져오기
    let html = await (await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })).text();

    // 2. iframe 안에 본문이 있을 경우
    const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
    if (iframeMatch && iframeMatch[1]) {
      const iframeUrl = iframeMatch[1].startsWith('http')
        ? iframeMatch[1]
        : 'https://blog.naver.com' + iframeMatch[1];
      html = await (await fetch(iframeUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })).text();
    }

    // 3. 본문만 추출
    const $ = cheerio.load(html);
    let content = $('#postViewArea').html() || $('.se-main-container').html();

    if (!content) {
      res.status(404).send('본문을 찾을 수 없습니다. 공개 글인지 확인하세요.');
      return;
    }

    // 4. HTML → Markdown 변환
    const markdown = NodeHtmlMarkdown.translate(content);

    // 5. 파일로 응답
    res.setHeader('Content-Disposition', 'attachment; filename="post.md"');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(markdown);

  } catch (error) {
    console.error('변환 오류:', error);
    res.status(500).send('변환 중 오류가 발생했습니다.');
  }
}
