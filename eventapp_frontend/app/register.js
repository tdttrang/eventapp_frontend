import React, { useEffect } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; // Thư viện tạo gradient background
// thư viện picker để tạo dropdown chọn role
import { Picker } from '@react-native-picker/picker';

const Register = () => {
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

  // Xử lý khi nhấn button Đăng ký (hiệu ứng scale)
  const handlePress = () => {
    scale.value = withTiming(0.95, { duration: 100 }, () => { // Thu nhỏ 5% khi nhấn
      scale.value = withTiming(1, { duration: 100 }); // Trở lại kích thước ban đầu
    });
    // Logic đăng ký sẽ thêm sau khi giao diện xong
  };

  // Xử lý khi nhấn nút back để quay về welcome
  const handleBack = () => {
    router.back(); // Quay lại màn hình trước (welcome)
  };

  return (
    <View style={styles.container}>
      {/* Gradient background phủ toàn màn hình */}
      <LinearGradient colors={['#1A1A1A', '#333']} style={styles.background} />
      <BlurView intensity={80} style={styles.blurBackground}>
        {/* Gradient overlay để tăng hiệu ứng kính mờ */}
        <LinearGradient
          colors={['rgba(33, 150, 243, 0.2)', 'rgba(76, 175, 80, 0.2)']}
          style={styles.gradientOverlay}
        />
        {/* Nút back ở góc trên cùng bên trái */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Animated.View style={[styles.formContainer, animatedFormStyle]}>
          {/* Logo đồng bộ với welcome screen */}
          <Image source={require("../assets/images/Logo.png")} style={styles.logo} />
          <Text style={styles.title}>Đăng ký</Text>
          {/* Input cho username */}
          <TextInput
            style={styles.input}
            placeholder="Tên người dùng"
            placeholderTextColor="#BBB"
            autoCapitalize="none"
          />
          {/* Input cho email */}
          <TextInput
            style={styles.input}
            placeholder="Email"
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
          {/* Input cho confirm password */}
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu"
            secureTextEntry
            placeholderTextColor="#BBB"
          />
          {/* Dropdown chọn role */}
          <View style={styles.pickerContainer}>
            <Picker style={styles.picker} selectedValue="participant">
              <Picker.Item label="Người tham gia" value="participant" />
              <Picker.Item label="Nhà tổ chức" value="organizer" />
            </Picker>
          </View>
          {/* Button Đăng ký với animation */}
          <Animated.View style={animatedButtonStyle}>
            <Pressable style={styles.button} onPress={handlePress}>
              <Text style={styles.buttonText}>Đăng ký</Text>
            </Pressable>
          </Animated.View>
          {/* Nút Google (placeholder, logic sẽ thêm sau) */}
          <Pressable style={styles.googleButton} onPress={() => console.log('Đăng nhập Google sẽ thêm sau')}>
            <Text style={styles.googleText}>Đăng nhập với Google</Text>
          </Pressable>
          {/* Link chuyển sang đăng nhập */}
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  // Căn giữa toàn bộ
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Gradient phủ toàn màn hình
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  // Full screen, bỏ modal
  blurBackground: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Full screen overlay
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  // Vị trí nút back điều chỉnh
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 5,
  },
  // Kiểu chữ nút back
  backText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Container form điều chỉnh kích thước
  formContainer: {
    width: '60%',
    alignItems: 'center',
    padding: 20,
  },
  // Logo kích thước
  logo: {
    height: 40,
    width: 160,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  // Tiêu đề
  title: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  // Kiểu input
  input: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Container cho dropdown
  pickerContainer: {
    width: '100%',
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Kiểu dropdown
  picker: {
    height: 50,
    color: '#FFF',
  },
  // Kiểu button Đăng ký
  button: {
    backgroundColor: '#2196F3',
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
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    elevation: 3,
  },
  // Kiểu chữ nút Google
  googleText: {
    color: '#757575',
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