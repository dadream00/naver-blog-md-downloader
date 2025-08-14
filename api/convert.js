import fetch from "node-fetch";
import TurndownService from "turndown";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).send("URL이 필요합니다");
      }

      // 네이버 블로그 HTML 가져오기
      const html = await (await fetch(url)).text();

      // HTML → Markdown 변환
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(html);

      // 파일로 다운로드
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
