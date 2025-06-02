import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Orbitron_400Regular } from '@expo-google-fonts/orbitron';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { Video } from 'expo-av';
import { TextInput } from 'react-native';
import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';





export default function LoginScreen() {

  useEffect( () => {
    async function checkJwt() {
    console.log( await AsyncStorage.getItem('jwt'));
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


  async function savename(jwt: string, email: string) {
   await AsyncStorage.setItem('username', email);
   await AsyncStorage.setItem('jwt', jwt);
  }
 


  const checkLogin = async () => {      
    try {
      if(email == ""  || password == ""){
           Alert.alert("Enter a Valid Email or Password","Invalid Username or Password",[{text:"Okay"}])
      }
      const response = await login(email, password);
      if (response.data.message === "Login accepted") {
        console.log('Login successful!');
        setJwt(response.data.token);
        savename(response.data.token, email);
        router.push('../aipage');
      }
      else if (response.data.message === "New user created") {
        Alert.alert(
          "New User Created",
          "User",
          [
            { text: "Okay", onPress: () => console.log("Retry pressed") },
          ]
        );
        setJwt(response.data.token);
        savename(response.data.token, email);
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
    const response = await axios.post('https://jarvis-ai-8pr6.onrender.com/login', {
      usermail: usermail,
      password: password
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
        <Text style={{ color: 'white', fontSize: 24, textAlign: 'center', top: '60', zIndex: 3, fontFamily: 'Orbitron_400Regular' }}>Login</Text>
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
            <Text style={[styles.fp, isHovered && styles.fphover]}>Forgot Password</Text></Pressable>
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
