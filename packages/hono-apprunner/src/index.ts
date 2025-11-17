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

app.get("/", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return c.json({
    message: "Hello from Hono on App Runner!!",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "OK" });
});

app.get("/external-test", async (c) => {
  try {
    const response = await fetch("http://checkip.amazonaws.com");
    const data = await response.json();

    return c.json({
      status: "External communication successful",
      externalResponse: data,
    });
  } catch (error: any) {
    return c.json(
      {
        status: "External communication failed",
        error: error.message || "Unknown error",
      },
      500
    );
  }
});

app.get("/db-test", async (c) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("select * from apprunner.orders");
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
