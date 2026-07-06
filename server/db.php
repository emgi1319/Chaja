<?php

declare(strict_types=1);

// Conexion a la base. Soporta MySQL (produccion en el servidor del cliente) y
// SQLite (deploy autonomo sin crear base en el panel del hosting). El driver se
// elige por config: 'driver' => 'sqlite' con 'db_path', o MySQL por defecto.
function db_connect(array $config): PDO
{
    $opts = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    if (($config['driver'] ?? 'mysql') === 'sqlite') {
        $path = $config['db_path'];
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        return new PDO('sqlite:' . $path, null, null, $opts);
    }

    $port = isset($config['db_port']) && $config['db_port'] !== '' ? ";port={$config['db_port']}" : '';
    $dsn = "mysql:host={$config['db_host']}{$port};dbname={$config['db_name']};charset=utf8mb4";
    return new PDO($dsn, $config['db_user'], $config['db_pass'], $opts);
}
