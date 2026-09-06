<?php
// api/session.php — reports the current session's role, if any, so the
// frontend can restore a logged-in state after a page reload.
require __DIR__ . '/auth.php';
header('Content-Type: application/json');

echo json_encode(['role' => currentRole()]);
