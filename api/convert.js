import fetch from "node-fetch";
import TurndownService from "turndown";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).send("URL이 필요합니다");
      }

      // 1. 블로그 메인 HTML 가져오기
      const html = await (await fetch(url)).text();

      // 2. iframe 주소 찾기
      let realHtml = html;
      const iframeSrc = html.match(/<iframe[^>]+src="([^"]+)"/)?.[1];
      if (iframeSrc) {
        const fullIframeUrl = iframeSrc.startsWith("http")
          ? iframeSrc
          : `https://blog.naver.com${iframeSrc}`;
        // 3. 실제 본문 HTML 가져오기
        realHtml = await (await fetch(fullIframeUrl)).text();
      }

      // 4. HTML → Markdown 변환
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(realHtml);

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="naver-post.md"'
      );
      res.status(200).send(markdown);
    } catch (err) {
      console.error(err);
      res.status(500).send("변환 중 오류 발생!");
    }
  } else {
    res.status(405).send("POST 메서드만 허용됨");
  }
}
