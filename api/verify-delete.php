<?php
// api/verify-delete.php — checks the delete/import confirmation password.
// Requires an existing admin session; does not itself grant any session.
require __DIR__ . '/auth.php';
require __DIR__ . '/pw_store.php';
header('Content-Type: application/json');

requireRole(['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = is_array($input) ? (string)($input['password'] ?? '') : '';

$stored = loadPasswords();
if (!hash_equals((string)$stored['deletePassword'], $password)) {
    http_response_code(401);
    echo json_encode(['error' => 'Incorrect password']);
    exit;
}

echo json_encode(['success' => true]);
