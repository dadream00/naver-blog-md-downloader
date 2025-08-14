import fetch from "node-fetch";
import { load } from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";

export default async function handler(req, res) {
  try {
    const blogUrl = req.query.url;
    if (!blogUrl) {
      return res.status(400).send("URL이 필요합니다.");
    }

    // 1. 첫 페이지 HTML 가져오기
    const firstRes = await fetch(blogUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const firstHtml = await firstRes.text();
    const $ = load(firstHtml);

    // 2. iframe 주소 찾기
    let iframeSrc = $("#mainFrame").attr("src");
    if (!iframeSrc) {
      const blogIdMatch = firstHtml.match(/"blogId"\s*:\s*"(.+?)"/);
      const logNoMatch = firstHtml.match(/"logNo"\s*:\s*"(\d+)"/);
      if (blogIdMatch && logNoMatch) {
        iframeSrc = `/PostView.nhn?blogId=${blogIdMatch[1]}&logNo=${logNoMatch[1]}`;
      } else {
        return res.status(500).send("본문 iframe을 찾을 수 없습니다.");
      }
    }

    // 3. iframe 전체 URL
    if (!iframeSrc.startsWith("http")) {
      iframeSrc = `https://blog.naver.com${iframeSrc}`;
    }

    // 4. iframe HTML 가져오기
    const iframeRes = await fetch(iframeSrc, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const iframeHtml = await iframeRes.text();
    const $iframe = load(iframeHtml);

    // 5. 제목 + 본문 추출
    const title =
      $iframe(".se_title, .pcol1, .htitle").first().text().trim() || "제목 없음";
    const contentHtml =
      $iframe(".se-main-container, #postViewArea").html();

    if (!contentHtml) {
      return res.status(500).send("본문 내용을 찾을 수 없습니다.");
    }

    // 6. HTML → 마크다운 변환
    const markdown =
      `# ${title}\n\n` +
      NodeHtmlMarkdown.translate(contentHtml);

    // 7. 파일 전송
    res.setHeader("Content-Disposition", "attachment; filename=naver-blog.md");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.send(markdown);
  } catch (err) {
    console.error(err);
    res.status(500).send("변환 실패");
  }
}
