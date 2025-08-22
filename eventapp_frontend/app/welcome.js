// app/welcome.js
import { useRouter } from "expo-router";
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MyStyles from "../styles/MyStyles";

const Welcome = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.replace("login");
  };

  const handleSignup = () => {
    router.replace("register");
  };

  return (
    <SafeAreaView style={MyStyles.container}>
      <Image source={require("../assets/images/Logo.png")} style={styles.logo} />
      <Image source={require("../assets/images/welcome.png")} style={styles.bannerImage} />
      <Text style={styles.title}>Welcome to EventGo!</Text>
      <Text style={styles.subTitle}>
        Ứng dụng đặt vé sự kiện nhanh chóng, tiện lợi và an toàn.
        Bắt đầu hành trình trải nghiệm sự kiện ngay hôm nay!
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: "#4CAF50" }]}
          onPress={handleLogin}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
          <Text style={styles.signupText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  logo: {
    height: 40,
    width: 160,
    marginTop: 80,
    resizeMode: "contain",
    alignSelf: "center",
  },
  bannerImage: {
    marginVertical: 25,
    height: 250,
    width: 231,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    paddingHorizontal: 20,
    textAlign: "center",
    color: "#2196F3",
    marginTop: 40,
  },
  subTitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    paddingHorizontal: 20,
    marginVertical: 20,
    textAlign: "center",
    fontFamily: "Segoe UI",
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#2196F3",
    width: "80%",
    height: 60,
    borderRadius: 100,
    overflow: "hidden",
  },
  loginButton: {
    justifyContent: "center",
    alignItems: "center",
    width: "50%",
    borderRadius: 98,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  signupText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2196F3",
  },
});
