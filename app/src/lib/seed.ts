import { LOCAL_MODE, notasCampo, operaciones, productores, referidos, saveCatalogLocal } from "./api";
import {
  DEMO_PRODUCTOS,
  demoNotas,
  demoOperaciones,
  demoProductores,
  demoReferidos,
} from "./demo-data";

const SEED_KEY = "chaja.seeded.v3";

// Carga datos de ejemplo una sola vez en modo local, para que la demostración
// no arranque vacía. Con backend activo no hace nada.
export function seedDemo(): void {
  if (!LOCAL_MODE) return;
  if (localStorage.getItem(SEED_KEY)) return;
  saveCatalogLocal(DEMO_PRODUCTOS);
  if (productores.list().length === 0) productores.seedLocal(demoProductores());
  if (notasCampo.list().length === 0) notasCampo.seedLocal(demoNotas());
  if (referidos.list().length === 0) referidos.seedLocal(demoReferidos());
  if (operaciones.list().length === 0) operaciones.seedLocal(demoOperaciones());
  localStorage.setItem(SEED_KEY, "1");
}
