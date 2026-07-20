<?php

declare(strict_types=1);

$config = require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function body(): array
{
    $data = json_decode((string) file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function out($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400): void
{
    out(['error' => $msg], $code);
}

function auth_token(): string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $k => $v) {
            if (strtolower($k) === 'authorization') {
                $h = $v;
            }
        }
    }
    return preg_match('/Bearer\s+(\S+)/', $h, $m) ? $m[1] : '';
}

$pdo = db_connect($config);

$path = trim((string) ($_GET['path'] ?? ''), '/');
$parts = $path === '' ? [] : explode('/', $path);
// Cuando la plataforma enruta /api al servicio sin quitar el prefijo, lo sacamos acá.
if (($parts[0] ?? '') === 'api') {
    array_shift($parts);
}
$method = $_SERVER['REQUEST_METHOD'];
$name = $parts[0] ?? '';

// Login: público
if ($name === 'login' && $method === 'POST') {
    $b = body();
    $stmt = $pdo->prepare('SELECT * FROM users WHERE usuario = ?');
    $stmt->execute([trim((string) ($b['usuario'] ?? ''))]);
    $u = $stmt->fetch();
    if (!$u || !password_verify((string) ($b['password'] ?? ''), $u['password_hash'])) {
        fail('credenciales', 401);
    }
    if ((int) ($u['activo'] ?? 1) === 0) {
        fail('cuenta desactivada', 403);
    }
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)')->execute([$token, $u['id']]);
    out([
        'token' => $token,
        'user' => [
            'id' => $u['id'], 'nombre' => $u['nombre'], 'usuario' => $u['usuario'],
            'rol' => $u['rol'], 'grupo' => $u['grupo'] ?? null,
        ],
    ]);
}

// El resto requiere sesión
// Una cuenta desactivada pierde el acceso en el acto, aunque ya tuviera sesión abierta.
$stmt = $pdo->prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND u.activo = 1',
);
$stmt->execute([auth_token()]);
$user = $stmt->fetch();
if (!$user) {
    fail('no autorizado', 401);
}
// Quién puede administrar/asignar carteras.
$esGestion = in_array($user['rol'], ['supervisor', 'gerente', 'superadmin'], true);

// Owners cuyos registros puede ver el usuario. null = sin restricción (ve todo).
// El líder de equipo (rol gerente) ve lo suyo y lo de los usuarios que tiene asignados.
$ownersVisibles = null;
if ($user['rol'] === 'vendedor') {
    $ownersVisibles = [$user['id']];
} elseif ($user['rol'] === 'gerente') {
    $q = $pdo->prepare('SELECT id FROM users WHERE lider_id = ?');
    $q->execute([$user['id']]);
    $ownersVisibles = array_column($q->fetchAll(), 'id');
    $ownersVisibles[] = $user['id'];
}
$canSeeAll = $ownersVisibles === null;

if ($name === 'me' && $method === 'GET') {
    out([
        'id' => $user['id'], 'nombre' => $user['nombre'], 'usuario' => $user['usuario'],
        'rol' => $user['rol'], 'grupo' => $user['grupo'] ?? null,
    ]);
}

// Cambio de contraseña propia: cualquier usuario, validando la actual.
if ($name === 'password' && $method === 'POST') {
    $b = body();
    $actual = (string) ($b['actual'] ?? '');
    $nueva = (string) ($b['nueva'] ?? '');
    if (mb_strlen($nueva) < 4) {
        fail('la contrasena nueva debe tener al menos 4 caracteres');
    }
    if (!password_verify($actual, $user['password_hash'])) {
        fail('la contrasena actual no coincide', 403);
    }
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($nueva, PASSWORD_DEFAULT), $user['id']]);
    out(['ok' => true]);
}

if ($name === 'catalog' && $method === 'GET') {
    $rows = $pdo->query('SELECT data FROM productos ORDER BY nombre')->fetchAll();
    out(['productos' => array_map(fn ($r) => json_decode($r['data'], true), $rows)]);
}

