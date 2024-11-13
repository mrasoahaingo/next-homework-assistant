import type { CoreAssistantMessage, CoreToolMessage } from 'ai';

export function sanitizeResponseMessages(
  messages: Array<CoreToolMessage | CoreAssistantMessage>,
): Array<CoreToolMessage | CoreAssistantMessage> {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}
