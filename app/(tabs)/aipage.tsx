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
    Animated, Clipboard, Dimensions, FlatList,
    Image,
    Keyboard, Linking, Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';







const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;
const AiChat = () => {
    const router = useRouter();
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [Task, setTask] = useState([]);
    const flatListRef = useRef(null);
    const [fontsLoaded] = useFonts({ Orbitron_400Regular });
    const [jwt, setJwt] = useState('');
    const [visible, setVisible] = useState(false);
    const [button1, setButton1] = useState(false);
    const slideAnim = useRef(new Animated.Value(-width * 5)).current;
    const taskslideAnim = useRef(new Animated.Value(-height * 5)).current;
    const [voicemode, setVoicemode] = useState(false);
    const [delbutton, setDelbutton] = useState(false);
    const [loader, setLoader] = useState(false);
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(-400)).current;
    const [skeleton, setSkeleton] = useState(false);

    useEffect(() => {
        Animated.loop(
            Animated.timing(translateX, {
                toValue: 200,
                duration: 1200,
                useNativeDriver: true,
            })
        ).start();
    }, []);
    const Loader = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });


    useEffect(() => {
        const getTasks = async () => {
            const response = await axios.post("https://jarvis-ai-8pr6.onrender.com/fetchtasks", {
                user: username
            })
            setTask(response.data.tasks);
            console.log(response.data.tasks[0].task);
        }
        getTasks();
    }, [])

    useEffect(() => {
        const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setKeyboardVisible(true);
        });
        const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);
            setKeyboardVisible(false);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);


    useEffect(() => {
        if (loader) {
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [loader]);


    const delete_task = async (task: String) => {
        try {
            const response = await axios.post("https://jarvis-ai-8pr6.onrender.com/removetasks", {
                task: task
            })
            console.log(response.data);
        } catch (error) {
            console.error("Error:", error);
        }
    }

    const toggleOverlay = async (item) => {
        setTask(Task.filter(arr => arr != item))
        await delete_task(item.task);
        Animated.timing(slideAnim, {
            toValue: visible ? -width : 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setVisible(!visible));
    };
    const TaskToggleOverlay = () => {
        Animated.timing(taskslideAnim, {
            toValue: visible ? height : height - 400,
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
                setMessages([]);
                setSkeleton(true);
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
                            time: msg.time
                        })) || [];
                        setSkeleton(false);
                        setMessages(formattedMessages);

                    } catch (err) {
                        console.error("Failed to fetch messages:", err);
                        setMessages([]);
                        setSkeleton(false);
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
                time: message.time
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


    function getSecondsFromNow(date) {
        const now = new Date();
        const target = new Date(date);
        const diffMs = target.getTime() - now.getTime();
        return Math.max(Math.floor(diffMs / 1000), 1);
    }



    async function scheduleNotification(date, text, repeats = false) {

        const utcDate = new Date(date);
        const seconds = getSecondsFromNow(utcDate);
        const triggerDate = new Date(
            utcDate.getUTCFullYear(),
            utcDate.getUTCMonth(),
            utcDate.getUTCDate(),
            utcDate.getUTCHours(),
            utcDate.getUTCMinutes(),
            utcDate.getUTCSeconds()
        );



        if (repeats) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Reminder",
                    body: text,
                },
                trigger: {
                    hour: 9,
                    minute: 0,
                    repeats: true,
                }

            });
            return;
        }

        if (seconds <= 3600) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Reminder",
                    body: text,
                },
                trigger: {
                    seconds,
                },
            });
            Alert.alert("Reminder scheduled", `Time: ${seconds} seconds`);
            return;
        }
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Reminder",
                body: text,
            },
            trigger: {
                type: 'date',
                date: triggerDate,
            },
        });
        Alert.alert(
            "Notification scheduled",
            repeats ? `Daily Reminder is Set` : triggerDate.toString()
        );
        console.log(triggerDate.toString());
    }


    const parseInput = async (message) => {
        const response = await axios.post("https://jarvis-ai-8pr6.onrender.com/parsetext", {
            text: message
        })
        console.log(response.data.date);
        return response.data;
    }


    const check_intent = async (message) => {
        const response = await axios.post("https://jarvis-ai-8pr6.onrender.com/predict", {
            text: message
        })
        return response.data.intent;
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
            console.log(res.data);
            return res.data;
        } catch (error) {
            console.error("API error:", error);
            return { response: "Failed to reach JARVIS." };
        }
    };

    const appnames = ["whatsapp", "instagram", "telegram", "youtube", "hotstar", "playstore", "snapchat"];
    const applink = [
        {
            app: "whatsapp",
            link: "whatsapp://send",
            fallback: "https://play.google.com/store/apps/details?id=com.whatsapp"
        },
        {
            app: "instagram",
            link: "instagram://user?username=instagram",
            fallback: "https://play.google.com/store/apps/details?id=com.instagram.android"
        },
        {
            app: "telegram",
            link: "tg://msg",
            fallback: "https://play.google.com/store/apps/details?id=org.telegram.messenger"
        },
        {
            app: "youtube",
            link: "vnd.youtube://",
            fallback: "https://play.google.com/store/apps/details?id=com.google.android.youtube"
        },
        {
            app: "hotstar",
            link: "hotstar://",
            fallback: "https://play.google.com/store/apps/details?id=in.startv.hotstar"
        },
        {
            app: "playstore",
            link: "market://details?id=com.android.vending",
            fallback: "https://play.google.com/store/apps/details?id=com.android.vending"
        },
        {
            app: "snapchat",
            link: "snapchat://",
            fallback: "https://play.google.com/store/apps/details?id=com.snapchat.android"
        },
    ];
    const sendAIMessage = async () => {
        Keyboard.dismiss();
        if (inputText.trim().toLowerCase() == "open taskbar") {
            TaskToggleOverlay();
            setInputText('');
            return;
        }
        else if (!inputText.trim()) {
            Alert.alert("Empty Prompt", "Please enter your prompt", [{ text: "Ok" }]);
            return;
        }
        else if (inputText.trim().toLowerCase().includes("open") && appnames.some(app => inputText.toLowerCase().includes(app))) {
            const date = new Date;
            const time = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
            const lowerprompt = inputText.toLowerCase().trim();
            const app = appnames.find(app => lowerprompt.includes(app))
            const link = applink.find(a => a.app == app);
            setMessages(prev => [...prev, { text: inputText, isUser: true, time: time }]);
            await saveData({ sender: "user", message: inputText, time: time })
            setMessages(prev => [...prev, { text: `Opening ${app}...`, isUser: false, time: time }]);
            await saveData({ sender: "bot", message: `Opening ${app}...`, time: time })
            setInputText('');
            console.log("works");
            setTimeout(() => {
                openApp(link?.link, link?.fallback);
            }, 2000);
        }
        else {
            setLoader(true);
            const date = new Date;
            const time = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
            setMessages([...messages, { text: inputText, isUser: true, time: time }]);
            const messi = { sender: "user", message: inputText, time: time };
            saveData(messi);
            setInputText('');
            setLoader(true);
            const res = await sendMessageToJarvis(inputText);
            res.response = (res.response).replace("JARVIS: ", "");
            const botReply = formatGeminiResponse(res.response);
            setLoader(false);
            setMessages(prev => [...prev, { text: botReply, isUser: false, time: time }]);
            const messa = { sender: "bot", message: res.response, time: time };
            saveData(messa);
            if (voicemode) {
                console.log("Trying for Voice");
                SpeakJarvis(res.response);
            }
            const intent = await check_intent(inputText);
            if (intent == "reminder") {
                console.log("Reminder Detected");
                const parsedmess = await parseInput(inputText);
                console.log("Parsed Message:", parsedmess);
                const aiBotReply = await axios.post('https://jarvis-ai-8pr6.onrender.com/notifications', {
                    text: `you are sending the user a reminding message as JARVIS for this'${parsedmess.task}',make it in a single line`,
                    context: "reminder"
                }, {
                    headers: {
                        Authorization: `Bearer ${jwt}`
                    }

                });
                console.log("AI's Response:", aiBotReply.data);
                const remmess = aiBotReply.data.response.replace(/<\/?p[^>]*>/gi, '');
                const newmess = remmess.replace("JARVIS: ", "");
                console.log("Parsed Date", parsedmess.date);
                const sendReminder = await axios.post("https://jarvis-ai-8pr6.onrender.com/reminders", {
                    username: username,
                    datetime: parsedmess.date,
                    intent: parsedmess.intent,
                    task: aiBotReply.data.response
                }, {
                    headers: {
                        Authorization: `Bearer ${jwt}`
                    },
                });

                console.log("Reminder Saving response:", sendReminder);
            }
            else if (intent == "task") {
                console.log("Task Detected");
                setTask(prev => [...prev, { task: inputText }]);
                setInputText("");
                const parsedmess = parseInput(inputText);
                const aiBotReply = await axios.post('https://jarvis-ai-8pr6.onrender.com/notifications', {
                    text: `you are sending the user a reminding message as JARVIS for this'${parsedmess.task}',make it in a single line`,
                    context: "task"
                }, {
                    headers: {
                        Authorization: `Bearer ${jwt}`
                    }

                });
                const remmess = aiBotReply.data.response.replace(/<\/?p[^>]*>/gi, '');
                const newmess = remmess.replace("JARVIS: ", "");
                const saveTaskdeadline = await axios.post("https://jarvis-ai-8pr6.onrender.com/tasks", {
                    username: username,
                    intent: parsedmess.intent,
                    datetime: parsedmess.datetime,
                    task: newmess,
                    message: remmess,
                }, {
                    headers: {
                        Authorization: `Bearer ${jwt}`
                    },
                })
                Alert.alert("Task Saved Successfully", "Task Saved", [{ text: "okay" }])
                return;
            }


        }

    };


    const resetChat = async () => {
        const deletechat = await axios.post(`https://jarvis-ai-8pr6.onrender.com/convoss/${username}`, {}, {
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        });
        setMessages([]);
    };


    function logout() {
        AsyncStorage.clear();
        toggleOverlay();
        router.push('/');
    }

    function reset() {
        resetChat();
        toggleOverlay();
    }



    const openApp = async (urlScheme, fallbackUrl) => {
        try {
            const supported = await Linking.canOpenURL(urlScheme);
            if (supported) {
                await Linking.openURL(urlScheme);
            } else {
                Alert.alert('App not installed', 'Redirecting to store...');
                if (fallbackUrl) {
                    Linking.openURL(fallbackUrl);
                }
            }
        } catch (err) {
            console.error('Error opening app:', err);
        }
    };

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
                    <Pressable onPressIn={() => { setDelbutton(true) }} onPressOut={() => { setDelbutton(false) }} style={delbutton ? { padding: 20, borderWidth: 1, borderColor: "red", borderRadius: 20, backgroundColor: "red" } : { padding: 20, borderWidth: 1, borderColor: "red", borderRadius: 20, }} onPress={reset}><Text style={delbutton ? { color: "white", fontSize: 20, fontFamily: 'Orbitron_400Regular' } : { color: "red", fontSize: 20, fontFamily: "Orbitron_400Regular" }}>DELETE CHAT</Text></Pressable>
                    <Pressable style={voicemode ? { padding: 20, borderWidth: 1, borderColor: "skyblue", backgroundColor: "skyblue", marginTop: 40, borderRadius: 20 } : { padding: 20, borderWidth: 1, borderColor: "skyblue", marginTop: 40, borderRadius: 20 }} onPress={() => { setVoicemode(prev => !prev); }}><Text style={voicemode ? { color: "white", fontSize: 20, fontFamily: 'Orbitron_400Regular' } : { color: "skyblue", fontSize: 20, fontFamily: 'Orbitron_400Regular' }}>VOICE MODE</Text></Pressable>
                    <Pressable style={button1 ? { padding: 20, borderWidth: 1, borderColor: "red", backgroundColor: "red", borderRadius: 20, marginTop: 40 } : { padding: 20, borderWidth: 1, borderColor: "red", borderRadius: 20, marginTop: 40 }} onPressIn={() => { setButton1(true) }} onPressOut={() => { setButton1(false) }} onPress={logout}><Text style={button1 ? { color: "white", fontSize: 20, fontFamily: 'Orbitron_400Regular' } : { color: "red", fontSize: 20, fontFamily: 'Orbitron_400Regular' }}>LOG OUT</Text></Pressable>
                </Animated.View>
                <View style={styles.toplayer}>
                    <FontAwesome onPress={toggleOverlay} name='bars' size={20} color={"skyblue"} style={{ position: "absolute", left: 30, marginTop: 10 }}></FontAwesome>
                    <Image source={require('../../assets/images/jarvis-icon.png')} style={styles.applogo} />
                    <Text style={styles.headerText}>J.A.R.V.I.S</Text>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item, index }) => {
                        let content;

                        if (Array.isArray(item.text)) {
                            content = item.text.map((line, i) => (
                                <Text
                                    key={line.key || i}
                                    style={{ color: line.color ?? 'white', fontFamily: 'Orbitron_400Regular' }}
                                >
                                    {String(line.text ?? '')}
                                </Text>
                            ));
                        } else {
                            content = (
                                <Text
                                    style={{ color: 'white', fontFamily: 'Orbitron_400Regular' }}
                                >
                                    {String(item.text ?? '')}
                                </Text>
                            );
                        }

                        return (
                            <TouchableOpacity
                                onLongPress={() => {
                                    const copiedText = Array.isArray(item.text)
                                        ? item.text.map(line => line.text).join('\n')
                                        : String(item.text ?? '');

                                    Clipboard.setString(copiedText);
                                    Alert.alert('Copied Text', copiedText);
                                }}
                                activeOpacity={0.4}
                            >
                                <View style={[styles.chatBubble, item.isUser && styles.userBubble]}>
                                    <Text>{content}</Text>
                                    <Text style={{ color: "gray", fontFamily: "Orbitron_400Regular", paddingTop: 10, alignSelf: "flex-end", fontSize: 10 }}>{item.time}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ref={flatListRef}
                    style={styles.chatLayer}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListFooterComponent={() => (
                        (
                            loader && <Animated.View
                                style={[
                                    {
                                        width: 40,
                                        height: 40,
                                        borderRadius: 100,
                                        margin: 10,
                                    },
                                    {
                                        transform: [{ rotate: Loader }],
                                    },
                                ]}
                            >
                                <Image
                                    source={require("../../assets/images/jarvis-icon.png")}
                                    style={{ width: 40, height: 40, borderRadius: 100 }}
                                />
                            </Animated.View>
                        )
                    )}
                />


                <View style={[styles.bottomlayer, { bottom: keyboardVisible ? keyboardHeight + 10 : 0 }]}>
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type your message here..."
                        placeholderTextColor="gray"
                        style={styles.input}
                        onSubmitEditing={sendAIMessage}
                        keyboardAppearance="light"
                    />
                    <TouchableOpacity onPress={sendAIMessage}>
                        <FontAwesome name='paper-plane' size={20} color="white" style={styles.send} />
                    </TouchableOpacity>
                </View>
                <Animated.View style={[{ width: "100%", height: "50%", backgroundColor: "white", borderRadius: 20, paddingBottom: 90, position: 'absolute', zIndex: 10000000 }, { transform: [{ translateY: taskslideAnim }] }]}>
                    <Text style={{ fontFamily: 'Orbitron_400Regular', textAlign: 'center', paddingTop: 15, paddingBottom: 15, fontSize: 20 }}>TASKS</Text>
                    <TouchableOpacity onPress={TaskToggleOverlay} style={{ position: 'absolute', top: 20, right: 20 }}><Text style={{ fontFamily: 'Orbitron_400Regular', color: 'red', borderWidth: 1, borderColor: 'red', borderRadius: 50, padding: 7, paddingLeft: 10, paddingRight: 10 }}>X</Text></TouchableOpacity>
                    <FlatList
                        data={Task}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View style={{ padding: 20, paddingBottom: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontFamily: 'Orbitron_400Regular', paddingRight: 20, fontSize: 15, textAlign: "center", color: "black" }}>{item.task}</Text>
                                <TouchableOpacity onPress={() => toggleOverlay(item)} style={{ padding: 0, marginTop: 5 }}>
                                    <FontAwesome name='trash' size={15} color={"red"}></FontAwesome>
                                </TouchableOpacity>
                            </View>
                        )}
                        style={{ width: "100%", display: 'flex' }}
                        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
                        scrollEnabled={true}
                    />
                </Animated.View>
                {skeleton && <View style={{ width: "100%", height: "100%", position: 'absolute', zIndex: 999999999, paddingTop: 140, paddingBottom: 100, paddingLeft: 10, paddingRight: 10, display: "flex", gap: 20 }}>
                    <View style={{ width: "50%", height: 70, borderRadius: 20, backgroundColor: "skyblue", alignSelf: 'flex-end', overflow: "hidden" }}>
                        <Animated.View style={[{ width: 60, height: "100%", backgroundColor: "rgba(255,255,255,0.4)", opacity: 0.5, transform: [{ skewX: "-20deg" }], }, { transform: [{ translateX }] }]}></Animated.View>
                    </View>
                    <View style={{ width: "50%", height: 70, borderRadius: 20, backgroundColor: "skyblue", position: "relative", overflow: "hidden" }}>
                        <Animated.View style={[{ width: 60, height: "100%", backgroundColor: "rgba(255,255,255,0.4)", opacity: 0.5, transform: [{ skewX: "-20deg" }], }, { transform: [{ translateX }] }]}></Animated.View>
                    </View>
                    <View style={{ width: "50%", height: 70, borderRadius: 20, backgroundColor: "skyblue", alignSelf: 'flex-end', overflow: "hidden" }}>
                        <Animated.View style={[{ width: 60, height: "100%", backgroundColor: "rgba(255,255,255,0.4)", opacity: 0.5, transform: [{ skewX: "-20deg" }], }, { transform: [{ translateX }] }]}></Animated.View>
                    </View>
                    <View style={{ width: "50%", height: 70, borderRadius: 20, backgroundColor: "skyblue", overflow: "hidden" }}>
                        <Animated.View style={[{ width: 60, height: "100%", backgroundColor: "rgba(255,255,255,0.4)", opacity: 0.5, transform: [{ skewX: "-20deg" }], }, { transform: [{ translateX }] }]}></Animated.View>
                    </View>
                    <View style={{ width: "50%", height: 70, borderRadius: 20, backgroundColor: "skyblue", alignSelf: 'flex-end', overflow: "hidden" }}>
                        <Animated.View style={[{ width: 60, height: "100%", backgroundColor: "rgba(255,255,255,0.4)", opacity: 0.5, transform: [{ skewX: "-20deg" }], }, { transform: [{ translateX }] }]}></Animated.View>
                    </View>
                    <View style={{ width: "50%", height: 70, borderRadius: 20, backgroundColor: "skyblue", overflow: "hidden" }}>
                        <Animated.View style={[{ width: 60, height: "100%", backgroundColor: "rgba(255,255,255,0.4)", opacity: 0.5, transform: [{ skewX: "-20deg" }], }, { transform: [{ translateX }] }]}></Animated.View>
                    </View>
                </View>
                }
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
        marginVertical: 5, alignSelf: 'flex-start', backgroundColor: "#00000096"
    },
    userBubble: { alignSelf: 'flex-end', borderColor: 'green' },
    bottomlayer: {
        position: 'absolute', bottom: 0, flexDirection: 'row', width: '100%', padding: 10,
        alignItems: 'center', gap: 10, backgroundColor: 'black'
    },
    input: { flex: 1, borderWidth: 1, borderColor: 'gray', color: 'white', fontFamily: 'Orbitron_400Regular', paddingLeft: 15, paddingRight: 15, borderRadius: 20 },
    send: { padding: 15, paddingLeft: 10, paddingRight: 20, color: 'skyblue' },
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