if ($name === 'parametros') {
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT clave, valor FROM parametros')->fetchAll();
        $map = [];
        foreach ($rows as $r) {
            $map[$r['clave']] = json_decode($r['valor'], true);
        }
        out($map);
    }
    if ($method === 'POST') {
        $b = body();
        $pdo->prepare('REPLACE INTO parametros (clave, valor, updated_at) VALUES (?, ?, ?)')
            ->execute([(string) $b['clave'], json_encode($b['valor'] ?? null, JSON_UNESCAPED_UNICODE), (int) round(microtime(true) * 1000)]);
        out(['ok' => true]);
    }
}

// Auditoría: log de cambios. Cualquier usuario registra (POST); solo gerencia lo lee (GET).
if ($name === 'auditoria') {
    if ($method === 'GET') {
        if ($user['rol'] !== 'gerente') {
            fail('solo gerencia', 403);
        }
        $rows = $pdo->query('SELECT data FROM auditoria ORDER BY fecha DESC LIMIT 300')->fetchAll();
        out(array_map(fn ($r) => json_decode($r['data'], true), $rows));
    }
    if ($method === 'POST') {
        $b = body();
        $id = (string) ($b['id'] ?? bin2hex(random_bytes(8)));
        $fecha = (int) ($b['fecha'] ?? round(microtime(true) * 1000));
        $data = array_merge($b, [
            'id' => $id,
            'fecha' => $fecha,
            'usuario' => $user['nombre'],
            'rol' => $user['rol'],
        ]);
        $pdo->prepare('REPLACE INTO auditoria (id, usuario, fecha, data) VALUES (?, ?, ?, ?)')
            ->execute([$id, $user['id'], $fecha, json_encode($data, JSON_UNESCAPED_UNICODE)]);
        out(['ok' => true]);
    }
}

// Gestión de cuentas: gerencia puede consultar el listado (para asignar carteras),
// pero crear y eliminar cuentas es exclusivo del super admin.
if ($name === 'usuarios') {
    if ($method === 'GET') {
        if (!$esGestion) {
            fail('sin permiso', 403);
        }
        // El líder solo ve las cuentas de su equipo; gerencia y super admin, todas.
        if ($user['rol'] === 'gerente') {
            $q = $pdo->prepare(
                'SELECT id, nombre, usuario, rol, grupo, lider_id FROM users WHERE lider_id = ? OR id = ? ORDER BY nombre',
            );
            $q->execute([$user['id'], $user['id']]);
            out($q->fetchAll());
        }
        $rows = $pdo->query(
            'SELECT id, nombre, usuario, rol, grupo, lider_id, activo FROM users ORDER BY nombre',
        )->fetchAll();
        out($rows);
    }
    if ($user['rol'] !== 'superadmin') {
        fail('solo super admin', 403);
    }

    // Activar/desactivar: la cuenta se conserva, pero deja de poder ingresar.
    if ($method === 'POST' && ($parts[2] ?? '') === 'estado') {
        $target = (string) ($parts[1] ?? '');
        if ($target === '') {
            fail('falta id');
        }
        if ($target === $user['id']) {
            fail('no podes desactivar tu propia cuenta', 400);
        }
        $activo = empty(body()['activo']) ? 0 : 1;
        $pdo->prepare('UPDATE users SET activo = ? WHERE id = ?')->execute([$activo, $target]);
        if (!$activo) {
            // Se cierran sus sesiones para que salga de la app de inmediato.
            $pdo->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$target]);
        }
        out(['ok' => true, 'activo' => $activo]);
    }
    if ($method === 'POST') {
        $b = body();
        $usuario = trim((string) ($b['usuario'] ?? ''));
        $nombre = trim((string) ($b['nombre'] ?? ''));
        $pass = (string) ($b['password'] ?? '');
        $rol = (string) ($b['rol'] ?? 'vendedor');
        $grupo = trim((string) ($b['grupo'] ?? '')) ?: null;
        $liderId = trim((string) ($b['liderId'] ?? '')) ?: null;
        if ($usuario === '' || $nombre === '' || $pass === '') {
            fail('faltan datos');
        }
        if (!in_array($rol, ['vendedor', 'supervisor', 'gerente', 'superadmin'], true)) {
            fail('rol invalido');
        }
        $exists = $pdo->prepare('SELECT id FROM users WHERE usuario = ?');
        $exists->execute([$usuario]);
        if ($exists->fetch()) {
            fail('el usuario ya existe', 409);
        }
        $id = 'usr-' . bin2hex(random_bytes(6));
        $pdo->prepare(
            'INSERT INTO users (id, nombre, usuario, password_hash, rol, grupo, lider_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )->execute([$id, $nombre, $usuario, password_hash($pass, PASSWORD_DEFAULT), $rol, $grupo, $liderId]);
        out([
            'id' => $id, 'nombre' => $nombre, 'usuario' => $usuario, 'rol' => $rol,
            'grupo' => $grupo, 'lider_id' => $liderId,
        ], 201);
    }
    if ($method === 'DELETE') {
        $target = $parts[1] ?? '';
        if ($target === '') {
            fail('falta id');
        }
        if ($target === $user['id']) {
            fail('no podes eliminar tu propia cuenta', 400);
        }
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$target]);
        $pdo->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$target]);
        out(['ok' => true]);
    }
    fail('metodo no soportado', 405);
}

