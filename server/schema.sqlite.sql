CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'vendedor',
  grupo TEXT,
  lider_id TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS productores (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  localidad TEXT,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_productores_owner ON productores(owner);

CREATE TABLE IF NOT EXISTS actividades (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  productor_id TEXT NOT NULL,
  actividad TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_actividades_owner ON actividades(owner);
CREATE INDEX IF NOT EXISTS idx_actividades_productor ON actividades(productor_id);

CREATE TABLE IF NOT EXISTS operaciones (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  productor_id TEXT NOT NULL,
  cultivo TEXT,
  producto TEXT,
  etapa TEXT,
  estado TEXT,
  valor_potencial REAL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_operaciones_owner ON operaciones(owner);
CREATE INDEX IF NOT EXISTS idx_operaciones_productor ON operaciones(productor_id);

CREATE TABLE IF NOT EXISTS referidos (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  nombre TEXT NOT NULL,
  proceso TEXT,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referidos_owner ON referidos(owner);

CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  codigo TEXT,
  categoria TEXT,
  nombre TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS parametros (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  usuario TEXT NOT NULL,
  fecha INTEGER NOT NULL,
  data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha);

CREATE TABLE IF NOT EXISTS anuncios (
  id TEXT PRIMARY KEY,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_anuncios_created ON anuncios(created_at);
