// state.js — shared state, loaded first so every other module can use it.
// Passwords are verified server-side (api/login.php, api/passwords.php,
// api/verify-delete.php) — the client never holds their values.

let selectedRole = null;

let currentRole = null;
let entries = [];
let editIndex = null;
let sortColumn = null;
let sortDirection = 'asc';
