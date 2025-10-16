import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import { Chip, Alert, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userFilter, setUserFilter] = useState("");

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

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setUserFilter(value);
    fetchLogs(value);
  };

  const clearFilter = () => {
    setUserFilter("");
    fetchLogs("");
  };

  const fetchLogs = async (filter = "") => {
    try {
      const token = localStorage.getItem("token");
      const url = filter
        ? `http://localhost:8000/api/logs?user_filter=${encodeURIComponent(filter)}`
        : "http://localhost:8000/api/logs";
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        setError("Failed to fetch logs");
      }
    } catch (error) {
      setError("Error fetching logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "create_form":
        return "success";
      case "edit_form":
        return "info";
      case "delete_form":
        return "error";
      case "view_form":
        return "secondary";
      case "send_email":
        return "warning";
      default:
        return "primary";
    }
  };

  const columns = [
    { Header: "timestamp", accessor: "timestamp", width: "15%" },
    { Header: "user", accessor: "user", width: "20%" },
    { Header: "role", accessor: "role", width: "10%" },
    { Header: "action", accessor: "action", width: "15%" },
    { Header: "resource", accessor: "resource", width: "15%" },
    { Header: "details", accessor: "details", width: "25%" },
  ];

  const rows = logs.map((log) => ({
    timestamp: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {formatDateTime(log.created_at)}
      </MDTypography>
    ),
    user: (
      <MDBox>
        <MDTypography variant="caption" color="text" fontWeight="medium">
          {log.user_email}
        </MDTypography>
      </MDBox>
    ),
    role: (
      <Chip
        label={log.user_role}
        color={log.user_role === "admin" ? "primary" : "secondary"}
        size="small"
      />
    ),
    action: (
      <Chip label={log.action.replace("_", " ")} color={getActionColor(log.action)} size="small" />
    ),
    resource: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {log.resource_type} #{log.resource_id}
      </MDTypography>
    ),
    details: (
      <MDTypography variant="caption" color="text" fontWeight="regular">
        {log.details || "-"}
      </MDTypography>
    ),
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <MDTypography variant="h6" fontWeight="medium">
            Loading logs...
          </MDTypography>
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
              >
                <MDTypography variant="h6" color="white">
                  System Activity Logs
                </MDTypography>
                <MDTypography variant="body2" color="white" opacity={0.8}>
                  Track all user actions and changes in the system
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                {error && (
                  <MDBox mx={2} mb={2}>
                    <Alert severity="error">{error}</Alert>
                  </MDBox>
                )}
                <MDBox mx={2} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Filter by user email..."
                    value={userFilter}
                    onChange={handleFilterChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: userFilter && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={clearFilter}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </MDBox>
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

export default Logs;
