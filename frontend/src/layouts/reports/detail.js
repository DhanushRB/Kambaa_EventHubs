import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import API_BASE_URL from "config/api";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Icon from "@mui/material/Icon";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

function ReportDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [analytics, setAnalytics] = useState({
    attendanceData: [],
    paymentData: [],
    collegeData: [],
  });

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    fetchEventData();
    fetchParticipants();
    fetchAnalytics();
  }, [eventId]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm]);

  const fetchEventData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      // Also fetch report stats to get totalPaid
      const statsResponse = await fetch(`${API_BASE_URL}/api/events/${eventId}/report-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stats = await statsResponse.json();

      setEvent({ ...data, ...stats });
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error("Error fetching participants:", error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const filterParticipants = () => {
    let filtered = Array.isArray(participants) ? participants : [];
    if (searchTerm && filtered.length > 0) {
      filtered = filtered.filter(
        (participant) =>
          participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.college.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredParticipants(filtered);
  };

  const exportToCSV = () => {
    // Add event name and date header
    const eventHeader = event?.name ? `Event: ${event.name}` : "Event Report";
    const eventDate = event?.event_date
      ? `Date: ${new Date(event.event_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`
      : "";

    const csvContent = [
      [eventHeader],
      eventDate ? [eventDate] : [],
      [""], // Empty row for spacing
      [
        "Name",
        "Email",
        "College",
        "Payment Status",
        "Attendance Status",
        "Chat Count",
        "Registration Date",
      ],
      ...filteredParticipants.map((p) => [
        p.name,
        p.email,
        p.college,
        p.payment_status,
        p.attendance_status,
        p.chat_count || 0,
        formatDateTime(p.created_at),
      ]),
    ]
      .filter((row) => row.length > 0) // Remove empty rows
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.name || "event"}_report.csv`;
    a.click();
  };

  const columns = [
    { Header: "Name", accessor: "name", width: "18%" },
    { Header: "Email", accessor: "email", width: "22%" },
    { Header: "College", accessor: "college", width: "18%" },
    { Header: "Payment", accessor: "payment_status", width: "12%" },
    { Header: "Attendance", accessor: "attendance_status", width: "12%" },
    { Header: "Chats", accessor: "chat_count", width: "8%" },
    { Header: "Date", accessor: "registration_date", width: "10%" },
  ];

  const rows = filteredParticipants.map((participant) => ({
    name: participant.name,
    email: participant.email,
    college: participant.college,
    payment_status: (
      <MDBox>
        <MDTypography
          variant="caption"
          color={participant.payment_status === "Paid" ? "success" : "error"}
          fontWeight="medium"
        >
          {participant.payment_status}
        </MDTypography>
      </MDBox>
    ),
    attendance_status: (
      <MDBox>
        <MDTypography
          variant="caption"
          color={participant.attendance_status === "Attended" ? "success" : "warning"}
          fontWeight="medium"
        >
          {participant.attendance_status}
        </MDTypography>
      </MDBox>
    ),
    chat_count: (
      <MDBox>
        <MDTypography
          variant="caption"
          color={participant.chat_count > 0 ? "info" : "secondary"}
          fontWeight="medium"
        >
          {participant.chat_count || 0}
        </MDTypography>
      </MDBox>
    ),
    registration_date: formatDateTime(participant.created_at),
  }));

  const participantsArray = Array.isArray(participants) ? participants : [];
  const totalParticipants = participantsArray.length;
  const totalPaid = event?.totalPaid || 0; // Use from API response
  const totalAttended = participantsArray.filter((p) => p.attendance_status === "Attended").length;
  const attendanceRate =
    totalParticipants > 0 ? Math.round((totalAttended / totalParticipants) * 100) : 0;

  // Calculate unique colleges
  const uniqueColleges = new Set(
    participantsArray.map((p) => p.college).filter((college) => college && college.trim() !== "")
  ).size;

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3} textAlign="center">
          <MDTypography variant="h6">Loading report...</MDTypography>
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
          {/* Header */}
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
                  Complete Report - {event?.name}
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={() => navigate("/reports")}>
                  Back to Reports
                </MDButton>
              </MDBox>
            </Card>
          </Grid>

          {/* Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <ComplexStatisticsCard
              color="dark"
              icon="group"
              title="Total Participants"
              count={totalParticipants}
              percentage={{ color: "success", amount: "", label: "registered" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ComplexStatisticsCard
              color="success"
              icon="payment"
              title="Total Paid"
              count={totalPaid}
              percentage={{ color: "success", amount: "", label: "payments" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ComplexStatisticsCard
              color="info"
              icon="event_available"
              title="Attendance Rate"
              count={`${attendanceRate}%`}
              percentage={{ color: "success", amount: "", label: "attended" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ComplexStatisticsCard
              color="warning"
              icon="school"
              title="Colleges Registered"
              count={uniqueColleges}
              percentage={{ color: "info", amount: "", label: "colleges" }}
            />
          </Grid>

          {/* Analytics Charts */}
          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={3}>
                  Attendance Overview
                </MDTypography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.attendanceData || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {(analytics.attendanceData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={3}>
                  Payment Status
                </MDTypography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.paymentData || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {(analytics.paymentData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" mb={3}>
                  Participants by College
                </MDTypography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.collegeData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={false} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </MDBox>
            </Card>
          </Grid>

          {/* Participants Table */}
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
                <MDBox display="flex" justifyContent="space-between" alignItems="center">
                  <MDTypography variant="h6" color="white">
                    Participants Details
                  </MDTypography>
                  <MDButton variant="contained" color="white" onClick={exportToCSV}>
                    Export CSV
                  </MDButton>
                </MDBox>
              </MDBox>
              <MDBox pt={3} px={3}>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      placeholder="Search participants..."
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
                </Grid>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ReportDetail;
