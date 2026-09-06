<?php
// api/touch.php — pinged by the frontend on user activity to keep an
// authenticated session alive; requireRole()/auth.php already refreshes
// the activity clock as a side effect of any authenticated request.
require __DIR__ . '/auth.php';
header('Content-Type: application/json');

requireRole(['admin', 'view']);

echo json_encode(['success' => true, 'expiresIn' => sessionExpiresIn()]);
