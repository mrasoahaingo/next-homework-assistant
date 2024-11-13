'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { db } from '@/storage/firestore';
import { subscribeToDocuments } from '@/storage/utils/subscribe';
import type { SessionResponse } from '@/types/response';
import type { Session } from '@/types/session';
import { collection, query } from '@firebase/firestore';
import type { ToolInvocation } from 'ai';
import { Check, X } from 'lucide-react';
import React from 'react';
import { Markdown } from '../messages/markdown';

const CardEvaluation: React.FC<{
  evaluation: SessionResponse;
}> = ({ evaluation }) => {
  return (
    <Card>
      <div className='flex items-center gap-2 p-4'>
        <div>{evaluation.isCorrect ? <Check /> : <X />}</div>
        <div className='flex-1 text-xs'>
          <Markdown text={evaluation.explanation} />
        </div>
        <div className='font-extrabold'>
          {evaluation.score} / 5
        </div>
      </div>
    </Card>
  );
};

const CardSummary: React.FC<{
  session: Session;
}> = ({ session }) => {
  return (
    <div>
      <h3>Bilan</h3>
      <Markdown text={session.summary ?? ''} />
      <h3>Conseils</h3>
      <Markdown text={session.advice ?? ''} />
    </div>
  );
};

const CardChoices: React.FC<{
  choices: { num: string; value: string }[];
  handleChoice: (choice: string) => void;
}> = ({ choices, handleChoice }) => {
  return (
    <div className="flex flex-col gap-2">
      {choices.map((choice) => (
        <Button
          key={choice.num}
          variant="outline"
          onClick={() => handleChoice(choice.num)}
        >
          {choice.num}. <Markdown text={choice.value} />
        </Button>
      ))}
    </div>
  );
};

const CardResult: React.FC<{
  toolInvocation: ToolInvocation & { state: 'result' };
  handleChoice: (choice: string) => void;
}> = ({ toolInvocation, handleChoice }) => {
  const { result, toolName } = toolInvocation;

  if (toolName === 'evaluate_response') {
    return <CardEvaluation evaluation={result} />;
  }

  if (toolName === 'end_session') {
    return <CardSummary session={result} />;
  }

  if (toolName === 'response_options') {
    return (
      <CardChoices
        choices={result.options}
        handleChoice={handleChoice}
      />
    );
  }

  return null;
};

export const ChatSession: React.FC<{ session: Session }> = ({ session }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [responses, setResponses] = useState<SessionResponse[]>([]);

  const { messages, input, setInput, handleSubmit, isLoading, append } =
    useChat({
      body: {
        session,
      },
      onToolCall: async ({ toolCall }) => {
        console.log(toolCall);

        if (toolCall.toolName === 'end_session') {
          setIsOpen(false);
        }
      },
    });

  React.useEffect(() => {
    const q = query(collection(db, 'sessions', session.id, 'responses'));
    return subscribeToDocuments<SessionResponse>(q, [], setResponses);
  }, [session]);

  const handleStart = () => {
    setIsOpen(true);
    append({
      role: 'user',
      content: "Bonjour, c'est parti !",
    });
  };

  if (session.status === 'completed') {
    return <CardSummary session={session} />;
  }

  if (messages.length === 0) {
    return <Button onClick={handleStart}>Commencer</Button>;
  }

  const totalScore = responses.reduce(
    (acc, response) => acc + response.score,
    0,
  );

  const handleChoice = (choice: string) => {
    append({
      role: 'user',
      content: choice,
    });
  };

  console.log(messages);

  return (
    <div className="flex flex-col gap-4">
      <h1>
        Chat (score: {totalScore} / {Object.keys(session.questions).length * 5})
      </h1>

      {messages.map((message) => (
        <Card key={message.id}>
          <CardHeader>
            <CardTitle>{message.role}</CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown text={message.content} />
            <div>
              {message.toolInvocations?.map((toolInvocation) => {
                const { toolCallId, state } = toolInvocation;

                if (state !== 'result') {
                  return <div key={toolCallId}>Chargement...</div>;
                }

                return (
                  <CardResult
                    key={toolCallId}
                    toolInvocation={toolInvocation}
                    handleChoice={handleChoice}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {isOpen && messages.length > 0 && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={input}
            disabled={isLoading}
            onChange={(event) => {
              setInput(event.target.value);
            }}
          />
          <Button type="submit" disabled={isLoading}>
            Envoyer
          </Button>
        </form>
      )}
    </div>
  );
};
