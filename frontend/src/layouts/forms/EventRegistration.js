import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Container,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const EventRegistration = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone_number: "",
    collegeName: "",
    yearSemester: "",
    course: "",
    specifyCourse: "",
    howDidYouHear: "",
    referralEmail: "",
    userType: "student",
    isCurrentStudent: "yes",
    gender: "",
    agreeToTerms: "yes",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/public/event/${slug}`);
        if (response.ok) {
          const eventData = await response.json();
          setEvent(eventData);
        } else {
          setError("Event not found");
        }
      } catch (err) {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-fill name field
    if (name === "firstName" || name === "lastName") {
      setFormData((prev) => ({
        ...prev,
        name: `${name === "firstName" ? value : prev.firstName} ${
          name === "lastName" ? value : prev.lastName
        }`.trim(),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const registrationData = {
        name: formData.name,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone_number: formData.phone_number,
        custom_fields: {
          collegeName: formData.collegeName,
          yearSemester: formData.yearSemester,
          course: formData.course,
          specifyCourse: formData.specifyCourse,
          howDidYouHear: formData.howDidYouHear,
          referralEmail: formData.referralEmail,
          userType: formData.userType,
          isCurrentStudent: formData.isCurrentStudent,
          gender: formData.gender,
          agreeToTerms: formData.agreeToTerms,
          registrationId: `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
        project: "kambaa.ai",
        formName: "AI-workshop-new",
        eventId: slug,
      };

      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer kambaa-ai-workshop-2024-static-token",
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="sm"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error && !event) {
    return (
      <Container
        maxWidth="sm"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}
      >
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container
        maxWidth="sm"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}
      >
        <Card>
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="h4" color="success.main" gutterBottom>
              Registration Successful!
            </Typography>
            <Typography variant="body1">
              Thank you for registering for {event?.name}. You will receive a confirmation email
              shortly.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h3" gutterBottom>
              {event?.name}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Event Registration
            </Typography>
            {event?.event_date && (
              <Typography variant="body1" color="text.secondary" mt={1}>
                Date:{" "}
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="College Name"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Year/Semester"
                  name="yearSemester"
                  value={formData.yearSemester}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Course"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="How did you hear about this event?"
                  name="howDidYouHear"
                  value={formData.howDidYouHear}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={submitting}
                  sx={{ py: 2 }}
                >
                  {submitting ? <CircularProgress size={24} /> : "Register Now"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EventRegistration;
