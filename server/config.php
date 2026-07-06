<?php

// Configuracion de la base, en orden de prioridad:
//   1. config.local.php (no versionado): desarrollo o hosting con datos a mano.
//   2. Variables de entorno DB_* : DigitalOcean App Platform, Render, etc.
//   3. Fallback SQLite autonomo (Hostinger u hosting sin base creada).

if (is_file(__DIR__ . '/config.local.php')) {
    return require __DIR__ . '/config.local.php';
}

$host = getenv('DB_HOST') ?: getenv('DATABASE_HOST');
if ($host) {
    return [
        'driver' => 'mysql',
        'db_host' => $host,
        'db_port' => getenv('DB_PORT') ?: '3306',
        'db_name' => getenv('DB_NAME') ?: getenv('DATABASE_NAME'),
        'db_user' => getenv('DB_USER') ?: getenv('DATABASE_USER'),
        'db_pass' => getenv('DB_PASS') ?: getenv('DATABASE_PASSWORD'),
        'cors_origin' => getenv('CORS_ORIGIN') ?: '*',
    ];
}

return [
    'driver' => 'sqlite',
    'db_path' => __DIR__ . '/data/chaja.sqlite',
    'cors_origin' => '*',
];
