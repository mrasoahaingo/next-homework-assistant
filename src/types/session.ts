import { z } from 'zod';

import type { Question } from './question';
import type { SessionResponse } from './response';

export const topics = [
  { value: 'Mathématiques', label: 'Mathématiques' },
  { value: 'Physique-Chimie', label: 'Physique-Chimie' },
  { value: 'Science de la vie et de la terre', label: 'Science de la vie et de la terre' },
  { value: 'Histoire', label: 'Histoire' },
  { value: 'Littérature', label: 'Littérature' },
  { value: 'Géographie', label: 'Géographie' },
  { value: 'Français', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Allemand', label: 'Allemand' },
];

export const schoolDegrees: { value: string; label: string }[] = [
  { value: 'Collège - classe de 6ème', label: '6ème' },
  { value: 'Collège - classe de 5ème', label: '5ème' },
  { value: 'Collège - classe de 4ème', label: '4ème' },
  { value: 'Collège - classe de 3ème', label: '3ème' },
  { value: 'Lycée - classe de 2nde', label: '2nde' },
  { value: 'Lycée - classe de 1ère', label: '1ère' },
  { value: 'Lycée - classe de Terminale', label: 'Terminale' },
];

export const questionTypes: { value: string; label: string }[] = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'free', label: 'Réponse libre' },
];

export const SessionSchema = z.object({
  topics: z
    .array(z.string())
    .min(1, { message: 'Please select at least one topic' }),
  questionCount: z.number().int().min(1).max(50),
  schoolDegree: z.enum(
    schoolDegrees.map((d) => d.value) as [string, ...string[]],
  ),
  questionType: z.enum(
    questionTypes.map((t) => t.value) as [string, ...string[]],
  ),
  files: z
    .array(
      z.object({
        fileName: z.string(),
        fileId: z.string(),
        fileUrl: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export type SessionFormData = z.infer<typeof SessionSchema>;

export type SessionPayload = SessionFormData & {
  status: 'started' | 'completed' | 'archived';
  questions: Record<string, Question>;
  summary?: string;
  advice?: string;
  threadId?: string;
};

export type Session = SessionPayload & {
  id: string;
  createdAt: Date;
  responses?: SessionResponse[];
};
