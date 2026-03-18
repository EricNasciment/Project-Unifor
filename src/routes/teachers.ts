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

      const usersQuery = await db
        .collection("users")
        .where("role", "==", "aluno")
        .get();

      const enrollmentList: any[] = [];
      const enrollmentQuery = await db.collection("enrollments").get();
      enrollmentQuery.forEach((doc) => {
        enrollmentList.push({ matriculaId: doc.id, ...doc.data() });
      });

      const response: any[] = [];
      usersQuery.forEach((user) => {
        response.push({
          id: user.id,
          name: user.data().name,
          enrollments: enrollmentList.filter(
            (enrollment) => enrollment.studentId == user.id,
          ),
        });
      });

      return response;
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
          required: ["enrollmentId", "grade"],
          properties: {
            enrollmentId: { type: "string" },
            grade: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      const user = (request as any).user;

      if (user.role !== "professor" && user.role !== "admin")
        return reply.code(403).send({ error: "Acesso negado." });

      const { enrollmentId, grade } = request.body as any;

      await db
        .collection("enrollments")
        .doc(enrollmentId)
        .update({
          grade: grade,
          updated_at: new Date().toISOString(),
        })
        .catch((error) => {
          console.error("Erro ao atualizar a nota:", error);
          return reply.code(500).send({
            error: `Erro ao atualizar a nota. Verifique se essa é a matrícula correta: ${enrollmentId}`,
          });
        });

      return reply.code(201).send({ message: "Nota atribuída com sucesso!" });
    },
  );
}
