import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://songjaehyun.com",
  "https://www.songjaehyun.com",
];

export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: (origin, callback) => {
      // allow server-to-server or curl requests
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"), false);
    },
  });
}