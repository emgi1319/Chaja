<?php

// Copiar a config.php y completar. config.php no se versiona.
//
// SQLite (deploy autonomo, no requiere crear base en el panel del hosting):
//   return [
//       'driver'      => 'sqlite',
//       'db_path'     => __DIR__ . '/data/chaja.sqlite',
//       'cors_origin' => '*',
//   ];
//
// MySQL (produccion): completar con los datos del hosting.
return [
    'db_host' => 'localhost',
    'db_name' => 'chaja',
    'db_user' => 'root',
    'db_pass' => '',
    'cors_origin' => '*',
];
