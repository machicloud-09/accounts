<?php
// api/data.php — GET returns the current entries; POST overwrites them.
// Data lives in /data/entries.json, which is gitignored so `git pull`
// never touches live data or produces merge conflicts.

header('Content-Type: application/json');

$dataDir  = __DIR__ . '/../data';
$dataFile = $dataDir . '/entries.json';
$seedFile = __DIR__ . '/../seed/seed-data.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0775, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($dataFile)) {
        // First run on this server: seed from the versioned template.
        if (file_exists($seedFile)) {
            copy($seedFile, $dataFile);
        } else {
            file_put_contents($dataFile, '[]');
        }
    }
    readfile($dataFile);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $decoded = json_decode($input, true);

    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['error' => 'Expected a JSON array of entries']);
        exit;
    }

    $fp = fopen($dataFile, 'c');
    if ($fp === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not open data file for writing']);
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
        echo json_encode(['error' => 'Could not lock data file']);
        exit;
    }
    fclose($fp);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
