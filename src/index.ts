import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import cors from "@fastify/cors";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import disciplinesRoutes from "./routes/disciplines";
import teachersRoutes from "./routes/teachers";
import studentsRoutes from "./routes/students";
import adminRoutes from "./routes/admin";
import userHealth from "./routes/user";

const server = Fastify({
  logger: true,
});

// Configuração do CORS
server.register(cors, {
  origin: "*", // Permite qualquer origem. Para produção, coloque o domínio específico do seu front-end.
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// Configuração do Swagger para gerar doc OpenAPI
server.register(swagger, {
  swagger: {
    info: {
      title: "UniProject API - Sistema Universitário",
      description:
        "Documentação da API Backend com papéis de Admin, Alunos e Professores.",
      version: "2.0.0",
    },
    host: "localhost:5000",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
  },
});

// Interface UI do Swagger
server.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
  staticCSP: true,
  transformSpecificationClone: true,
});

// Resgistro das Rotas
server.register(healthRoutes);
server.register(authRoutes, { prefix: "/v1" });
server.register(disciplinesRoutes, { prefix: "/v1" });
server.register(teachersRoutes, { prefix: "/v1" });
server.register(studentsRoutes, { prefix: "/v1" });
server.register(adminRoutes, { prefix: "/v1" });
server.register(userHealth, { prefix: "/v1" });

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 5000;
    const host = process.env.HOST || "0.0.0.0";

    // Escutando em 0.0.0.0 para aceitar conexões vindas da rede (outros PCs/celulares)
    await server.listen({ port, host });

    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📄 Documentação local: http://localhost:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
