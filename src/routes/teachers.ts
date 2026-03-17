import { FastifyInstance } from "fastify";
import { verifyToken } from "../controllers/authController";
import { db } from "../plugins/firebase";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/teachers/students",
    {
      preHandler: [verifyToken],
      schema: {
        tags: ["Professor"],
        description: "Listar a base de alunos cadastrados",
      },
    },
    async (request, reply) => {
      const user = (request as any).user;
      if (user.role !== "professor" && user.role !== "admin")
        return reply.code(403).send({ error: "Acesso negado." });

      const snapshot = await db
        .collection("users")
        .where("role", "==", "aluno")
        .get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
    },
  );

  fastify.post(
    "/teachers/grades",
    {
      preHandler: [verifyToken],
      schema: {
        tags: ["Professor"],
        description: "Adicionar nota final para um aluno em uma disciplina",
        body: {
          type: "object",
          required: ["enrollment_id", "grade"],
          properties: {
            enrollment_id: { type: "string" },
            grade: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      const user = (request as any).user;

      if (user.role !== "professor" && user.role !== "admin")
        return reply.code(403).send({ error: "Acesso negado." });

      const { enrollment_id, grade } = request.body as any;

      await db
        .collection("enrollments")
        .doc(enrollment_id)
        .update({
          grade: grade,
          updated_at: new Date().toISOString(),
        })
        .catch((error) => {
          console.error("Erro ao atualizar a nota:", error);
          return reply
            .code(500)
            .send({
              error: `Erro ao atualizar a nota. Verifique se essa é a matrícula correta: ${enrollment_id}`,
            });
        });

      return reply.code(201).send({ message: "Nota atribuída com sucesso!" });
    },
  );
}
