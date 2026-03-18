import { FastifyInstance } from "fastify";
import { verifyToken } from "../controllers/authController";
import { db } from "../plugins/firebase";

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
    async (request, reply) => {
      const identification = (request as any).user;
      const user = await db.collection("users").doc(identification.uid).get();

      if (identification.role != "admin") {
        if (identification.role == "professor") {
          const disciplinesData = await db
            .collection("disciplines")
            .where("teacherId", "==", identification.uid)
            .get();

          let disciplinesList: any[] = [];
          disciplinesData.forEach((doc) => {
            disciplinesList.push({ id: doc.id, ...doc.data() });
          });

          reply.code(200).send({
            identificadores: identification,
            usuarios: user.data(),
            id: user.id,
            disciplinas: disciplinesList,
          });
        } else {
          const matriculas = await db
            .collection("enrollments")
            .where("studentId", "==", identification.uid)
            .get();

          let matriculaList: any[] = [];

          matriculas.forEach((doc) => {
            matriculaList.push({ id: doc.id, ...doc.data() });
          });

          reply.code(200).send({
            identificadores: identification,
            usuarios: user.data(),
            id: user.id,
            ListaDeMatriculas: matriculaList,
          });
        }
      }

      reply.code(200).send({
        identificadores: identification,
        usuarios: user.data(),
        id: user.id,
      });
    },
  );

  fastify.get("/debug/enrollments", {}, async (request, reply) => {
    const EnrollmentsList: any[] = [];
    const snapshot = await db.collection("enrollments").get();
    snapshot.forEach((docs) => {
      EnrollmentsList.push({ id: docs.id, ...docs.data() });
    });
    return reply.code(200).send(EnrollmentsList);
  });
}
