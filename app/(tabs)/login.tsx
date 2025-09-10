import { Orbitron_400Regular } from '@expo-google-fonts/orbitron';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Video } from 'expo-av';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';



export default function LoginScreen() {


  async function getPushToken() {
    try {
      // Check if already stored
      let token = await AsyncStorage.getItem("expoPushToken");
      if (token) {
        console.log("Using cached token:", token);
        return token;
      }

      // Ask permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token!');
        return null;
      }

      // Get new token
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "5a9db27b-87ee-4bfa-bd8f-ea806380a2f0",
        })
      ).data;
      console.log("Generated new token:", token);

      await AsyncStorage.setItem("expoPushToken", token);



      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (err) {
      console.error("Error getting push token:", err);
      return null;
    }
  }

  useEffect(() => {
    async function checkJwt() {
      console.log(await AsyncStorage.getItem('jwt'));
      let pass = await AsyncStorage.getItem('jwt');
      if (pass) {
        router.push('../aipage');
      }
    }

    checkJwt();
  }, [])

  const router = useRouter();
  const [fontsLoaded] = useFonts({ Orbitron_400Regular });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isHoveredlog, setIsHoveredlog] = useState(false);
  const [jwt, setJwt] = useState('');
  const infoRef = useRef(false);


  async function savename(jawt: string, email: string) {
    await AsyncStorage.setItem('username', email);
    await AsyncStorage.setItem('jwt', jawt);
  }



  const checkLogin = async () => {
    try {
      const token = await getPushToken();
      if (email == "" || password == "") {
        Alert.alert("Enter a Valid Email or Password", "Invalid Username or Password", [{ text: "Okay" }])
      }
      const response = await login(email, password, token);
      if (response.data.message === "Login accepted") {
        console.log('Login successful!');
        setJwt(response.data.token);
        await savename(response.data.token, email);
        router.push('../aipage');
      }
      else if (response.data.message === "New user created") {
        Alert.alert(
          "New User Created",
          "Now, you may login with your credentials.",
          [
            { text: "Okay", onPress: () => console.log("Retry pressed") }
          ]
        );
        console.log(response.data.token);
        setJwt(response.data.token);
        await savename(response.data.token, email);
        router.push('../aipage');
      }
      else {
        console.log('Login failed!');
        infoRef.current = true;
        Alert.alert(
          "Login Failed",
          "Invalid email or password",
          [
            { text: "Retry", onPress: () => console.log("Retry pressed") },
            { text: "Cancel", style: "cancel" }
          ]
        );
        setPassword('');
      }
    } catch (error) {
      console.error('Error logging in:', error);
    }
  }
  const login = async (usermail: string, password: string) => {
    const token = await getPushToken();
    const response = await axios.post('https://jarvis-ai-8pr6.onrender.com/login', {
      usermail: usermail,
      password: password,
      telegramToken: token,
      android: true
    });
    console.log(response.data);
    return response;
  }




  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.viewstyle}>
      <Video
        source={require('../../assets/videos/bg.mp4')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        isLooping
        shouldPlay
        isMuted
        onLayout={onLayoutRootView} />
      <View style={styles.inputs}>
        <Text style={{ color: 'white', fontSize: 24, textAlign: 'center', top: 60, zIndex: 3, fontFamily: 'Orbitron_400Regular' }}>Login</Text>
        <View style={styles.inputsbox}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="gray"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input2}
            placeholder="Password"
            placeholderTextColor="gray"
            secureTextEntry={true}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPressIn={() => setIsHovered(true)} onPressOut={() => setIsHovered(false)}>
            <Text style={[styles.fp, isHovered && styles.fphover]} onPress={() => { Alert.alert("Change Password", "Continue to our website to change your password", [{ text: "NO THANKS" }, { text: "Open Website", onPress: () => { Linking.openURL("https://j-a-r-v-i-s-ai.netlify.app") } }]) }}>Forgot Password</Text></Pressable>
          <Pressable onPressIn={() => setIsHoveredlog(true)} onPressOut={() => setIsHoveredlog(false)} onPress={checkLogin} onLongPress={() => console.log('Button Clicked!')}>
            <Text style={[styles.button, isHoveredlog && styles.logbutton]}>Login</Text>
          </Pressable>
        </View>
      </View>
    </View>



  );
}
const styles = StyleSheet.create({
  viewstyle: {
    flex: 1,
    backgroundColor: 'black',
    zIndex: 1,
    fontFamily: 'Orbitron_400Regular'
  },
  inputs: {
    width: '100%',
    height: '100%',
    zIndex: 2,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.69)'
  },
  inputsbox: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
    justifyContent: 'center',
    marginTop: 50,
  },
  input: {
    zIndex: 35,
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 40,
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontFamily: 'Orbitron_400Regular',
  },
  input2: {
    zIndex: 35,
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 40,
    padding: 10,
    paddingLeft: 20,
    marginTop: 20,
    paddingRight: 20,
    fontFamily: 'Orbitron_400Regular',
  },
  fp: {
    color: 'white',
    fontFamily: 'Orbitron_400Regular',
    marginTop: 20,
  },
  fphover: {
    color: 'white',
    fontFamily: 'Orbitron_400Regular',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  button: {
    color: 'white',
    fontFamily: 'Orbitron_400Regular',
    marginTop: 30,
    borderColor: 'white',
    borderWidth: 1,
    padding: 20,
    borderRadius: 30,
  },
  logbutton: {
    color: 'black',
    fontFamily: 'Orbitron_400Regular',
    marginTop: 30,
    borderColor: 'white',
    borderWidth: 0,
    padding: 20,
    borderRadius: 30,
    backgroundColor: 'skyblue',
  },

});
