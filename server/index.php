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
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)')->execute([$token, $u['id']]);
    out([
        'token' => $token,
        'user' => ['id' => $u['id'], 'nombre' => $u['nombre'], 'usuario' => $u['usuario'], 'rol' => $u['rol']],
    ]);
}

// El resto requiere sesión
$stmt = $pdo->prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?');
$stmt->execute([auth_token()]);
$user = $stmt->fetch();
if (!$user) {
    fail('no autorizado', 401);
}
$canSeeAll = in_array($user['rol'], ['supervisor', 'gerente', 'superadmin'], true);

if ($name === 'me' && $method === 'GET') {
    out(['id' => $user['id'], 'nombre' => $user['nombre'], 'usuario' => $user['usuario'], 'rol' => $user['rol']]);
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

// Gestión de cuentas: solo el super admin lista, crea y elimina usuarios.
if ($name === 'usuarios') {
    if ($user['rol'] !== 'superadmin') {
        fail('solo super admin', 403);
    }
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT id, nombre, usuario, rol FROM users ORDER BY nombre')->fetchAll();
        out($rows);
    }
    if ($method === 'POST') {
        $b = body();
        $usuario = trim((string) ($b['usuario'] ?? ''));
        $nombre = trim((string) ($b['nombre'] ?? ''));
        $pass = (string) ($b['password'] ?? '');
        $rol = (string) ($b['rol'] ?? 'vendedor');
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
        $pdo->prepare('INSERT INTO users (id, nombre, usuario, password_hash, rol) VALUES (?, ?, ?, ?, ?)')
            ->execute([$id, $nombre, $usuario, password_hash($pass, PASSWORD_DEFAULT), $rol]);
        out(['id' => $id, 'nombre' => $nombre, 'usuario' => $usuario, 'rol' => $rol], 201);
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
    if ($col['owned'] && !$canSeeAll) {
        $stmt = $pdo->prepare("SELECT data FROM {$table} WHERE owner = ? ORDER BY updated_at DESC");
        $stmt->execute([$user['id']]);
    } else {
        $stmt = $pdo->query("SELECT data FROM {$table} ORDER BY updated_at DESC");
    }
    out(array_map(fn ($r) => json_decode($r['data'], true), $stmt->fetchAll()));
}

if ($method === 'POST') {
    $item = body();
    if (($item['id'] ?? '') === '') {
        fail('falta id');
    }
    $values = [
        'id' => $item['id'],
        'owner' => $user['id'],
        'data' => json_encode($item, JSON_UNESCAPED_UNICODE),
        'updated_at' => (int) ($item['updatedAt'] ?? round(microtime(true) * 1000)),
    ];
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
