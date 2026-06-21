import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const API_BASE = "http://192.168.1.9/routa-api";

export default function HomeScreen() {
  const [mosque, setMosque] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findBestMosque() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/recommend-mosq.php?user_id=1`);
      const data = await response.json();

      setMosque(data);
    } catch (err) {
      setError("Could not connect to the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Routa</Text>
      <Text style={styles.subtitle}>Mosque Visit Recommendation System</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommended Mosque</Text>

        {loading ? (
          <ActivityIndicator />
        ) : mosque ? (
          <>
            <Text style={styles.mosqueName}>{mosque.mosque_name}</Text>
            <Text style={styles.details}>Area: {mosque.area}</Text>
            <Text style={styles.details}>
              Religious people: {mosque.number_of_religous_people}
            </Text>
            <Text style={styles.details}>
              Last visited: {mosque.last_visited ?? "Never visited"}
            </Text>
            <Text style={styles.details}>
              Days not visited: {mosque.days_not_visited}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.mosqueName}>No recommendation loaded yet</Text>
            <Text style={styles.details}>Tap the button to connect to your PHP API.</Text>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Pressable style={styles.button} onPress={findBestMosque}>
        <Text style={styles.buttonText}>Find Best Mosque</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f4f7f5",
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#12372a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#436850",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  mosqueName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#12372a",
  },
  details: {
    marginTop: 8,
    color: "#666",
  },
  error: {
    marginTop: 12,
    color: "#b00020",
  },
  button: {
    backgroundColor: "#12372a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});