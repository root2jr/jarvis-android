import { View, Text, Image, TextInput, TouchableOpacity, FlatList } from 'react-native'
import { StyleSheet } from 'react-native'
import { useFonts, Orbitron_400Regular } from '@expo-google-fonts/orbitron'
import React, { useState, useRef, useEffect } from 'react'
import { Video } from 'expo-av'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane, faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { Keyboard } from 'react-native';
import axios from 'axios'

const AiChat = () => {
    const [fontsLoaded] = useFonts({ Orbitron_400Regular });
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

    const formatGeminiResponse = (text) => {
        const formattedText = text.split('\n').map((line, index) => {
          const trimmed = line.trim();
      
          // Bullet point (e.g. "* something")
          if (/^\* (?!\*)/.test(trimmed)) {
            return [{
              key: `${index}-bullet`,
              text: `• ${trimmed.substring(2)}`,
              color: 'white',
            }];
          }
      
          // Bold text using **...**
          const boldRegex = /\*\*(.*?)\*\*\**/g;
          if (boldRegex.test(trimmed)) {
            const parts = [];
            let lastIndex = 0;
            let match;
      
            while ((match = boldRegex.exec(trimmed)) !== null) {
              const [fullMatch, innerText] = match;
              const start = match.index;
      
              // Text before bold
              if (start > lastIndex) {
                parts.push({
                  key: `${index}-text-${lastIndex}`,
                  text: trimmed.slice(lastIndex, start),
                  color: 'white',
                });
              }
      
              // Bold text without ** markers, in a different color
              parts.push({
                key: `${index}-highlight-${start}`,
                text: innerText, // only inner text, ** removed
                color: '#4da6ff',
              });
      
              lastIndex = start + fullMatch.length;
            }
      
            // Remaining text after last match
            if (lastIndex < trimmed.length) {
              parts.push({
                key: `${index}-text-end`,
                text: trimmed.slice(lastIndex),
                color: 'white',
              });
            }
      
            return parts;
          }
      
          return [{
            key: `${index}-normal`,
            text: trimmed,
            color: 'white',
          }];
        });
        if(formattedText.includes("**")){
            formattedText.splice(formattedText.indexOf("**"), 1)
            return formattedText;
        }
      
        return formattedText.flat();
      };
      


    useEffect(() => {
        const fetchMessages = async () => {
            let usersname = 'jram6269@gmail.com'
            try {
                const res = await axios.get(
                    `https://jarvis-ai-8pr6.onrender.com/conversations/${usersname}`
                );

                if (res?.data?.messages && Array.isArray(res.data.messages)) {

                    const formattedMessages = res.data.messages.map((msg) => ({
                        text: msg.message,
                        isUser: msg.sender === "user",
                    }));

                    setMessages(formattedMessages);
                } else {
                    console.error("messages is not an array:", res.data.messages);
                    setMessages([]);
                }
            } catch (err) {
                console.error("Failed to fetch saved messages:", err);
            }
        };

        fetchMessages();
    }, []);

    useEffect(() => {
        setTimeout(() => {
            flatListRef.current.scrollToOffset({ offset: 99999, animated: true });
        }, 200);
    }, [messages.length])


    const sendMessageToJarvis = async (message, userid, usersname) => {
        try {
            console.log("Sending request to API:", message, userid, usersname);

            const res = await axios.post('https://jarvis-ai-8pr6.onrender.com/api/gemini', {
                prompt: message,
                conversationId: userid,
                username: usersname
            });

            return res.data;
        } catch (error) {
            console.error("Error sending message:", error?.response?.data || error.message);
            return { error: "Failed to reach JARVIS" };
        }
    };

    const sendAIMessage = async () => {
        if (inputText.trim() === '') return;

        console.log("User Input:", inputText); // Check if function runs

        setMessages([...messages, { text: inputText, isUser: true }]);
        setInputText('');
        Keyboard.dismiss();

        console.log("Calling API...");
        const response = await sendMessageToJarvis(inputText, 'ss', 'jram');
        const botreply = formatGeminiResponse(response.response);

        console.log("API Response:", response);

        if (response && response.response) {
            setMessages(prevMessages => [...prevMessages, { text: botreply, isUser: false }]);
        }
    };



    return (
        <View style={styles.bg}>
            <Video
                source={require('../assets/videos/bg.mp4')}
                shouldPlay
                isLooping
                style={styles.aibg}
                resizeMode="cover"
            />
            <View style={styles.bglayer}>
                {/* Top Section */}
                <View style={styles.toplayer}>
                    <Image source={require('../assets/images/jarvis-icon.png')} style={styles.applogo} />
                    <Text style={styles.headerText}>J.A.R.V.I.S</Text>
                </View>

                <View style={{ flex: 1, paddingBottom: 60 }}  >
                    <FlatList
                        data={messages}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View style={[styles.chatBubble, item.isUser && styles.userBubble]}>
                                {Array.isArray(item.text) ? (
                                    item.text.map((line) => (
                                        <Text
                                            key={line.key}
                                            style={{
                                                color: line.color || 'white',
                                                fontFamily: 'Orbitron_400Regular',
                                            }}
                                        >
                                            {line.text}
                                        </Text>
                                    ))
                                ) : (
                                    <Text style={{ color: 'white', fontFamily: 'Orbitron_400Regular' }}>
                                        {item.text}
                                    </Text>
                                )}
                            </View>

                        )}
                        style={styles.chatLayer}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ref={flatListRef}
                    />

                </View>
                {/* Bottom Section */}
                <View style={styles.bottomlayer}>
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type your message here..."
                        style={styles.input}
                        autoCapitalize="none"
                        placeholderTextColor="gray"
                        onSubmitEditing={sendAIMessage}
                    />
                    <FontAwesomeIcon icon={faMicrophone} size={20} color="skyblue" style={styles.voice} />
                    <TouchableOpacity onPress={sendAIMessage}>
                        <FontAwesomeIcon icon={faPaperPlane} size={20} color="skyblue" style={styles.send} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bg: {
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aibg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        position: 'absolute',
    },
    bglayer: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.7)',
        position: 'absolute',
    },
    toplayer: {
        width: '100%',
        height: '15%',
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgb(0, 0, 0)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        zIndex: 5
    },
    headerText: {
        color: 'skyblue',
        fontSize: 20,
        fontFamily: 'Orbitron_400Regular',
    },
    applogo: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        borderRadius: 25,
    },
    chatLayer: {
        flex: 1,
        marginTop: 80,
        width: '100%',
        paddingTop: 60,
        paddingLeft: 10,
        paddingRight: 10,
    },
    chatBubble: {
        maxWidth: '80%',
        padding: 20,
        borderWidth: 1,
        borderColor: 'skyblue',
        borderRadius: 10,
        marginVertical: 5,
        alignSelf: 'flex-start',
        color: 'white',
    },

    userBubble: {
        alignSelf: 'flex-end',
        borderWidth: 1,
        borderColor: 'green',
        color: 'white'
    },

    chatText: {
        color: 'white',
        fontSize: 17,
        fontFamily: 'Orbitron_400Regular',
        textAlign: 'center'
    },
    bottomlayer: {
        width: '100%',
        height: '10%',
        position: 'absolute',
        bottom: 0,
        backgroundColor: 'rgb(0, 0, 0)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        zIndex: 5
    },
    input: {
        flex: 1,
        height: 40,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'skyblue',
        color: 'white',
        paddingLeft: 15,
        fontFamily: 'Orbitron_400Regular',
        paddingRight: 90,
    },
    send: {
        position: 'absolute',
        right: 20,
        bottom: -10,
    },
    voice: {
        position: 'absolute',
        right: 80
    },
    chat: {
        width: '100%',
        height: '100%',
        paddingBottom: 100
    }
});

export default AiChat;
