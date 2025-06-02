import { Image, StyleSheet, View, Pressable, Text } from 'react-native';
import { useFonts, Orbitron_400Regular } from '@expo-google-fonts/orbitron';
import { useCallback, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [isHovered, setIsHovered] = useState(false);
  const [fontsLoaded] = useFonts({ Orbitron_400Regular });
  const router = useRouter();


  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Video
        source={require('../../assets/videos/bg.mp4')}
        style={styles.bgVideo}
        resizeMode="cover"
        isLooping
        shouldPlay
        isMuted
        onLayout={onLayoutRootView}
      />

      {/* Dark Filter for Transparency Effect */}
      <View style={styles.filter} />

      {/* Centered Text */}
      <Text style={styles.text}>JARVIS</Text>

      {/* Centered GIF Video */}
      <Image
        source={require('../../assets/videos/4872-181170832.gif')}
        style={styles.middlevideo}
      />

      {/* Pressable Button with Hover Effect */}
      <Pressable
        onPressIn={() => setIsHovered(true)}
        onPressOut={() => setIsHovered(false)}
        style={[styles.button, isHovered && styles.buttonHover]}
        onPress={() =>  router.push('../login')} onLongPress={() =>console.log('Button Clicked!')}  
      >
        <Text style={[styles.buttontext, isHovered && styles.buttonTextHover]}>LOGIN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgVideo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  filter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.74)',
    zIndex: 1,
  },
  text: {
    color: 'white',
    fontFamily: 'Orbitron_400Regular',
    fontSize: 40,
    textAlign: 'center',
    zIndex: 2,
    position: 'absolute',
    top: 100,
  },
  middlevideo: {
    width: '150%',
    height: '150%',
    position: 'absolute',
    zIndex: 2,
    resizeMode: 'contain',
    top: '-23%',
  },
  button: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'white',
  },
  buttonHover: {
    backgroundColor: 'skyblue',
    borderWidth: 0,
  },
  buttontext: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center',
  },
  buttonTextHover: {
    color: 'black',
  },
});
