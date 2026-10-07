<?php

declare(strict_types=1);

// Setup inicial: crea las tablas y un usuario administrador.
// Correr una vez desde la terminal (php migrate.php) o desde el navegador y
// luego eliminar/proteger este archivo en el hosting.

$config = require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

$pdo = db_connect($config);

$driver = $config['driver'] ?? 'mysql';
$schema = (string) file_get_contents(
    __DIR__ . ($driver === 'sqlite' ? '/schema.sqlite.sql' : '/schema.sql'),
);
foreach (array_filter(array_map('trim', explode(';', $schema))) as $stmt) {
    try {
        $pdo->exec($stmt);
    } catch (PDOException $e) {
        // En re-deploys las tablas ya existen: no es un error a frenar.
    }
}

// El rol paso de ENUM fijo a texto libre; actualizar la tabla ya creada (MySQL).
if (($driver ?? 'mysql') !== 'sqlite') {
    try {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'vendedor'");
    } catch (PDOException $e) {
        // ya estaba migrado
    }
}

// Altas posteriores sobre una tabla que ya existe: el CREATE TABLE IF NOT EXISTS
// no agrega columnas, asi que se suman aca (falla en silencio si ya estan).
$columnasNuevas = ($driver ?? 'mysql') === 'sqlite'
    ? [
        'ALTER TABLE users ADD COLUMN grupo TEXT',
        'ALTER TABLE users ADD COLUMN lider_id TEXT',
        'ALTER TABLE users ADD COLUMN activo INTEGER NOT NULL DEFAULT 1',
        'ALTER TABLE productos ADD COLUMN owner TEXT',
        'ALTER TABLE productos ADD COLUMN grupo TEXT',
    ]
    : [
        'ALTER TABLE users ADD COLUMN grupo VARCHAR(120)',
        'ALTER TABLE users ADD COLUMN lider_id VARCHAR(40)',
        'ALTER TABLE users ADD COLUMN activo TINYINT NOT NULL DEFAULT 1',
        'ALTER TABLE productos ADD COLUMN owner VARCHAR(40)',
        'ALTER TABLE productos ADD COLUMN grupo VARCHAR(120)',
    ];
foreach ($columnasNuevas as $sql) {
    try {
        $pdo->exec($sql);
    } catch (PDOException $e) {
        // la columna ya existe
    }
}

// El catálogo paso a ser por empresa (grupo). Los productos ya cargados antes de
// este cambio quedaron sin grupo: se asignan una sola vez (WHERE grupo vacio, idempotente).
// Los de ejemplo (de la cuenta de Diego) van al grupo demo; el resto los cargo la
// cuenta de Innoquim mientras probaba el sistema.
try {
    $pdo->exec("UPDATE productos SET grupo = 'Agro Norte' WHERE owner = 'usr-diego' AND (grupo IS NULL OR grupo = '')");
    $pdo->exec("UPDATE productos SET grupo = 'Innoquim' WHERE (owner IS NULL OR owner = '') AND (grupo IS NULL OR grupo = '')");
} catch (PDOException $e) {
    // sin productos previos o ya migrados
}

$exists = $pdo->prepare('SELECT id FROM users WHERE usuario = ?');
$exists->execute(['admin']);
if (!$exists->fetch()) {
    $pdo->prepare('INSERT INTO users (id, nombre, usuario, password_hash, rol) VALUES (?, ?, ?, ?, ?)')
        ->execute([
            'usr-admin',
            'Administrador',
            'admin',
            password_hash('admin', PASSWORD_DEFAULT),
            'gerente',
        ]);
    $msg = "Tablas creadas. Usuario admin/admin (rol gerente) creado.";
} else {
    $msg = "Tablas verificadas. El usuario admin ya existía.";
}

if (PHP_SAPI === 'cli') {
    echo $msg . "\n";
} else {
    header('Content-Type: text/plain; charset=utf-8');
    echo $msg;
}
