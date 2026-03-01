// lib/marketing-data.ts
// Centralized marketing copy for all marketing pages.
// Imported by marketing components and the original FAQ.tsx / TestimonialsCarousel.tsx.

/* ============ Testimonials ============ */
export type Testimonial = {
    id: number;
    name: string;
    role: string;
    rating: number;
    text: string;
};

export const TESTIMONIALS: Testimonial[] = [
    { id: 1, name: "Sarah Chen", role: "Medical Student, Johns Hopkins", rating: 5, text: "Lexaro completely changed how I study for boards. The citation feature means I can trust the answers, and the quiz generator saves me hours of prep time." },
    { id: 2, name: "Marcus Johnson", role: "Law Student, NYU", rating: 5, text: "Finally, an AI tool that actually understands legal documents. The flashcard generation from my case briefs is incredibly accurate." },
    { id: 3, name: "Emily Rodriguez", role: "Engineering Student, MIT", rating: 5, text: "I use the voice feature during my commute and the Learn features at night. My grades have improved significantly since I started using Lexaro." },
    { id: 4, name: "David Kim", role: "Pre-Med, Stanford", rating: 5, text: "The progress tracking and weak topic alerts are game changers. I know exactly what to focus on before each exam." },
    { id: 5, name: "Aisha Patel", role: "MBA Student, Wharton", rating: 5, text: "Clean, fast, and actually useful. The essay grading feature helped me improve my writing for case competitions." },
    { id: 6, name: "James Wilson", role: "PhD Candidate, Berkeley", rating: 5, text: "Reading papers is so much easier with Lexaro Voice. I can listen while taking notes and the audio quality is surprisingly natural." },
    { id: 7, name: "Lisa Thompson", role: "Nursing Student, UCLA", rating: 5, text: "The study loop approach actually works. Quiz myself, see what I missed, review those topics. My retention has never been better." },
    { id: 8, name: "Ryan O'Connor", role: "Finance Major, Columbia", rating: 5, text: "Worth every penny. I tried other AI study tools but Lexaro is the only one that felt polished and reliable." },
];

/* ============ FAQ ============ */
export type QA = { q: string; a: string };

export const FAQ_ITEMS: QA[] = [
    { q: "What is Lexaro Learn?", a: "Lexaro Learn is your document-based study area: chat with your PDFs beside the page, get answers with page links, and generate notes, flashcards, quizzes, essay feedback, and study plans." },
    { q: "Do answers include citations / page links?", a: "Yes — Lexaro is designed to point back to your materials so you can verify quickly and jump to the exact page." },
    { q: "Can I choose quiz difficulty?", a: "Yes — quizzes can be generated as Easy, Medium, or Hard depending on whether you want recall practice or deeper challenge questions." },
    { q: "What does the essay grader do?", a: "You can paste or upload an essay and get structured feedback: strengths, weaknesses, score breakdowns, and specific improvements." },
    { q: "What is the study calendar?", a: "It generates a study plan and daily tasks based on your exam date and availability, so you stay consistent instead of cramming." },
    { q: "What is TTS (text to speech)?", a: "Text to speech, sometimes called TTS, read aloud, or speech synthesis, is the term for using AI voices to turn any input text into speech." },
    { q: "What is an AI voice?", a: "An AI voice refers to the synthesized or generated speech produced by artificial intelligence systems, enabling machines to communicate with human-like speech." },
    { q: "Who is Lexaro for?", a: "Lexaro is for everyone, including seniors, students, professionals, and anyone who benefits from listening to written content read aloud." },
    { q: "Does Lexaro's voices sound natural?", a: "Yes. Lexaro's text to speech reader has natural, human-sounding voices available in multiple languages." },
    { q: "Is Lexaro available in different languages?", a: "Yes, Lexaro supports many of the most frequently spoken languages around the world." },
];

/* ============ Process Steps ============ */
export type ProcessStep = {
    number: number;
    title: string;
    description: string;
};

export const PROCESS_STEPS: ProcessStep[] = [
    { number: 1, title: "Upload Your Documents", description: "Drop in your PDFs, DOCX files, or scanned pages. Lexaro extracts and indexes the text automatically so it is ready for study or audio." },
    { number: 2, title: "Study or Listen", description: "Chat with your documents, generate flashcards, quizzes, and notes — or convert them to premium audio with natural AI voices." },
    { number: 3, title: "Track and Improve", description: "Monitor your progress, identify weak areas, and let the study calendar keep you on track for exam day." },
];

/* ============ Benefits ============ */
export type Benefit = {
    title: string;
    description: string;
};

export const BENEFITS: Benefit[] = [
    { title: "Citations First", description: "Every answer links back to the exact page in your document. Verify in seconds, never guess." },
    { title: "The Study Loop", description: "Chat, quiz, review. Lexaro connects every study tool so practice feels seamless, not scattered." },
    { title: "Premium Feel", description: "A fast, clean interface with natural AI voices. Studying should feel good, not clunky." },
];

/* ============ Comparison (Us vs Others) ============ */
export type ComparisonRow = {
    lexaro: string;
    others: string;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
    { lexaro: "Answers cite exact pages in your PDFs", others: "Generic AI answers with no source links" },
    { lexaro: "Flashcards, quizzes, and notes from your docs", others: "Manual creation or generic templates" },
    { lexaro: "Natural AI voices for any document", others: "Robotic-sounding or no voice feature" },
    { lexaro: "Progress tracking with weak-area alerts", others: "No progress visibility or study analytics" },
    { lexaro: "One platform for reading, listening, and practicing", others: "Multiple fragmented tools and subscriptions" },
];

/* ============ Capabilities Grid ============ */
export type Capability = {
    label: string;
    /** Lucide icon name (rendered by consumer) */
    iconName: string;
};

export const CAPABILITIES: Capability[] = [
    { label: "PDF", iconName: "FileText" },
    { label: "DOCX", iconName: "FileText" },
    { label: "OCR / Scans", iconName: "ScanLine" },
    { label: "Text-to-Speech", iconName: "Headphones" },
    { label: "AI Chat", iconName: "MessageSquare" },
    { label: "Flashcards", iconName: "LayoutGrid" },
    { label: "Quizzes", iconName: "CheckCircle2" },
    { label: "Notes", iconName: "BookOpen" },
    { label: "Progress", iconName: "TrendingUp" },
];

/* ============ Trust Stats ============ */
export type TrustStat = { value: string; label: string };

export const TRUST_STATS: TrustStat[] = [
    { value: "50,000+", label: "Study sessions" },
    { value: "10,000+", label: "Documents processed" },
    { value: "4.9/5", label: "Average rating" },
    { value: "98%", label: "Would recommend" },
];
