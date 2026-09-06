// state.js — shared state, loaded first so every other module can use it.

let ADMIN_PASSWORD = "admin123";   // default; overridden by saved value once loaded
let VIEW_PASSWORD = "view123";     // default; overridden by saved value once loaded
let DELETE_PASSWORD = "delete123"; // default; overridden by saved value once loaded
let passwordsLoaded = false;
let selectedRole = null;

let currentRole = null;
let entries = [];
let editIndex = null;
let sortColumn = null;
let sortDirection = 'asc';
