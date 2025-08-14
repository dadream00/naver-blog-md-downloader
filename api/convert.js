import fetch from "node-fetch";
import TurndownService from "turndown";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).send("URL이 필요합니다");
      }

      // 1. 블로그 주소에서 blogId, logNo 꺼내기
      const match = url.match(/blog\.naver\.com\/([^\/]+)\/(\d+)/);
      if (!match) {
        return res.status(400).send("올바른 네이버 블로그 주소가 아닙니다");
      }
      const blogId = match[1];
      const logNo = match[2];

      // 2. 본문 HTML이 있는 네이버 API 주소 만들기
      const apiUrl = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&directAccess=true`;

      // 3. HTML 가져오기
      const html = await (await fetch(apiUrl)).text();

      // 4. HTML → Markdown 변환
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(html);

      // 5. 파일로 내려주기
      res.setHeader("Content-Disposition", 'attachment; filename="naver-post.md"');
      res.status(200).send(markdown);
    } catch (err) {
      console.error(err);
      res.status(500).send("변환 중 오류 발생!");
    }
  } else {
    res.status(405).send("POST 메서드만 허용됩니다");
  }
}
