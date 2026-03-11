import { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

export async function registerSwagger(app: FastifyInstance) {

  await app.register(swagger, {
    openapi: {
      info: {
        title: "SongJaeHyun Node API",
        description: "Product-style API demos for songjaehyun.com",
        version: "1.0.0"
      }
    }
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs"
  });

}