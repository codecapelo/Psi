import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <div className="app-canvas flex h-full flex-col items-center justify-center gap-5 p-6 text-center animate-fade-in">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900/40">
        <Compass className="h-8 w-8" />
      </span>
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-300 dark:text-slate-700">404</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Página não encontrada.</p>
      </div>
      <Link to="/">
        <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>Voltar ao início</Button>
      </Link>
    </div>
  );
}
