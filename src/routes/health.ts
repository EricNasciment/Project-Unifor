import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    fastify.get('/health', {
        schema: {
            description: 'Rota para verificação rápida de estado e saúde da API.',
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
}