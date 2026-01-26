import { redirect } from 'next/navigation';

export default function EducationDocIndex({ params }: { params: { id: string } }) {
    redirect(`/education/doc/${params.id}/chat`);
}
