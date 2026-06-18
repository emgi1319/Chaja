<?php

declare(strict_types=1);

// Carga datos de ejemplo en la base (usuarios, catálogo y una cartera).
// Correr una vez tras migrate.php: php seed.php

$config = require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

$pdo = db_connect($config);
$now = (int) round(microtime(true) * 1000);

function upsertUser(PDO $pdo, string $id, string $nombre, string $usuario, string $pass, string $rol): void
{
    $pdo->prepare(
        'INSERT INTO users (id, nombre, usuario, password_hash, rol) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), rol = VALUES(rol)',
    )->execute([$id, $nombre, $usuario, password_hash($pass, PASSWORD_DEFAULT), $rol]);
}

upsertUser($pdo, 'usr-diego', 'Diego Romero', 'diego', 'diego', 'vendedor');
upsertUser($pdo, 'usr-sandra', 'Sandra Méndez', 'sandra', 'sandra', 'supervisor');

$owner = 'usr-diego';

$productos = [
    ['SEM-MZ-7210', 'Semilla', 'Semilla de maíz DK 7210 VT3P', 'Dekalb', 'Maíz híbrido', 'Bolsa 80.000 semillas', 320, 308, 300, 120],
    ['SEM-SJ-46I20', 'Semilla', 'Semilla de soja DM 46i20', 'Don Mario', 'Soja grupo IV', 'Bolsa 40 kg', 95, 90, 86, 200],
    ['SEM-TR-620', 'Semilla', 'Semilla de trigo Baguette 620', 'Nidera', 'Trigo pan', 'Bolsa 25 kg', 42, 40, 38, 150],
    ['HRB-GLI-62', 'Herbicida', 'Glifosato 62%', 'Atanor', 'Glifosato', 'Bidón 20 L', 4.5, 4.3, 4.1, 800],
    ['FER-UREA', 'Fertilizante', 'Urea granulada', 'Profertil', 'Nitrógeno 46%', 'Big bag 1.000 kg', 520, 505, 490, 60],
    ['INO-SOJ', 'Inoculante', 'Inoculante para soja', 'Rizobacter', 'Bradyrhizobium', 'Dosis 50 ha', 180, 172, 165, 100],
];
$stmtProd = $pdo->prepare(
    'INSERT INTO productos (id, codigo, categoria, nombre, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)',
);
foreach ($productos as $i => $p) {
    $id = 'prod-' . ($i + 1);
    $data = [
        'id' => $id, 'codigo' => $p[0], 'categoria' => $p[1], 'nombre' => $p[2], 'empresa' => $p[3],
        'principioActivo' => $p[4], 'presentacion' => $p[5],
        'precio1' => $p[6], 'precio2' => $p[7], 'precio3' => $p[8], 'stock' => $p[9],
    ];
    $stmtProd->execute([$id, $p[0], $p[1], $p[2], json_encode($data, JSON_UNESCAPED_UNICODE), $now]);
}

$productores = [
    [
        'id' => 'p1', 'razonSocial' => 'Estancia La Esperanza S.A.', 'vendedor' => 'Martín Suárez', 'localidad' => 'Pergamino',
        'telefono' => '+54 2477 412345', 'email' => 'compras@laesperanza.com.ar', 'contactos' => [],
        'unidades' => [[
            'id' => 'p1-u1',
            'cultivos' => [
                ['id' => 'p1-c1', 'cultivo' => 'Maíz', 'superficieHa' => 300, 'facturado' => 88000],
                ['id' => 'p1-c2', 'cultivo' => 'Soja', 'superficieHa' => 150, 'facturado' => 21000],
                ['id' => 'p1-c3', 'cultivo' => 'Trigo', 'superficieHa' => 150, 'facturado' => 13000],
            ],
        ]],
    ],
    [
        'id' => 'p2', 'razonSocial' => 'Agropecuaria Don Alfredo', 'vendedor' => 'Lucía Fernández', 'localidad' => 'Venado Tuerto',
        'celular' => '+54 9 3462 540321', 'contactos' => [],
        'unidades' => [[
            'id' => 'p2-u1',
            'cultivos' => [
                ['id' => 'p2-c1', 'cultivo' => 'Soja', 'superficieHa' => 200, 'facturado' => 30000],
                ['id' => 'p2-c2', 'cultivo' => 'Trigo', 'superficieHa' => 120, 'facturado' => 8000],
            ],
        ]],
    ],
];
$stmtPdor = $pdo->prepare(
    'INSERT INTO productores (id, owner, razon_social, localidad, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)',
);
foreach ($productores as $p) {
    $p['updatedAt'] = $now;
    $stmtPdor->execute([$p['id'], $owner, $p['razonSocial'], $p['localidad'], json_encode($p, JSON_UNESCAPED_UNICODE), $now]);
}

