import { useState, useEffect } from "react";
import { useAuth } from "context/AuthContext";
import { useEvent } from "context/EventContext";
import API_BASE_URL from "config/api";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function DashboardHeader() {
  const { user } = useAuth();
  const { selectedEvent, handleEventChange } = useEvent();
  const [events, setEvents] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const eventsData = await response.json();
          setEvents([{ id: "all", name: "All Events" }, ...eventsData]);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getRoleDisplayName = (role) => {
    if (!role) return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <MDBox p={3}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <MDBox>
              <MDTypography variant="h3" fontWeight="bold" color="dark">
                Welcome {getRoleDisplayName(user?.role)}!
              </MDTypography>
              <MDTypography variant="body2" color="text" sx={{ mt: 0.5 }}>
                {user?.email}
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={4}>
            <MDBox textAlign="right">
              <MDTypography variant="body2" color="text" fontWeight="medium">
                {formatDateTime(currentDateTime)}
              </MDTypography>
            </MDBox>
          </Grid>
        </Grid>
        <MDBox mt={3}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Event Filter</InputLabel>
                <Select
                  value={selectedEvent}
                  label="Event Filter"
                  onChange={(e) => handleEventChange(e.target.value)}
                  sx={{ height: 45 }}
                >
                  {events.map((event) => (
                    <MenuItem key={event.id} value={event.id}>
                      {event.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default DashboardHeader;
