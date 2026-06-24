import { Geolocation } from "@capacitor/geolocation";

// Devuelve la ubicación actual o null si no se pudo obtener (permiso denegado, sin
// señal, etc.). En web usa la API del navegador; en Android, el plugin nativo.
export async function getPosicion(): Promise<{ lat: number; lng: number } | null> {
  try {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
