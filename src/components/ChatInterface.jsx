import { useState, useRef, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemIcon,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Send as SendIcon,
  Person as PersonIcon,
  Storage as StorageIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from "@mui/icons-material";
import { ReactMic } from "react-mic";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

function ChatInterface({ setIsLoading, showNotification }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const micRef = useRef(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      return;
    }

    // Add user message to chat
    const userMessage = {
      text: input,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Send query to API
      const response = await axios.post(`${API_URL}/api/chat`, {
        query: input,
      });

      // Add AI response to chat
      const aiMessage = {
        text: response.data.answer,
        sender: "ai",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      showNotification("Failed to get response", "error");

      // Add error message to chat
      const errorMessage = {
        text: "Sorry, I had trouble answering that question. Please try again.",
        sender: "ai",
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAudioStart = () => {
    // Reset any previous audio blob
    setAudioBlob(null);
    // Start recording
    setIsRecording(true);
    // Show notification to guide the user
    showNotification(
      "Recording started. Click the mic icon again to stop and transcribe.",
      "info"
    );
  };

  const handleAudioStop = async (recordedBlob) => {
    setIsRecording(false);
    setIsTranscribing(true);

    if (!recordedBlob || !recordedBlob.blob) {
      showNotification("No audio data received. Please try again.", "error");
      setIsTranscribing(false);
      return;
    }

    // Save the blob for potential re-use
    setAudioBlob(recordedBlob.blob);

    // Skip transcription for very small blobs (likely just noise)
    if (recordedBlob.blob.size < 1000) {
      showNotification("Recording too short. Please try again.", "warning");
      setIsTranscribing(false);
      return;
    }

    try {
      // Create a FormData object to send the audio file
      const formData = new FormData();
      // Use a consistent filename and append the blob with it
      formData.append("audio", recordedBlob.blob, "voice-message.webm");

      // Send the audio file to the backend for transcription
      const response = await axios.post(
        `${API_URL}/api/transcribe-audio`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Set the transcribed text as the input for the user to edit before sending
      if (response.data.transcription) {
        setInput(response.data.transcription);
        showNotification(
          "Audio transcribed successfully. You can edit before sending.",
          "success"
        );
      } else {
        setInput("");
        showNotification(
          "No speech detected in recording. Please try again.",
          "warning"
        );
      }
    } catch (error) {
      showNotification(
        "Failed to transcribe audio: " +
          (error.response?.data?.error || error.message),
        "error"
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Function to explicitly stop recording
  const stopRecording = () => {
    if (isRecording) {
      // First set the state to false so ReactMic stops recording
      setIsRecording(false);
    }
  };

  // Format the source citation to be more readable
  const formatSourceCitation = (sourceCitation) => {
    // Check if it's a file path source
    const filePathMatch = sourceCitation.match(
      /\([Ss]ource: (.*?)(, page (\d+))?\)$/i
    );

    if (filePathMatch) {
      const path = filePathMatch[1];
      const pageInfo = filePathMatch[3] ? `, page ${filePathMatch[3]}` : "";

      // Check if the source is a URL
      if (path.startsWith("http") || path.includes("://")) {
        // It's a URL, return the full URL
        return `(Source: ${path}${pageInfo})`;
      }

      // For file paths, extract just the filename
      const filename = path.includes("/") ? path.split("/").pop() : path;

      if (filename) {
        return `(Source: ${filename}${pageInfo})`;
      }
    }

    // If not a file path or couldn't extract filename, return the original
    return sourceCitation;
  };

  return (
    <Paper
      elevation={2}
      sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Typography variant="h2" component="h2" sx={{ mb: 3 }}>
        Chat with Your Documents
      </Typography>

      <Box
        sx={{
          flex: 1,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 40, 55, 0.4)"
              : "rgba(245, 247, 250, 0.7)",
          borderRadius: 2,
          p: 2,
          mb: 3,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
          border: "1px solid",
          borderColor: "divider",
          cursor: "default",
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "text.secondary",
              m: "auto",
            }}
          >
            <StorageIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ fontWeight: "normal", mb: 1 }}>
              Your Knowledge Base is Ready
            </Typography>
            <Typography sx={{ textAlign: "center", maxWidth: 400 }}>
              Ask anything about your documents, text, or websites you've added
              to the knowledge base.
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: "100%", p: 0, flex: 1 }}>
            {messages.map((message, index) => (
              <ListItem
                key={index}
                alignItems="flex-start"
                sx={{
                  mb: 2,
                  flexDirection:
                    message.sender === "user" ? "row-reverse" : "row",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: "auto",
                    m: message.sender === "user" ? "0 0 0 1rem" : "0 1rem 0 0",
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor:
                        message.sender === "user"
                          ? "primary.main"
                          : "secondary.main",
                      width: 36,
                      height: 36,
                      boxShadow: 2,
                    }}
                  >
                    {message.sender === "user" ? (
                      <PersonIcon fontSize="small" />
                    ) : (
                      <StorageIcon fontSize="small" />
                    )}
                  </Avatar>
                </ListItemIcon>
                <Card
                  sx={{
                    maxWidth: "85%",
                    bgcolor:
                      message.sender === "user"
                        ? "primary.main"
                        : "background.paper",
                    color:
                      message.sender === "user"
                        ? "primary.contrastText"
                        : "text.primary",
                    borderRadius:
                      message.sender === "user"
                        ? "16px 4px 16px 16px"
                        : "4px 16px 16px 16px",
                    boxShadow: message.sender === "user" ? 2 : 1,
                    ...(message.isError && {
                      borderColor: "error.main",
                      borderWidth: 1,
                      borderStyle: "solid",
                    }),
                  }}
                  variant={message.sender === "user" ? "filled" : "outlined"}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {/* Display the message text without the source citation */}
                      {message.text.replace(/\s*\([Ss]ource:.*?\)\s*$/, "")}
                    </Typography>

                    {/* Only display the source from the AI's answer */}
                    {message.sender === "ai" &&
                      message.text.match(/\([Ss]ource:.*?\)$/i) && (
                        <Box
                          sx={{
                            mt: 2,
                            pt: 1,
                            borderTop: 1,
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                            sx={{
                              fontStyle: "italic",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1,
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                            }}
                          >
                            <StorageIcon
                              fontSize="small"
                              sx={{ opacity: 0.7, mt: 0.3, flexShrink: 0 }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              {formatSourceCitation(
                                message.text.match(/\([Ss]ource:.*?\)$/i)[0]
                              )}
                            </Box>
                          </Typography>
                        </Box>
                      )}
                  </CardContent>
                </Card>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Add typing indicator */}
      {isTyping && (
        <ListItem alignItems="flex-start">
          <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
            <Avatar
              sx={{
                bgcolor: "secondary.main",
                width: 36,
                height: 36,
                boxShadow: 2,
              }}
            >
              <StorageIcon fontSize="small" />
            </Avatar>
          </ListItemIcon>
          <Card
            sx={{
              maxWidth: "85%",
              bgcolor: "background.paper",
              borderRadius: "4px 16px 16px 16px",
              boxShadow: 1,
              p: 2,
            }}
            variant="outlined"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: "secondary.main",
                    borderRadius: "50%",
                    animation: "pulse 1s infinite",
                    animationDelay: "0s",
                    "@keyframes pulse": {
                      "0%": { opacity: 0.2 },
                      "50%": { opacity: 1 },
                      "100%": { opacity: 0.2 },
                    },
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: "secondary.main",
                    borderRadius: "50%",
                    animation: "pulse 1s infinite",
                    animationDelay: "0.3s",
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: "secondary.main",
                    borderRadius: "50%",
                    animation: "pulse 1s infinite",
                    animationDelay: "0.6s",
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Box>
          </Card>
        </ListItem>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", gap: 1 }}
      >
        <TextField
          fullWidth
          size="medium"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          variant="outlined"
          disabled={isRecording || isTranscribing}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "24px",
              pr: 1,
            },
            "& .MuiInputBase-input": {
              cursor: "text",
            },
          }}
          inputProps={{
            style: { cursor: "text" },
          }}
          InputProps={{
            endAdornment: (
              <>
                {/* Mic button for recording */}
                <Tooltip
                  title={isRecording ? "Stop Recording" : "Record Audio"}
                >
                  <IconButton
                    onClick={() => {
                      if (isRecording) {
                        stopRecording();
                      } else {
                        handleAudioStart();
                      }
                    }}
                    color={isRecording ? "error" : "default"}
                    disabled={isTyping || isTranscribing}
                    sx={{ mr: 1 }}
                  >
                    {isRecording ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>

                {/* Send button */}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    !input.trim() || isTyping || isRecording || isTranscribing
                  }
                  sx={{
                    borderRadius: "50%",
                    minWidth: 40,
                    width: 40,
                    height: 40,
                    p: 0,
                    cursor: "pointer",
                  }}
                >
                  {isTyping ? (
                    <SendIcon disabled={true} fontSize="small" />
                  ) : (
                    <SendIcon fontSize="small" />
                  )}
                </Button>
              </>
            ),
          }}
        />
      </Box>

      {/* React Mic component for audio recording - Always render but only record when isRecording is true */}
      <Box
        sx={{
          mt: 2,
          borderRadius: 2,
          overflow: "hidden",
          border: isRecording ? "1px solid" : "none",
          borderColor: "divider",
          height: isRecording ? 60 : 0,
          position: "relative",
          transition: "height 0.3s ease",
          display: isRecording ? "block" : "none",
        }}
      >
        <ReactMic
          ref={micRef}
          record={isRecording}
          onStop={handleAudioStop}
          mimeType="audio/webm"
          strokeColor="#3f51b5"
          backgroundColor="rgba(200, 200, 200, 0.2)"
          className="sound-wave"
          visualSetting="sinewave"
          width="100%"
          height="60px"
        />
        {isRecording && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.1)",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: "bold" }}
            >
              Recording... Click mic icon again to stop
            </Typography>
          </Box>
        )}
      </Box>

      {/* Transcribing indicator */}
      {isTranscribing && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            justifyContent: "center",
            mt: 2,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2">Transcribing your audio...</Typography>
        </Box>
      )}
    </Paper>
  );
}

export default ChatInterface;
