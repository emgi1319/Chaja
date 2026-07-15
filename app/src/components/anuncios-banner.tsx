import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { listarAnuncios, anunciosCacheados, anuncioVisible } from "../lib/api";
import { useApp } from "../store";
import type { Anuncio, AnuncioTema } from "../types";

const TEMA: Record<AnuncioTema, { wrap: string; title: string; text: string; link: string }> = {
  azul: {
    wrap: "border-primary/20 bg-primary/5",
    title: "text-ink",
    text: "text-ink-soft",
    link: "text-primary",
  },
  verde: {
    wrap: "border-accent/25 bg-accent/5",
    title: "text-ink",
    text: "text-ink-soft",
    link: "text-accent-dark",
  },
  ambar: {
    wrap: "border-amber/30 bg-amber/10",
    title: "text-ink",
    text: "text-ink-soft",
    link: "text-amber",
  },
  oscuro: {
    wrap: "border-transparent bg-panel",
    title: "text-white",
    text: "text-white/75",
    link: "text-white",
  },
};

function Contenido({ a }: { a: Anuncio }) {
  // Solo imagen: ocupa todo el ancho con proporción de banner (3:1). Una imagen
  // 900x300 entra exacta; una más alta se recorta al centro en vez de estirar la pantalla.
  if (a.formato === "imagen") {
    return (
      <img
        src={a.imagen}
        alt={a.titulo || ""}
        className="aspect-[3/1] w-full rounded-2xl object-cover"
      />
    );
  }

  const t = TEMA[a.tema] ?? TEMA.azul;
  const texto = (
    <div className="min-w-0 flex-1">
      {a.titulo && <p className={`font-display text-[15px] font-semibold ${t.title}`}>{a.titulo}</p>}
      {a.texto && <p className={`mt-0.5 text-[13px] leading-snug ${t.text}`}>{a.texto}</p>}
      {a.enlace && (
        <span className={`mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold ${t.link}`}>
          Ver más <ArrowRight size={14} />
        </span>
      )}
    </div>
  );

  // Solo texto: caja de color con título y texto.
  if (a.formato === "texto") {
    return <div className={`rounded-2xl border p-4 ${t.wrap}`}>{texto}</div>;
  }

  // Imagen + texto: imagen como complemento del texto.
  return (
    <div className={`flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 sm:flex-row sm:items-center ${t.wrap}`}>
      {a.imagen && (
        <img src={a.imagen} alt="" className="h-32 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-36" />
      )}
      {texto}
    </div>
  );
}

// Revalidación única por carga de app: evita un fetch por cada cambio de sección.
let revalidado = false;

export function AnunciosBanner() {
  const user = useApp((s) => s.user);
  const [items, setItems] = useState<Anuncio[]>(anunciosCacheados);

  useEffect(() => {
    // Ya se dibujó desde el cache; revalidamos contra el servidor una sola vez
    // por sesión para no pegarle en cada cambio de sección (el main se remonta).
    if (revalidado) return;
    revalidado = true;
    let alive = true;
    void listarAnuncios().then((all) => {
      if (alive) setItems(all);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;
  const visibles = items.filter((a) => anuncioVisible(a, user));
  if (!visibles.length) return null;

  return (
    <div className="mb-5 space-y-3">
      {visibles.map((a) =>
        a.enlace ? (
          <a key={a.id} href={a.enlace} target="_blank" rel="noreferrer" className="block">
            <Contenido a={a} />
          </a>
        ) : (
          <div key={a.id}>
            <Contenido a={a} />
          </div>
        ),
      )}
    </div>
  );
}
