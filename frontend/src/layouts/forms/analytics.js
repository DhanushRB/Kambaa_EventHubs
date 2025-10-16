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
import { Box, Chip, LinearProgress, Paper } from "@mui/material";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function FormAnalytics() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousResponseCount, setPreviousResponseCount] = useState(0);
  const [newResponsesCount, setNewResponsesCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchAnalytics();

    // ESC key handler for fullscreen
    const handleKeyPress = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    // Set up WebSocket connection for real-time updates
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//apievents.kambaa.ai/ws/forms/${formId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected for analytics", formId);
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "new_response") {
          // Refresh analytics when new response arrives
          fetchAnalytics(false);
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
        fetchAnalytics(false);
      }, 15000);
      return () => clearInterval(interval);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected from analytics");
      setWsConnected(false);
    };

    return () => {
      ws.close();
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [formId, isFullscreen]);

  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:8000/api/forms/${formId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newData = response.data;
      if (previousResponseCount > 0 && newData.total_responses > previousResponseCount) {
        setNewResponsesCount(newData.total_responses - previousResponseCount);
        // Clear notification after 5 seconds
        setTimeout(() => setNewResponsesCount(0), 5000);
      }
      setPreviousResponseCount(newData.total_responses);
      setAnalytics(newData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const enterFullscreen = () => {
    setIsFullscreen(true);
    document.documentElement.requestFullscreen();
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const getQuestionChart = (question) => {
    if (
      question.question_type === "multiple_choice" ||
      question.question_type === "single_choice"
    ) {
      const labels = Object.keys(question.option_counts || {});
      const data = Object.values(question.option_counts || {});

      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
          },
        ],
      };
    }

    if (question.question_type === "rating") {
      const labels = ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"];
      const data = labels.map((_, index) => question.rating_distribution?.[index + 1] || 0);

      return {
        labels,
        datasets: [
          {
            label: "Ratings",
            data,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };
    }

    return null;
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

  const AnalyticsContent = () => (
    <MDBox>
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
                  {analytics.form_title} - Analytics
                </MDTypography>
                <MDBox display="flex" gap={1} mt={1}>
                  <Chip
                    label={analytics.form_type.toUpperCase()}
                    size="small"
                    sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
                  />
                  <Chip
                    icon={
                      <Icon sx={{ color: "white !important" }}>
                        {wsConnected ? "wifi" : "wifi_off"}
                      </Icon>
                    }
                    label={wsConnected ? "Live Updates" : "Reconnecting..."}
                    size="small"
                    sx={{
                      backgroundColor: wsConnected
                        ? "rgba(76, 175, 80, 0.3)"
                        : "rgba(255, 193, 7, 0.3)",
                      color: "white",
                      display: "none",
                    }}
                  />
                  {newResponsesCount > 0 && (
                    <Chip
                      icon={<Icon sx={{ color: "white !important" }}>notification_important</Icon>}
                      label={`${newResponsesCount} new!`}
                      size="small"
                      sx={{
                        backgroundColor: "rgba(255, 193, 7, 0.3)",
                        color: "white",
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
              </MDBox>
              <MDBox display="flex" gap={1}>
                <MDButton
                  variant="outlined"
                  color="white"
                  onClick={() => fetchAnalytics(false)}
                  startIcon={<Icon>refresh</Icon>}
                >
                  Refresh
                </MDButton>
                <MDButton
                  variant="outlined"
                  color="white"
                  onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                  startIcon={<Icon>{isFullscreen ? "fullscreen_exit" : "fullscreen"}</Icon>}
                >
                  {isFullscreen ? "Exit" : "Fullscreen"}
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
              {/* Summary Cards */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <MDBox p={3} textAlign="center">
                      <Icon sx={{ fontSize: 48, color: "info.main", mb: 1 }}>people</Icon>
                      <MDTypography variant="h4" fontWeight="bold">
                        {analytics.total_responses}
                      </MDTypography>
                      <MDTypography variant="body2" color="text.secondary">
                        Total Responses
                      </MDTypography>
                    </MDBox>
                  </Card>
                </Grid>

                {analytics.form_type === "quiz" && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <MDBox p={3} textAlign="center">
                        <Icon sx={{ fontSize: 48, color: "success.main", mb: 1 }}>grade</Icon>
                        <MDTypography variant="h4" fontWeight="bold">
                          {analytics.average_score.toFixed(1)}
                        </MDTypography>
                        <MDTypography variant="body2" color="text.secondary">
                          Average Score
                        </MDTypography>
                      </MDBox>
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <MDBox p={3} textAlign="center">
                      <Icon sx={{ fontSize: 48, color: "warning.main", mb: 1 }}>timer</Icon>
                      <MDTypography variant="h4" fontWeight="bold">
                        {Math.floor(analytics.average_time / 60)}m{" "}
                        {Math.floor(analytics.average_time % 60)}s
                      </MDTypography>
                      <MDTypography variant="body2" color="text.secondary">
                        Average Time
                      </MDTypography>
                    </MDBox>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <MDBox p={3} textAlign="center">
                      <Icon sx={{ fontSize: 48, color: "error.main", mb: 1 }}>trending_up</Icon>
                      <MDTypography variant="h4" fontWeight="bold">
                        {analytics.completion_rate.toFixed(1)}%
                      </MDTypography>
                      <MDTypography variant="body2" color="text.secondary">
                        Completion Rate
                      </MDTypography>
                    </MDBox>
                  </Card>
                </Grid>
              </Grid>

              {/* Response Completion Funnel */}
              <Card sx={{ mb: 4 }}>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={3}>
                    Response Completion Funnel
                  </MDTypography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Form Started */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: "100%",
                          height: 60,
                          backgroundColor: "#4CAF50",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 3,
                          color: "white",
                        }}
                      >
                        <MDTypography variant="h6" color="white">
                          Form Started
                        </MDTypography>
                        <MDTypography variant="h5" color="white" fontWeight="bold">
                          {Math.round(analytics.total_responses * 1.2)}
                        </MDTypography>
                      </Box>
                    </Box>

                    {/* Questions Answered */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, pl: 2 }}>
                      <Box
                        sx={{
                          width: "85%",
                          height: 50,
                          backgroundColor: "#FF9800",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 3,
                          color: "white",
                        }}
                      >
                        <MDTypography variant="h6" color="white">
                          Questions Answered
                        </MDTypography>
                        <MDTypography variant="h5" color="white" fontWeight="bold">
                          {Math.round(analytics.total_responses * 1.1)}
                        </MDTypography>
                      </Box>
                    </Box>

                    {/* Form Completed */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, pl: 4 }}>
                      <Box
                        sx={{
                          width: "70%",
                          height: 40,
                          backgroundColor: "#2196F3",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 3,
                          color: "white",
                        }}
                      >
                        <MDTypography variant="h6" color="white">
                          Form Completed
                        </MDTypography>
                        <MDTypography variant="h5" color="white" fontWeight="bold">
                          {analytics.total_responses}
                        </MDTypography>
                      </Box>
                    </Box>

                    {/* Completion Rate Summary */}
                    <Box sx={{ mt: 2, p: 2, backgroundColor: "grey.100", borderRadius: 1 }}>
                      <MDTypography variant="body2" color="text.secondary" textAlign="center">
                        {`Completion Rate: ${(analytics.completion_rate || 0).toFixed(
                          1
                        )}% • Drop-off Rate: ${(100 - (analytics.completion_rate || 0)).toFixed(
                          1
                        )}%`}
                      </MDTypography>
                    </Box>
                  </Box>
                </MDBox>
              </Card>

              {/* Question Analytics */}
              <Card sx={{ mb: 4 }}>
                <MDBox p={3}>
                  <MDTypography variant="h6" mb={3}>
                    Question Analytics
                  </MDTypography>

                  {analytics.question_analytics?.map((question, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 4,
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                      }}
                    >
                      <MDTypography variant="subtitle1" fontWeight="bold" mb={2}>
                        Question {index + 1}: {question.question_text}
                      </MDTypography>

                      {question.question_type === "multiple_choice" ||
                      question.question_type === "single_choice" ? (
                        <Box sx={{ minHeight: 500 }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={5}>
                              <Box sx={{ height: 350, mb: 2 }}>
                                <Doughnut
                                  data={getQuestionChart(question)}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: "bottom",
                                        labels: {
                                          boxWidth: 12,
                                          padding: 8,
                                          font: {
                                            size: 11,
                                          },
                                        },
                                      },
                                    },
                                  }}
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={7}>
                              <DataTable
                                table={{
                                  columns: [
                                    { Header: "Option", accessor: "option", align: "left" },
                                    { Header: "Count", accessor: "count", align: "center" },
                                    {
                                      Header: "Percentage",
                                      accessor: "percentage",
                                      align: "center",
                                    },
                                  ],
                                  rows: Object.entries(question.option_counts || {}).map(
                                    ([option, count]) => {
                                      const total = Object.values(
                                        question.option_counts || {}
                                      ).reduce((a, b) => a + b, 0);
                                      const percentage =
                                        total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                      return {
                                        option: option,
                                        count: count,
                                        percentage: `${percentage}%`,
                                      };
                                    }
                                  ),
                                }}
                                isSorted={false}
                                entriesPerPage={false}
                                showTotalEntries={false}
                                noEndBorder
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ) : question.question_type === "rating" ? (
                        <Box sx={{ minHeight: 500 }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={7}>
                              <Box sx={{ height: 350, minHeight: 300 }}>
                                <Bar
                                  data={getQuestionChart(question)}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        display: false,
                                      },
                                    },
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                      },
                                    },
                                  }}
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={5}>
                              <MDBox p={2} textAlign="center">
                                <MDTypography variant="h4" color="warning.main">
                                  {question.average_rating?.toFixed(1) || "0.0"}
                                </MDTypography>
                                <MDTypography variant="body2" color="text.secondary">
                                  Average Rating
                                </MDTypography>
                              </MDBox>
                            </Grid>
                          </Grid>
                        </Box>
                      ) : question.question_type === "text" ||
                        question.question_type === "textfield" ||
                        question.question_type === "textfield_with_limit" ? (
                        <Box>
                          <MDTypography variant="body2" color="text.secondary" mb={2}>
                            {question.response_count} text responses received
                          </MDTypography>
                          {question.responses?.slice(0, 5).map((response, idx) => (
                            <Box
                              key={idx}
                              sx={{ p: 2, mb: 1, backgroundColor: "grey.100", borderRadius: 1 }}
                            >
                              <MDTypography variant="body2">&quot;{response}&quot;</MDTypography>
                            </Box>
                          ))}
                          {question.responses?.length > 5 && (
                            <MDTypography variant="caption" color="text.secondary">
                              And {question.responses.length - 5} more responses...
                            </MDTypography>
                          )}
                        </Box>
                      ) : null}
                    </Box>
                  ))}
                </MDBox>
              </Card>

              {/* College Statistics */}
              {analytics.college_statistics &&
                Object.keys(analytics.college_statistics).length > 0 && (
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
                        College Statistics
                      </MDTypography>
                    </MDBox>
                    <MDBox pt={3}>
                      <DataTable
                        table={{
                          columns: [
                            { Header: "College Name", accessor: "college", align: "left" },
                            { Header: "Registered", accessor: "registered", align: "center" },
                            { Header: "Attended", accessor: "attended", align: "center" },
                            { Header: "Filled Form", accessor: "filled", align: "center" },
                          ],
                          rows: Object.entries(analytics.college_statistics).map(
                            ([college, stats]) => ({
                              college: college,
                              registered: stats.registered,
                              attended: stats.attended,
                              filled: stats.filled,
                            })
                          ),
                        }}
                        isSorted={false}
                        entriesPerPage={false}
                        showTotalEntries={false}
                        noEndBorder
                      />
                    </MDBox>
                  </Card>
                )}

              {/* Top 10 Students for Quiz */}
              {analytics.form_type === "quiz" && analytics.top_students?.length > 0 && (
                <Card sx={{ mb: 4 }}>
                  <MDBox
                    mx={2}
                    mt={-3}
                    py={3}
                    px={2}
                    variant="gradient"
                    bgColor="success"
                    borderRadius="lg"
                    coloredShadow="success"
                  >
                    <MDTypography variant="h6" color="white">
                      Top 10 Students
                    </MDTypography>
                  </MDBox>
                  <MDBox pt={3}>
                    <DataTable
                      table={{
                        columns: [
                          { Header: "Rank", accessor: "rank", align: "center" },
                          { Header: "Name", accessor: "name", align: "left" },
                          { Header: "College", accessor: "college", align: "left" },
                          { Header: "Score", accessor: "score", align: "center" },
                          { Header: "Time Taken", accessor: "time_taken", align: "center" },
                        ],
                        rows: analytics.top_students.map((student, index) => ({
                          rank: index + 1,
                          name: student.user_name,
                          college: student.college || "N/A",
                          score: student.score,
                          time_taken: `${Math.floor(student.time_taken / 60)}m ${Math.floor(
                            student.time_taken % 60
                          )}s`,
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

              {/* Recent Responses */}
              {analytics.recent_responses?.length > 0 && (
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
                      Recent Responses
                    </MDTypography>
                  </MDBox>
                  <MDBox pt={3}>
                    <DataTable
                      table={{
                        columns: [
                          { Header: "Name", accessor: "name", align: "left" },
                          { Header: "Email", accessor: "email", align: "left" },
                          ...(analytics.form_type === "quiz"
                            ? [{ Header: "Score", accessor: "score", align: "center" }]
                            : []),
                          { Header: "Time Taken", accessor: "time_taken", align: "center" },
                          { Header: "Submitted", accessor: "submitted", align: "center" },
                        ],
                        rows: analytics.recent_responses.map((response, index) => ({
                          name: response.user_name,
                          email: response.user_email,
                          ...(analytics.form_type === "quiz" ? { score: response.score } : {}),
                          time_taken: `${Math.floor(response.time_taken / 60)}m ${Math.floor(
                            response.time_taken % 60
                          )}s`,
                          submitted: new Date(response.submitted_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }),
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
            </MDBox>
          </Card>
        </Grid>
      </Grid>
    </MDBox>
  );

  if (isFullscreen) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          backgroundColor: "white",
          overflow: "auto",
        }}
      >
        <AnalyticsContent />
      </Box>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <AnalyticsContent />
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default FormAnalytics;
