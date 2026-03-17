import { FastifyInstance } from 'fastify';
import { db } from '../plugins/firebase';
import { verifyToken } from '../controllers/authController';

export default async function (fastify: FastifyInstance) {
    fastify.get('/teachers/students', {
        preHandler: [verifyToken],
        schema: { tags: ['Professor'], description: 'Listar a base de alunos cadastrados' }
    }, async (request, reply) => {
        const user = (request as any).user;
        if (user.role !== 'professor' && user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado.' });

        const snapshot = await db.collection('users').where('role', '==', 'aluno').get();
        return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
    });

    fastify.post('/teachers/grades', {
        preHandler: [verifyToken],
        schema: {
            tags: ['Professor'],
            description: 'Adicionar nota final para um aluno em uma disciplina',
            body: {
                type: 'object',
                required: ['studentId', 'disciplineId', 'grade'],
                properties: {
                    studentId: { type: 'string' },
                    disciplineId: { type: 'string' },
                    grade: { type: 'number' }
                }
            }
        }
    }, async (request, reply) => {
        const user = (request as any).user;
        if (user.role !== 'professor' && user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado.' });

        const { studentId, disciplineId, grade } = request.body as any;
        await db.collection('enrollments').add({
            'student_id': studentId,
            'discipline_id': disciplineId,
            'teacher_id': user.uid,
            'grade': grade,
            'created_at': new Date().toISOString()
        });
        return reply.code(201).send({ message: 'Nota atribuída com sucesso!' });
    });
}
