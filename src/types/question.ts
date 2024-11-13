export type Question = {
  id: string;
  question: string;
  answer?: string;
  choices?: { num: string; value: string }[];
  hints?: string[];
};
