import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from "expo-auth-session/providers/google";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient'; // Thư viện tạo gradient background
import { useRouter } from 'expo-router';
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import qs from 'qs'; // thu vien giup stringify object thanh form-urlencoded
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { auth } from './firebase';
import api, { endpoints } from '../services/api';
import * as AuthSession from 'expo-auth-session';


WebBrowser.maybeCompleteAuthSession();


const Login = () => {
  const router = useRouter(); // Hook để điều hướng giữa các màn hình
  const opacity = useSharedValue(0); // Giá trị ban đầu cho animation opacity (ẩn)
  const scale = useSharedValue(1); // Giá trị ban đầu cho animation scale của button

  // State để quản lý form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // State để quản lý trạng thái loading

  // Sử dụng redirectUri của Expo proxy
  // Tạo redirectUri động với proxy cho Expo Go
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  console.log('Redirect URI:', redirectUri);
  // Cấu hình Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "986556347009-3e51v68q4vp643nsgscttdlfl49jukpe.apps.googleusercontent.com",
    androidClientId: "986556347009-8ufou26gfe92vkbhs1vjuo4v49gso4g3.apps.googleusercontent.com",
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }), // đảm bảo dev chạy qua proxy
  }, {
    useProxy: true, // Sử dụng proxy của Expo
    selectAccount: true, // Cho phép chọn tài khoản Google
  });

  

  // Client ID và Client Secret từ backend
  const CLIENT_ID = 'INuD9I5SADMpikgGPfdgZeYKdu1NncPKrDs7b70l';
  const CLIENT_SECRET = 'DjFi2UJC1VpacmEdA2KngGZUWAHxEBY2Ek6reKahAhT3ckau7mR5fQY3Lg0PFDKTmEPGScHJR3CiVCmH7UxwOe0odSwuJ4IKqxLb7r9e2PiYIYIHyHNJ4frH7RpRqaEL';

  // Hiệu ứng khi màn hình load: form fade-in và slide-up
  useEffect(() => {
    opacity.value = withSpring(1, { damping: 10 }); // Damping 10 tạo hiệu ứng spring mượt mà
  }, []);

  useEffect(() => {
    if (response) {
      console.log('Google Auth Response:', JSON.stringify(response));
      if (response.type === 'success' && response.authentication) {
        (async () => {
          try {
            const { idToken } = response.authentication;
            console.log('ID Token:', idToken);
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;
            const firebaseToken = await user.getIdToken();
            console.log('Firebase ID Token:', firebaseToken);
            const res = await api.post(endpoints.googleLogin, { token: firebaseToken });
            console.log('Backend Response:', res.data);
            await AsyncStorage.setItem('access-token', res.data.access_token);
            authApi.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${response.data.access_token}`;
            if (res.data.refresh_token) {
              await AsyncStorage.setItem('refresh-token', res.data.refresh_token);
            }
            Alert.alert('Thành công', 'Đăng nhập Google thành công!');
            router.push('/tabs');
          } catch (error) {
            console.error('Google login error:', error);
            Alert.alert('Lỗi', `Đăng nhập Google thất bại: ${error.message}`);
          }
        })();
      } else {
        console.log('Google Auth Failed or Cancelled:', response);
        Alert.alert('Lỗi', `Đăng nhập Google bị hủy: ${JSON.stringify(response)}`);
      }
    }
  }, [response]);


  // Tạo style animation cho form (opacity và translateY)
  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 800 }), // Tăng opacity trong 800ms
    transform: [{ translateY: withSpring(opacity.value ? 0 : 50, { damping: 10 }) }], // Slide từ dưới lên
  }));

  // Tạo style animation cho button (scale khi nhấn)
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Xử lý khi nhấn button Đăng nhập (hiệu ứng scale)
  const handleLogin = async () => {
    // animation khi nhấn nút
    scale.value = withTiming(0.95, { duration: 100 }, () => { // Thu nhỏ 5% khi nhấn
      scale.value = withTiming(1, { duration: 100 }); // Trở lại kích thước ban đầu
    });
    // validate input trống
    if (!username.trim() || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setLoading(true); // Bắt đầu loading

    // dữ liệu login gửi đi
    const data = {
      username: username,
      password: password,
      grant_type: 'password',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    };
    try {
      //  gửi request đăng nhập
    const response = await api.post(endpoints['login'], qs.stringify(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
      console.log('Login response:', response.data);
      // Lưu token vào AsyncStorage để tái sử dụng
      await AsyncStorage.setItem('access-token', response.data.access_token);
      await AsyncStorage.setItem('refresh-token', response.data.refresh_token);
      Alert.alert('Thành công', 'Đăng nhập thành công!');
      router.push('/tabs');
    } catch (error) {      
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      // bắt lỗi từ response của server
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.error === 'invalid_grant' || (errorData.error_description && errorData.error_description.includes("Invalid credentials"))) {
          errorMessage = "Sai tên đăng nhập hoặc mật khẩu.";
        }
      // Bắt lỗi liên quan đến mạng (không có kết nối, server không phản hồi)
      } else if (error.request) {
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.";
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false); // Kết thúc loading
    }
  };

  // ham login với google
//   const handleGoogleLogin = async () => {
//     try {
//       console.log('Starting Google login...');
//        // Gọi promptAsync để hiển thị popup login Google
//     const result = await promptAsync();
//       console.log('Google Auth Result:', JSON.stringify(result));

//     if (result.type === 'success' && result.authentication) {
//       const { idToken } = result.authentication;
//       console.log('Google ID Token:', idToken);

//       // Tạo credential Firebase từ idToken
//       const credential = GoogleAuthProvider.credential(idToken);

//       // Đăng nhập Firebase
//       const userCredential = await signInWithCredential(auth, credential);
//       const user = userCredential.user;

//       // Lấy Firebase ID token để gửi lên backend
//       const firebaseToken = await user.getIdToken();
//       console.log('Firebase ID Token:', firebaseToken);

//       // Gửi token lên backend để tạo session
//       const res = await api.post(endpoints.googleLogin, { token: firebaseToken });
//       console.log('Backend Google Login Response:', res.data);
//       await AsyncStorage.setItem('access-token', res.data.access_token);
//       if (res.data.refresh_token) {
//         await AsyncStorage.setItem('refresh-token', res.data.refresh_token);
//       }

//       Alert.alert('Thành công', 'Đăng nhập Google thành công!');
//       router.push('/tabs/tickets');
//     } else {
//       Alert.alert('Lỗi', 'Đăng nhập Google bị hủy.');
//     }
//   } catch (error) {
//     console.error('Google login error:', error);
// Alert.alert('Lỗi', `Đăng nhập Google thất bại: ${error.message}`);  }
// };
  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google login...');
      console.log('Request URL:', request?.url); // Debug URL gửi đi
      if (!request) {
        console.log('Request not ready');
        Alert.alert('Lỗi', 'Yêu cầu đăng nhập Google chưa sẵn sàng.');
        return;
      }
      // Mở WebView in-app thay vì trình duyệt bên ngoài
      await promptAsync();
    } catch (error) {
      console.error('Prompt Async Error:', error);
      Alert.alert('Lỗi', `Lỗi khi mở đăng nhập Google: ${error.message}`);
    }
  };

  // Xử lý khi nhấn nút back để quay về welcome
  const handleBack = () => {
    router.push('/welcome'); // Navigate to the welcome screen 
  };

  return (
  <SafeAreaView style={styles.container}>
    {/* Gradient background phủ toàn màn hình */}
    <LinearGradient colors={['#fface8', '#00c9ff']} style={styles.background} />
    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Image source={require("../assets/images/previous.png")} style={styles.backIcon} />
    </TouchableOpacity>
    <BlurView intensity={80} style={styles.blurBackground}>
      {/* Gradient overlay để tăng hiệu ứng kính mờ */}
      <LinearGradient
        colors={['rgba(254, 255, 255, 0.2)', 'rgba(203, 255, 204, 0.2)']}
        style={styles.gradientOverlay}
      />
      {/* Header với nút back và text chào */}
      <View style={styles.header}>        
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeTop}>Heyy,</Text>
          <Text style={styles.welcomeBottom}>Bạn đã trở lại!</Text>
        </View>
      </View>
      <Animated.View style={[styles.formContainer, animatedFormStyle]}>
        <Text style={styles.title}>Đăng nhập</Text>
        {/* Input cho username */}
        <TextInput
          style={styles.input}
          placeholder="Tên người dùng"
          placeholderTextColor="#BBB"
          autoCapitalize="none"
          value = {username}
          onChangeText={setUsername}
        />
        {/* Input cho password */}
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          secureTextEntry
          placeholderTextColor="#BBB"
          value = {password}
          onChangeText={setPassword}
        />
        {/* "Quên mật khẩu" nằm dưới ô input mật khẩu */}
        <TouchableOpacity onPress={() => console.log('Quên mật khẩu clicked')} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPassword}>Quên mật khẩu</Text>
        </TouchableOpacity>
        {/* Button Đăng nhập với animation */}
        <Animated.View style={animatedButtonStyle}>
          <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
          </Pressable>
        </Animated.View>
        <Text style={styles.subText}>
          Hoặc đăng nhập bằng tài khoản Google
        </Text>
        {/* Nút Google (placeholder, logic sẽ thêm sau) */}
        <Pressable style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleText}>Đăng nhập với Google</Text>          
        </Pressable>
        {/* Link chuyển sang đăng ký */}
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
        </TouchableOpacity>
      </Animated.View>
    </BlurView>
  </SafeAreaView>
);
};

export default Login;

const styles = StyleSheet.create({
  // Căn giữa toàn bộ
  container: {
    flex: 1, 
  },
  // Gradient phủ toàn màn hình
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  // Full screen
  blurBackground: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Full screen overlay
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  // Header chứa nút back và welcome text
  header: {
    flexDirection: 'column', 
    alignItems: 'flex-start', // Căn trái
    width: '85%',    
    paddingTop: 10,
    marginBottom: 20,
  },
  // Vị trí nút back điều chỉnh
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 5,
    zIndex: 1, // Đảm bảo nút back nằm trên các thành phần khác
  },
  // Kiểu icon nút back
  backIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain', // Đảm bảo hình ảnh vừa với kích thước đã đặt
  },
  welcomeText: {
    flex: 1,
    //alignItems: 'left',
  },  
  welcomeTop: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 20,
  },
  welcomeBottom: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',

  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotPassword: {
    color: '#334da0ff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 10,
    textDecorationLine: 'underline',

  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end', // Căn phải dưới ô input
  },
  
  // Container form điều chỉnh kích thước
  formContainer: {
    width: '85%',
    maxWidth: 400, // Giới hạn độ rộng tối đa
    alignItems: 'center',
    padding: 20,
  },
  // Tiêu đề
  title: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  // Kiểu chữ phụ subtext
  subText: {
    color: '#2b1871ff',
    fontSize: 13,
    marginTop: 30,
    textAlign: 'center',
  },
  // Kiểu input
  input: {
    width: '100%',
    padding: 12,
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'rgba(19, 137, 27, 0.2)',
  },
  // Kiểu button Đăng nhập
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    elevation: 5,
  },
  // Kiểu chữ button
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Kiểu nút Google
  googleButton: {
    backgroundColor: '#ffffffff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    elevation: 3,
  },
  // Kiểu chữ nút Google
  googleText: {
    color: '#0088a0ff',
    fontSize: 16,
    fontWeight: '500',
  },
  // Kiểu link
  linkText: {
    color: '#2196F3',
    fontSize: 15,
    marginTop: 20,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});