import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import API_BASE_URL from "config/api";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function Reports() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, dateFilter]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const eventsWithStats = await Promise.all(
        data.map(async (event) => {
          try {
            const statsResponse = await fetch(
              `${API_BASE_URL}/api/events/${event.id}/report-stats`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const stats = await statsResponse.json();
            return { ...event, ...stats };
          } catch (error) {
            return { ...event, totalParticipants: 0, attendanceRate: 0 };
          }
        })
      );

      setEvents(eventsWithStats);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((event) => {
        try {
          let eventDate = null;

          // Try to parse the event date
          if (event.date_part) {
            eventDate = new Date(event.date_part + "T00:00:00");
          } else if (event.event_date) {
            eventDate = new Date(event.event_date.split(" ")[0] + "T00:00:00");
          }

          if (eventDate && !isNaN(eventDate.getTime())) {
            return eventDate.toDateString() === filterDate.toDateString();
          }
          return false;
        } catch (error) {
          return false;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const formatDateTime = (event) => {
    if (!event) return "N/A";

    // Try multiple approaches to get a valid date
    let dateTime = null;

    // First try: Use date_part and time_part from backend
    if (event.date_part && event.time_part && event.date_part !== "" && event.time_part !== "") {
      try {
        const timeStr = event.time_part.includes(":") ? event.time_part : `${event.time_part}:00`;
        dateTime = new Date(`${event.date_part}T${timeStr}`);
        if (!isNaN(dateTime.getTime())) {
          return (
            dateTime.toLocaleDateString() +
            " " +
            dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          );
        }
      } catch (error) {
        console.log("Error parsing date_part and time_part:", error);
      }
    }

    // Second try: Use event_date directly
    if (
      event.event_date &&
      event.event_date !== "" &&
      event.event_date !== "Invalid Date" &&
      event.event_date !== "None"
    ) {
      try {
        // Handle different date formats
        let dateStr = event.event_date;

        // If it's just a date without time, add default time
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateStr += "T00:00:00";
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
          dateStr = dateStr.replace(" ", "T") + ":00";
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          dateStr = dateStr.replace(" ", "T");
        }

        dateTime = new Date(dateStr);
        if (!isNaN(dateTime.getTime())) {
          return (
            dateTime.toLocaleDateString() +
            " " +
            dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          );
        }
      } catch (error) {
        console.log("Error parsing event_date:", error);
      }
    }

    // Third try: Just show the date part if available
    if (event.date_part && event.date_part !== "") {
      try {
        const date = new Date(event.date_part + "T00:00:00");
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch (error) {
        console.log("Error parsing date_part only:", error);
      }
    }

    // Fallback: return the raw string or N/A
    return event.event_date && event.event_date !== "None" ? event.event_date : "N/A";
  };

  const handleEventClick = (eventId) => {
    navigate(`/reports/${eventId}`);
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
                  Event Reports
                </MDTypography>
              </MDBox>

              <MDBox pt={3} px={3}>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Icon>search</Icon>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Filter by Date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MDButton
                      variant="gradient"
                      color="secondary"
                      onClick={() => {
                        setSearchTerm("");
                        setDateFilter("");
                      }}
                    >
                      Clear Filters
                    </MDButton>
                  </Grid>
                </Grid>
              </MDBox>

              <MDBox px={3} pb={3}>
                {loading ? (
                  <MDBox textAlign="center" py={6}>
                    <MDTypography variant="h6" color="text">
                      Loading events...
                    </MDTypography>
                  </MDBox>
                ) : filteredEvents.length > 0 ? (
                  <Grid container spacing={3}>
                    {filteredEvents.map((event) => (
                      <Grid item xs={12} md={6} lg={4} key={event.id}>
                        <Card
                          sx={{
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: 3,
                            },
                          }}
                          onClick={() => handleEventClick(event.id)}
                        >
                          <MDBox p={3}>
                            <MDTypography variant="h5" fontWeight="medium" mb={1}>
                              {event.name}
                            </MDTypography>
                            <MDTypography variant="body2" color="text" mb={2}>
                              {formatDateTime(event)}
                            </MDTypography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <MDBox textAlign="center">
                                  <MDTypography variant="h4" color="info">
                                    {event.totalParticipants || 0}
                                  </MDTypography>
                                  <MDTypography variant="caption" color="text">
                                    Participants
                                  </MDTypography>
                                </MDBox>
                              </Grid>
                              <Grid item xs={6}>
                                <MDBox textAlign="center">
                                  <MDTypography variant="h4" color="success">
                                    {event.attendanceRate || 0}%
                                  </MDTypography>
                                  <MDTypography variant="caption" color="text">
                                    Attendance
                                  </MDTypography>
                                </MDBox>
                              </Grid>
                            </Grid>

                            <MDBox mt={2}>
                              <MDButton variant="gradient" color="info" size="small" fullWidth>
                                View Report
                              </MDButton>
                            </MDBox>
                          </MDBox>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <MDBox textAlign="center" py={6}>
                    <MDTypography variant="h6" color="text">
                      No events found matching your criteria.
                    </MDTypography>
                  </MDBox>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Reports;
