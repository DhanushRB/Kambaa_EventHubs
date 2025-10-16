import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import PageLayout from "examples/LayoutContainers/PageLayout";

// Auto-resize window on load for popup mode
if (window.location !== window.parent.location || window.opener) {
  // This is in a popup or iframe
  if (window.resizeTo) {
    window.resizeTo(450, 650);
  }
}

function QAUser() {
  const [validationData, setValidationData] = useState({ email: "" });
  const [isValidated, setIsValidated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [question, setQuestion] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeEvent, setActiveEvent] = useState(null);
  const [checkingEvent, setCheckingEvent] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if this is the authenticated popup window
  const isAuthenticatedPopup =
    new URLSearchParams(window.location.search).get("authenticated") === "true";

  useEffect(() => {
    if (isAuthenticatedPopup && window.userData) {
      // This is the authenticated popup window
      setUserInfo(window.userData);
      setValidationData(window.validationData);
      setIsValidated(true);
      setActiveEvent({ id: window.userData.event_id, name: window.userData.event_name });

      // Add welcome message
      const welcomeMessage = {
        id: Date.now(),
        text: `Welcome ${window.userData.user_name}! You can ask questions about ${window.userData.event_name}. Your questions will be reviewed by our team.`,
        sender: "system",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([welcomeMessage]);

      const newSocket = io("http://localhost:8000", {
        path: "/socket.io",
      });
      setSocket(newSocket);
    } else {
      // Only check for active event if not already validated
      if (!isValidated) {
        checkActiveEvent();
      }
    }
  }, [isAuthenticatedPopup, isValidated]);

  const checkActiveEvent = async () => {
    try {
      setCheckingEvent(true);
      setError("");
      const response = await fetch("http://localhost:8000/api/qa/active-event");
      if (response.ok) {
        const data = await response.json();
        setActiveEvent(data);
        console.log("Active event found:", data);
      } else {
        console.log("No active Q/A session");
        setActiveEvent(null);
        setError("No active Q/A session available");
      }
    } catch (error) {
      console.error("Error checking active event:", error);
      setActiveEvent(null);
      setError("No active Q/A session available");
    } finally {
      setCheckingEvent(false);
    }
  };

  const handleValidation = async () => {
    if (!validationData.email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/qa/validate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: validationData.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Open chat interface in mobile-sized popup window
        const chatPopup = window.open(
          window.location.href + "?authenticated=true",
          "qaChatWindow",
          "width=400,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no,left=" +
            (screen.width / 2 - 200) +
            ",top=" +
            (screen.height / 2 - 350)
        );

        if (chatPopup) {
          // Pass user data to popup
          chatPopup.userData = data;
          chatPopup.validationData = validationData;
          chatPopup.focus();

          // Close current window
          window.close();
        } else {
          // Fallback if popup blocked - show in same window
          setUserInfo(data);
          setIsValidated(true);
          setActiveEvent({ id: data.event_id, name: data.event_name });

          const welcomeMessage = {
            id: Date.now(),
            text: `Welcome ${data.user_name}! You can ask questions about ${data.event_name}. Your questions will be reviewed by our team.`,
            sender: "system",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages([welcomeMessage]);

          const newSocket = io("http://localhost:8000", {
            path: "/socket.io",
          });
          setSocket(newSocket);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Invalid credentials");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: question,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
    const currentQuestion = question;
    setQuestion("");

    try {
      const response = await fetch("http://localhost:8000/api/qa/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: validationData.email,
          user_name: userInfo.user_name,
          question: currentQuestion,
        }),
      });

      if (response.ok) {
        // Add system confirmation message
        const systemMessage = {
          id: Date.now() + 1,
          text: "Question submitted successfully! It will be reviewed by our team.",
          sender: "system",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, systemMessage]);

        if (socket) {
          socket.emit("new_question", { eventId: userInfo.event_id });
        }
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          text: "Failed to submit question. Please try again.",
          sender: "system",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Network error. Please check your connection and try again.",
        sender: "system",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (checkingEvent) {
    return (
      <PageLayout>
        <MDBox
          position="absolute"
          width="100%"
          minHeight="100vh"
          sx={{
            backgroundImage: "linear-gradient(195deg, #42424a, #191919)",
          }}
        />
        <MDBox px={1} width="100%" height="100vh" mx="auto" position="relative" zIndex={2}>
          <Grid container spacing={1} justifyContent="center" alignItems="center" height="100%">
            <Grid item xs={11} sm={9} md={5} lg={4} xl={3}>
              <Card>
                <MDBox
                  variant="gradient"
                  bgColor="info"
                  borderRadius="lg"
                  coloredShadow="info"
                  mx={2}
                  mt={-3}
                  p={2}
                  mb={1}
                  textAlign="center"
                >
                  <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
                    Loading...
                  </MDTypography>
                </MDBox>
                <MDBox pt={4} pb={3} px={3} textAlign="center">
                  <MDTypography variant="body1" color="text" mb={2}>
                    Checking for active Q/A sessions...
                  </MDTypography>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </PageLayout>
    );
  }

  if (!activeEvent) {
    return (
      <PageLayout>
        <MDBox
          position="absolute"
          width="100%"
          minHeight="100vh"
          sx={{
            backgroundImage: "linear-gradient(195deg, #42424a, #191919)",
          }}
        />
        <MDBox px={1} width="100%" height="100vh" mx="auto" position="relative" zIndex={2}>
          <Grid container spacing={1} justifyContent="center" alignItems="center" height="100%">
            <Grid item xs={11} sm={9} md={5} lg={4} xl={3}>
              <Card>
                <MDBox
                  variant="gradient"
                  bgColor="error"
                  borderRadius="lg"
                  coloredShadow="error"
                  mx={2}
                  mt={-3}
                  p={2}
                  mb={1}
                  textAlign="center"
                >
                  <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
                    Q/A Unavailable
                  </MDTypography>
                </MDBox>
                <MDBox pt={4} pb={3} px={3} textAlign="center">
                  <MDTypography variant="body1" color="text" mb={2}>
                    {error || "No Q/A session is currently active. Please check back later."}
                  </MDTypography>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={checkActiveEvent}
                    disabled={checkingEvent}
                  >
                    {checkingEvent ? "Checking..." : "Refresh"}
                  </MDButton>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </PageLayout>
    );
  }

  if (!isValidated) {
    return (
      <PageLayout>
        <MDBox
          position="absolute"
          width="100%"
          minHeight="100vh"
          sx={{
            backgroundImage: "linear-gradient(195deg, #42424a, #191919)",
          }}
        />
        <MDBox px={1} width="100%" height="100vh" mx="auto" position="relative" zIndex={2}>
          <Grid container spacing={1} justifyContent="center" alignItems="center" height="100%">
            <Grid item xs={11} sm={9} md={5} lg={4} xl={3}>
              <Card>
                <MDBox
                  variant="gradient"
                  bgColor="info"
                  borderRadius="lg"
                  coloredShadow="info"
                  mx={2}
                  mt={-3}
                  p={2}
                  mb={1}
                  textAlign="center"
                >
                  <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
                    Q/A Access
                  </MDTypography>
                  <MDTypography variant="body2" color="white">
                    {activeEvent.name}
                  </MDTypography>
                </MDBox>
                <MDBox pt={4} pb={3} px={3}>
                  {error && (
                    <MDBox mb={2}>
                      <MDTypography variant="caption" color="error">
                        {error}
                      </MDTypography>
                    </MDBox>
                  )}

                  <MDBox mb={2}>
                    <MDInput
                      type="email"
                      label="Email"
                      fullWidth
                      value={validationData.email}
                      onChange={(e) =>
                        setValidationData((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </MDBox>
                  <MDBox mt={4} mb={1}>
                    <MDButton
                      variant="gradient"
                      color="info"
                      fullWidth
                      onClick={handleValidation}
                      disabled={loading}
                    >
                      {loading ? "Validating..." : "Access Q/A"}
                    </MDButton>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </PageLayout>
    );
  }

  return (
    <MDBox
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f5f7fa",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Header */}
      <MDBox
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          p: { xs: 2, sm: 2.5 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          minHeight: { xs: "60px", sm: "70px" },
        }}
      >
        <MDBox>
          <MDTypography variant="h6" color="white" fontWeight="bold">
            {userInfo?.user_name}
          </MDTypography>
          <MDTypography variant="caption" color="white" sx={{ opacity: 0.9 }}>
            Q&A Session • Online
          </MDTypography>
        </MDBox>
        <MDButton
          onClick={() => {
            setIsValidated(false);
            setUserInfo(null);
            if (socket) socket.disconnect();
            window.close();
          }}
          sx={{
            color: "white",
            minWidth: "auto",
            width: { xs: "40px", sm: "36px" },
            height: { xs: "40px", sm: "36px" },
            fontSize: { xs: "1.8rem", sm: "1.5rem" },
            fontWeight: "bold",
            backgroundColor: "transparent",
            border: "none",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
            },
            "&:focus": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          ×
        </MDButton>
      </MDBox>

      {/* Messages Area */}
      <MDBox
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 1, sm: 2 },
          backgroundColor: "#f0f2f5",
          backgroundImage:
            "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%)",
          backgroundSize: "20px 20px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.map((message) => (
          <MDBox
            key={message.id}
            sx={{
              display: "flex",
              justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
              mb: 1.5,
            }}
          >
            <MDBox
              sx={{
                maxWidth: "85%",
                p: 2,
                borderRadius: 3,
                backgroundColor:
                  message.sender === "user"
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "white",
                color: message.sender === "user" ? "white" : "#333",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                border: message.sender === "user" ? "none" : "1px solid #e1e8ed",
              }}
            >
              <MDTypography
                variant="body1"
                sx={{
                  wordBreak: "break-word",
                  fontWeight: "500",
                  fontSize: "0.95rem",
                  lineHeight: 1.4,
                }}
              >
                {message.text}
              </MDTypography>
              <MDTypography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: "right",
                  mt: 0.5,
                  opacity: message.sender === "user" ? 0.8 : 0.6,
                  fontSize: "0.75rem",
                  fontWeight: "400",
                }}
              >
                {message.timestamp}
              </MDTypography>
            </MDBox>
          </MDBox>
        ))}
        <div ref={messagesEndRef} />
      </MDBox>

      {/* Input Area */}
      <MDBox
        sx={{
          p: 2,
          backgroundColor: "white",
          borderTop: "1px solid #e1e8ed",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <MDInput
          placeholder="Type your question..."
          fullWidth
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleQuestionSubmit();
            }
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 4,
              backgroundColor: "#f8f9fa",
              border: "2px solid #e1e8ed",
              fontSize: "1rem",
              "&:hover": {
                borderColor: "#667eea",
              },
              "&.Mui-focused": {
                borderColor: "#667eea",
                backgroundColor: "white",
              },
            },
            "& .MuiOutlinedInput-input": {
              padding: "12px 16px",
              fontWeight: "500",
            },
          }}
        />
        <MDButton
          onClick={handleQuestionSubmit}
          disabled={loading || !question.trim()}
          sx={{
            minWidth: "auto",
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white !important",
            fontSize: "1.2rem",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
              transform: "scale(1.05)",
              boxShadow: "0 6px 16px rgba(102, 126, 234, 0.6)",
              color: "white !important",
            },
            "&:disabled": {
              background: "#ccc",
              color: "#999 !important",
              transform: "none",
              boxShadow: "none",
            },
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "⏳" : "▶"}
        </MDButton>
      </MDBox>
    </MDBox>
  );
}
export default QAUser;
