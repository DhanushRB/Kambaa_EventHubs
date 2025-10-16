import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import ViewOnlyAlert from "components/ViewOnlyAlert";

function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [attendanceForms, setAttendanceForms] = useState([]);
  const [userPrivileges, setUserPrivileges] = useState({
    is_admin: false,
    can_manage_all_forms: false,
  });

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return dateTimeString;

    const parts = dateTimeString.split(" ");
    if (parts.length < 2) return dateTimeString;

    const date = parts[0];
    const time = parts[1];

    // Convert 24-hour time to 12-hour format with AM/PM
    const [hours, minutes, seconds] = time.split(":");
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? "PM" : "AM";

    return `${date} ${hour12}:${minutes} ${ampm}`;
  };

  const [openDialog, setOpenDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventSlug, setEventSlug] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [viewOnlyAlert, setViewOnlyAlert] = useState({ open: false, action: "" });

  useEffect(() => {
    fetchEvents();
    fetchUserPrivileges();
  }, []);

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
      setEvents([]);
    }
  };

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

  const handleAddEvent = async () => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "create events" });
      return;
    }
    if (!eventName || !eventName.trim()) {
      alert("Event name is required");
      return;
    }
    if (!eventSlug || !eventSlug.trim()) {
      alert("Event slug is required");
      return;
    }
    if (!eventDate || !eventDate.trim()) {
      alert("Event date is required");
      return;
    }
    if (!eventTime || !eventTime.trim()) {
      alert("Event time is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: eventName.trim(),
          slug: eventSlug.trim(),
          event_date: eventDate.trim(),
          event_time: eventTime.trim(),
        }),
      });

      if (response.ok) {
        const eventData = await response.json();
        setOpenDialog(false);
        setEventName("");
        setEventSlug("");
        setEventDate("");
        setEventTime("");
        fetchEvents();
        setSnackbar({
          open: true,
          message: `Event created successfully! Registration URL: ${
            window.location.origin
          }/register/${eventSlug.trim()}`,
          severity: "success",
        });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || "Failed to create event"}`);
      }
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Error creating event. Please try again.");
    }
  };

  const handleEditEvent = (event) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "edit events" });
      return;
    }
    setEditingEvent(event);
    setEventName(event.name);
    setEventSlug(event.slug || "");
    const eventDateTime = event.event_date;
    if (eventDateTime && eventDateTime.includes(" ")) {
      const parts = eventDateTime.split(" ");
      setEventDate(parts[0]);
      // Extract time part (handle both HH:MM and HH:MM:SS formats)
      const timePart = parts[1];
      if (timePart) {
        const timeComponents = timePart.split(":");
        setEventTime(`${timeComponents[0]}:${timeComponents[1]}`);
      } else {
        setEventTime("");
      }
    } else {
      setEventDate(eventDateTime || "");
      setEventTime("");
    }
    setEditDialog(true);
  };

  const handleUpdateEvent = async () => {
    if (!eventName || !eventName.trim()) {
      alert("Event name is required");
      return;
    }
    if (!eventSlug || !eventSlug.trim()) {
      alert("Event slug is required");
      return;
    }
    if (!eventDate || !eventDate.trim()) {
      alert("Event date is required");
      return;
    }
    if (!eventTime || !eventTime.trim()) {
      alert("Event time is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: eventName.trim(),
          slug: eventSlug.trim(),
          event_date: eventDate.trim(),
          event_time: eventTime.trim(),
        }),
      });

      if (response.ok) {
        setEditDialog(false);
        setEventName("");
        setEventSlug("");
        setEventDate("");
        setEventTime("");
        setEditingEvent(null);
        fetchEvents();
        setSnackbar({ open: true, message: "Event updated successfully!", severity: "success" });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || "Failed to update event"}`);
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Error updating event. Please try again.");
    }
  };

  const handleDeleteEvent = async (event) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "delete events" });
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete "${event.name}"? This action cannot be undone.`
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/api/events/${event.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchEvents();
          setSnackbar({ open: true, message: "Event deleted successfully!", severity: "success" });
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.detail || "Failed to delete event"}`);
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Error deleting event. Please try again.");
      }
    }
  };

  const handleQAToggle = async (eventId, active) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "toggle Q/A sessions" });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/qa/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          active: active,
        }),
      });

      if (response.ok) {
        fetchEvents();
        const message = active ? "Q/A session activated!" : "Q/A session deactivated!";
        setSnackbar({ open: true, message, severity: "success" });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || "Failed to toggle Q/A session"}`);
      }
    } catch (error) {
      console.error("Error toggling Q/A session:", error);
      alert("Error toggling Q/A session. Please try again.");
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
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Events
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="dark"
                  onClick={() => {
                    if (userPrivileges.role === "presenter") {
                      setViewOnlyAlert({ open: true, action: "create events" });
                    } else {
                      setOpenDialog(true);
                    }
                  }}
                >
                  Add Event
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <Grid container spacing={3} px={3} pb={3}>
                  {events && events.length > 0 ? (
                    events.map((event) => (
                      <Grid item xs={12} md={6} lg={4} key={event.id}>
                        <Card>
                          <MDBox p={3}>
                            <MDBox
                              display="flex"
                              justifyContent="space-between"
                              alignItems="flex-start"
                            >
                              <MDBox sx={{ flexGrow: 1 }}>
                                <MDTypography
                                  variant="h5"
                                  fontWeight="medium"
                                  sx={{ cursor: "pointer", "&:hover": { color: "info.main" } }}
                                  onClick={() => navigate(`/events/${event.id}/analytics`)}
                                >
                                  {event.name}
                                </MDTypography>
                                <MDTypography variant="body2" color="text" mt={1}>
                                  Date: {formatDateTime(event.event_date)}
                                </MDTypography>
                                <MDTypography variant="body2" color="info" mt={0.5}>
                                  Registration URL: /register/{event.slug}
                                </MDTypography>
                                <MDBox mt={2}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={event.qa_active === 1}
                                        onChange={(e) => handleQAToggle(event.id, e.target.checked)}
                                        color="success"
                                      />
                                    }
                                    label={
                                      <MDTypography variant="caption" color="text">
                                        Q/A Session {event.qa_active === 1 ? "Active" : "Inactive"}
                                      </MDTypography>
                                    }
                                  />
                                </MDBox>
                              </MDBox>
                              <MDBox display="flex" flexDirection="column" gap={1}>
                                <MDButton
                                  variant="text"
                                  color="info"
                                  size="small"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  Edit
                                </MDButton>
                                <MDButton
                                  variant="text"
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteEvent(event)}
                                >
                                  Delete
                                </MDButton>
                              </MDBox>
                            </MDBox>
                          </MDBox>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <MDBox textAlign="center" py={6}>
                        <MDTypography variant="h6" color="text">
                          No events found. Click &ldquo;Add Event&rdquo; to create your first event.
                        </MDTypography>
                      </MDBox>
                    </Grid>
                  )}
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <MDBox mb={2}>
              <MDInput
                label="Event Name *"
                fullWidth
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                label="Event Slug (URL) *"
                fullWidth
                value={eventSlug}
                onChange={(e) =>
                  setEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                required
                helperText="This will be used in the registration URL: /register/your-slug"
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="date"
                label="Event Date *"
                fullWidth
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="time"
                label="Event Time *"
                fullWidth
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                helperText="Time will be displayed in 12-hour format with AM/PM"
              />
              {eventTime && (
                <MDBox mt={1}>
                  <MDTypography variant="caption" color="info">
                    Preview: {formatDateTime(`2024-01-01 ${eventTime}`)}
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleAddEvent} variant="gradient" color="info">
            Add Event
          </MDButton>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <MDBox mb={2}>
              <MDInput
                label="Event Name *"
                fullWidth
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                label="Event Slug (URL) *"
                fullWidth
                value={eventSlug}
                onChange={(e) =>
                  setEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                required
                helperText="This will be used in the registration URL: /register/your-slug"
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="date"
                label="Event Date *"
                fullWidth
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="time"
                label="Event Time *"
                fullWidth
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                helperText="Time will be displayed in 12-hour format with AM/PM"
              />
              {eventTime && (
                <MDBox mt={1}>
                  <MDTypography variant="caption" color="info">
                    Preview: {formatDateTime(`2024-01-01 ${eventTime}`)}
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setEditDialog(false)} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleUpdateEvent} variant="gradient" color="info">
            Update Event
          </MDButton>
        </DialogActions>
      </Dialog>

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

      <ViewOnlyAlert
        open={viewOnlyAlert.open}
        onClose={() => setViewOnlyAlert({ open: false, action: "" })}
        action={viewOnlyAlert.action}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default Events;
