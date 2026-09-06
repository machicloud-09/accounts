<?php
// api/passwords.php — GET returns the current passwords (admin only); POST
// changes a single password after verifying the current one server-side.
// Data lives in /data/passwords.json, which is gitignored.
// NOTE: passwords are stored in plain text in a JSON file. This is convenient
// for a small private deployment but is NOT strong security — anyone with
// filesystem access to /data/passwords.json can read it. Keep this folder
// outside the web root, or block it via server config, if possible.
require __DIR__ . '/auth.php';
require __DIR__ . '/pw_store.php';

header('Content-Type: application/json');

requireRole(['admin']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(loadPasswords());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Expected a JSON object']);
        exit;
    }

    $which   = $input['which'] ?? '';
    $current = (string)($input['currentPassword'] ?? '');
    $next    = (string)($input['newPassword'] ?? '');

    $fieldByWhich = ['admin' => 'adminPassword', 'view' => 'viewPassword', 'delete' => 'deletePassword'];
    if (!isset($fieldByWhich[$which])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid password type']);
        exit;
    }
    if (strlen($next) < 4) {
        http_response_code(400);
        echo json_encode(['error' => 'New password must be at least 4 characters']);
        exit;
    }

    $stored = loadPasswords();
    if (!hash_equals((string)$stored[$fieldByWhich[$which]], $current)) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }
    $stored[$fieldByWhich[$which]] = $next;

    $fp = fopen(pwFilePath(), 'c');
    if ($fp === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not open passwords file for writing']);
        exit;
    }

    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($stored));
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
