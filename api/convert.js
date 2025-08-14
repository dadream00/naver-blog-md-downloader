import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';

export default async function handler(req, res) {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).send('URL is required');
      return;
    }

    // 1. 블로그 HTML 가져오기
    let html = await (await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })).text();

    // 2. iframe 안의 본문 페이지 찾기
    const iframeMatch = html.match(/<iframe.*?src="(.*?)".*?<\/iframe>/);
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
    let content = $('#postViewArea').html(); // 스마트에디터 3.0
    if (!content) {
      content = $('.se-main-container').html(); // 최신 에디터
    }

    if (!content) {
      res.status(404).send('본문을 찾을 수 없습니다.');
      return;
    }

    // 4. HTML → Markdown 변환
    const markdown = NodeHtmlMarkdown.translate(content);

    // 5. 파일 다운로드 응답
    res.setHeader('Content-Disposition', 'attachment; filename="post.md"');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(markdown);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
}
