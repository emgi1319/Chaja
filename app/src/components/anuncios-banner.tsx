import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { listarAnuncios, anuncioVisible } from "../lib/api";
import { useApp } from "../store";
import type { Anuncio, AnuncioTema } from "../types";

const DISMISS_KEY = "chaja.anuncios_dismiss";

const TEMA: Record<AnuncioTema, { wrap: string; title: string; text: string; close: string; link: string }> = {
  azul: {
    wrap: "border-primary/20 bg-primary/5",
    title: "text-ink",
    text: "text-ink-soft",
    close: "text-ink-muted hover:text-ink",
    link: "text-primary",
  },
  verde: {
    wrap: "border-accent/25 bg-accent/5",
    title: "text-ink",
    text: "text-ink-soft",
    close: "text-ink-muted hover:text-ink",
    link: "text-accent-dark",
  },
  ambar: {
    wrap: "border-amber/30 bg-amber/10",
    title: "text-ink",
    text: "text-ink-soft",
    close: "text-ink-muted hover:text-ink",
    link: "text-amber",
  },
  oscuro: {
    wrap: "border-transparent bg-panel text-white",
    title: "text-white",
    text: "text-white/75",
    close: "text-white/60 hover:text-white",
    link: "text-white",
  },
};

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function AnunciosBanner() {
  const user = useApp((s) => s.user);
  const [items, setItems] = useState<Anuncio[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);

  useEffect(() => {
    let alive = true;
    void listarAnuncios().then((all) => {
      if (alive) setItems(all);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;
  const visibles = items.filter((a) => anuncioVisible(a, user) && !dismissed.includes(a.id));
  if (!visibles.length) return null;

  const cerrar = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
  };

  return (
    <div className="mb-5 space-y-3">
      {visibles.map((a) => {
        const t = TEMA[a.tema] ?? TEMA.azul;
        const inner = (
          <div
            className={`relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 sm:flex-row sm:items-center ${t.wrap}`}
          >
            {a.imagen && (
              <img
                src={a.imagen}
                alt=""
                className="h-32 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-36"
              />
            )}
            <div className="min-w-0 flex-1 pr-6">
              <p className={`font-display text-[15px] font-semibold ${t.title}`}>{a.titulo}</p>
              {a.texto && <p className={`mt-0.5 text-[13px] leading-snug ${t.text}`}>{a.texto}</p>}
              {a.enlace && (
                <span className={`mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold ${t.link}`}>
                  Ver más <ArrowRight size={14} />
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                cerrar(a.id);
              }}
              aria-label="Cerrar"
              className={`absolute right-3 top-3 transition-colors ${t.close}`}
            >
              <X size={16} />
            </button>
          </div>
        );
        return a.enlace ? (
          <a key={a.id} href={a.enlace} target="_blank" rel="noreferrer" className="block">
            {inner}
          </a>
        ) : (
          <div key={a.id}>{inner}</div>
        );
      })}
    </div>
  );
}
