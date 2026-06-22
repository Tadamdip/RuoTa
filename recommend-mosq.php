<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  exit;
}

require "db.php";
header("Content-Type: application/json");

$userId = $_GET["user_id"] ?? null;

$stmt = $pdo->prepare("
  SELECT 
    m.*,
    DATEDIFF(CURDATE(), COALESCE(m.last_visited_date, '1900-01-01')) AS days_not_visited,
    CASE 
      WHEN m.area = u.representing_area THEN 1 
      ELSE 0 
    END AS area_match
  FROM mosques m
  JOIN users u ON u.user_id = ?
  ORDER BY 
    days_not_visited DESC,
    m.number_of_religious_people ASC,
    area_match DESC,
    m.priority_level DESC
  LIMIT 1
");

$stmt->execute([$userId]);
echo json_encode($stmt->fetch());