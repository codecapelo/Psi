import { type ReactNode } from "react";
import { Modal, Button } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/utils";

function PrefRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: ".9rem", color: "var(--text)" }}>{label}</span>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        border: "1px solid var(--border)",
        padding: 2,
        background: checked ? "var(--brand)" : "var(--surface-sunk)",
        cursor: "pointer",
        transition: ".15s",
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: ".15s",
          boxShadow: "0 1px 2px rgba(0,0,0,.2)",
        }}
      />
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { prefs, setPref } = useTheme();
  const { user, logout } = useAuth();
  const name = user?.email ?? "Profissional";

  return (
    <Modal open={open} onClose={onClose} title="Conta e preferências" size="sm">
      <div style={{ padding: "4px 2px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
          <span className="avatar" style={{ width: 48, height: 48, flexBasis: 48, fontSize: "1rem" }}>
            {initials(name)}
          </span>
          <div>
            <div style={{ fontWeight: 660, color: "var(--text-strong)" }}>{name}</div>
            <div className="faint" style={{ fontSize: ".82rem" }}>
              {user?.isAdmin ? "Administrador" : "Psiquiatra"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "16px 0",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="eyebrow">Aparência</div>
          <PrefRow label="Tema escuro">
            <Switch checked={prefs.dark} onChange={(v) => setPref("dark", v)} />
          </PrefRow>
          <PrefRow label="Densidade">
            <Segmented
              value={prefs.density}
              options={[
                { value: "confortavel", label: "Confortável" },
                { value: "compacto", label: "Compacto" },
              ]}
              onChange={(v) => setPref("density", v)}
            />
          </PrefRow>
          <PrefRow label="Destaque">
            <Segmented
              value={prefs.accent}
              options={[
                { value: "azul", label: "Azul" },
                { value: "teal", label: "Teal" },
              ]}
              onChange={(v) => setPref("accent", v)}
            />
          </PrefRow>

          <div className="eyebrow" style={{ marginTop: 6 }}>
            Acessibilidade
          </div>
          <PrefRow label="Tamanho do texto">
            <input
              type="range"
              min={0.9}
              max={1.25}
              step={0.05}
              value={prefs.fontScale}
              onChange={(e) => setPref("fontScale", Number(e.target.value))}
              style={{ width: 140, accentColor: "var(--brand)" }}
            />
          </PrefRow>
          <PrefRow label="Animações">
            <Switch checked={prefs.motion} onChange={(v) => setPref("motion", v)} />
          </PrefRow>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
          <Button
            variant="ghost"
            icon={<Icon name="logout" size={16} />}
            onClick={() => {
              logout();
              onClose();
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    </Modal>
  );
}
