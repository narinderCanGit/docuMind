import { useState, useRef, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import {
  Send as SendIcon,
  Person as PersonIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

function ChatInterface({ setIsLoading, showNotification }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

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
        sources: response.data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
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

  // Format source information
  const formatSource = (source) => {
    if (!source.metadata) return "Unknown source";

    if (source.metadata.source === "user-input") {
      return "From your text input";
    }

    if (source.metadata.url) {
      return `From ${source.metadata.url}`;
    }

    if (source.metadata.source) {
      // Handle file sources
      const filename = source.metadata.source.split("/").pop();
      return `From ${filename}${
        source.metadata.page ? ` (Page ${source.metadata.page})` : ""
      }`;
    }

    return "Source document";
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
                      {message.text}
                    </Typography>

                    {message.sources && message.sources.length > 0 && (
                      <Box
                        sx={{
                          mt: 2,
                          pt: 1,
                          borderTop: 1,
                          borderColor:
                            message.sender === "user"
                              ? "rgba(255,255,255,0.2)"
                              : "divider",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: "bold", mb: 0.5 }}
                        >
                          Sources:
                        </Typography>
                        <List dense disablePadding>
                          {message.sources.map((source, i) => (
                            <ListItem key={i} disablePadding disableGutters>
                              <ListItemText
                                primary={formatSource(source)}
                                primaryTypographyProps={{
                                  variant: "caption",
                                  color:
                                    message.sender === "user"
                                      ? "rgba(255,255,255,0.9)"
                                      : "text.secondary",
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
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
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!input.trim() || isTyping}
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
                  <SendIcon disabled="true" fontSize="small" />
                ) : (
                  <SendIcon fontSize="small" />
                )}
              </Button>
            ),
          }}
        />
      </Box>
    </Paper>
  );
}

export default ChatInterface;