// Campañas / comunicados: el super admin publica banners; cada usuario recibe los
// que le corresponden (a todos, a su rol, o a su cuenta). La lectura la hace cualquiera;
// crear, editar y eliminar es exclusivo del super admin.
if ($name === 'anuncios') {
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT data FROM anuncios ORDER BY created_at DESC')->fetchAll();
        $all = array_map(fn ($r) => json_decode($r['data'], true), $rows);
        if ($user['rol'] === 'superadmin') {
            out($all);
        }
        $vis = array_values(array_filter($all, function ($a) use ($user) {
            if (empty($a['activo'])) {
                return false;
            }
            $aud = $a['audiencia'] ?? 'todos';
            if ($aud === 'todos') {
                return true;
            }
            if ($aud === 'rol') {
                return ($a['rol'] ?? '') === $user['rol'];
            }
            if ($aud === 'grupo') {
                return ($a['grupo'] ?? '') !== '' && ($a['grupo'] ?? '') === ($user['grupo'] ?? '');
            }
            if ($aud === 'usuario') {
                return ($a['usuarioId'] ?? '') === $user['id'];
            }
            return false;
        }));
        out($vis);
    }
    if ($user['rol'] !== 'superadmin') {
        fail('solo super admin', 403);
    }
    if ($method === 'POST') {
        $b = body();
        $id = (string) ($b['id'] ?? '');
        if ($id === '') {
            fail('falta id');
        }
        $created = (int) ($b['createdAt'] ?? round(microtime(true) * 1000));
        $activo = empty($b['activo']) ? 0 : 1;
        $pdo->prepare('REPLACE INTO anuncios (id, activo, created_at, data) VALUES (?, ?, ?, ?)')
            ->execute([$id, $activo, $created, json_encode($b, JSON_UNESCAPED_UNICODE)]);
        out(['ok' => true]);
    }
    if ($method === 'DELETE') {
        $target = $parts[1] ?? '';
        if ($target === '') {
            fail('falta id');
        }
        $pdo->prepare('DELETE FROM anuncios WHERE id = ?')->execute([$target]);
        out(['ok' => true]);
    }
    fail('metodo no soportado', 405);
}

