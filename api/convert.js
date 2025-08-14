import fetch from "node-fetch";
import { load } from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";

export default async function handler(req, res) {
  try {
    const blogUrl = req.query.url;
    if (!blogUrl) {
      return res.status(400).send("URL is required");
    }

    // 1. 첫 페이지 HTML 가져오기
    const firstRes = await fetch(blogUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const firstHtml = await firstRes.text();

    // 2. blogId & logNo 추출
    const blogIdMatch = firstHtml.match(/"blogId"\s*:\s*"(.+?)"/);
    const logNoMatch = firstHtml.match(/"logNo"\s*:\s*"(\d+)"/);

    if (!blogIdMatch || !logNoMatch) {
      return res.status(500).send("blogId 또는 logNo를 찾을 수 없습니다.");
    }

    const blogId = blogIdMatch[1];
    const logNo = logNoMatch[1];

    // 3. iframe URL 생성
    const iframeUrl = `https://blog.naver.com/PostView.nhn?blogId=${blogId}&logNo=${logNo}`;

    // 4. iframe HTML 가져오기
    const iframeRes = await fetch(iframeUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const iframeHtml = await iframeRes.text();
    const $iframe = load(iframeHtml);

    // 5. 제목 + 본문 추출
    const title =
      $iframe(".se_title, .pcol1, .htitle").first().text().trim() || "제목 없음";
    const contentHtml = $iframe(".se-main-container, #postViewArea").html();

    if (!contentHtml) {
      return res.status(500).send("본문 내용을 찾을 수 없습니다.");
    }

    // 6. HTML → Markdown 변환
    const markdown = `# ${title}\n\n` + NodeHtmlMarkdown.translate(contentHtml);

    // 7. 파일 다운로드 응답
    res.setHeader("Content-Disposition", "attachment; filename=post.md");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.send(markdown);
  } catch (err) {
    console.error(err);
    res.status(500).send("변환 실패");
  }
}
