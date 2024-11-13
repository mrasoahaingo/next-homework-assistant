import { MathpixLoader, MathpixMarkdown } from 'mathpix-markdown-it';

export const Markdown = ({ text }: { text: string }) => {
  return (
    <MathpixLoader>
      <MathpixMarkdown text={text} display="inline-block" />
    </MathpixLoader>
  );
};
