import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient'; // Thư viện tạo gradient background
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';


const Login = () => {
  const router = useRouter(); // Hook để điều hướng giữa các màn hình
  const opacity = useSharedValue(0); // Giá trị ban đầu cho animation opacity (ẩn)
  const scale = useSharedValue(1); // Giá trị ban đầu cho animation scale của button

  // Hiệu ứng khi màn hình load: form fade-in và slide-up
  useEffect(() => {
    opacity.value = withSpring(1, { damping: 10 }); // Damping 10 tạo hiệu ứng spring mượt mà
  }, []);

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
  const handlePress = () => {
    scale.value = withTiming(0.95, { duration: 100 }, () => { // Thu nhỏ 5% khi nhấn
      scale.value = withTiming(1, { duration: 100 }); // Trở lại kích thước ban đầu
    });
    // Logic đăng nhập sẽ thêm sau khi giao diện xong
  };

  // Xử lý khi nhấn nút back để quay về welcome
  const handleBack = () => {
    router.back(); // Quay lại màn hình trước (welcome)
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
        {/* Input cho username hoặc email */}
        <TextInput
          style={styles.input}
          placeholder="Tên người dùng hoặc Email"
          placeholderTextColor="#BBB"
          autoCapitalize="none"
        />
        {/* Input cho password */}
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          secureTextEntry
          placeholderTextColor="#BBB"
        />
        {/* "Quên mật khẩu" nằm dưới ô input mật khẩu */}
        <TouchableOpacity onPress={() => console.log('Quên mật khẩu clicked')} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPassword}>Quên mật khẩu</Text>
        </TouchableOpacity>
        {/* Button Đăng nhập với animation */}
        <Animated.View style={animatedButtonStyle}>
          <Pressable style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </Pressable>
        </Animated.View>
        <Text style={styles.subText}>
          Hoặc đăng nhập bằng tài khoản Google
        </Text>
        {/* Nút Google (placeholder, logic sẽ thêm sau) */}
        <Pressable style={styles.googleButton} onPress={() => console.log('Đăng nhập Google sẽ thêm sau')}>
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