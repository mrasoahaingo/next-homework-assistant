import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { mistral } from '@ai-sdk/mistral';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { modelMiddleware } from './middleware';

const perplexity = createOpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai/',
});

const xai = createOpenAI({
  name: 'xai',
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY ?? '',
});

const models = {
  groq: groq('llama-3.1-70b-versatile'),
  google: google('gemini-1.5-flash'),
  openai: openai('o1-preview'),
  anthropic: anthropic('claude-3-5-sonnet-20241022'),
  mistral: mistral('mistral-large-latest'),
  perplexity: perplexity('llama-3.1-8b-instruct'),
  xai: xai('grok-beta'),
};

export const model = wrapLanguageModel({
  model: models.anthropic,
  middleware: modelMiddleware,
});