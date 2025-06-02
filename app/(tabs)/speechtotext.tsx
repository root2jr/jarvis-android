
export const startListening = (onResult: (text: string) => void) => {
  const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported on this browser");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.start();
};
