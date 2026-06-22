import { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const backgroundImage = require("../../assets/images/mosq.jpg");
// For using npm run web
const API_BASE = "http://localhost/routa-api";
// For using a real Android phone
// const API_BASE = "http://192.168.1.9/routa-api";
// For using Android Emulator
// const API_BASE = "http://10.0.2.2/routa-api";

type Mosque = {
  mosque_id: number;
  mosque_name: string;
  location: string | null;
  area: string | null;
  number_of_religous_people: number;
  last_visited: string | null;
  priority_level: number | null;
  days_not_visited?: number;
};

type User = {
  user_id: number;
  full_name: string;
  representing_area: string;
  representing_mosque: string;
};

export default function HomeScreen() {
  const [screen, setScreen] = useState<"welcome" | "login" | "main">("welcome");
  const [user, setUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState("");
  const [representingArea, setRepresentingArea] = useState("");
  const [representingMosque, setRepresentingMosque] = useState("");

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMosques() {
    setListLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/mosques.php`);
      const data = await response.json();
      setMosques(data.mosques ?? data);
    } catch {
      setError("Could not load the mosque list.");
    } finally {
      setListLoading(false);
    }
  }

  async function continueWithUser() {
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/users.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          representing_area: representingArea,
          representing_mosque: representingMosque,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Failed to save user.");
      }

      setUser({
        user_id: data.user_id,
        full_name: fullName,
        representing_area: representingArea,
        representing_mosque: representingMosque,
      });

      setScreen("main");
      await loadMosques();
    } catch {
      setError("Could not save user information.");
    } finally {
      setLoading(false);
    }
  }

  async function viewWithoutLogin() {
    setUser(null);
    setMosque(null);
    setScreen("main");
    await loadMosques();
  }

  async function findBestMosque() {
    if (!user) {
      setError("Please login first to get a mosque suggestion.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/recommend-mosq.php?user_id=${user.user_id}`
      );
      const data = await response.json();
      setMosque(data);
    } catch {
      setError("Could not connect to the API.");
    } finally {
      setLoading(false);
    }
  }

  if (screen === "welcome") {
    return (
      <ImageBackground source={backgroundImage} style={styles.background}>
        <View style={styles.overlay}>
          <Text style={styles.welcomeTitle}>Routa</Text>
          <Text style={styles.welcomeSubtitle}>
            Mosque Visit Recommendation System
          </Text>

          <View style={styles.welcomeCard}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.details}>
              Login to get a suggested mosque, or continue as guest to view the
              mosque list.
            </Text>

            <Pressable style={styles.button} onPress={() => setScreen("login")}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={viewWithoutLogin}>
              <Text style={styles.secondaryButtonText}>View Mosque List</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    );
  }

  if (screen === "login") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Routa</Text>
        <Text style={styles.subtitle}>User Login</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Representing area"
            value={representingArea}
            onChangeText={setRepresentingArea}
          />

          <TextInput
            style={styles.input}
            placeholder="Representing mosque name or ID"
            value={representingMosque}
            onChangeText={setRepresentingMosque}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={continueWithUser}>
            <Text style={styles.buttonText}>
              {loading ? "Saving..." : "Continue"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => setScreen("welcome")}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Routa</Text>
      <Text style={styles.subtitle}>Main Page</Text>

      {user ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logged User</Text>
          <Text style={styles.details}>Name: {user.full_name}</Text>
          <Text style={styles.details}>
            Area: {user.representing_area || "Not provided"}
          </Text>
          <Text style={styles.details}>
            Mosque: {user.representing_mosque || "Not provided"}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Guest View</Text>
          <Text style={styles.details}>
            You are viewing the mosque list without logging in.
          </Text>
        </View>
      )}

      {user ? (
        <>
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
                <Text style={styles.details}>
                  Tap the button to find the best mosque.
                </Text>
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <Pressable style={styles.button} onPress={findBestMosque}>
            <Text style={styles.buttonText}>Find Best Mosque</Text>
          </Pressable>
        </>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mosque List</Text>

        {listLoading ? (
          <ActivityIndicator />
        ) : mosques.length > 0 ? (
          mosques.map((item) => (
            <View key={item.mosque_id} style={styles.listItem}>
              <Text style={styles.listItemTitle}>{item.mosque_name}</Text>
              <Text style={styles.details}>Area: {item.area ?? "Not set"}</Text>
              <Text style={styles.details}>
                Religious people: {item.number_of_religous_people}
              </Text>
              <Text style={styles.details}>
                Last visited: {item.last_visited ?? "Never visited"}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.details}>No mosques loaded yet.</Text>
        )}
      </View>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => setScreen("welcome")}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "rgba(18, 55, 42, 0.58)",
  },
  welcomeTitle: {
    fontSize: 48,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: "#eef7f1",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  welcomeCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    padding: 20,
    borderRadius: 12,
  },
  container: {
    flexGrow: 1,
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
    marginBottom: 12,
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
  input: {
    borderWidth: 1,
    borderColor: "#d7dfd8",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
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
    marginTop: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#12372a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#12372a",
    fontSize: 16,
    fontWeight: "700",
  },
  listItem: {
    borderTopWidth: 1,
    borderTopColor: "#eef2ef",
    paddingTop: 12,
    marginTop: 12,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#12372a",
  },
});