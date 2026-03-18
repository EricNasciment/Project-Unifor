import { FastifyInstance } from "fastify";
import { verifyToken } from "../controllers/authController";
import { db } from "../plugins/firebase";

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/students/enroll",
    {
      preHandler: [verifyToken],
      schema: {
        tags: ["Aluno"],
        description: "Escolher uma disciplina para cursar (Matricular-se)",
        body: {
          type: "object",
          required: ["disciplineId"],
          properties: { disciplineId: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const user = (request as any).user;
      if (user.role !== "aluno" && user.role !== "admin")
        return reply.code(403).send({ error: "Acesso restrito a alunos." });

      const { disciplineId } = request.body as any;

      const disciplineDoc = await db
        .collection("disciplines")
        .doc(disciplineId)
        .get();

      if (!disciplineDoc.exists)
        return reply.code(404).send({ error: "Disciplina não encontrada." });

      const enrollmentQuery = await db
        .collection("enrollments")
        .where("studentId", "==", user.uid)
        .where("disciplineId", "==", disciplineId)
        .get();

      if (!enrollmentQuery.empty)
        return reply
          .code(400)
          .send({ error: "Aluno já está matriculado nesta disciplina." });

      await db.collection("enrollments").add({
        studentId: user.uid,
        disciplineId: disciplineId,
        teacherId: disciplineDoc.data()?.teacherId || null,
        grade: null,
        enrolledAt: new Date().toISOString(),
      });
      return reply
        .code(201)
        .send({ message: "Matriculado com sucesso na disciplina!" });
    },
  );

  fastify.get(
    "/students/grades",
    {
      preHandler: [verifyToken],
      schema: {
        tags: ["Aluno"],
        description: "Visualizar o boletim de notas do próprio aluno",
      },
    },
    async (request, reply) => {
      const user = (request as any).user;
      if (user.role !== "aluno" && user.role !== "admin")
        return reply.code(403).send({ error: "Acesso restrito a alunos." });

      const snapshot = await db
        .collection("enrollments")
        .where("studentId", "==", user.uid)
        .get();

      const disciplineQuery = await db.collection("disciplines").get();
      const disciplines: any[] = [];
      disciplineQuery.forEach((doc) => {
        disciplines.push({ id: doc.id, name: doc.data().name });
      });

      return snapshot.docs.map((doc) => {
        const data = doc.data();

        const discipline = disciplines.find((d) => d.id === data.disciplineId);

        return {
          id: doc.id,
          ...data,
          disciplineName: discipline ? discipline.name : null,
        };
      });
    },
  );
}
