import type { Session } from '@/types/session';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { ImageCard } from './file-upload-form';

export const SessionCard = ({ session }: { session: Session }) => {
  const totalScore =
    session.responses?.reduce((acc, response) => acc + response.score, 0) ?? 0;
  const totalQuestions = Object.keys(session.questions).length ?? 0;

  return (
    <Link href={`/sessions/${session.id}`}>
      <Card>
        <CardHeader>{session.id}</CardHeader>
        <CardContent className="flex gap-2">
          <div className="flex-1">
            <p>{session.topics.join(', ')}</p>
            <p>{session.schoolDegree}</p>
            <p>{session.status}</p>
          </div>
          <div className="font-bold text-xl">
            {totalScore} / {totalQuestions * 5}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-2">
            {session.files?.map((file, index) => (
              <ImageCard key={`${file.fileId}-${index}`} image={file} />
            ))}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