$operaciones = [
    ['op-1', 'p1', 'Estancia La Esperanza S.A.', 'Maíz', 'Semilla de maíz DK 7210', 90000, 'negociacion', 'abierta'],
    ['op-2', 'p1', 'Estancia La Esperanza S.A.', 'Soja', 'Semilla de soja', 27000, 'venta', 'ganada'],
    ['op-3', 'p2', 'Agropecuaria Don Alfredo', 'Soja', 'Inoculante', 720, 'en_proceso', 'abierta'],
];
$stmtOp = $pdo->prepare(
    'INSERT INTO operaciones (id, owner, productor_id, cultivo, producto, etapa, estado, valor_potencial, data, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)',
);
foreach ($operaciones as $o) {
    $data = [
        'id' => $o[0], 'productorId' => $o[1], 'productorNombre' => $o[2], 'cultivo' => $o[3],
        'producto' => $o[4], 'valorPotencial' => $o[5], 'etapa' => $o[6], 'estado' => $o[7],
        'fechaInicio' => date('c'), 'updatedAt' => $now,
    ];
    $stmtOp->execute([$o[0], $owner, $o[1], $o[3], $o[4], $o[6], $o[7], $o[5], json_encode($data, JSON_UNESCAPED_UNICODE), $now]);
}

$referidos = [
    ['ref-1', 'Juan Pérez', 'Nicolás Díaz', 'en_proceso', 600, 'Recontactar la semana próxima'],
    ['ref-2', 'Laura Méndez', 'Juan Pérez', 'presupuesto', 300, 'Presupuesto de semilla de soja enviado'],
    ['ref-3', 'Sergio Díaz', 'Lucía Fernández', 'visita', 450, 'Visita al campo agendada para el 18/06'],
    ['ref-4', 'Marta Quiroga', 'Nicolás Díaz', 'venta', 800, 'Cerró compra de fertilizante'],
    ['ref-5', 'Pablo Sosa', 'Diego Romero', 'no_venta', 0, 'Ya trabaja con otro proveedor'],
];
$stmtRef = $pdo->prepare(
    'INSERT INTO referidos (id, owner, nombre, proceso, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)',
);
foreach ($referidos as $r) {
    $data = [
        'id' => $r[0], 'nombre' => $r[1], 'referidor' => $r[2], 'proceso' => $r[3],
        'hectareas' => $r[4], 'observaciones' => $r[5], 'updatedAt' => $now,
    ];
    $stmtRef->execute([$r[0], $owner, $r[1], $r[3], json_encode($data, JSON_UNESCAPED_UNICODE), $now]);
}

$notas = [
    ['nota-1', 'p1', 'Estancia La Esperanza S.A.', 'Maíz', 'negociacion', 'Interesado en cerrar semilla y herbicida.'],
    ['nota-2', 'p1', 'Estancia La Esperanza S.A.', 'Soja', 'venta', 'Cerró la semilla de soja.'],
    ['nota-3', 'p2', 'Agropecuaria Don Alfredo', 'Soja', 'visita_campo', 'Recorrida de lote, evaluación de malezas.'],
];
$stmtNota = $pdo->prepare(
    'INSERT INTO actividades (id, owner, productor_id, actividad, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)',
);
foreach ($notas as $i => $n) {
    $data = [
        'id' => $n[0], 'productorId' => $n[1], 'productorNombre' => $n[2], 'cultivo' => $n[3],
        'actividad' => $n[4], 'notaVisita' => $n[5], 'creadoPor' => 'Diego Romero',
        'fechaContacto' => date('c', time() - ($i + 1) * 86400), 'updatedAt' => $now,
    ];
    $stmtNota->execute([$n[0], $owner, $n[1], $n[4], json_encode($data, JSON_UNESCAPED_UNICODE), $now]);
}

$msg = 'Datos de ejemplo cargados: usuarios (diego/diego vendedor, sandra/sandra supervisor, admin/admin gerente), '
    . count($productos) . ' productos, ' . count($productores) . ' productores, '
    . count($operaciones) . ' operaciones, ' . count($referidos) . ' referidos, ' . count($notas) . ' actividades.';

echo PHP_SAPI === 'cli' ? $msg . "\n" : $msg;
