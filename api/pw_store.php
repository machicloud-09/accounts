<?php
// api/pw_store.php — shared helper for reading data/passwords.json.

function pwFilePath() {
    return __DIR__ . '/../data/passwords.json';
}

function loadPasswords() {
    $dataDir = __DIR__ . '/../data';
    $pwFile  = pwFilePath();
    $defaults = [
        'adminPassword'  => 'admin123',
        'viewPassword'   => 'view123',
        'deletePassword' => 'delete123',
    ];

    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0775, true);
    }
    if (!file_exists($pwFile)) {
        file_put_contents($pwFile, json_encode($defaults));
    }
    $stored = json_decode(file_get_contents($pwFile), true);
    return is_array($stored) ? array_merge($defaults, $stored) : $defaults;
}
