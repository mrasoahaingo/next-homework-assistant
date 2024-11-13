'use client';
import { createChat } from '@/actions/session-action';
import { createThread } from '@/actions/session-action';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { saveSession } from '@/stores/session-store';
import {
  type SessionFormData,
  SessionSchema,
  questionTypes,
  schoolDegrees,
  topics,
} from '@/types/session';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { FileUploadForm } from './file-upload-form';

export const CreateSessionForm = () => {
  const [useAssistant, setUseAssistant] = React.useState(false);
  const router = useRouter();
  const form = useForm<SessionFormData>({
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      topics: [],
      questionCount: 10,
    },
  });

  async function onSubmit(data: SessionFormData) {
    const { threadId, questions } = useAssistant
      ? await createThread(data)
      : await createChat(data);

    const { sessionId } = await saveSession({
      ...data,
      status: 'started',
      threadId,
      questions,
    });

    router.push(`/sessions/${sessionId}`);
  }

  const { isSubmitting } = form.formState;

  return (
    <Card className="relative mx-auto w-full max-w-2xl">
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        <Switch checked={useAssistant} onCheckedChange={setUseAssistant} />
      </div>
      <CardHeader>
        <CardTitle>Révisions</CardTitle>
        <CardDescription>
          Créer un exercice personnalisé grâce à l'IA
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="topics"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Matières</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-[200px] justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value.length > 0
                            ? `${field.value.length} topic${field.value.length > 1 ? 's' : ''} selected`
                            : 'Choisir...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Rechercher un sujet..." />
                        <CommandList>
                          <CommandEmpty>Aucun sujet trouvé.</CommandEmpty>
                          <CommandGroup>
                            {topics.map((topic) => (
                              <CommandItem
                                key={topic.value}
                                onSelect={() => {
                                  field.onChange(
                                    field.value.includes(topic.value)
                                      ? field.value.filter(
                                          (t) => t !== topic.value,
                                        )
                                      : [...field.value, topic.value],
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value.includes(topic.value)
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {topic.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questionCount"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nombre de questions</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      id="questionCount"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10))
                      }
                      min="1"
                      max="10"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schoolDegree"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Classe</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolDegrees.map((degree) => (
                          <SelectItem key={degree.value} value={degree.value}>
                            {degree.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questionType"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Type de question</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2">
                      {questionTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={
                            field.value === type.value ? 'default' : 'outline'
                          }
                          onClick={() => field.onChange(type.value)}
                          className="flex-1"
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Pièce jointes</FormLabel>
                  <FormControl>
                    <FileUploadForm setValue={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormMessage />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Générer les questions'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
