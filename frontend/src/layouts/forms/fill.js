import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

import Icon from "@mui/material/Icon";
import {
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Rating,
  LinearProgress,
  Box,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";

function FillForm() {
  const { formHash } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState({});
  const [userInfo, setUserInfo] = useState({ name: "", email: "", registration_id: "" });
  const [feedbackCharCount, setFeedbackCharCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeStarted, setTimeStarted] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isFirstTimeAttendance, setIsFirstTimeAttendance] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    fetchForm();
  }, [formHash]);

  useEffect(() => {
    if (form) {
      document.title = form.title;
    }
    return () => {
      document.title = "Kambaa Events Management Dashboard";
    };
  }, [form]);

  const handleAuthenticate = async () => {
    // Forms require both email and registration ID
    if (!userInfo.email.trim()) {
      setErrors({
        email: "Email is required",
      });
      return;
    }

    if (!userInfo.registration_id.trim()) {
      setErrors({
        registration_id: "Registration ID is required",
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
      setErrors({ email: "Please enter a valid email" });
      return;
    }

    setAuthLoading(true);
    try {
      const response = await axios.post(`http://localhost:8000/api/auth/validate-email`, {
        email: userInfo.email,
        registration_id: userInfo.registration_id,
      });

      if (response.data.valid) {
        if (form?.type === "attendance") {
          // Check if already marked attendance
          const checkResponse = await axios.get(
            `http://localhost:8000/api/public/forms/${formHash}/check-submission/${encodeURIComponent(
              userInfo.email
            )}`
          );

          if (checkResponse.data.hasSubmitted) {
            setIsFirstTimeAttendance(false);
            setSnackbar({
              open: true,
              message: "Attendance Already Marked",
              severity: "info",
            });
            setHasSubmitted(true);
          } else {
            // Auto-submit attendance
            await handleAttendanceSubmit();
          }
        } else {
          // Check if user already submitted
          const checkResponse = await axios.get(
            `http://localhost:8000/api/public/forms/${formHash}/check-submission/${encodeURIComponent(
              userInfo.email
            )}`
          );

          if (checkResponse.data.hasSubmitted) {
            setHasSubmitted(true);
          } else {
            setIsAuthenticated(true);
            setErrors({});
            // Start timer after authentication for all form types
            setTimeStarted(Date.now());
            if (form && form.settings?.timeLimit) {
              setTimeLeft(form.settings.timeLimit * 60);
            }
          }
        }
      } else {
        setSnackbar({
          open: true,
          message: "Invalid credentials. Please check your email and registration ID.",
          severity: "error",
        });
        setErrors({ email: "Invalid email or registration ID" });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setErrors({ email: "Invalid email or registration ID" });
      } else {
        setErrors({ email: "Authentication failed. Please try again." });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (form && form.settings?.timeLimit && timeLeft > 0 && isAuthenticated) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, form, isAuthenticated]);

  const fetchForm = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/public/forms/${formHash}`);
      setForm(response.data);
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Update feedback character count for feedback forms
    if (form?.type === "feedback") {
      const updatedResponses = { ...responses, [questionId]: value };
      let totalChars = 0;
      form.questions.forEach((question) => {
        if (question.question_type === "text" && updatedResponses[question.id]) {
          totalChars += String(updatedResponses[question.id]).trim().length;
        }
      });
      setFeedbackCharCount(totalChars);
    }

    if (errors[questionId]) {
      setErrors((prev) => ({
        ...prev,
        [questionId]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!userInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!userInfo.registration_id.trim()) {
      newErrors.registration_id = "Registration ID is required";
    }

    form.questions.forEach((question) => {
      if (question.is_required && !responses[question.id]) {
        newErrors[question.id] = "This question is required";
      }
      if (question.question_type === "textfield_with_limit" && responses[question.id]) {
        const charCount = String(responses[question.id]).trim().length;
        if (charCount < 150) {
          newErrors[question.id] = "This field requires at least 150 characters";
        }
      }
    });

    // Validate feedback character count only if there are text fields
    if (form?.type === "feedback") {
      const hasTextFields = form.questions.some((q) => q.question_type === "text");
      if (hasTextFields && feedbackCharCount < 150) {
        newErrors.feedback =
          "Feedback must contain at least 150 characters in total across all text fields";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAttendanceSubmit = async () => {
    try {
      // For attendance, record minimal time (1 second)
      const timeTaken = 1;

      const response = await axios.post(
        `http://localhost:8000/api/public/forms/${formHash}/submit`,
        {
          form_id: form?.id,
          user_email: userInfo.email,
          user_name: userInfo.name || "Attendance User",
          registration_id: userInfo.registration_id,
          responses: {},
          time_taken: timeTaken,
        }
      );

      setSnackbar({
        open: true,
        message: "Attendance Marked",
        severity: "success",
      });
      setHasSubmitted(true);
    } catch (error) {
      console.error("Error marking attendance:", error);
      if (error.response?.status === 400) {
        setIsFirstTimeAttendance(false);
        setSnackbar({
          open: true,
          message: "Attendance Already Marked",
          severity: "info",
        });
        setHasSubmitted(true);
      } else {
        setSnackbar({
          open: true,
          message: "Error marking attendance. Please try again.",
          severity: "error",
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Calculate time taken more accurately
      let timeTaken = 0;
      if (timeStarted) {
        timeTaken = Math.floor((Date.now() - timeStarted) / 1000);
        // Ensure minimum time of 1 second for valid submissions
        timeTaken = Math.max(timeTaken, 1);
      }

      const response = await axios.post(
        `http://localhost:8000/api/public/forms/${formHash}/submit`,
        {
          form_id: form?.id,
          user_email: userInfo.email,
          user_name: userInfo.name || "User",
          registration_id: userInfo.registration_id,
          responses: responses,
          time_taken: timeTaken,
        }
      );

      setResult(response.data);
      setShowResult(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response?.status === 403) {
        setSnackbar({
          open: true,
          message: "Only registered users can submit responses to this form.",
          severity: "error",
        });
      } else if (error.response?.status === 400) {
        setSnackbar({
          open: true,
          message:
            error.response.data.detail || "You have already submitted a response to this form.",
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Error submitting form. Please try again.",
          severity: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const value = responses[question.id] || "";
    const error = errors[question.id];

    switch (question.question_type) {
      case "multiple_choice":
        return (
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <FormControl component="fieldset" fullWidth error={!!error}>
              <FormGroup sx={{ gap: 1 }}>
                {question.options.map((option, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                      pr: 2,
                    }}
                  >
                    <Checkbox
                      checked={Array.isArray(value) ? value.includes(option) : false}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleResponseChange(question.id, [...currentValues, option]);
                        } else {
                          handleResponseChange(
                            question.id,
                            currentValues.filter((v) => v !== option)
                          );
                        }
                      }}
                      sx={{
                        color: form.brand_colors?.primary || "#1A73E8",
                        "&.Mui-checked": {
                          color: form.brand_colors?.primary || "#1A73E8",
                        },
                        mt: -0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        wordWrap: "break-word",
                        overflowWrap: "anywhere",
                        whiteSpace: "normal",
                      }}
                    >
                      <MDTypography
                        variant="body2"
                        sx={{
                          color: "#323130",
                          fontSize: "14px",
                          lineHeight: 1.4,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          const currentValues = Array.isArray(value) ? value : [];
                          if (currentValues.includes(option)) {
                            handleResponseChange(
                              question.id,
                              currentValues.filter((v) => v !== option)
                            );
                          } else {
                            handleResponseChange(question.id, [...currentValues, option]);
                          }
                        }}
                      >
                        {option}
                      </MDTypography>
                    </Box>
                  </Box>
                ))}
              </FormGroup>
            </FormControl>
            {error && (
              <MDTypography variant="caption" color="error">
                {error}
              </MDTypography>
            )}
          </Box>
        );

      case "single_choice":
        return (
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <FormControl component="fieldset" fullWidth error={!!error}>
              <RadioGroup
                value={value}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                sx={{ gap: 1 }}
              >
                {question.options.map((option, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                      pr: 2,
                    }}
                  >
                    <Radio
                      value={option}
                      sx={{
                        color: form.brand_colors?.primary || "#1A73E8",
                        "&.Mui-checked": {
                          color: form.brand_colors?.primary || "#1A73E8",
                        },
                        mt: -0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        wordWrap: "break-word",
                        overflowWrap: "anywhere",
                        whiteSpace: "normal",
                      }}
                    >
                      <MDTypography
                        variant="body2"
                        sx={{
                          color: "#323130",
                          fontSize: "14px",
                          lineHeight: 1.4,
                          cursor: "pointer",
                        }}
                        onClick={() => handleResponseChange(question.id, option)}
                      >
                        {option}
                      </MDTypography>
                    </Box>
                  </Box>
                ))}
              </RadioGroup>
            </FormControl>
            {error && (
              <MDTypography variant="caption" color="error">
                {error}
              </MDTypography>
            )}
          </Box>
        );

      case "yes_no":
        return (
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <FormControl component="fieldset" fullWidth error={!!error}>
              <RadioGroup
                value={value}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                sx={{ gap: 1 }}
              >
                {["Yes", "No"].map((option) => (
                  <Box
                    key={option}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                      pr: 2,
                    }}
                  >
                    <Radio
                      value={option}
                      sx={{
                        color: form.brand_colors?.primary || "#1A73E8",
                        "&.Mui-checked": {
                          color: form.brand_colors?.primary || "#1A73E8",
                        },
                        mt: -0.5,
                        flexShrink: 0,
                      }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        wordWrap: "break-word",
                        overflowWrap: "anywhere",
                        whiteSpace: "normal",
                      }}
                    >
                      <MDTypography
                        variant="body2"
                        sx={{
                          color: "#323130",
                          fontSize: "14px",
                          lineHeight: 1.4,
                          cursor: "pointer",
                        }}
                        onClick={() => handleResponseChange(question.id, option)}
                      >
                        {option}
                      </MDTypography>
                    </Box>
                  </Box>
                ))}
              </RadioGroup>
            </FormControl>
            {error && (
              <MDTypography variant="caption" color="error">
                {error}
              </MDTypography>
            )}
          </Box>
        );

      case "text":
        const charCount = String(value).trim().length;
        const showCharCount = form?.type === "feedback";
        return (
          <Box>
            <TextField
              fullWidth
              placeholder="Your answer"
              multiline
              rows={4}
              value={value}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              error={!!error}
              helperText={error}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#e1dfdd",
                  },
                  "&:hover fieldset": {
                    borderColor: form.brand_colors?.primary || "#1A73E8",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: form.brand_colors?.primary || "#1A73E8",
                  },
                },
              }}
            />
            {showCharCount && (
              <Box
                sx={{
                  position: "relative",
                  mt: 1,
                  textAlign: "right",
                }}
              >
                <MDTypography
                  variant="caption"
                  sx={{
                    color: charCount >= 150 ? "success.main" : "text.secondary",
                    fontSize: "12px",
                  }}
                >
                  {charCount} characters (Total: {feedbackCharCount}/150 required)
                </MDTypography>
              </Box>
            )}
          </Box>
        );

      case "textfield":
        return (
          <Box>
            <TextField
              fullWidth
              placeholder="Your answer"
              value={value}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              error={!!error}
              helperText={error}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#e1dfdd",
                  },
                  "&:hover fieldset": {
                    borderColor: "#1A73E8",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1A73E8",
                  },
                },
              }}
            />
          </Box>
        );

      case "textfield_with_limit":
        const textFieldCharCount = String(value).trim().length;
        return (
          <Box>
            <TextField
              fullWidth
              placeholder="Your answer (minimum 150 characters required)"
              multiline
              rows={4}
              value={value}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              error={!!error}
              helperText={error}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#e1dfdd",
                  },
                  "&:hover fieldset": {
                    borderColor: "#1A73E8",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1A73E8",
                  },
                },
              }}
            />
            <Box
              sx={{
                position: "relative",
                mt: 1,
                textAlign: "right",
              }}
            >
              <MDTypography
                variant="caption"
                sx={{
                  color: textFieldCharCount >= 150 ? "success.main" : "text.secondary",
                  fontSize: "12px",
                }}
              >
                {textFieldCharCount}/150 characters
              </MDTypography>
            </Box>
          </Box>
        );

      case "rating":
        return (
          <Box>
            <Rating
              value={parseInt(value) || 0}
              onChange={(e, newValue) => handleResponseChange(question.id, newValue)}
              size="large"
              sx={{
                color: form.brand_colors?.primary || "#1A73E8",
                "& .MuiRating-iconEmpty": {
                  color: "#e1dfdd",
                },
              }}
            />
            {error && (
              <MDTypography variant="caption" color="error" display="block" mt={1}>
                {error}
              </MDTypography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getFormTypeConfig = () => {
    return {
      title: form?.type?.charAt(0).toUpperCase() + form?.type?.slice(1) || "Form",
      icon: "description",
      color: "#1A73E8",
    };
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f2f1",
        }}
      >
        <MDTypography variant="h4" color="#323130">
          Loading form...
        </MDTypography>
      </Box>
    );
  }

  if (!form) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f2f1",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            backgroundColor: "white",
            border: "1px solid #e1dfdd",
            borderRadius: 2,
          }}
        >
          <Icon sx={{ fontSize: 64, color: "#d13438", mb: 2 }}>error</Icon>
          <MDTypography variant="h4" mb={2} color="#323130">
            Form Not Found
          </MDTypography>
          <MDTypography variant="body1" color="#605e5c">
            The form you&apos;re looking for doesn&apos;t exist or has been deactivated.
          </MDTypography>
        </Paper>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f3f2f1",
          py: 0,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "white",
            borderBottom: "1px solid #e1dfdd",
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={{ xs: 2, sm: 0 }}
          >
            <Box display="flex" alignItems="center">
              <img
                src="/kambaa-logo.jpeg"
                alt="Kambaa Logo"
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "contain",
                  marginRight: "12px",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <MDTypography
                variant="h6"
                color="#323130"
                fontWeight="600"
                sx={{ fontSize: { xs: "16px", sm: "18px" } }}
              >
                Kambaa Forms
              </MDTypography>
            </Box>
            {form.settings?.timeLimit &&
              isAuthenticated &&
              timeStarted &&
              timeLeft !== null &&
              timeLeft > 0 && (
                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  flexDirection={{ xs: "column", sm: "row" }}
                >
                  <MDTypography
                    variant="body2"
                    color="#605e5c"
                    sx={{ fontSize: { xs: "12px", sm: "14px" } }}
                  >
                    Time remaining: {formatTime(timeLeft)}
                  </MDTypography>
                  <LinearProgress
                    variant="determinate"
                    value={(timeLeft / (form.settings.timeLimit * 60)) * 100}
                    sx={{
                      width: { xs: 80, sm: 100 },
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#edebe9",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: timeLeft < 300 ? "#d13438" : "#1A73E8",
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            maxWidth: "720px",
            mx: "auto",
            py: { xs: 2, sm: 4 },
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Banner Image */}
          {form.banner_image && (
            <Box sx={{ mb: 3 }}>
              <img
                src={`http://localhost:8000/api/files/${form.banner_image?.replace(
                  "uploads/",
                  ""
                )}`}
                alt="Banner"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
                onError={(e) => {
                  console.error("Banner image failed to load:", e.target.src);
                  e.target.style.display = "none";
                }}
              />
            </Box>
          )}

          {/* Form Header */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: { xs: 2, sm: 4 },
              backgroundColor: "white",
              border: "1px solid #e1dfdd",
              borderRadius: 2,
              borderTop: `4px solid ${form.brand_colors?.primary || "#1A73E8"}`,
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              {form.logo_image && (
                <img
                  src={`http://localhost:8000/api/files/${form.logo_image?.replace(
                    "uploads/",
                    ""
                  )}`}
                  alt="Logo"
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "contain",
                    marginRight: 16,
                  }}
                  onError={(e) => {
                    console.error("Logo image failed to load:", e.target.src);
                    e.target.style.display = "none";
                  }}
                />
              )}
              <Box>
                <MDTypography
                  variant="h4"
                  sx={{
                    color: form.brand_colors?.primary || "#323130",
                    fontWeight: 600,
                    mb: 1,
                    fontSize: { xs: "20px", sm: "24px", md: "28px" },
                  }}
                >
                  {form.title}
                </MDTypography>
                {form.description && (
                  <MDTypography
                    variant="body1"
                    sx={{
                      color: "#605e5c",
                      fontSize: "16px",
                      lineHeight: 1.5,
                    }}
                  >
                    {form.description}
                  </MDTypography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* User Information Section */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: { xs: 2, sm: 4 },
              backgroundColor: "white",
              border: "1px solid #e1dfdd",
              borderRadius: 2,
            }}
          >
            <MDTypography
              variant="h6"
              sx={{
                color: "#323130",
                fontWeight: 600,
                mb: 3,
                fontSize: { xs: "16px", sm: "18px" },
              }}
            >
              {form?.type === "attendance" ? "Mark Attendance" : "Your Information"}
            </MDTypography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo((prev) => ({ ...prev, email: e.target.value }))}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#e1dfdd",
                      },
                      "&:hover fieldset": {
                        borderColor: "#1A73E8",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1A73E8",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Registration ID"
                  value={userInfo.registration_id}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, registration_id: e.target.value }))
                  }
                  error={!!errors.registration_id}
                  helperText={errors.registration_id}
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#e1dfdd",
                      },
                      "&:hover fieldset": {
                        borderColor: "#1A73E8",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1A73E8",
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
            {form?.type === "feedback" &&
              form.questions.some((q) => q.question_type === "text") && (
                <Box mt={2}>
                  <MDTypography variant="caption" color="text.secondary">
                    Note: Feedback forms require at least 150 characters total across all text
                    fields.
                  </MDTypography>
                </Box>
              )}
            {errors.feedback && (
              <Box mt={1}>
                <MDTypography variant="caption" color="error">
                  {errors.feedback}
                </MDTypography>
              </Box>
            )}
            {!isAuthenticated && !hasSubmitted && (
              <Box textAlign="left" mt={3}>
                <MDButton
                  onClick={handleAuthenticate}
                  disabled={authLoading}
                  sx={{
                    backgroundColor: "white",
                    color: form.brand_colors?.primary || "#1A73E8",
                    border: `2px solid ${form.brand_colors?.primary || "#1A73E8"}`,
                    px: { xs: 2, sm: 3 },
                    py: 1.5,
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 600,
                    width: { xs: "100%", sm: "auto" },
                    "&:hover": {
                      backgroundColor: "#f8f9fa",
                      borderColor: form.brand_colors?.secondary || "#1557B0",
                      color: form.brand_colors?.secondary || "#1557B0",
                    },
                    "&:disabled": {
                      backgroundColor: "#f5f5f5",
                      color: "#999",
                      borderColor: "#ddd",
                    },
                  }}
                >
                  {authLoading
                    ? "Verifying..."
                    : form?.type === "attendance"
                    ? "Mark Attendance"
                    : "Continue"}
                </MDButton>
              </Box>
            )}
          </Paper>

          {/* Questions Section */}
          {isAuthenticated && !hasSubmitted && (
            <>
              {form.questions.map((question, index) => (
                <Paper
                  key={question.id}
                  elevation={0}
                  sx={{
                    mb: 3,
                    p: { xs: 2, sm: 4 },
                    backgroundColor: "white",
                    border: "1px solid #e1dfdd",
                    borderRadius: 2,
                  }}
                >
                  <Box mb={3}>
                    <MDTypography
                      variant="h6"
                      sx={{
                        color: "#323130",
                        fontWeight: 600,
                        mb: 1,
                        fontSize: { xs: "14px", sm: "16px" },
                      }}
                    >
                      {index + 1}. {question.question_text}
                      {question.is_required && (
                        <span style={{ color: "#d13438", marginLeft: "4px" }}>*</span>
                      )}
                    </MDTypography>
                    {form.type === "quiz" && question.points > 0 && (
                      <MDTypography
                        variant="caption"
                        sx={{
                          color: "#605e5c",
                          fontSize: "12px",
                        }}
                      >
                        {question.points} point{question.points !== 1 ? "s" : ""}
                      </MDTypography>
                    )}
                  </Box>
                  <Box>{renderQuestion(question)}</Box>
                </Paper>
              ))}

              {/* Submit Button */}
              <Box textAlign="left" mt={4}>
                <MDButton
                  onClick={handleSubmit}
                  disabled={submitting}
                  sx={{
                    backgroundColor: "white",
                    color: form.brand_colors?.primary || "#1A73E8",
                    border: `2px solid ${form.brand_colors?.primary || "#1A73E8"}`,
                    px: { xs: 3, sm: 4 },
                    py: 1.5,
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: { xs: "14px", sm: "16px" },
                    width: { xs: "100%", sm: "auto" },
                    "&:hover": {
                      backgroundColor: "#f8f9fa",
                      borderColor: form.brand_colors?.secondary || "#1557B0",
                      color: form.brand_colors?.secondary || "#1557B0",
                    },
                    "&:disabled": {
                      backgroundColor: "#f5f5f5",
                      color: "#999",
                      borderColor: "#ddd",
                    },
                  }}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </MDButton>
              </Box>
            </>
          )}

          {/* Footer */}
          {form.footer_text && (
            <Paper
              elevation={0}
              sx={{
                mt: 4,
                p: { xs: 2, sm: 3 },
                backgroundColor: "white",
                border: "1px solid #e1dfdd",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <MDTypography
                variant="body2"
                sx={{
                  color: "#605e5c",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {form.footer_text}
              </MDTypography>
            </Paper>
          )}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={showResult}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            mx: { xs: 2, sm: 3 },
            width: { xs: "calc(100% - 32px)", sm: "100%" },
          },
        }}
      >
        <DialogTitle>
          <MDBox display="flex" alignItems="center">
            <Icon sx={{ mr: 1, color: "success.main" }}>check_circle</Icon>
            Response Submitted Successfully!
          </MDBox>
        </DialogTitle>
        <DialogContent>
          <MDBox textAlign="center" py={2}>
            <Icon sx={{ fontSize: 64, color: "success.main", mb: 2 }}>celebration</Icon>
            <MDTypography variant="h6" mb={2}>
              Thank you for your response!
            </MDTypography>

            {result && form.type === "quiz" && form.settings?.showResults && (
              <MDBox>
                <MDTypography variant="h4" color="info.main" mb={1}>
                  {result.score} / {result.total_points}
                </MDTypography>
                <MDTypography variant="body1" color="text.secondary">
                  Your Score: {((result.score / result.total_points) * 100).toFixed(1)}%
                </MDTypography>
              </MDBox>
            )}

            <MDTypography variant="body2" color="text.secondary" mt={2}>
              Your response has been recorded. You can now close this window.
            </MDTypography>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton
            onClick={() => {
              window.close();
              if (!window.closed) window.location.href = "about:blank";
            }}
            color="info"
          >
            Close
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Already Submitted Dialog */}
      <Dialog
        open={hasSubmitted}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            mx: { xs: 2, sm: 3 },
            width: { xs: "calc(100% - 32px)", sm: "100%" },
          },
        }}
      >
        <DialogTitle>
          <MDBox display="flex" alignItems="center">
            <Icon sx={{ mr: 1, color: "info.main" }}>info</Icon>
            {form?.type === "attendance"
              ? isFirstTimeAttendance
                ? "Attendance Marked"
                : "Attendance Already Marked"
              : "Response Already Submitted"}
          </MDBox>
        </DialogTitle>
        <DialogContent>
          <MDBox textAlign="center" py={2}>
            <Icon sx={{ fontSize: 64, color: "info.main", mb: 2 }}>check_circle</Icon>
            <MDTypography variant="body1" color="text.secondary">
              {form?.type === "attendance"
                ? isFirstTimeAttendance
                  ? "Your attendance has been marked. Please close this form."
                  : "Your attendance has already been marked. Please close this form."
                : "You have submitted a response to this form. Thank you for your participation!"}
            </MDTypography>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton
            onClick={() => {
              window.close();
              if (!window.closed) window.location.href = "about:blank";
            }}
            color="info"
          >
            Close
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Registration Required Dialog */}
      <Dialog
        open={errors.email === "Only registered users can access this form"}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            mx: { xs: 2, sm: 3 },
            width: { xs: "calc(100% - 32px)", sm: "100%" },
          },
        }}
      >
        <DialogTitle>
          <MDBox display="flex" alignItems="center">
            <Icon sx={{ mr: 1, color: "warning.main" }}>warning</Icon>
            Registration Required
          </MDBox>
        </DialogTitle>
        <DialogContent>
          <MDBox textAlign="center" py={2}>
            <Icon sx={{ fontSize: 64, color: "warning.main", mb: 2 }}>person_add</Icon>
            <MDTypography variant="h6" mb={2}>
              Please register if you have not registered
            </MDTypography>
            <MDTypography variant="body1" color="text.secondary">
              You need to be registered to access this form. Please register first or try again with
              correct credentials.
            </MDTypography>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setErrors({})} color="secondary">
            Retry
          </MDButton>
          <MDButton
            onClick={() => {
              if (form?.register_link) {
                window.open(form.register_link, "_blank");
              } else {
                setSnackbar({
                  open: true,
                  message: "Registration link not available. Please contact administrator.",
                  severity: "warning",
                });
              }
            }}
            variant="gradient"
            color="info"
          >
            Register
          </MDButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default FillForm;