// Colecciones: tabla, si se filtra por dueño, y columnas indexadas que se extraen del objeto
$collections = [
    'productores' => ['table' => 'productores', 'owned' => true, 'cols' => ['razon_social' => 'razonSocial', 'localidad' => 'localidad']],
    'notas-campo' => ['table' => 'actividades', 'owned' => true, 'cols' => ['productor_id' => 'productorId', 'actividad' => 'actividad']],
    'operaciones' => ['table' => 'operaciones', 'owned' => true, 'cols' => ['productor_id' => 'productorId', 'cultivo' => 'cultivo', 'producto' => 'producto', 'etapa' => 'etapa', 'estado' => 'estado', 'valor_potencial' => 'valorPotencial']],
    'referidos' => ['table' => 'referidos', 'owned' => true, 'cols' => ['nombre' => 'nombre', 'proceso' => 'proceso']],
    'productos' => ['table' => 'productos', 'owned' => false, 'cols' => ['codigo' => 'codigo', 'categoria' => 'categoria', 'nombre' => 'nombre']],
];

if (!isset($collections[$name])) {
    fail('ruta desconocida', 404);
}
$col = $collections[$name];
$table = $col['table'];

if ($method === 'GET') {
    // El catálogo es de la empresa: no tiene dueño ni se filtra.
    if (!$col['owned']) {
        $stmt = $pdo->query("SELECT data FROM {$table} ORDER BY updated_at DESC");
        out(array_map(fn ($r) => json_decode($r['data'], true), $stmt->fetchAll()));
    }
    if ($ownersVisibles !== null) {
        $marcas = implode(',', array_fill(0, count($ownersVisibles), '?'));
        $stmt = $pdo->prepare("SELECT owner, data FROM {$table} WHERE owner IN ({$marcas}) ORDER BY updated_at DESC");
        $stmt->execute($ownersVisibles);
    } else {
        $stmt = $pdo->query("SELECT owner, data FROM {$table} ORDER BY updated_at DESC");
    }
    // Se expone el dueño de cada registro para que el líder pueda ver el trabajo
    // de un integrante puntual de su equipo (modo sombra).
    out(array_map(
        fn ($r) => array_merge(json_decode($r['data'], true), ['owner' => $r['owner']]),
        $stmt->fetchAll(),
    ));
}

if ($method === 'POST') {
    $item = body();
    if (($item['id'] ?? '') === '') {
        fail('falta id');
    }
    // Por defecto el registro es de quien lo carga. Cuando gerencia asigna una
    // cartera a un vendedor, el productor pasa a ser de ese vendedor para que lo vea.
    $dueno = $user['id'];
    if ($name === 'productores' && $esGestion && !empty($item['vendedor'])) {
        $q = $pdo->prepare('SELECT id FROM users WHERE nombre = ? LIMIT 1');
        $q->execute([(string) $item['vendedor']]);
        if ($asignado = $q->fetch()) {
            $dueno = $asignado['id'];
        }
    }
    // Al corregir el registro de un integrante del equipo, el dueño no cambia:
    // el líder ajusta el dato pero el trabajo sigue siendo del vendedor.
    if ($col['owned'] && $esGestion) {
        $q = $pdo->prepare("SELECT owner FROM {$table} WHERE id = ?");
        $q->execute([$item['id']]);
        if (($previo = $q->fetch()) && $name !== 'productores') {
            $dueno = $previo['owner'];
        }
    }
    unset($item['owner']);
    $values = ['id' => $item['id']];
    if ($col['owned']) {
        $values['owner'] = $dueno;
    }
    $values['data'] = json_encode($item, JSON_UNESCAPED_UNICODE);
    $values['updated_at'] = (int) ($item['updatedAt'] ?? round(microtime(true) * 1000));
    foreach ($col['cols'] as $dbcol => $field) {
        $values[$dbcol] = $item[$field] ?? null;
    }
    $names = array_keys($values);
    $placeholders = implode(',', array_fill(0, count($names), '?'));
    $sql = "REPLACE INTO {$table} (" . implode(',', $names) . ") VALUES ({$placeholders})";
    $pdo->prepare($sql)->execute(array_values($values));
    out(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $parts[1] ?? '';
    if ($id === '') {
        fail('falta id');
    }
    $pdo->prepare("DELETE FROM {$table} WHERE id = ?")->execute([$id]);
    out(['ok' => true]);
}

fail('método no soportado', 405);
