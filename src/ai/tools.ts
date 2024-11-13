import { adminDb } from '@/storage/firebase-admin';
import type { Session } from '@/types/session';
import { tool as createTool } from 'ai';
import { z } from 'zod';

export const evaluateResponseTool = (session: Session, response: string) =>
  createTool({
    description:
      'Evaluer la réponse de l\'élève et retourne la note, l\'explication et si nécessaire la bonne réponse',
    parameters: z.object({
      questionId: z.string(),
      score: z.number().min(0).max(5),
      explanation: z.string(),
      isCorrect: z.boolean(),
    }),
    execute: async ({ questionId, score, isCorrect, explanation }) => {
      await adminDb
        .collection('sessions')
        .doc(session.id)
        .collection('responses')
        .doc(questionId)
        .set({
          response,
          score,
          isCorrect,
          explanation,
        });
      return {
        questionId,
        score,
        isCorrect,
        explanation,
      };
    },
  });

export const endSessionTool = (session: Session) =>
  createTool({
    description: 'Terminer la session et retourne le bilan avec des conseils',
    parameters: z.object({
      summary: z.string(),
      advice: z.string(),
    }),
    execute: async ({ summary, advice }) => {
      await adminDb
        .collection('sessions')
        .doc(session.id)
        .update({
          status: 'completed',
          summary,
          advice,
        });

      return {
        summary,
        advice,
      };
    },
  });

export const responseOptionsTool = () =>
  createTool({
    description: 'Lister les options de réponse à choisir',
    parameters: z.object({
      questionId: z.string(),
      options: z.array(
        z.object({
          num: z.string().describe('Alpabetical order'),
          value: z.string(),
        }),
      ),
    }),
    execute: async ({ questionId, options }) => {
      return {
        questionId,
        options,
      };
    },
  });
