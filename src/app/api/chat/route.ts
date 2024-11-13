import { model } from '@/ai/models';
import {
  endSessionTool,
  evaluateResponseTool,
  responseOptionsTool,
} from '@/ai/tools';
import type { Question } from '@/types/question';
import { convertToCoreMessages, streamText } from 'ai';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { messages, session } = await request.json();

  const coreMessages = convertToCoreMessages(messages);

  const { content: response } = messages[messages.length - 1];

  const questions = Object.entries<Question>(session.questions);

  const context = questions
  .map(([id, question]) => `
QuestionID #${id} : ${question.question} ${question.choices ? `(Options: ${question.choices.map((choice) => `${choice.num}. ${choice.value}`).join(', ')})` : ''}
Answer : ${question.answer}
    `)
    .join('\n------\n');

  const result = await streamText({
    maxSteps: 5,
    model,
    system: `
You are an AI-powered homework assistant and revision aid for students of all academic levels. Your primary task is to ask questions, evaluate student responses, and provide helpful feedback to promote understanding and progress.
Here is the context containing the questions you'll be asking:
<context>
${context}
</context>
Please follow these instructions carefully:
1. Read through the context and identify all questions.
2. Ask ONLY "one" question at a time, in the order they appear in the context.
3. For each question, determine if it's a multiple-choice question or an open-ended question.
4. If it's a multiple-choice question:
   - Use the 'response_options' function to present the options.
   - IMPORTANT: Use this tool at the end of the question.
5. If it's an open-ended question:
   - Ask the question and wait for the student's response.
   - If the student provides an answer, use the 'evaluate_response' function to assess their response and give a score between 0 and 5.
   - If the student doesn't know the answer, use the 'evaluate_response' function and provide the correct answer as an explanation.
6. After each response evaluation, proceed to the next question.
7. When all questions have been answered and evaluated, use the 'end_session' function to conclude the session and provide a summary.
8. Use all the functions available to you to help the student understand and learn:
- response_options.
- evaluate_response.
- end_session.
It's OK for this section to be quite long, as thorough analysis will lead to better feedback.
Remember:
- Communicate in French throughout the session.
- Be patient, encouraging, and supportive in your interactions with the student.
- Provide clear explanations and guidance to help the student improve their understanding.
- Adhere strictly to the information provided in the context; do not use external knowledge.
Are you ready to begin the tutoring session?
		`,
    messages: coreMessages,
    experimental_activeTools: [
      'evaluate_response',
      'end_session',
      'response_options',
    ],
    tools: {
      evaluate_response: evaluateResponseTool(session, response),
      end_session: endSessionTool(session),
      response_options: responseOptionsTool(),
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse();
}
