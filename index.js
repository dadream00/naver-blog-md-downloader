import express from "express";
import fetch from "node-fetch";
import TurndownService from "turndown";

const app = express();
app.use(express.json());

app.post("/convert", async (req, res) => {
  try {
    const { url } = req.body;
    const html = await (await fetch(url)).text();

    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(html);

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="naver-post.md"'
    );
    res.send(markdown);
  } catch (err) {
    res.status(500).send("변환 중 오류 발생!");
  }
});

app.get("/", (req, res) => {
  res.send(`
    <form method="POST" action="/convert" onsubmit="event.preventDefault(); fetch('/convert', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ url: document.querySelector('#url').value })
    }).then(res => res.blob()).then(blob => {
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = 'post.md';
      a.click();
    });">
      <input id="url" placeholder="네이버 블로그 주소 붙여넣기" size="50">
      <button type="submit">다운로드</button>
    </form>
  `);
});

app.listen(3000, () => console.log("서버 시작!"));
