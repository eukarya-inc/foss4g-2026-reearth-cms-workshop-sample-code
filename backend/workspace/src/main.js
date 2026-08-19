import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8787);

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // TODO: workshop code goes here.
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
