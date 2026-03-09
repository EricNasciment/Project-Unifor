import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { db } from '../plugins/firebase';
import { verifyToken } from '../controllers/authController';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // Lista todos os itens de exemplo do Firestore (Pública)
    fastify.get('/items', {
        schema: {
            tags: ['Items'],
            description: 'Lista todos os itens do banco de dados (Firestore)',
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const snapshot = await db.collection('items').get();
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return items;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Erro ao buscar itens no Firestore' });
        }
    });

    // Cria um novo item no Firestore (Privada)
    fastify.post('/items', {
        preHandler: [verifyToken],
        schema: {
            tags: ['Items'],
            description: 'Cria um novo item no banco de dados',
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string' }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { name } = request.body as { name: string };
            const docRef = await db.collection('items').add({
                name,
                createdAt: new Date().toISOString()
            });
            return reply.code(201).send({ id: docRef.id, message: 'Item criado com sucesso!' });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Erro ao criar o item' });
        }
    });
}