import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import Icon from "@mui/material/Icon";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import axios from "axios";

function FormResponses() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);
  const [newResponsesCount, setNewResponsesCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    fetchResponses();
    fetchForm();

    // Set up WebSocket connection for real-time updates
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//apievents.kambaa.ai/ws/forms/${formId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected for form", formId);
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "new_response") {
          // Refresh responses when new one arrives
          fetchResponses(false);
          setNewResponsesCount((prev) => prev + 1);
          // Clear notification after 5 seconds
          setTimeout(() => setNewResponsesCount(0), 5000);
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
      // Fallback to polling if WebSocket fails
      const interval = setInterval(() => {
        fetchResponses(false);
      }, 10000);
      return () => clearInterval(interval);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [formId]);

  const fetchResponses = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/api/forms/${formId}/responses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const newData = response.data;
      if (previousCount > 0 && newData.length > previousCount) {
        setNewResponsesCount(newData.length - previousCount);
        // Clear notification after 5 seconds
        setTimeout(() => setNewResponsesCount(0), 5000);
      }
      setPreviousCount(newData.length);
      setResponses(newData);
    } catch (error) {
      console.error("Error fetching responses:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchForm = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:8000/api/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm(response.data);
    } catch (error) {
      console.error("Error fetching form:", error);
    }
  };

  const handleViewDetails = (response) => {
    setSelectedResponse(response);
    setDetailDialogOpen(true);
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getFormTypeConfig = () => {
    const configs = {
      quiz: { title: "Quiz", icon: "quiz", color: "info" },
      poll: { title: "Poll", icon: "poll", color: "success" },
      feedback: { title: "Feedback", icon: "feedback", color: "warning" },
    };
    return configs[form?.type] || configs.quiz;
  };

  const renderResponseValue = (question, value) => {
    if (!value) return "No answer";

    switch (question.question_type) {
      case "multiple_choice":
        return Array.isArray(value) ? value.join(", ") : value;
      case "rating":
        return `${value} stars`;
      case "text":
        return value.length > 100 ? `${value.substring(0, 100)}...` : value;
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <MDTypography variant="h4">Loading responses...</MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const typeConfig = getFormTypeConfig();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor={typeConfig.color}
                borderRadius="lg"
                coloredShadow={typeConfig.color}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDBox>
                  <MDTypography variant="h6" color="white">
                    {form?.title} - Responses
                  </MDTypography>
                  <Chip
                    label={typeConfig.title}
                    size="small"
                    sx={{ mt: 1, backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
                  />
                </MDBox>
                <MDBox>
                  <MDButton
                    variant="contained"
                    color="white"
                    onClick={() => navigate(`/forms/${formId}/analytics`)}
                    sx={{ mr: 1 }}
                    startIcon={<Icon>analytics</Icon>}
                  >
                    Analytics
                  </MDButton>
                  <MDButton
                    variant="contained"
                    color="white"
                    onClick={() => navigate("/forms")}
                    startIcon={<Icon>arrow_back</Icon>}
                  >
                    Back to Forms
                  </MDButton>
                </MDBox>
              </MDBox>

              <MDBox p={3}>
                {responses.length === 0 ? (
                  <MDBox textAlign="center" py={6}>
                    <Icon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}>inbox</Icon>
                    <MDTypography variant="h5" color="text.secondary" mb={1}>
                      No responses yet
                    </MDTypography>
                    <MDTypography variant="body2" color="text.secondary">
                      Share your form link to start collecting responses
                    </MDTypography>
                  </MDBox>
                ) : (
                  <>
                    <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
                      <MDBox>
                        <MDTypography variant="h6">
                          Total Responses: {responses.length}
                        </MDTypography>
                        {newResponsesCount > 0 && (
                          <Chip
                            icon={<Icon>notification_important</Icon>}
                            label={`${newResponsesCount} new response${
                              newResponsesCount > 1 ? "s" : ""
                            }!`}
                            color="success"
                            size="small"
                            sx={{
                              mt: 1,
                              "@keyframes pulse": {
                                "0%": { transform: "scale(1)", opacity: 1 },
                                "50%": { transform: "scale(1.05)", opacity: 0.8 },
                                "100%": { transform: "scale(1)", opacity: 1 },
                              },
                              animation: "pulse 1s infinite",
                            }}
                          />
                        )}
                      </MDBox>
                      <MDBox display="flex" gap={1}>
                        <Chip
                          icon={<Icon>{wsConnected ? "wifi" : "wifi_off"}</Icon>}
                          label={wsConnected ? "Live Updates" : "Reconnecting..."}
                          color={wsConnected ? "success" : "warning"}
                          size="small"
                          variant="outlined"
                          sx={{ display: "none" }}
                        />
                        <MDButton
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => fetchResponses(false)}
                          startIcon={<Icon>refresh</Icon>}
                        >
                          Refresh
                        </MDButton>
                      </MDBox>
                    </MDBox>

                    <DataTable
                      table={{
                        columns: [
                          { Header: "Name", accessor: "name", align: "left" },
                          { Header: "Email", accessor: "email", align: "left" },
                          ...(form?.type === "quiz"
                            ? [{ Header: "Score", accessor: "score", align: "center" }]
                            : []),
                          { Header: "Time Taken", accessor: "time_taken", align: "center" },
                          { Header: "Submitted", accessor: "submitted", align: "center" },
                          { Header: "Actions", accessor: "actions", align: "center" },
                        ],
                        rows: responses.map((response) => ({
                          name: response.user_name,
                          email: response.user_email,
                          ...(form?.type === "quiz"
                            ? {
                                score: (
                                  <Chip
                                    label={response.score}
                                    color={response.score > 0 ? "success" : "default"}
                                    size="small"
                                  />
                                ),
                              }
                            : {}),
                          time_taken: formatTime(response.time_taken),
                          submitted: formatDateTime(response.submitted_at),
                          actions: (
                            <MDButton
                              variant="text"
                              color="info"
                              size="small"
                              onClick={() => handleViewDetails(response)}
                            >
                              View Details
                            </MDButton>
                          ),
                        })),
                      }}
                      isSorted={false}
                      entriesPerPage={false}
                      showTotalEntries={false}
                      noEndBorder
                    />
                  </>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Response Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h6">
              Response Details - {selectedResponse?.user_name}
            </MDTypography>
            <Chip
              label={`${formatTime(selectedResponse?.time_taken || 0)}`}
              color="info"
              size="small"
            />
          </MDBox>
        </DialogTitle>
        <DialogContent>
          {selectedResponse && form && (
            <MDBox>
              {/* User Info */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="body2" color="text.secondary">
                      Name
                    </MDTypography>
                    <MDTypography variant="body1">{selectedResponse.user_name}</MDTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="body2" color="text.secondary">
                      Email
                    </MDTypography>
                    <MDTypography variant="body1">{selectedResponse.user_email}</MDTypography>
                  </Grid>
                  {form.type === "quiz" && (
                    <Grid item xs={12} sm={6}>
                      <MDTypography variant="body2" color="text.secondary">
                        Score
                      </MDTypography>
                      <MDTypography variant="body1">{selectedResponse.score}</MDTypography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="body2" color="text.secondary">
                      Submitted
                    </MDTypography>
                    <MDTypography variant="body1">
                      {formatDateTime(selectedResponse.submitted_at)}
                    </MDTypography>
                  </Grid>
                </Grid>
              </Box>

              {/* Responses */}
              <MDTypography variant="h6" mb={2}>
                Responses
              </MDTypography>
              {form.questions.map((question, index) => {
                const responseValue = selectedResponse.responses[question.id];
                const isCorrect =
                  form.type === "quiz" &&
                  question.correct_answer &&
                  responseValue === question.correct_answer;

                return (
                  <Accordion key={question.id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                      <MDBox display="flex" alignItems="center" width="100%">
                        <Chip label={`Q${index + 1}`} size="small" color="primary" sx={{ mr: 2 }} />
                        <MDTypography variant="body1" sx={{ flexGrow: 1 }}>
                          {question.question_text}
                        </MDTypography>
                        {form.type === "quiz" && question.correct_answer && (
                          <Chip
                            label={isCorrect ? "Correct" : "Incorrect"}
                            color={isCorrect ? "success" : "error"}
                            size="small"
                          />
                        )}
                      </MDBox>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <MDTypography variant="body2" color="text.secondary" mb={1}>
                            User&apos;s Answer:
                          </MDTypography>
                          <Box sx={{ p: 2, backgroundColor: "grey.100", borderRadius: 1 }}>
                            <MDTypography variant="body1">
                              {renderResponseValue(question, responseValue)}
                            </MDTypography>
                          </Box>
                        </Grid>
                        {form.type === "quiz" && question.correct_answer && (
                          <Grid item xs={12} md={6}>
                            <MDTypography variant="body2" color="text.secondary" mb={1}>
                              Correct Answer:
                            </MDTypography>
                            <Box sx={{ p: 2, backgroundColor: "success.light", borderRadius: 1 }}>
                              <MDTypography variant="body1" color="white">
                                {question.correct_answer}
                              </MDTypography>
                            </Box>
                          </Grid>
                        )}
                        {question.points > 0 && (
                          <Grid item xs={12}>
                            <MDTypography variant="caption" color="text.secondary">
                              Points: {isCorrect ? question.points : 0} / {question.points}
                            </MDTypography>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </MDBox>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setDetailDialogOpen(false)}>Close</MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default FormResponses;
