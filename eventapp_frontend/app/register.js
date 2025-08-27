import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import api, { endpoints } from '../services/api';

const Register = () => {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // State for form inputs and validation
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('attendee');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Animation effect on screen load
  useEffect(() => {
    opacity.value = withSpring(1, { damping: 10 });
  }, []);

  // Animated style for form
  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 800 }),
    transform: [{ translateY: withSpring(opacity.value ? 0 : 50, { damping: 10 }) }],
  }));

  // Animated style for button
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Tên người dùng không được để trống';
    if (!email.trim()) newErrors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email không hợp lệ';
    if (!password) newErrors.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle register button press
  const handleRegister = async () => {
    scale.value = withTiming(0.95, { duration: 100 }, () => {
      scale.value = withTiming(1, { duration: 100 });
    });
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    const userData = {
      username,
      email,
      password,
    };

    // Determine endpoint based on role
    const endpoint = role === 'attendee' ? endpoints['registerAttendee'] : endpoints['registerOrganizer'];
    try {
      const responese = await api.post(endpoint, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Register response:', responese.data);
      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
    }
    catch (error) {
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại!';
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.username) {
          errorMessage = "Tên người dùng đã tồn tại";
        } else if (errorData.email) {
          errorMessage = "Email đã được sử dụng";
        } else {
          const errorMessages = Object.values(errorData).flat();
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
          }
        }
      }
    Alert.alert('Lỗi', errorMessage);
  } finally {
      setLoading(false);
    }
  };

  // Handle back button press
  const handleBack = () => {
    router.push('/Welcome'); // Navigate to the welcome screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fface8', '#00c9ff']} style={styles.background} />
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Image source={require("../assets/images/previous.png")} style={styles.backIcon} />
      </TouchableOpacity>
      <BlurView intensity={80} style={styles.blurBackground}>
        <LinearGradient
          colors={['rgba(254, 255, 255, 0.2)', 'rgba(203, 255, 204, 0.2)']}
          style={styles.gradientOverlay}
        />
        <View style={styles.header}>
          <View style={styles.welcomeTextContainer}>
          </View>
        </View> 
        <Animated.View style={[styles.formContainer, animatedFormStyle]}>
          <Text style={styles.title}>Đăng ký</Text>
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            placeholder="Tên người dùng"
            placeholderTextColor="#BBB"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email"
            placeholderTextColor="#BBB"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Mật khẩu"
            secureTextEntry
            placeholderTextColor="#BBB"
            value={password}
            onChangeText={setPassword}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Xác nhận mật khẩu"
            secureTextEntry
            placeholderTextColor="#BBB"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          <View style={[styles.input, styles.pickerContainer]}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Người tham gia" value="attendee" />
              <Picker.Item label="Nhà tổ chức" value="organizer" />
            </Picker>
          </View>
          <Animated.View style={animatedButtonStyle}>
            <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Đăng ký</Text>}
            </Pressable>
          </Animated.View>
          <Text style={styles.subText}>
            Hoặc đăng ký bằng tài khoản Google
          </Text>
          <Pressable style={styles.googleButton} onPress={() => console.log('Đăng ký Google sẽ thêm sau')}>
            <Text style={styles.googleText}>Đăng ký với Google</Text>
          </Pressable>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </SafeAreaView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  blurBackground: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '85%',
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 5,
    zIndex: 1,
  },
  backIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  welcomeTextContainer: {
    flex: 1,
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
  formContainer: {
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  subText: {
    color: '#2b1871ff',
    fontSize: 13,
    marginTop: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical:5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'rgba(19, 137, 27, 0.2)',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: 'rgba(19, 137, 27, 0.2)',
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  picker: {
    color: '#FFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#ffffffff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    elevation: 3,
  },
  googleText: {
    color: '#0088a0ff',
    fontSize: 16,
    fontWeight: '500',
  },
  linkText: {
    color: '#2196F3',
    fontSize: 15,
    marginTop: 20,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});