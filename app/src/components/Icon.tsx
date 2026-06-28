// ==========================================================================
// Ícone do shell SOPsi 2.0 — fachada por NOME sobre o lucide-react (já é dep do
// app). Mantém a API do protótipo (`<Icon name="mic" size={18} />`) para que as
// telas portadas fiquem 1:1, sem manter um set de SVGs paralelo. A classe `.ico`
// é preservada para as regras de cor do shell.css (ex.: `.nav-item .ico`).
// ==========================================================================
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bed,
  Bell,
  BookText,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  FileText,
  Filter,
  Heart,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Lock,
  LogOut,
  Mic,
  Moon,
  MoreHorizontal,
  PenLine,
  Pill,
  Plus,
  RefreshCw,
  ScrollText,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Stethoscope,
  Sun,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  painel: LayoutDashboard,
  pacientes: Users,
  agenda: Calendar,
  prontuario: FileText,
  timeline: LineChart,
  alta: ClipboardCheck,
  plus: Plus,
  sparkles: Sparkles,
  mic: Mic,
  search: Search,
  sun: Sun,
  moon: Moon,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  check: Check,
  checkCircle: CheckCircle2,
  x: X,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  clock: Clock,
  pill: Pill,
  shield: Shield,
  penLine: PenLine,
  logout: LogOut,
  stethoscope: Stethoscope,
  warning: AlertTriangle,
  filter: Filter,
  more: MoreHorizontal,
  bed: Bed,
  activity: Activity,
  listChecks: ListChecks,
  send: Send,
  copy: Copy,
  refresh: RefreshCw,
  user: User,
  heart: Heart,
  download: Download,
  lock: Lock,
  settings: Settings,
  book: BookText,
  scroll: ScrollText,
  bell: Bell,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      className={cn("ico", className)}
      style={style}
      aria-hidden="true"
    />
  );
}
