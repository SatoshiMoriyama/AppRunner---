import { Hono } from "hono";
import mysql from "mysql2/promise";

const app = new Hono();

// MySQL接続設定
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "test",
  port: 3306,
};

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

app.get("/db-test", async (c) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT 1 as test");
    await connection.end();

    return c.json({
      status: "Database connection successful",
      result: rows,
    });
  } catch (error: any) {
    return c.json(
      {
        status: "Database connection failed",
        error: error.message || "Unknown error",
      },
      500
    );
  }
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
