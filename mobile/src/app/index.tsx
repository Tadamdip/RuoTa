import { useState } from "react";
import type { PropsWithChildren } from "react";
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
  first_name?: string;
  last_name?: string;
  full_name: string;
  contact_number?: string;
  representing_area: string;
  representing_mosque: string;
  role?: string;
};

type ScreenName =
  | "welcome"
  | "signup"
  | "login"
  | "main"
  | "mosques"
  | "maps"
  | "todos"
  | "settings"
  | "profile";

export default function HomeScreen() {
  const [screen, setScreen] = useState<ScreenName>("welcome");
  const [user, setUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [representingArea, setRepresentingArea] = useState("");
  const [representingMosque, setRepresentingMosque] = useState("");

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  function goToScreen(nextScreen: ScreenName) {
    setError("");
    setMessage("");
    setShowProfileMenu(false);
    setScreen(nextScreen);
  }

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

  async function enterApp() {
    goToScreen("main");
    await loadMosques();
  }

  async function viewWithoutLogin() {
    setUser(null);
    setMosque(null);
    goToScreen("mosques");
    await loadMosques();
  }

  async function handleSignup() {
    setMessage("");
    setError("");

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !contactNumber.trim() ||
      !representingArea.trim() ||
      !representingMosque.trim()
    ) {
      setMessage("Please complete all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/signup.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          contact_number: contactNumber.trim(),
          representing_area: representingArea.trim(),
          representing_mosque: representingMosque.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage(data.message || "Sign up failed.");
        return;
      }

      setMessage("Sign up successful. You can now login.");
      setScreen("login");
    } catch {
      setMessage("Cannot connect to signup API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setMessage("");
    setError("");

    if (!firstName.trim() || !lastName.trim() || !contactNumber.trim()) {
      setMessage("Please enter your first name, last name, and contact number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          contact_number: contactNumber.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage(data.message || "Login failed.");
        return;
      }

      const apiUser = data.user as User;

      setUser({
        ...apiUser,
        full_name:
          apiUser.full_name ||
          `${apiUser.first_name ?? firstName} ${apiUser.last_name ?? lastName}`,
      });

      setMosque(null);
      setMessage("");
      setScreen("main");
      await loadMosques();
    } catch {
      setMessage("Cannot connect to login API.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    setUser(null);
    setMosque(null);
    setFirstName("");
    setLastName("");
    setContactNumber("");
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

  function HeaderBar() {
    return (
      <View style={styles.headerBar}>
        <Pressable style={styles.headerLeft} onPress={enterApp}>
          <Text style={styles.headerTitle}>Routa</Text>
        </Pressable>

        <View style={styles.headerRight}>
          {user ? (
            <View>
              <Pressable
                style={styles.headerIconButton}
                onPress={() => setShowProfileMenu(!showProfileMenu)}
              >
                <MaterialCommunityIcons
                  name="account-circle"
                  size={24}
                  color="#ffffff"
                />
                <Text style={styles.headerIconLabel}>Profile</Text>
              </Pressable>

              {showProfileMenu && (
                <View style={styles.profileMenu}>
                  <Text style={styles.profileMenuName}>{user.full_name}</Text>
                  <Text style={styles.profileMenuDetail}>
                    {user.representing_area || "No area"}
                  </Text>

                  <View style={styles.profileMenuDivider} />

                  <Pressable
                    style={styles.profileMenuItem}
                    onPress={() => goToScreen("profile")}
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
            <>
              <Pressable
                style={styles.headerIconButton}
                onPress={() => goToScreen("signup")}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={24}
                  color="#ffffff"
                />
                <Text style={styles.headerIconLabel}>Sign Up</Text>
              </Pressable>

              <Pressable
                style={styles.headerIconButton}
                onPress={() => goToScreen("login")}
              >
                <MaterialCommunityIcons
                  name="login"
                  size={24}
                  color="#ffffff"
                />
                <Text style={styles.headerIconLabel}>Login</Text>
              </Pressable>
            </>
          )}

          <Pressable
            style={styles.headerIconButton}
            onPress={() => goToScreen("settings")}
          >
            <MaterialCommunityIcons name="cog" size={24} color="#ffffff" />
            <Text style={styles.headerIconLabel}>Settings</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function BottomTabBar() {
    const tabs: { key: ScreenName; label: string; icon: string }[] = [
      { key: "main", label: "Home", icon: "home" },
      { key: "mosques", label: "Mosques", icon: "mosque" },
      { key: "maps", label: "Maps", icon: "map-marker" },
      { key: "todos", label: "To Do's", icon: "checkbox-marked-outline" },
    ];

    return (
      <View style={styles.bottomTabBar}>
        {tabs.map((tab) => {
          const active = tab.key === screen;

          return (
            <Pressable
              key={tab.label}
              style={styles.bottomTab}
              onPress={async () => {
                if (tab.key === "mosques") {
                  goToScreen("mosques");
                  await loadMosques();
                } else {
                  goToScreen(tab.key);
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

  if (screen === "welcome") {
    return (
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
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

          <Pressable style={styles.proceedButton} onPress={enterApp}>
            <Text style={styles.proceedButtonText}>Click to proceed</Text>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

  if (screen === "signup") {
    return (
      <AppShell>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Create your Routa account</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Information</Text>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInput
            style={styles.input}
            placeholder="Contact Number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Representing Area"
            value={representingArea}
            onChangeText={setRepresentingArea}
          />

          <TextInput
            style={styles.input}
            placeholder="Representing Mosque"
            value={representingMosque}
            onChangeText={setRepresentingMosque}
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>
              {loading ? "Creating..." : "Create Account"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => goToScreen("login")}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? Login
            </Text>
          </Pressable>
        </View>
      </AppShell>
    );
  }

  if (screen === "login") {
    return (
      <AppShell>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Enter your registered information</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login Information</Text>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInput
            style={styles.input}
            placeholder="Contact Number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => goToScreen("signup")}
          >
            <Text style={styles.secondaryButtonText}>Create New Account</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={viewWithoutLogin}>
            <Text style={styles.secondaryButtonText}>View Mosque List</Text>
          </Pressable>
        </View>
      </AppShell>
    );
  }

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
              <Text style={styles.profileInfoLabel}>Contact</Text>
              <Text style={styles.profileInfoValue}>
                {user.contact_number || "Not provided"}
              </Text>
            </View>

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

            <Pressable style={styles.button} onPress={() => goToScreen("login")}>
              <Text style={styles.buttonText}>Go to Login</Text>
            </Pressable>
          </View>
        )}
      </AppShell>
    );
  }

  if (screen === "maps") {
    return (
      <AppShell>
        <Text style={styles.title}>Maps</Text>
        <Text style={styles.subtitle}>Map feature will be added here.</Text>
      </AppShell>
    );
  }

  if (screen === "todos") {
    return (
      <AppShell>
        <Text style={styles.title}>To Do's</Text>
        <Text style={styles.subtitle}>
          Tasks and visit plans will be added here.
        </Text>
      </AppShell>
    );
  }

  if (screen === "settings") {
    return (
      <AppShell>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>App settings will be added here.</Text>
      </AppShell>
    );
  }

  if (screen === "mosques") {
    return (
      <AppShell>
        <Text style={styles.title}>Mosques</Text>
        <Text style={styles.subtitle}>All Mosques</Text>

        <View style={styles.card}>
          <Pressable style={styles.button} onPress={loadMosques}>
            <Text style={styles.buttonText}>Refresh List</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {listLoading ? (
            <ActivityIndicator />
          ) : mosques.length > 0 ? (
            mosques.map((item) => (
              <View key={item.mosque_id} style={styles.listItem}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.mosqueImage}
                  />
                ) : (
                  <Image
                    source={require("../../assets/images/mosq.jpg")}
                    style={styles.mosqueImage}
                  />
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

  const recommendedMosques = mosques.filter(
    (item) => (item.priority_level || 0) >= 3
  );

  return (
    <AppShell>
      <Text style={styles.title}>Routa</Text>
      <Text style={styles.subtitle}>Main Page</Text>

      {user ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logged User</Text>
          <Text style={styles.details}>Name: {user.full_name}</Text>
          <Text style={styles.details}>
            Contact: {user.contact_number || "Not provided"}
          </Text>
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
          <Text style={styles.details}>You are exploring the app as a guest.</Text>

          <Pressable style={styles.button} onPress={() => goToScreen("login")}>
            <Text style={styles.buttonText}>Login to Get Suggestion</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={viewWithoutLogin}>
            <Text style={styles.secondaryButtonText}>View Mosque List</Text>
          </Pressable>
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
                <Text style={styles.mosqueName}>
                  No recommendation loaded yet
                </Text>
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
        <Text style={styles.cardTitle}>Recommended Mosques</Text>

        {listLoading ? (
          <ActivityIndicator />
        ) : recommendedMosques.length > 0 ? (
          recommendedMosques.map((item) => (
            <View key={item.mosque_id} style={styles.listItem}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.mosqueImage}
                />
              ) : (
                <Image
                  source={require("../../assets/images/mosq.jpg")}
                  style={styles.mosqueImage}
                />
              )}

              <Text style={styles.listItemTitle}>{item.mosque_name}</Text>
              <Text style={styles.details}>Area: {item.area ?? "Not set"}</Text>
              <Text style={styles.details}>
                Religious people: {item.number_of_religous_people}
              </Text>
              <Text style={styles.details}>Priority: {item.priority_level}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.details}>No recommended mosques found.</Text>
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 55, 42, 0.62)",
  },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 12,
    backgroundColor: "rgba(10, 35, 25, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    zIndex: 10,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  headerIconButton: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  headerIconLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    marginTop: 3,
    fontFamily: "Agdasima-Regular",
  },

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

  bottomTabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 35, 25, 0.67)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingBottom: 10,
    paddingTop: 8,
  },

  bottomTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    position: "relative",
  },

  bottomTabLabel: {
    fontSize: 11,
    fontFamily: "Agdasima-Regular",
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

  pageContainer: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 12,
  },

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
    backgroundColor: "transparent",
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

  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#ffffff",
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

  message: {
    marginTop: 6,
    marginBottom: 8,
    color: "#12372a",
    fontWeight: "700",
    textAlign: "center",
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