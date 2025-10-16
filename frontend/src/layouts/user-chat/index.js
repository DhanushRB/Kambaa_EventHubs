import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

function UserChatLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First check if there's an active Q/A session
      const sessionResponse = await fetch("http://localhost:8000/api/qa/active-event");

      if (!sessionResponse.ok) {
        setError("No active Q/A session found. Please try again later.");
        setLoading(false);
        return;
      }

      // Check if user exists
      const userResponse = await fetch(
        `http://localhost:8000/api/public/check-user/${encodeURIComponent(email)}`
      );
      const userData = await userResponse.json();

      if (!userData.exists) {
        setError("Email not found. Please check your email address.");
        setLoading(false);
        return;
      }

      // Store email and navigate to chat room immediately
      localStorage.setItem("userEmail", email);
      setLoading(false);
      navigate("/user-chat-room");
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect. Please try again.");
      setLoading(false);
    }
  };

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
      <Container maxWidth="xs">
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
              Enter your email to continue
            </MDTypography>
          </MDBox>
          <MDBox pt={4} pb={3} px={3}>
            <MDBox component="form" role="form">
              <MDBox mb={2}>
                <MDInput
                  type="email"
                  label="Email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? "Connecting..." : "Continue"}
                </MDButton>
              </MDBox>
            </MDBox>
          </MDBox>
        </Card>
      </Container>
    </Box>
  );
}

export default UserChatLogin;
