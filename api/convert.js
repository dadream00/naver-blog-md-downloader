import fetch from "node-fetch";
import { load } from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";

export default async function handler(req, res) {
  try {
    const blogUrl = req.query.url;
    if (!blogUrl) {
      return res.status(400).send("URL is required");
    }

    // 1. 네이버 블로그 첫 페이지 HTML 가져오기
    const firstRes = await fetch(blogUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const firstHtml = await firstRes.text();
    const $first = load(firstHtml);

    // 2. iframe 주소 추출
    const iframeSrc = $first("iframe#mainFrame").attr("src");
    if (!iframeSrc) {
      return res.status(500).send("본문 iframe을 찾을 수 없습니다.");
    }

    // 3. iframe HTML 가져오기
    const iframeUrl = new URL(iframeSrc, blogUrl).toString();
    const iframeRes = await fetch(iframeUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const iframeHtml = await iframeRes.text();
    const $iframe = load(iframeHtml);

    // 4. 제목 + 본문 추출
    const title = $iframe(".se_title, .pcol1, .htitle").first().text().trim();
    const contentHtml = $iframe(".se-main-container, #postViewArea").html();

    if (!contentHtml) {
      return res.status(500).send("본문 내용을 찾을 수 없습니다.");
    }

    // 5. HTML → Markdown 변환
    const markdown = `# ${title}\n\n` + NodeHtmlMarkdown.translate(contentHtml);

    // 6. 파일로 응답
    res.setHeader("Content-Disposition", "attachment; filename=post.md");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.send(markdown);

  } catch (err) {
    console.error(err);
    res.status(500).send("변환 실패");
  }
}
