<?php
// api/auth.php — shared session bootstrap for protected endpoints.
// Every endpoint that should not be publicly reachable must `require` this
// and call requireRole() before doing any work.

define('SESSION_TIMEOUT_SECONDS', 180);

$secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

// Enforce the inactivity timeout, then refresh the activity clock — any
// authenticated request (real action or an activity ping) counts as
// activity and pushes the deadline back out.
if (isset($_SESSION['role'])) {
    if (time() - ($_SESSION['lastActivity'] ?? 0) > SESSION_TIMEOUT_SECONDS) {
        $_SESSION = [];
        session_destroy();
    } else {
        $_SESSION['lastActivity'] = time();
    }
}

function currentRole() {
    return $_SESSION['role'] ?? null;
}

function sessionExpiresIn() {
    if (!isset($_SESSION['lastActivity'])) {
        return 0;
    }
    return max(0, SESSION_TIMEOUT_SECONDS - (time() - $_SESSION['lastActivity']));
}

function requireRole(array $allowedRoles) {
    if (!in_array(currentRole(), $allowedRoles, true)) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
}
