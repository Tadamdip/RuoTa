const API_BASE = "http://192.168.1.20/routa-api";

async function getRecommendedMosque(userId) {
  const response = await fetch(`${API_BASE}/recommend-mosque.php?user_id=${userId}`);
  return await response.json();
}