import { useState, useRef } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Stack,
  Input,
  InputLabel,
  FormControl,
  FormHelperText,
  IconButton,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Link as LinkIcon,
  Send as SendIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

function DocumentInput({ setIsLoading, showNotification }) {
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleTextSubmit = async (e) => {
    e.preventDefault();

    if (!textInput.trim()) {
      showNotification("Please enter some text", "error");
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/api/save-text`, { text: textInput });

      setTextInput("");
      showNotification("Text saved successfully!", "success");
    } catch (error) {
      console.error("Error saving text:", error);
      showNotification("Failed to save text", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    console.log("File selected:", e.target.files[0]);
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileType = file.type;

      if (fileType.includes("pdf") || fileType.includes("csv")) {
        setSelectedFile(file);
      } else {
        showNotification("Only PDF and CSV files are supported", "error");
      }
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showNotification("Please select a file", "error");
      return;
    }

    const fileType = selectedFile.type;
    if (!fileType.includes("pdf") && !fileType.includes("csv")) {
      showNotification("Only PDF and CSV files are supported", "error");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("document", selectedFile);

      console.log("Uploading to:", `${API_URL}/api/upload-document`);

      const response = await axios.post(
        `${API_URL}/api/upload-document`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload response:", response);

      setSelectedFile(null);
      showNotification(
        "Document uploaded and processed successfully!",
        "success"
      );
    } catch (error) {
      console.error("Error uploading document:", error);
      const errorMessage = error.response?.data?.details
        ? `${error.response.data.error}: ${error.response.data.details}`
        : error.message || "Unknown error occurred";
      showNotification(`Failed to upload document: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();

    if (!urlInput.trim()) {
      showNotification("Please enter a URL", "error");
      return;
    }

    // Basic URL validation
    let url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
      setUrlInput(url);
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/api/process-website`, {
        url,
      });

      setUrlInput("");
      setShowUrlInput(false);
      showNotification("Website processed successfully!", "success");
    } catch (error) {

      const errorMessage = error.response?.data?.details
        ? `${error.response.data.error}: ${error.response.data.details}`
        : error.message || "Unknown error occurred";

      showNotification(`Failed to process website: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Typography variant="h2" component="h2" sx={{ mb: 3 }}>
        Add Knowledge
      </Typography>

      {/* Text Input */}
      <Box component="section" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Text Input
        </Typography>
        <Box component="form" onSubmit={handleTextSubmit}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter any text you want to store in the knowledge base..."
            variant="outlined"
            sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                cursor: "text",
              },
            }}
            inputProps={{
              style: { cursor: "text" },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            disabled={!textInput.trim()}
          >
            Save Text
          </Button>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* File Upload */}
      <Box component="section" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Document Upload
        </Typography>

        <Box
          component="form"
          onSubmit={handleFileUpload}
          onDragEnter={handleDrag}
          sx={{
            border: "2px dashed",
            borderColor: dragActive ? "secondary.main" : "primary.main",
            borderRadius: 2,
            p: 3,
            mb: 2,
            textAlign: "center",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "primary.dark",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(33, 150, 243, 0.05)"
                  : "rgba(63, 81, 181, 0.05)",
            },
            position: "relative",
            backgroundColor: dragActive
              ? (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(33, 150, 243, 0.1)"
                    : "rgba(63, 81, 181, 0.1)"
              : "transparent",
          }}
        >
          {dragActive && (
            <Box
              position="absolute"
              width="100%"
              height="100%"
              top={0}
              right={0}
              bottom={0}
              left={0}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            />
          )}

          {selectedFile ? (
            <Box>
              <FileIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography
                variant="body1"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedFile.name}
                <IconButton
                  color="error"
                  size="small"
                  onClick={handleRemoveFile}
                  sx={{ ml: 1 }}
                  aria-label="Remove file"
                >
                  <DeleteIcon />
                </IconButton>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedFile.type} ({Math.round(selectedFile.size / 1024)} KB)
              </Typography>
              <Button
                type="submit"
                variant="contained"
                color="success"
                sx={{ mt: 2 }}
                startIcon={<CloudUploadIcon />}
              >
                Upload Document
              </Button>
            </Box>
          ) : (
            <>
              <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                Drag & drop a file here, or click to browse
              </Typography>
              <Button
                variant="contained"
                component="label"
                color="primary"
                sx={{ mt: 2 }}
                startIcon={<UploadIcon />}
              >
                Browse Files
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept=".pdf,.csv"
                  onChange={handleFileChange}
                />
              </Button>
            </>
          )}
        </Box>
        <FormHelperText>Supported formats: PDF, CSV</FormHelperText>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Website URL */}
      <Box component="section" sx={{ mb: 3, flex: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Website URL
        </Typography>
        {showUrlInput ? (
          <Box component="form" onSubmit={handleUrlSubmit}>
            <TextField
              fullWidth
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com"
              variant="outlined"
              sx={{
                mb: 2,
                "& .MuiInputBase-input": {
                  cursor: "text",
                },
              }}
              inputProps={{
                style: { cursor: "text" },
              }}
              helperText="Enter a full URL including http:// or https://"
            />
            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<LinkIcon />}
                disabled={!urlInput.trim()}
              >
                Process Website
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setShowUrlInput(false)}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        ) : (
          <Button
            onClick={() => setShowUrlInput(true)}
            variant="outlined"
            startIcon={<LinkIcon />}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Add Website URL
          </Button>
        )}
      </Box>
    </Paper>
  );
}

export default DocumentInput;
