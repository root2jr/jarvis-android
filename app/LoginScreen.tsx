import { View, Text, Pressable} from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Orbitron_400Regular } from '@expo-google-fonts/orbitron';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { useState } from 'react';
import { Video } from 'expo-av';
import { TextInput } from 'react-native';


export default function LoginScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Orbitron_400Regular });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isHoveredlog, setIsHoveredlog] = useState(false);


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
        source={require('../assets/videos/bg.mp4')}
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
          <Pressable  onPressIn={() => setIsHovered(true)} onPressOut={() => setIsHovered(false)}>
          <Text style={[styles.fp, isHovered && styles.fphover]}>Forgot Password</Text></Pressable>
          <Pressable onPressIn={() => setIsHoveredlog(true)} onPressOut={() => setIsHoveredlog(false)} onPress={() => router.push('../aichat')} onLongPress={() => console.log('Button Clicked!')}>
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
    zIndex: 5,
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 40,
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontFamily: 'Orbitron_400Regular',
  },
  input2: {
    zIndex: 5,
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
  fphover:{
    color: 'white',
    fontFamily: 'Orbitron_400Regular',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  button:{
    color: 'white',
    fontFamily: 'Orbitron_400Regular',
    marginTop: 30,
    borderColor: 'white',
    borderWidth: 1,
    padding: 20,
    borderRadius: 30,
  },
  logbutton:{
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
