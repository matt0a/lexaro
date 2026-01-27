import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import EducationAuthGuard from '@/components/education/EducationAuthGuard';
import EducationDocTabs from '@/components/education/EducationDocTabs';
import EducationDocAudioButton from '@/components/education/EducationDocAudioButton';

export default function EducationDocLayout({
                                               children,
                                               params,
                                           }: {
    children: React.ReactNode;
    params: { id: string };
}) {
    const docId = Number(params.id);

    return (
        <EducationAuthGuard>
            <div className="min-h-screen bg-black text-white">
                <Sidebar />

                <main className="md:ml-56">
                    <div className="relative overflow-hidden min-h-screen">
                        <div className="pointer-events-none absolute inset-0 -z-10">
                            <LightPillarsBackground />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
                            <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                        </div>

                        <div className="px-4 md:px-6 py-10 max-w-6xl mx-auto">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-semibold">Document #{docId}</h1>
                                    <p className="text-white/70 mt-2">
                                        Chat / Notes / Flashcards / Quizzes — plus Sources (index + chunk search).
                                    </p>
                                </div>

                                {/* ✅ Audio only visible once you’re inside the doc */}
                                <EducationDocAudioButton docId={docId} docName={`Education Document ${docId}`} />
                            </div>

                            <div className="mt-6">
                                <EducationDocTabs docId={docId} />
                            </div>

                            <div className="mt-6">{children}</div>
                        </div>
                    </div>
                </main>
            </div>
        </EducationAuthGuard>
    );
}
