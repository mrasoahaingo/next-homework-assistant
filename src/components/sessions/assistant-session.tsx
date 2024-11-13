'use client';

import { useAssistant } from 'ai/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const AssistantSession: React.FC<{ threadId: string }> = ({ threadId }) => {
  const { messages, input, submitMessage, handleInputChange, append } =
    useAssistant({ api: '/api/assistant', threadId });

  const handleStart = () => {
    append({ role: 'user', content: 'Je suis prêt !' });
  };

  if (messages.length === 0) {
    return <Button onClick={handleStart}>Commencer</Button>;
  }

  return (	
    <div className="flex flex-col gap-4">
      <h1>Assistant</h1>

      {messages.map((message) => (
        <Card key={message.id}>
          <CardHeader>
            <CardTitle>{message.role}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>{message.content}</div>
            <pre>{JSON.stringify(message.data, null, 2)}</pre>
          </CardContent>
        </Card>
      ))}

			<form onSubmit={submitMessage} className="flex gap-2">
				<Input
					type="text"
					value={input}
					onChange={handleInputChange}
				/>
				<Button type="submit">
					Envoyer
				</Button>
			</form>
    </div>
  );
};
