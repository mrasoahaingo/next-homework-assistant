import { AssistantResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Parse the request body
  const input: {
    threadId: string | null;
    message: string;
  } = await req.json();

  if (!input.threadId) {
    throw new Error('THREAD_ID is not set');
  }

  // Create a thread if needed
  const threadId = input.threadId;

  // Check if there's an active run on the thread
  const activeRuns = await openai.beta.threads.runs.list(threadId);

  if (activeRuns.data.length > 0) {
    const promises = activeRuns.data
      .filter(
        (run) => !['completed', 'expired', 'cancelled'].includes(run.status),
      )
      .map((run) => {
        return openai.beta.threads.runs.cancel(threadId, run.id);
      });

    await Promise.all(promises);
  }

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(
    threadId,
    {
      role: 'user',
      content: input.message,
    },
    { signal: req.signal },
  );

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream, sendDataMessage }) => {
      // Run the assistant on the thread
      const runStream = openai.beta.threads.runs.stream(
        threadId,
        {
          assistant_id:
            process.env.NEXT_PUBLIC_ASSISTANT_ID ??
            (() => {
              throw new Error('ASSISTANT_ID is not set');
            })(),
        },
        { signal: req.signal },
      );

      // forward run status would stream message deltas
      let runResult = await forwardStream(runStream);

      // status can be: queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired
      while (
        runResult?.status === 'requires_action' &&
        runResult.required_action?.type === 'submit_tool_outputs'
      ) {
        const tool_outputs = [];
        const toolCalls =
          runResult.required_action.submit_tool_outputs.tool_calls;

        for (const toolCall of toolCalls) {
          const parameters = JSON.parse(toolCall.function.arguments);

          switch (toolCall.function.name) {
            case 'evaluate_response':
              sendDataMessage({
                role: 'data',
                data: {
                  questionId: parameters.questionId,
                  score: parameters.score,
                  hints: parameters.hints,
                  isCorrect: parameters.isCorrect,
                  explanation: parameters.explanation,
                },
              });

              tool_outputs.push({
                tool_call_id: toolCall.id,
                output: `Evaluation de la réponse pour la question ${parameters.questionId} effectuée`,
              });
              break;

            case 'end_session':
              sendDataMessage({
                role: 'data',
                data: {
                  summary: parameters.summary,
                  advice: parameters.advice,
                },
              });

              await openai.beta.threads.update(threadId, {
                metadata: {
                  status: 'completed',
                },
              });

              tool_outputs.push({
                tool_call_id: toolCall.id,
                output: 'Session terminée',
              });
              break;

            default:
              console.log('UNHANDLED function name', toolCall.function.name);
              break;
          }
        }

        runResult = await forwardStream(
          openai.beta.threads.runs.submitToolOutputsStream(
            threadId,
            runResult.id,
            { tool_outputs },
            { signal: req.signal },
          ),
        );
      }
    },
  );
}
