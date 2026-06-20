<?php
require "db.php";
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$pdo->beginTransaction();

$stmt = $pdo->prepare("
  INSERT INTO visits (mosque_id, user_id, visit_date, duration, purpose)
  VALUES (?, ?, ?, ?, ?)
");

$stmt->execute([
  $data["mosque_id"],
  $data["user_id"],
  $data["visit_date"],
  $data["duration"],
  $data["purpose"]
]);

$update = $pdo->prepare("
  UPDATE mosques 
  SET last_visited_date = ?
  WHERE mosque_id = ?
");

$update->execute([
  $data["visit_date"],
  $data["mosque_id"]
]);

$pdo->commit();

echo json_encode(["success" => true]);