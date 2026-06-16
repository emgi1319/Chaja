<?php

declare(strict_types=1);

// Setup inicial: crea las tablas y un usuario administrador.
// Correr una vez desde la terminal (php migrate.php) o desde el navegador y
// luego eliminar/proteger este archivo en el hosting.

$config = require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

$pdo = db_connect($config);

$schema = (string) file_get_contents(__DIR__ . '/schema.sql');
foreach (array_filter(array_map('trim', explode(';', $schema))) as $stmt) {
    $pdo->exec($stmt);
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
