import { FastifyInstance } from "fastify";
import { verifyToken } from "../controllers/authController";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/debug/user",
    {
      preHandler: [verifyToken],
      schema: {
        tags: ["Usuário logado"],
        description: "verificar as funções dos nossos usuários",
      },
    },
    async (request) => {
      const user = (request as any).user;
      return user;
    },
  );
}
