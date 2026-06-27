<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require "db.php";

// Fetch ALL mosques so the app can filter them as needed
$stmt = $pdo->query("SELECT * FROM mosques ORDER BY priority_level DESC");
$mosques = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["mosques" => $mosques]);
