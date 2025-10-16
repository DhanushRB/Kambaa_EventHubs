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
import Icon from "@mui/material/Icon";
import DataTable from "examples/Tables/DataTable";

function EventAnalytics() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching analytics for event ID:", eventId);
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Analytics response status:", response.status);
      const data = await response.json();
      console.log("Analytics data received:", data);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <MDTypography variant="h4">Loading analytics...</MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <MDTypography variant="h4">Analytics not found</MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

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
                <MDBox>
                  <MDTypography variant="h6" color="white">
                    {analytics.event_name} - Analytics
                  </MDTypography>
                </MDBox>
                <MDButton
                  variant="contained"
                  color="white"
                  onClick={() => navigate("/events")}
                  startIcon={<Icon>arrow_back</Icon>}
                >
                  Back to Events
                </MDButton>
              </MDBox>

              <MDBox p={3}>
                {/* Summary Cards */}
                <Grid container spacing={3} mb={4}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <MDBox p={3} textAlign="center">
                        <Icon sx={{ fontSize: 48, color: "info.main", mb: 1 }}>people</Icon>
                        <MDTypography variant="h4" fontWeight="bold">
                          {analytics.total_registrations || 0}
                        </MDTypography>
                        <MDTypography variant="body2" color="text.secondary">
                          Total Registrations
                        </MDTypography>
                      </MDBox>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <MDBox p={3} textAlign="center">
                        <Icon sx={{ fontSize: 48, color: "success.main", mb: 1 }}>
                          check_circle
                        </Icon>
                        <MDTypography variant="h4" fontWeight="bold">
                          {analytics.attendance_stats?.attended || 0}
                        </MDTypography>
                        <MDTypography variant="body2" color="text.secondary">
                          Attended
                        </MDTypography>
                      </MDBox>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <MDBox p={3} textAlign="center">
                        <Icon sx={{ fontSize: 48, color: "error.main", mb: 1 }}>cancel</Icon>
                        <MDTypography variant="h4" fontWeight="bold">
                          {analytics.attendance_stats?.not_attended || 0}
                        </MDTypography>
                        <MDTypography variant="body2" color="text.secondary">
                          Not Attended
                        </MDTypography>
                      </MDBox>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <MDBox p={3} textAlign="center">
                        <Icon sx={{ fontSize: 48, color: "warning.main", mb: 1 }}>schedule</Icon>
                        <MDTypography variant="h4" fontWeight="bold">
                          {analytics.attendance_stats?.partially_attended || 0}
                        </MDTypography>
                        <MDTypography variant="body2" color="text.secondary">
                          Partial Attendance
                        </MDTypography>
                      </MDBox>
                    </Card>
                  </Grid>
                </Grid>

                {/* Traffic Sources */}
                {analytics.utm_sources && analytics.utm_sources.length > 0 && (
                  <Card sx={{ mb: 4 }}>
                    <MDBox p={3}>
                      <MDTypography variant="h6" mb={3}>
                        Traffic Sources
                      </MDTypography>
                      <Grid container spacing={2}>
                        {analytics.utm_sources.map((source, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <MDBox
                              p={2}
                              border="1px solid"
                              borderColor="divider"
                              borderRadius={1}
                              textAlign="center"
                            >
                              <MDTypography variant="h5" fontWeight="bold">
                                {source.count}
                              </MDTypography>
                              <MDTypography variant="body2" color="text.secondary">
                                {source.source}
                              </MDTypography>
                            </MDBox>
                          </Grid>
                        ))}
                      </Grid>
                    </MDBox>
                  </Card>
                )}

                {/* College Statistics */}
                {analytics.college_stats && Object.keys(analytics.college_stats).length > 0 && (
                  <Card sx={{ mb: 4 }}>
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
                        College Statistics & Attendance Forms
                      </MDTypography>
                    </MDBox>
                    <MDBox pt={3}>
                      <DataTable
                        table={{
                          columns: [
                            { Header: "College Name", accessor: "college" },
                            { Header: "Registered", accessor: "registered", align: "right" },
                            { Header: "Attended", accessor: "attended", align: "right" },
                            { Header: "Partially", accessor: "partially_attended", align: "right" },
                            { Header: "Not Attended", accessor: "not_attended", align: "right" },
                            { Header: "Session 1", accessor: "session1", align: "right" },
                            { Header: "Session 2", accessor: "session2", align: "right" },
                            { Header: "Session 3", accessor: "session3", align: "right" },
                            { Header: "Session 4", accessor: "session4", align: "right" },
                            { Header: "Session 5", accessor: "session5", align: "right" },
                            {
                              Header: "Session 5 (Copy)",
                              accessor: "session5Copy",
                              align: "right",
                            },
                          ],
                          rows: Object.entries(analytics.college_stats).map(([college, stats]) => ({
                            college,
                            registered: stats.registered || 0,
                            attended: stats.attended || 0,
                            partially_attended: stats.partially_attended || 0,
                            not_attended: stats.not_attended || 0,
                            session1: stats["Session 1_responses"] || 0,
                            session2: stats["Session 2_responses"] || 0,
                            session3: stats["Session 3_responses"] || 0,
                            session4: stats["Session 4_responses"] || 0,
                            session5: stats["Session 5_responses"] || 0,
                            session5Copy: stats["Session 5 (Copy)_responses"] || 0,
                          })),
                        }}
                        isSorted={false}
                        entriesPerPage={false}
                        showTotalEntries={false}
                        noEndBorder
                      />
                    </MDBox>
                  </Card>
                )}

                {/* Registration Timeline */}
                {analytics.daily_registrations && analytics.daily_registrations.length > 0 && (
                  <Card sx={{ mb: 4 }}>
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
                        Registration Timeline
                      </MDTypography>
                    </MDBox>
                    <MDBox pt={3}>
                      <DataTable
                        table={{
                          columns: [
                            { Header: "Date", accessor: "date" },
                            { Header: "Registrations", accessor: "count", align: "right" },
                          ],
                          rows: analytics.daily_registrations.map((day) => ({
                            date: day.date,
                            count: day.count,
                          })),
                        }}
                        isSorted={false}
                        entriesPerPage={false}
                        showTotalEntries={false}
                        noEndBorder
                      />
                    </MDBox>
                  </Card>
                )}

                {/* Top Students Q/A Participation */}
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
                      Top 10 Students (Q/A Participation)
                    </MDTypography>
                  </MDBox>
                  <MDBox pt={3}>
                    <DataTable
                      table={{
                        columns: [
                          { Header: "Rank", accessor: "rank" },
                          { Header: "Student Name", accessor: "name" },
                          { Header: "Email", accessor: "email" },
                          { Header: "College", accessor: "college" },
                          { Header: "Questions", accessor: "questions", align: "right" },
                        ],
                        rows: [
                          {
                            rank: "#1",
                            name: "Dhanush R B",
                            email: "dhanush.rb@kambaa.in",
                            college: "ABC University",
                            questions: 12,
                          },
                        ],
                      }}
                      isSorted={false}
                      entriesPerPage={false}
                      showTotalEntries={false}
                      noEndBorder
                    />
                  </MDBox>
                </Card>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default EventAnalytics;
