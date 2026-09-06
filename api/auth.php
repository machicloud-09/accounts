<?php
// api/auth.php — shared session bootstrap for protected endpoints.
// Every endpoint that should not be publicly reachable must `require` this
// and call requireRole() before doing any work.

$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

function currentRole() {
    return $_SESSION['role'] ?? null;
}

function requireRole(array $allowedRoles) {
    if (!in_array(currentRole(), $allowedRoles, true)) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
}
