import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { PropsWithChildren } from 'react';
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  image_url?: string | null;
};

type User = {
  user_id: number;
  full_name: string;
  representing_area: string;
  representing_mosque: string;
};

type ScreenName = "welcome" | "login" | "main" | "mosques" | "maps" | "todos" | "settings" | "profile";


export default function HomeScreen() {
  const [screen, setScreen] = useState<ScreenName>("welcome");
  const [user, setUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState("");
  const [representingArea, setRepresentingArea] = useState("");
  const [representingMosque, setRepresentingMosque] = useState("");

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");

  // Profile dropdown visibility
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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

  function handleSignOut() {
    setUser(null);
    setMosque(null);
    setFullName("");
    setRepresentingArea("");
    setRepresentingMosque("");
    setShowProfileMenu(false);
    setScreen("welcome");
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

  // ─── Header Bar (top) ─────────────────────────────────────────
  function HeaderBar() {
    return (
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🕌 Routa</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Login / Profile button */}
          {user ? (
            <View>
              <Pressable
                style={styles.headerIconButton}
                onPress={() => setShowProfileMenu(!showProfileMenu)}
              >
              
                <Text style={styles.headerIconLabel}>Profile</Text>
              </Pressable>

              {/* Profile dropdown menu */}
              {showProfileMenu && (
                <View style={styles.profileMenu}>
                  <Text style={styles.profileMenuName}>{user.full_name}</Text>
                  <Text style={styles.profileMenuDetail}>
                    {user.representing_area || "No area"}
                  </Text>
                  <View style={styles.profileMenuDivider} />
                  <Pressable
                    style={styles.profileMenuItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      setScreen("profile");
                    }}
                  >
                    <Text style={styles.profileMenuItemText}>View Profile</Text>
                  </Pressable>
                  <Pressable
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                  >
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <Pressable
              style={styles.headerIconButton}
              onPress={() => {
                setShowProfileMenu(false);
                setScreen("login");
              }}
            >
              <MaterialCommunityIcons name="account-circle" size={24} color="#ffffff" />
              <Text style={styles.headerIconLabel}>Login</Text>
            </Pressable>
          )}

          {/* Settings button */}
          <Pressable
            style={styles.headerIconButton}
            onPress={() => {
              setShowProfileMenu(false);
              setScreen("settings");
            }}
          >
            <MaterialCommunityIcons name="cog" size={24} color="#ffffff" />
            <Text style={styles.headerIconLabel}>Settings</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Bottom Tab Bar ────────────────────────────────────────────
  function BottomTabBar() {
    const tabs: { key: ScreenName; label: string; icon: string }[] = [
      { key: "main", label: "Home", icon: "home" },
      { key: "mosques", label: "Mosques", icon: "mosque" },
      { key: "maps", label: "Maps", icon: "map-marker" },
      { key: "todos", label: "To Do's", icon: "checkbox-marked-outline" },
    ];

    function isActive(tabKey: ScreenName) {
      if (tabKey === screen) return true;
      return false;
    }

    return (
      <View style={styles.bottomTabBar}>
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          return (
            <Pressable
              key={tab.label}
              style={styles.bottomTab}
              onPress={async () => {
                setShowProfileMenu(false);
                if (tab.key === "mosques") {
                  setScreen("mosques");
                  await loadMosques();
                } else {
                  setScreen(tab.key);
                }
              }}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={24}
                color={active ? "#e4d211" : "rgba(255,255,255,0.55)"}
              />
              <Text
                style={[
                  styles.bottomTabLabel,
                  { color: active ? "#e4d211" : "rgba(255,255,255,0.55)" },
                ]}
              >
                {tab.label}
              </Text>
              {active && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    );
  }

  // ─── App Shell (Header + Content + Bottom Tab) ─────────────────
  function AppShell({ children }: PropsWithChildren) {
    return (
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.backgroundOverlay}>
          <HeaderBar />
          <ScrollView contentContainerStyle={styles.pageContainer}>
            {children}
          </ScrollView>
          <BottomTabBar />
        </View>
      </ImageBackground>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════════════════════════════

  // ─── Welcome Screen (full-screen, no nav) ──────────────────────
  if (screen === "welcome") {
    return (
      <ImageBackground source={backgroundImage} style={styles.background}>
        <View style={styles.overlay}>
          <Text style={styles.welcomeTitle}>Routa</Text>
          <Text style={styles.welcomeSubtitle}>
            Na Ska tunay LALAKAW NGA? {"\n"}
            <Text style={styles.stayl}>1</Text>days,{" "}
            <Text style={styles.stayl}>3</Text>days,{" "}
            <Text style={styles.stayl}>7</Text>days,{" "}
            <Text style={styles.stayl}>40</Text>days,{" "}
            <Text style={styles.stayl}>4</Text>months?
          </Text>

          <Pressable style={styles.proceedButton} onPress={() => setScreen("main")}>
            <Text style={styles.proceedButtonText}>Click to proceed</Text>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

    // ─── Login Screen ─────────────────────────────────────────────
    if (screen === "login") {
      return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
          <View style={styles.backgroundOverlay}>
            <HeaderBar />
            <ScrollView contentContainerStyle={styles.pageContainer}>
              <Text style={styles.title}>Routa</Text>
              <Text style={styles.subtitle}>User Login</Text>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>User Information</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Last Name, First Name"
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
            <BottomTabBar />
          </View>
        </ImageBackground>
      );
    }


  // ─── Profile Screen ───────────────────────────────────────────
  if (screen === "profile") {
    return (
      <AppShell>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your Account</Text>

        {user ? (
          <View style={styles.card}>
            <View style={styles.profileAvatarContainer}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.profileName}>{user.full_name}</Text>

            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Area</Text>
              <Text style={styles.profileInfoValue}>
                {user.representing_area || "Not provided"}
              </Text>
            </View>

            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Mosque</Text>
              <Text style={styles.profileInfoValue}>
                {user.representing_mosque || "Not provided"}
              </Text>
            </View>

            <Pressable style={styles.signOutFullButton} onPress={handleSignOut}>
              <Text style={styles.signOutFullButtonText}>Sign Out</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.details}>You are not logged in.</Text>
            <Pressable
              style={styles.button}
              onPress={() => setScreen("login")}
            >
              <Text style={styles.buttonText}>Go to Login</Text>
            </Pressable>
          </View>
        )}
      </AppShell>
    );
  }

  // ─── Maps Screen ──────────────────────────────────────────────
  if (screen === "maps") {
    return (
      <AppShell>
        <Text style={styles.title}>Maps</Text>
        <Text style={styles.subtitle}>Map feature will be added here.</Text>
      </AppShell>
    );
  }

  // ─── To Do's Screen ───────────────────────────────────────────
  if (screen === "todos") {
    return (
      <AppShell>
        <Text style={styles.title}>To Do&apos;s</Text>
        <Text style={styles.subtitle}>Tasks and visit plans will be added here.</Text>
      </AppShell>
    );
  }

  // ─── Settings Screen ──────────────────────────────────────────
  if (screen === "settings") {
    return (
      <AppShell>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>App settings will be added here.</Text>
      </AppShell>
    );
  }

    // ─── Mosques Screen ───────────────────────────────────────────
    if (screen === "mosques") {
      return (
        <AppShell>
          <Text style={styles.title}>Mosques</Text>
          <Text style={styles.subtitle}>All Mosques</Text>

          <View style={styles.card}>
            {listLoading ? (
              <ActivityIndicator />
            ) : mosques.length > 0 ? (
              mosques.map((item) => (
                <View key={item.mosque_id} style={styles.listItem}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.mosqueImage} />
                  ) : (
                    <Image source={require("../../assets/images/mosq.jpg")} style={styles.mosqueImage} />
                  )}
                  <Text style={styles.listItemTitle}>{item.mosque_name}</Text>
                  <Text style={styles.details}>Area: {item.area ?? "Not set"}</Text>
                  <Text style={styles.details}>
                    Religious people: {item.number_of_religous_people}
                  </Text>
                  <Text style={styles.details}>
                    Priority: {item.priority_level}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.details}>No mosques found.</Text>
            )}
          </View>
        </AppShell>
      );
    }

    // ─── Main / Home Screen ───────────────────────────────────────
    
    // Filter for mosques with priority >= 3 to show as recommended
    const recommendedMosques = mosques.filter(m => (m.priority_level || 0) >= 3);

    return (
      <AppShell>
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
              You are exploring the app as a guest.
            </Text>
          </View>
        )}

        {user ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Personalized Mosque</Text>

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
                    Tap the button to find the best mosque for you.
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
          <Text style={styles.cardTitle}>Recommended Mosques (High Priority)</Text>

          {listLoading ? (
            <ActivityIndicator />
          ) : recommendedMosques.length > 0 ? (
            recommendedMosques.map((item) => (
              <View key={item.mosque_id} style={styles.listItem}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.mosqueImage} />
                ) : (
                  <Image source={require("../../assets/images/mosq.jpg")} style={styles.mosqueImage} />
                )}
                <Text style={styles.listItemTitle}>{item.mosque_name}</Text>
                <Text style={styles.details}>Area: {item.area ?? "Not set"}</Text>
                <Text style={styles.details}>
                  Religious people: {item.number_of_religous_people}
                </Text>
                <Text style={styles.details}>
                  Priority: {item.priority_level}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.details}>No recommended mosques found.</Text>
          )}
        </View>
      </AppShell>
    );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 55, 42, 0.62)",
  },

  // ─── Header Bar ────────────────────────────────────────────
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 22, // status bar clearance
    paddingBottom: 12,
    backgroundColor: "rgba(10, 35, 25, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  headerIconButton: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerIcon: {
    width: 22,
    height: 22,
    tintColor: "#ffffff",
  },
  headerIconLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 3,
    fontFamily: "Agdasima-Regular",
  },

  // ─── Profile Dropdown Menu ─────────────────────────────────
  profileMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  profileMenuName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12372a",
    marginBottom: 2,
  },
  profileMenuDetail: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  profileMenuItem: {
    paddingVertical: 8,
  },
  profileMenuItemText: {
    fontSize: 14,
    color: "#12372a",
    fontWeight: "600",
  },
  signOutButton: {
    paddingVertical: 8,
    marginTop: 4,
  },
  signOutButtonText: {
    fontSize: 14,
    color: "#b00020",
    fontWeight: "600",
  },

  // ─── Bottom Tab Bar ────────────────────────────────────────
  bottomTabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 35, 25, 0.67)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingBottom: 10, // safe area for phones with gesture bar
    paddingTop: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    position: "relative",
  },
  bottomTabIcon: {
    width: 24,
    height: 24,
    marginBottom: 3,
  },
  bottomTabLabel: {
    fontSize: 11,
    fontFamily: "Agdasima-Regular",
    letterSpacing: 0.3,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    left: "25%",
    right: "25%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "#e4d211",
  },

  // ─── Page Container ────────────────────────────────────────
  pageContainer: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 12,
  },

  // ─── Welcome Screen ────────────────────────────────────────
  overlay: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "rgba(18, 55, 42, 0.58)",
  },
  welcomeTitle: {
    fontSize: 58,
    fontWeight: "500",
    fontFamily: "BitcountInk",
    color: "#ffffff",
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 24,
    fontFamily: "Agdasima-Regular",
    color: "#eef7f1",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  stayl: {
    fontSize: 20,
    color: "#efdd13",
    fontFamily: "BitcountSingle",
    textAlign: "center",
    marginRight: 2,
  },
  proceedButton: {
    alignSelf: "center",
    width: 230,
    backgroundColor: "Transparent",
    borderWidth: 2,
    borderColor: "#fffbfb",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 32,
  },
  proceedButtonText: {
    color: "#e4d211",
    fontSize: 17,
    fontFamily: "BitcountSingle",
  },

  // ─── Common ────────────────────────────────────────────────
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
    color: "#c8e7d3",
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
    borderColor: "#000000",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#000000",
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
  mosqueImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: "cover",
  },

  // ─── Profile Screen ────────────────────────────────────────
  profileAvatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#12372a",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#e4d211",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#12372a",
    textAlign: "center",
    marginBottom: 20,
  },
  profileInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2ef",
  },
  profileInfoLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  profileInfoValue: {
    fontSize: 14,
    color: "#12372a",
    fontWeight: "600",
  },
  signOutFullButton: {
    backgroundColor: "#b00020",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  signOutFullButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

