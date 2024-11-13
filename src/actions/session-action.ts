'use server';

import { z } from 'zod';

import { model } from '@/ai/models';
import { adminDb } from '@/storage/firebase-admin';
import type { Question } from '@/types/question';
import type { SessionFormData } from '@/types/session';
import { type AssistantContent, type ImagePart, type ToolContent, generateId, generateText } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const getThread = async (
  id: string,
): Promise<{ threadId: string; metadata: Record<string, unknown> }> => {
  const thread = await openai.beta.threads.retrieve(id);

  return {
    threadId: thread.id,
    metadata: (thread.metadata || {}) as Record<string, unknown>,
  };
};

export const createThread = async (
  data: SessionFormData,
): Promise<{ threadId: string; questions: Record<string, Question> }> => {
  const { questions } = await generateQuestions(data);

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'assistant',
        content: `Voici les questions : ${JSON.stringify(questions)}`,
      },
    ],
  });

  return { threadId: thread.id, questions };
};

export const createChat = async (
  data: SessionFormData,
): Promise<{ threadId: string; questions: Record<string, Question> }> => {
  const { questions } = await generateQuestions(data);
  return { questions, threadId: '' };
};

const getQuestionSchema = (questionType: string) => {
  if (questionType === 'quiz')
    return z.object({
      question: z.string(),
      choices: z.array(
        z.object({
          num: z.string().describe('Alpabetical order'),
          value: z.string(),
        }),
      ),
			answer: z.string(),
			hints: z.array(z.string()),
    });

  return z.object({
    question: z.string(),
    answer: z.string(),
    hints: z.array(z.string()),
  });
};

const generetateInstructions = (data: SessionFormData) => `
- Langue : Français
- Pays : France
- Thème : "${data.topics.join(', ')}"
- Niveau scolaire : "${data.schoolDegree}".

Pour chaque question, tu peux donner une liste d'indices pour l'aider à répondre.
`;

export const generateQuestions = async (
  data: SessionFormData,
): Promise<{ questions: Record<string, Question> }> => {
  const instructions = generetateInstructions(data);
  const questionSchema = getQuestionSchema(data.questionType);

  const attachments = data.files.map(
    (file): ImagePart => ({
      type: 'image',
      image: file.fileUrl,
    }),
  );

  const userText =
    attachments.length > 0
      ? `
Analyse ce ou ces images et rédige une série de questions en fonction de ce que tu vois en suivant ces instructions :
- Si l'image est un exercice. Reprend l'exercice et rédige une question par exercice.
- Si l'image est une leçon. Reprend la leçon et rédige une question par notion abordée.
- Si l'image est un document avec des textes et des images. Reprend le document et rédige une question par information importante du document sous forme d'étude de document.
`
      : `
Prépare des question en suivant ces instructions :
- Nombre de questions : ${data.questionCount}
`;

  const response = await generateText({
    model,
    system: `
Tu es un assistant d'aide aux devoirs de maison et à la révision pour tout niveau scolaire.
		`,
    messages: [
      {
        role: 'user',
        content: [
          ...attachments,
          {
            type: 'text',
            text: `
${userText}
${instructions}
					`,
          },
        ],
      },
    ],
    tools: {
      generate_questions: {
        description: 'Pour générer des questions',
        parameters: z.object({
          imageDescription: z.string(),
          questions: z.array(questionSchema),
        }),
        execute(args) {
          return args;
        },
      },
    },
    toolChoice: 'required',
  });

  const [{ result }] = response.toolResults;

  const questions = (result?.questions as Question[])?.reduce(
    (all: Record<string, Question>, question: Question) => {
      all[generateId()] = question;
			return all;
		},
    {},
  );

  return { questions };
};

export const saveMessages = async (
  sessionId: string,
  messages: {
    id: string;
    role: string;
    content: AssistantContent | ToolContent;
    createdAt: Date;
  }[],
) => {
  await adminDb
    .collection('sessions')
    .doc(sessionId)
    .update({ messages });
};
