import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

function UserChatRoom() {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationStep, setValidationStep] = useState(true);
  const [tempRegistrationId, setTempRegistrationId] = useState("");
  const [sessionChecking, setSessionChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const storedRegId = localStorage.getItem("userRegistrationId");
    const storedUserName = localStorage.getItem("userName");

    if (!email) {
      navigate("/user-chat-login");
      return;
    }

    setUserEmail(email);

    // Check if user is already validated
    if (storedRegId && storedUserName) {
      setRegistrationId(storedRegId);
      setUserName(storedUserName);
      setValidationStep(false);
    }
  }, [navigate]);

  // Initial load and periodic session check
  useEffect(() => {
    if (!validationStep && userEmail && registrationId) {
      // Initial load of questions
      fetchUserQuestions();

      // Set up periodic session check
      const interval = setInterval(() => {
        checkActiveSession();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [validationStep, userEmail, registrationId]);

  const checkActiveSession = async () => {
    try {
      const storedRegId = localStorage.getItem("userRegistrationId");
      if (!storedRegId || !userEmail) {
        return;
      }

      const response = await fetch("http://localhost:8000/api/qa/check-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          registration_id: storedRegId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.valid) {
          setError(data.message || "Session expired");
          localStorage.removeItem("userRegistrationId");
          localStorage.removeItem("userName");
          setValidationStep(true);
        }
      }
    } catch (error) {
      console.error("Error checking active session:", error);
    }
  };

  const handleValidateUser = async () => {
    if (!tempRegistrationId.trim()) {
      setError("Please enter your registration ID");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await fetch("http://localhost:8000/api/qa/validate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, registration_id: tempRegistrationId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || "Invalid credentials");
        setLoading(false);
        return;
      }
      const userData = await response.json();
      setUserName(userData.user_name);
      setRegistrationId(tempRegistrationId);

      // Store validation data in localStorage
      localStorage.setItem("userRegistrationId", tempRegistrationId);
      localStorage.setItem("userName", userData.user_name);

      setValidationStep(false);
      setLoading(false);
    } catch (error) {
      console.error("Error validating user:", error);
      setError("Failed to validate user. Please try again.");
      setLoading(false);
    }
  };

  const fetchUserQuestions = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/qa/user-questions?email=${encodeURIComponent(userEmail)}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuestions(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to fetch questions. Please try again.");
    }
  };

  const handleQuestionSubmit = async () => {
    if (!newQuestion.trim()) {
      setError("Please enter a question");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:8000/api/qa/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          user_name: userName,
          registration_id: registrationId,
          question: newQuestion.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setNewQuestion("");
        await fetchUserQuestions();
        // Show success message briefly
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to submit question");
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      setError("Failed to submit question. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "manager_approved":
        return "info";
      case "answered":
        return "success";
      case "rejected":
        return "error";
      case "skipped":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending Review";
      case "manager_approved":
        return "Approved - Waiting for Answer";
      case "answered":
        return "Answered";
      case "rejected":
        return "Rejected";
      case "skipped":
        return "Skipped";
      default:
        return status;
    }
  };

  if (validationStep) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(195deg, #42424a, #191919)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="sm">
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
                Join Q/A Session
              </MDTypography>
              <MDTypography display="block" variant="button" color="white" my={1}>
                {error
                  ? "Please verify your credentials"
                  : "Enter your registration ID to join the Q/A session"}
              </MDTypography>
            </MDBox>
            <MDBox pt={4} pb={3} px={3}>
              <MDBox mb={2}>
                <MDInput label="Email" value={userEmail} disabled fullWidth />
              </MDBox>
              <MDBox mb={2}>
                <MDInput
                  label="Registration ID"
                  value={tempRegistrationId}
                  onChange={(e) => setTempRegistrationId(e.target.value)}
                  fullWidth
                />
              </MDBox>
              {error && (
                <MDBox mb={2}>
                  <MDTypography variant="caption" color="error">
                    {error}
                  </MDTypography>
                </MDBox>
              )}
              <MDBox mt={4} mb={1}>
                <MDButton
                  variant="gradient"
                  color="info"
                  fullWidth
                  onClick={handleValidateUser}
                  disabled={loading}
                >
                  {loading ? "Validating..." : "Join Session"}
                </MDButton>
              </MDBox>
            </MDBox>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{ minHeight: "100vh", background: "linear-gradient(195deg, #42424a, #191919)", py: 3 }}
    >
      <Container maxWidth="md">
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
              Q/A Session
            </MDTypography>
            <MDTypography display="block" variant="button" color="white" my={1}>
              Ask questions and view your submissions • Session Active
            </MDTypography>
          </MDBox>
          <MDBox pt={4} pb={3} px={3}>
            <MDBox mb={3}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Ask a question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                variant="outlined"
              />
              <MDBox mt={2}>
                <MDButton
                  variant="gradient"
                  color="info"
                  onClick={handleQuestionSubmit}
                  disabled={loading || !newQuestion.trim()}
                >
                  {loading ? "Submitting..." : "Submit Question"}
                </MDButton>
                <MDButton
                  variant="outlined"
                  color="info"
                  onClick={fetchUserQuestions}
                  sx={{ ml: 2 }}
                >
                  Refresh
                </MDButton>
              </MDBox>
            </MDBox>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <MDTypography variant="h6">Your Questions</MDTypography>
              <MDBox>
                <MDTypography variant="caption" color="text">
                  Welcome, {userName}
                </MDTypography>
                <MDButton
                  variant="text"
                  color="error"
                  size="small"
                  onClick={() => {
                    localStorage.removeItem("userEmail");
                    localStorage.removeItem("userRegistrationId");
                    localStorage.removeItem("userName");
                    navigate("/user-chat-login");
                  }}
                  sx={{
                    ml: 2,
                    minWidth: "auto",
                    padding: 0,
                    backgroundColor: "transparent",
                    border: "none",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "transparent",
                      boxShadow: "none",
                    },
                  }}
                >
                  ×
                </MDButton>
              </MDBox>
            </MDBox>
            {error && (
              <MDBox mb={2}>
                <MDTypography variant="caption" color="error">
                  {error}
                </MDTypography>
              </MDBox>
            )}
            <List>
              {questions.length === 0 ? (
                <MDBox textAlign="center" py={4}>
                  <MDTypography variant="body2" color="text">
                    No questions submitted yet. Ask your first question!
                  </MDTypography>
                </MDBox>
              ) : (
                questions.map((question) => (
                  <ListItem key={question.id} divider>
                    <ListItemText
                      primary={question.question}
                      secondary={
                        <MDBox mt={1}>
                          <Chip
                            label={getStatusLabel(question.status)}
                            color={getStatusColor(question.status)}
                            size="small"
                          />
                          <MDTypography variant="caption" color="text" display="block" mt={1}>
                            Submitted: {new Date(question.created_at).toLocaleString()}
                          </MDTypography>
                        </MDBox>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </MDBox>
        </Card>
      </Container>
    </Box>
  );
}

export default UserChatRoom;
