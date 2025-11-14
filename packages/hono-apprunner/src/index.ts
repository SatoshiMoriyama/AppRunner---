import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  const testValue = process.env.TEST_VALUE || "環境変数が設定されていません";
  return c.json({
    message: "Hello from Hono on App Runner!",
    testValue: testValue,
  });
});

app.get("/health", (c) => {
  return c.json({ status: "OK" });
});

const port = Number(process.env.PORT) || 3000;

console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};

// サーバー起動
const { serve } = await import("@hono/node-server");
serve({
  fetch: app.fetch,
  port,
});
