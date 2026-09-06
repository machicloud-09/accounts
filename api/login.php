<?php
// api/login.php — verifies a role password server-side and starts a session.
require __DIR__ . '/auth.php';
require __DIR__ . '/pw_store.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$role = is_array($input) ? ($input['role'] ?? '') : '';
$password = is_array($input) ? (string)($input['password'] ?? '') : '';

$fieldByRole = ['admin' => 'adminPassword', 'view' => 'viewPassword'];
if (!isset($fieldByRole[$role])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid role']);
    exit;
}

$stored = loadPasswords();
if (!hash_equals((string)$stored[$fieldByRole[$role]], $password)) {
    http_response_code(401);
    echo json_encode(['error' => 'Incorrect password']);
    exit;
}

session_regenerate_id(true);
$_SESSION['role'] = $role;
echo json_encode(['success' => true, 'role' => $role]);
