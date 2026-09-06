<?php
// api/passwords.php — GET returns the current passwords; POST overwrites them.
// Data lives in /data/passwords.json, which is gitignored.
// NOTE: passwords are stored in plain text in a JSON file. This is convenient
// for a small private deployment but is NOT strong security — anyone with
// filesystem or HTTP access to /data/passwords.json can read it. Keep this
// folder outside the web root, or block it via server config, if possible.

header('Content-Type: application/json');

$dataDir = __DIR__ . '/../data';
$pwFile  = $dataDir . '/passwords.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0775, true);
}

$defaults = [
    'adminPassword'  => 'admin123',
    'viewPassword'   => 'view123',
    'deletePassword' => 'delete123'
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($pwFile)) {
        file_put_contents($pwFile, json_encode($defaults));
    }
    readfile($pwFile);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $decoded = json_decode($input, true);

    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['error' => 'Expected a JSON object']);
        exit;
    }

    $fp = fopen($pwFile, 'c');
    if ($fp === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not open passwords file for writing']);
        exit;
    }

    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, $input);
        fflush($fp);
        flock($fp, LOCK_UN);
    } else {
        fclose($fp);
        http_response_code(500);
        echo json_encode(['error' => 'Could not lock passwords file']);
        exit;
    }
    fclose($fp);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
