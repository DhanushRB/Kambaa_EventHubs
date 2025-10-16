import { useState, useEffect } from "react";
import io from "socket.io-client";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useAuth } from "context/AuthContext";
import ViewOnlyAlert from "components/ViewOnlyAlert";

function QA() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [socket, setSocket] = useState(null);
  const [responseDialog, setResponseDialog] = useState({
    open: false,
    question: null,
    response: "",
  });
  const [loading, setLoading] = useState(false);
  const [userPrivileges, setUserPrivileges] = useState({ role: "" });
  const [viewOnlyAlert, setViewOnlyAlert] = useState({ open: false, action: "" });

  const { user } = useAuth();

  const fetchUserPrivileges = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/user/privileges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUserPrivileges(data);
    } catch (error) {
      console.error("Error fetching user privileges:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUserPrivileges();

    const newSocket = io("http://localhost:8000", {
      path: "/socket.io",
    });
    setSocket(newSocket);

    newSocket.on("new_question", () => {
      if (selectedEvent) {
        setTimeout(() => fetchQuestions(selectedEvent.id), 500);
      }
    });

    newSocket.on("question_approved", () => {
      if (selectedEvent) {
        setTimeout(() => fetchQuestions(selectedEvent.id), 500);
      }
    });

    newSocket.on("question_answered", () => {
      if (selectedEvent) {
        setTimeout(() => fetchQuestions(selectedEvent.id), 500);
      }
    });

    // Auto-refresh questions every 3 seconds for real-time updates
    const interval = setInterval(() => {
      if (selectedEvent) {
        fetchQuestions(selectedEvent.id);
      }
    }, 3000);

    return () => {
      newSocket.disconnect();
      clearInterval(interval);
    };
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchQuestions = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        user?.role === "manager"
          ? `http://localhost:8000/api/qa/manager-questions/${eventId}`
          : `http://localhost:8000/api/qa/admin-questions/${eventId}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    fetchQuestions(event.id);
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setQuestions([]);
  };

  const handleToggleQA = async (eventId, active) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "toggle Q/A sessions" });
      return;
    }
    if (user?.role !== "admin") {
      alert("Only admins can toggle Q/A events");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/qa/toggle-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, active }),
      });

      if (response.ok) {
        fetchEvents();
        if (socket) {
          socket.emit("qa_toggled", { eventId, active });
        }
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to toggle Q/A");
      }
    } catch (error) {
      alert("Error toggling Q/A");
    }
  };

  const handleManagerApprove = async (questionId) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "approve questions" });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8000/api/qa/manager-approve/${questionId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (socket) {
        socket.emit("question_approved", { questionId });
      }

      fetchQuestions(selectedEvent.id);
    } catch (error) {
      console.error("Error approving question:", error);
    }
  };

  const handleManagerReject = async (questionId) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "reject questions" });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8000/api/qa/manager-reject/${questionId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (socket) {
        socket.emit("question_answered", { questionId, action: "rejected" });
      }

      fetchQuestions(selectedEvent.id);
    } catch (error) {
      console.error("Error rejecting question:", error);
    }
  };

  const handleAdminAction = async (questionId, action, response = "") => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "manage questions" });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:8000/api/qa/admin-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question_id: questionId, action, response }),
      });

      if (socket) {
        socket.emit("question_answered", { questionId, action });
      }

      fetchQuestions(selectedEvent.id);
      setResponseDialog({ open: false, question: null, response: "" });
    } catch (error) {
      console.error("Error handling admin action:", error);
    }
  };

  const handlePresenterClear = async (questionId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:8000/api/qa/presenter-clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question_id: questionId }),
      });

      if (socket) {
        socket.emit("question_cleared", { questionId });
      }

      fetchQuestions(selectedEvent.id);
    } catch (error) {
      console.error("Error clearing question:", error);
    }
  };

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
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Q/A Management System
                </MDTypography>
              </MDBox>
              <MDBox pt={3} px={3} pb={3}>
                {!selectedEvent ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <MDTypography variant="h6" mb={2}>
                        Select an Event
                      </MDTypography>
                      <Grid container spacing={2}>
                        {events.map((event) => (
                          <Grid item xs={12} md={6} lg={4} key={event.id}>
                            <Card
                              sx={{
                                border: event.qa_active ? "2px solid #4caf50" : "1px solid #e0e0e0",
                                backgroundColor: event.qa_active ? "#f1f8e9" : "white",
                              }}
                            >
                              <MDBox p={3}>
                                <MDBox
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  mb={2}
                                >
                                  <MDTypography variant="h6">{event.name}</MDTypography>
                                  {event.qa_active && (
                                    <MDTypography
                                      variant="caption"
                                      color="success"
                                      fontWeight="bold"
                                    >
                                      ACTIVE
                                    </MDTypography>
                                  )}
                                </MDBox>
                                <MDTypography variant="body2" color="text" mb={2}>
                                  Date: {event.event_date}
                                </MDTypography>

                                <MDBox
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <MDButton
                                    variant="gradient"
                                    color="info"
                                    size="small"
                                    onClick={() => handleEventSelect(event)}
                                  >
                                    View Q/A
                                  </MDButton>

                                  {user?.role === "admin" && (
                                    <MDButton
                                      variant={event.qa_active ? "contained" : "outlined"}
                                      color={event.qa_active ? "error" : "success"}
                                      size="small"
                                      onClick={() => handleToggleQA(event.id, !event.qa_active)}
                                      disabled={false}
                                    >
                                      {event.qa_active ? "Disable" : "Enable"}
                                    </MDButton>
                                  )}
                                </MDBox>
                              </MDBox>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <MDBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <MDTypography variant="h6">
                          {user?.role === "manager" ? "Pending Questions" : "Approved Questions"} -{" "}
                          {selectedEvent.name}
                        </MDTypography>
                        <MDButton variant="gradient" color="dark" onClick={handleBackToEvents}>
                          Back to Events
                        </MDButton>
                      </MDBox>

                      <Card>
                        <MDBox p={3}>
                          <List>
                            {questions.length === 0 ? (
                              <MDTypography variant="body2" color="text" textAlign="center" py={4}>
                                No questions available
                              </MDTypography>
                            ) : (
                              questions.map((question) => (
                                <ListItem key={question.id} divider>
                                  <ListItemText
                                    primary={question.question}
                                    secondary={
                                      <MDBox>
                                        <MDTypography variant="caption" color="text">
                                          {question.user_name} ({question.user_email})
                                        </MDTypography>
                                        <MDBox mt={1}>
                                          {user?.role === "manager" && (
                                            <MDBox>
                                              <MDButton
                                                size="small"
                                                color="success"
                                                onClick={() => handleManagerApprove(question.id)}
                                                sx={{ mr: 1 }}
                                              >
                                                Approve
                                              </MDButton>
                                              <MDButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleManagerReject(question.id)}
                                              >
                                                Reject
                                              </MDButton>
                                            </MDBox>
                                          )}
                                          {user?.role === "admin" && (
                                            <MDBox>
                                              <MDButton
                                                size="small"
                                                color="success"
                                                onClick={() =>
                                                  handleAdminAction(question.id, "answered")
                                                }
                                                sx={{ mr: 1 }}
                                              >
                                                Answer
                                              </MDButton>
                                              <MDButton
                                                size="small"
                                                color="warning"
                                                onClick={() =>
                                                  handleAdminAction(question.id, "skipped")
                                                }
                                                sx={{ mr: 1 }}
                                              >
                                                Skip
                                              </MDButton>
                                              <MDButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                  handleAdminAction(question.id, "rejected")
                                                }
                                              >
                                                Reject
                                              </MDButton>
                                            </MDBox>
                                          )}
                                          {user?.role === "presenter" && (
                                            <MDBox display="flex" alignItems="center" gap={1}>
                                              <Chip
                                                label="Approved for Presentation"
                                                color="success"
                                                size="small"
                                                variant="outlined"
                                              />
                                              <MDButton
                                                size="small"
                                                color="error"
                                                onClick={() => handlePresenterClear(question.id)}
                                              >
                                                Clear
                                              </MDButton>
                                            </MDBox>
                                          )}
                                        </MDBox>
                                      </MDBox>
                                    }
                                  />
                                </ListItem>
                              ))
                            )}
                          </List>
                        </MDBox>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <ViewOnlyAlert
        open={viewOnlyAlert.open}
        onClose={() => setViewOnlyAlert({ open: false, action: "" })}
        action={viewOnlyAlert.action}
      />
      <Footer />
    </DashboardLayout>
  );
}

export default QA;
