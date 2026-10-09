import { JoinPreview } from '@/components/join-preview';

export default function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 py-16">
      <div className="flex max-w-lg flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          WorkHub
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Leave and papers, in one place
        </h1>
        <p className="text-muted-foreground">
          Next.js · Tailwind · shadcn/ui · Zustand · Zod · TanStack Query
        </p>
      </div>
      <JoinPreview />
    </main>
  );
}
