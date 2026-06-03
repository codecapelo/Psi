import { Link } from "react-router-dom";
import { Button } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold text-slate-300 dark:text-slate-700">404</h1>
      <p className="text-slate-500 dark:text-slate-400">Página não encontrada.</p>
      <Link to="/">
        <Button variant="outline">Voltar ao início</Button>
      </Link>
    </div>
  );
}
