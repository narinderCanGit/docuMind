import { useState, useMemo } from "react";
import {
  CssBaseline,
  Container,
  Box,
  Typography,
  Snackbar,
  Alert,
  Grid,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  IconButton,
  Paper,
} from "@mui/material";
import DocumentInput from "./components/DocumentInput";
import ChatInterface from "./components/ChatInterface";
import { indigo, blueGrey, grey, blue } from "@mui/material/colors";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [mode, setMode] = useState(() => {
    // Try to get the theme from localStorage
    const savedMode = localStorage.getItem("themeMode");
    return savedMode || "light";
  });

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // Create a theme instance based on the mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? blue[300] : indigo[500],
            light: mode === "dark" ? blue[200] : indigo[300],
            dark: mode === "dark" ? blue[400] : indigo[700],
          },
          secondary: {
            main: mode === "dark" ? "#81c784" : "#f06292",
            light: mode === "dark" ? "#a5d6a7" : "#f48fb1",
            dark: mode === "dark" ? "#66bb6a" : "#e91e63",
          },
          background: {
            default: mode === "dark" ? blueGrey[900] : grey[50],
            paper:
              mode === "dark"
                ? "rgba(35, 48, 68, 0.9)"
                : "rgba(255, 255, 255, 0.9)",
          },
          text: {
            primary: mode === "dark" ? grey[100] : grey[900],
            secondary: mode === "dark" ? grey[300] : grey[700],
          },
        },
        typography: {
          h1: {
            fontSize: "2.5rem",
            fontWeight: 600,
            background:
              mode === "dark"
                ? "linear-gradient(45deg, #81d4fa 30%, #64b5f6 90%)"
                : "linear-gradient(45deg, #5c6bc0 30%, #3949ab 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textFillColor: "transparent",
            marginBottom: "0.5rem",
          },
          h2: {
            fontSize: "1.75rem",
            fontWeight: 600,
            marginBottom: "1rem",
            color: mode === "dark" ? blue[300] : indigo[500],
          },
          h6: {
            fontWeight: 600,
            color: mode === "dark" ? blue[200] : indigo[400],
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 500,
                cursor: "pointer",
              },
              contained: {
                boxShadow:
                  mode === "dark"
                    ? "0 3px 5px 2px rgba(33, 150, 243, .1)"
                    : "0 3px 5px 2px rgba(63, 81, 181, .1)",
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                cursor: "pointer",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                borderRadius: 12,
                boxShadow:
                  mode === "dark"
                    ? "0 8px 24px rgba(0, 0, 0, 0.2)"
                    : "0 8px 24px rgba(0, 0, 0, 0.05)",
                cursor: "default",
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: 8,
                  cursor: "text",
                },
                "& .MuiInputBase-input": {
                  cursor: "text",
                },
              },
            },
          },
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": {
                  width: "8px",
                  height: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: mode === "dark" ? blueGrey[800] : grey[200],
                },
                "&::-webkit-scrollbar-thumb": {
                  background: mode === "dark" ? blueGrey[600] : grey[400],
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: mode === "dark" ? blueGrey[500] : grey[500],
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  const toggleColorMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("themeMode", newMode);
    console.log("Theme toggled to:", newMode); // For debugging
  };

  const showNotification = (message, severity = "info") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          background:
            mode === "light"
              ? "linear-gradient(135deg, rgba(236,239,244,1) 0%, rgba(231,237,249,1) 35%, rgba(225,233,246,1) 100%)"
              : "linear-gradient(135deg, rgba(27,39,53,1) 0%, rgba(33,45,59,1) 35%, rgba(42,54,68,1) 100%)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            p: 2,
            width: "100%",
          }}
        >
          <Typography 
            variant="h1" 
            component="h1"
            sx={{ textAlign: "center" }}
          >
            DocuMind
          </Typography>
          <IconButton
            onClick={toggleColorMode}
            color="inherit"
            size="large"
            aria-label="toggle theme"
            sx={{ 
              cursor: "pointer",
              position: "absolute",
              right: 16
            }}
          >
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>

        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{
            textAlign: "center",
            mb: 2,
            px: 2,
          }}
        >
          Upload, ask, and get insights from your documents
        </Typography>

        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: "100%" }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            overflow: "hidden",
            p: { xs: 2, md: 3 },
            gap: 3,
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              minHeight: { xs: "50vh", md: "auto" },
            }}
          >
            <DocumentInput
              setIsLoading={setIsLoading}
              showNotification={showNotification}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              minHeight: { xs: "50vh", md: "auto" },
            }}
          >
            <ChatInterface
              setIsLoading={setIsLoading}
              showNotification={showNotification}
            />
          </Box>
        </Box>

        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isLoading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    </ThemeProvider>
  );
}

export default App;
