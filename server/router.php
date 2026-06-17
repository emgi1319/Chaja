<?php

// Router para el servidor embebido de PHP en desarrollo (php -S ... server/router.php).
// En producción Apache hace el rewrite vía .htaccess; acá lo replicamos.
$_GET['path'] = ltrim((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
require __DIR__ . '/index.php';
