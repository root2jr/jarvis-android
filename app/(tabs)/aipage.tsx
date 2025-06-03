import { Orbitron_400Regular, useFonts } from '@expo-google-fonts/orbitron';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Video } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated, Dimensions, FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { startListening } from './speechtotext';



const width = Dimensions.get("window").width;
const AiChat = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechText, setSpeechText] = useState("");
    const flatListRef = useRef(null);
    const [fontsLoaded] = useFonts({ Orbitron_400Regular });
    const [jwt, setJwt] = useState('');
    const [visible, setVisible] = useState(false);
    const [button1, setButton1] = useState(false);
    const slideAnim = useRef(new Animated.Value(-width * 5)).current;
    const [voicemode, setVoicemode] = useState(false);
    const [delbutton,setDelbutton] = useState(false);
    const toggleOverlay = () => {
        Animated.timing(slideAnim, {
            toValue: visible ? -width : 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setVisible(!visible));
    };


    useEffect(() => {
        const requestPermissions = async () => {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                if (newStatus !== 'granted') {
                    Alert.alert("Permission required", "Please enable notifications.");
                }
            }
        };

        requestPermissions();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const checkJwt = async () => {
                const token = await AsyncStorage.getItem('jwt');
                const storedUsername = await AsyncStorage.getItem('username');
                if (token) setJwt(token);

                if (storedUsername) {
                    setUsername(storedUsername);
                    try {
                        const res = await axios.get(`https://jarvis-ai-8pr6.onrender.com/conversations/${storedUsername}`, {
                            headers: {
                                Authorization: `Bearer ${token} `
                            }
                        });
                        const formattedMessages = res?.data?.messages?.map(msg => ({
                            text: cleanHtml(msg.message),
                            isUser: msg.sender === "user",
                        })) || [];
                        setMessages(formattedMessages);

                    } catch (err) {
                        console.error("Failed to fetch messages:", err);
                        setMessages([{ isUser: true, text: "Wake Up J.A.R.V.I.S, Daddy's Home" }, { isUser: false, text: "Welcome Home Sir, What are we going to work on today?" }]);
                    }
                }
            };
            checkJwt();
        }, [])
    );


    const cleanHtml = (html) => {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]*>?/gm, '')
            .trim();
    };
    const handleVoiceInput = () => {
        startListening((spokenText: string) => {
            setInputText(spokenText);
        });
    };


    const saveData = async (message) => {
        const timestamp = new Date().toISOString();
        const requests = [];


        requests.push(
            axios.post('https://jarvis-ai-8pr6.onrender.com/conversations', {
                sender: message.sender,
                message: message.message,
                timestamp,
                username: username,
                conversationId: 23234433,
            }, {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            })
        );

        try {
            const res = await Promise.all(requests);
        } catch (err) {
            console.error('Error saving data:', err);
        }
    };

    const reminderKeywords = [
        "remind me to",
        "remind me at",
        "set a reminder",
        "alert me to",
        "wake me at",
        "alarm for",
        "reminder:",
        "remind",
        "alert",
    ];
    async function scheduleNotification(hour, minute, projectName) {
        const now = new Date();
        const triggerTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour,
            minute,
            0
        );

        if (triggerTime <= now) {
            triggerTime.setDate(triggerTime.getDate() + 1);
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Reminder",
                body: `Your ${projectName} duration is up!`,
                sound: true,
            },
            trigger: {
                type: 'date',
                date: triggerTime,
            },
        });
        console.log(projectName);
        console.log(hour);
        console.log(minute);

        Alert.alert("Notification scheduled for", triggerTime.toString());
    }


    function parseReminder(text) {
        let task = "";
        let targetDate = new Date();

        text = text.toLowerCase();

        // Check for day references
        if (text.includes("day after tomorrow")) {
            targetDate.setDate(targetDate.getDate() + 2);
        } else if (text.includes("tomorrow")) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        // Extract time like "at 5 PM" or "at 14:30"
        const timeMatch = text.match(/at\s(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const period = timeMatch[3];

            if (period === 'pm' && hour < 12) hour += 12;
            if (period === 'am' && hour === 12) hour = 0;

            targetDate.setHours(hour);
            targetDate.setMinutes(minute);
            targetDate.setSeconds(0);
        } else {
            // Default fallback time
            targetDate.setHours(9);
            targetDate.setMinutes(0);
            targetDate.setSeconds(0);
        }

        // Extract task
        task = text.replace(/remind me to|set me a reminder to|alert me about|remind me that|at.*/i, "").trim();

        return {
            task,
            hour: targetDate.getHours(),
            minute: targetDate.getMinutes(),
            date: targetDate,
        };
    }


    const isReminderMessage = (message) => {
        return reminderKeywords.some(keyword =>
            message.toLowerCase().includes(keyword)
        );
    }





















    const formatGeminiResponse = (text) => {
        return text.split('\n').flatMap((line, index) => {
            const trimmed = line.trim();
            const parts = [];
            const boldRegex = /\*\*(.*?)\*\*/g;
            let lastIndex = 0, match;
            while ((match = boldRegex.exec(trimmed)) !== null) {
                if (match.index > lastIndex)
                    parts.push({ key: `${index}-${lastIndex}`, text: trimmed.slice(lastIndex, match.index), color: 'white' });
                parts.push({ key: `${index}-bold-${match.index}`, text: match[1], color: '#4da6ff' });
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < trimmed.length)
                parts.push({ key: `${index}-end`, text: trimmed.slice(lastIndex), color: 'white' });

            return parts.length ? parts : [{ key: `${index}`, text: trimmed, color: 'white' }];
        });
    };

    function SpeakJarvis(text) {
        if (!text.trim()) return;
        else {
            Speech.speak(text, {
                language: "en",
                pitch: 1.2,
                rate: 1.0,
            });
            console.log("Works");

        }
    }
    const sendMessageToJarvis = async (prompt) => {
        try {
            const res = await axios.post('https://jarvis-ai-8pr6.onrender.com/api/gemini', {
                prompt,
                username,
            }, {
                headers: {
                    Authorization: `Bearer ${jwt} `
                }
            });
            console.log(res.data.response);
            return res.data;
        } catch (error) {
            console.error("API error:", error);
            return { response: "Failed to reach JARVIS." };
        }
    };



    const sendAIMessage = async () => {
        if (!inputText.trim()) return;
        else if (inputText.toLowerCase() == "clear chat") {
            setMessages([]);
            setInputText('');
            return;
        }
        else {
            if (isReminderMessage(inputText)) {
                console.log("Reminder Detected");
                const parsedmess = parseReminder(inputText);
                const aiBotReply = await axios.post('https://jarvis-ai-8pr6.onrender.com/api/gemini', {
                    prompt: `you are sending the user a reminding message as JARVIS for this'${parsedmess.task}',make it in a single line`
                }, {
                    headers: {
                        Authorization: `Bearer ${jwt}`
                    }

                });
                const remmess = aiBotReply.data.response.replace(/<\/?p[^>]*>/gi, '');
                console.log(parsedmess.minute, parsedmess.hour);
                await scheduleNotification(parsedmess.hour, parsedmess.minute, remmess);
            }
            console.log('Works AI function');
            setMessages([...messages, { text: inputText, isUser: true }]);
            const messi = { sender: "user", message: inputText };
            saveData(messi);
            setInputText('');
            const res = await sendMessageToJarvis(inputText);
            console.log(res);
            const botReply = formatGeminiResponse(res.response);
            setMessages(prev => [...prev, { text: botReply, isUser: false }]);
            const messa = { sender: "bot", message: res.response };
            saveData(messa);
            if (voicemode) {
                console.log("Trying for Voice");
                console.log(res.response);
                SpeakJarvis(res.response);
            }
        }

    };


    const resetChat = async () => {
        const deletechat = await axios.post(`https://jarvis-ai-8pr6.onrender.com/convoss/${username}`, {}, {
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        });
        setMessages([{ isUser: true, text: "Wake Up J.A.R.V.I.S, Daddy's Home" }, { isUser: false, text: "Welcome Home Sir, What are we going to work on today?" }]);
    };


    function logout() {
        AsyncStorage.clear();
        router.push('/');
    }

    function reset() {
        resetChat();
        toggleOverlay();
    }


    useEffect(() => {
        flatListRef.current?.scrollToOffset({ offset: 99999, animated: true });
    }, [messages.length]);

    if (!fontsLoaded) return null;

    return (
        <View style={styles.bg}>
            <Video source={require('../../assets/videos/bg.mp4')} shouldPlay isLooping resizeMode="cover" style={styles.aibg} />
            <View style={styles.bglayer}>
                <Animated.View style={[styles.overlay, { transform: [{ translateX: slideAnim }] }]}>
                    <TouchableOpacity style={{ position: 'absolute', top: 30, left: 30 }} onPress={toggleOverlay}><FontAwesome name='close' color={"skyblue"} size={30} /></TouchableOpacity>
                    <Pressable onPressIn={() => {setDelbutton(true)}} onPressOut={() => {setDelbutton(false)}} style={delbutton?{ padding: 20, borderWidth: 1, borderColor: "red", borderRadius: 20,backgroundColor:"red"}:{ padding: 20, borderWidth: 1, borderColor: "red", borderRadius: 20,}} onPress={reset}><Text style={delbutton?{ color: "white", fontSize: 20, fontFamily: 'Orbitron_400Regular' }:{color:"red",fontSize:20,fontFamily:"Orbitron_400Regular"}}>DELETE CHAT</Text></Pressable>
                    <Pressable style={voicemode ? { padding: 20, borderWidth: 1, borderColor: "skyblue", backgroundColor: "skyblue", marginTop: 20, borderRadius: 20 } : { padding: 20, borderWidth: 1, borderColor: "skyblue", marginTop: 20, borderRadius: 20 }} onPress={() => { setVoicemode(prev => !prev); }}><Text style={voicemode ? { color: "white", fontSize: 20, fontFamily: 'Orbitron_400Regular' } : { color: "skyblue", fontSize: 20, fontFamily: 'Orbitron_400Regular' }}>VOICE MODE</Text></Pressable>
                    <Pressable style={button1 ? { padding: 20, borderWidth: 1, borderColor: "red", backgroundColor: "red", borderRadius: 20, marginTop: 20 } : { padding: 20, borderWidth: 1, borderColor: "red", borderRadius: 20, marginTop: 20 }} onPressIn={() => { setButton1(true) }} onPressOut={() => { setButton1(false) }} onPress={logout}><Text style={button1 ? { color: "white", fontSize: 20, fontFamily: 'Orbitron_400Regular' } : { color: "red", fontSize: 20, fontFamily: 'Orbitron_400Regular' }}>LOG OUT</Text></Pressable>
                </Animated.View>
                <View style={styles.toplayer}>
                    <FontAwesome onPress={toggleOverlay} name='bars' size={20} color={"skyblue"} style={{ position: "absolute", left: 30, marginTop: 10 }}></FontAwesome>
                    <Image source={require('../../assets/images/jarvis-icon.png')} style={styles.applogo} />
                    <Text style={styles.headerText}>J.A.R.V.I.S</Text>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={[styles.chatBubble, item.isUser && styles.userBubble]}>
                            {Array.isArray(item.text) ? item.text.map(line => (
                                <Text key={line.key} style={{ color: line.color, fontFamily: 'Orbitron_400Regular' }}>{line.text}</Text>
                            )) : (
                                <Text style={{ color: 'white', fontFamily: 'Orbitron_400Regular' }}>{item.text}</Text>
                            )}
                        </View>
                    )}
                    ref={flatListRef}
                    style={styles.chatLayer}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />

                <View style={styles.bottomlayer}>
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type your message here..."
                        placeholderTextColor="gray"
                        style={styles.input}
                        onSubmitEditing={sendAIMessage}
                    />
                    <TouchableOpacity onPress={handleVoiceInput}>
                        <FontAwesome name='microphone' size={20} color="skyblue" style={styles.voice} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={sendAIMessage} style={{}}>
                        <FontAwesome name='paper-plane' size={20} color="white" style={styles.send} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: 'black' },
    aibg: { ...StyleSheet.absoluteFillObject },
    bglayer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
    toplayer: {
        height: '13%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: 'black', zIndex: 5
    },
    headerText: { color: 'skyblue', fontSize: 20, fontFamily: 'Orbitron_400Regular', marginTop: 10 },
    applogo: { width: 50, height: 50, resizeMode: 'contain', borderRadius: 25, marginTop: 10 },
    chatLayer: { flex: 1, marginTop: 0, padding: 10 },
    chatBubble: {
        maxWidth: '80%', padding: 20, borderWidth: 1, borderColor: 'skyblue', borderRadius: 10,
        marginVertical: 5, alignSelf: 'flex-start'
    },
    userBubble: { alignSelf: 'flex-end', borderColor: 'green' },
    bottomlayer: {
        position: 'absolute', bottom: 0, flexDirection: 'row', width: '100%', padding: 10,
        alignItems: 'center', gap: 10, backgroundColor: 'black'
    },
    input: { flex: 1, borderWidth: 1, borderColor: 'gray', color: 'white', fontFamily: 'Orbitron_400Regular', paddingLeft: 15, borderRadius: 20 },
    send: { padding: 10, color: 'skyblue' },
    voice: { padding: 10 },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        backgroundColor: 'black',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AiChat;
