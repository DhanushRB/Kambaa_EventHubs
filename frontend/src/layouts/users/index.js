import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import {
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Edit,
  Delete,
  Visibility,
  ToggleOn,
  ToggleOff,
  Close,
  FileDownload,
} from "@mui/icons-material";
import { MDNotification, showNotification } from "components/MDNotification";
import ViewOnlyAlert from "components/ViewOnlyAlert";

function Users() {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collegeFilter, setCollegeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportFilters, setReportFilters] = useState({ college: "", event: "", format: "excel" });
  const [colleges, setColleges] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [userPrivileges, setUserPrivileges] = useState({ role: "" });
  const [viewOnlyAlert, setViewOnlyAlert] = useState({ open: false, action: "" });

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (collegeFilter) params.append("college", collegeFilter);
      if (statusFilter) params.append("attendance", statusFilter);
      if (eventFilter) params.append("event", eventFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`http://localhost:8000/api/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalCount(data.total_count || 0);
        setError("");
      } else {
        setError("Failed to fetch users");
        setUsers([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/colleges", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Colleges data:", data);
        setColleges(data.colleges || []);
      } else {
        console.error("Failed to fetch colleges:", response.status, response.statusText);
        setColleges([]);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    }
  };

  const fetchEvents = async (college = null) => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (college) params.append("college", college);

      const response = await fetch(`http://localhost:8000/api/events/by-college?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Events data:", data, "for college:", college);
        setEvents(data.events || []);
      } else {
        console.error("Failed to fetch events:", response.status, response.statusText);
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
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

  useEffect(() => {
    fetchUsers();
  }, [collegeFilter, statusFilter, eventFilter, searchTerm]);

  useEffect(() => {
    fetchColleges();
    fetchEvents();
    fetchUserPrivileges();
  }, []);

  useEffect(() => {
    if (collegeFilter) {
      fetchEvents(collegeFilter);
      setEventFilter("");
    } else {
      fetchEvents();
    }
  }, [collegeFilter]);

  // Refresh dropdowns when users data changes
  useEffect(() => {
    if (users.length > 0) {
      fetchColleges();
      fetchEvents(collegeFilter);
    }
  }, [users.length]);

  const handleToggleStatus = async (userId) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "toggle user status" });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/toggle-status`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "delete users" });
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchUsers();
          fetchColleges();
          fetchEvents();
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleEditUser = (user) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, action: "edit users" });
      return;
    }
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "",
      college: user.college || "",
      event: user.event || "",
      attendance_status: user.attendance_status || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setEditModalOpen(false);
        fetchUsers();
        fetchColleges();
        fetchEvents();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (reportFilters.college) params.append("college", reportFilters.college);
      if (reportFilters.event) params.append("event", reportFilters.event);
      params.append("format", reportFilters.format);

      const response = await fetch(`http://localhost:8000/api/users/report?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fileExtension = reportFilters.format === "pdf" ? "pdf" : "xlsx";
        a.download = `users_report_${new Date().toISOString().split("T")[0]}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setReportModalOpen(false);
        showNotification("Report downloaded successfully!", "success");
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        showNotification(
          `Error generating report: ${errorData.detail || "Please try again"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error generating report:", error);
      showNotification(
        "Error generating report. Please check your connection and try again.",
        "error"
      );
    } finally {
      setReportLoading(false);
    }
  };

  const columns = [
    { Header: "Name", accessor: "name", align: "left" },
    { Header: "Email", accessor: "email", align: "left" },
    { Header: "Role", accessor: "role", align: "center" },
    { Header: "College", accessor: "college", align: "center" },
    { Header: "Event", accessor: "event", align: "center" },
    { Header: "Attendance", accessor: "attendance_status", align: "center" },
    { Header: "Created Date", accessor: "created_date", align: "center" },
    { Header: "Actions", accessor: "actions", align: "center" },
  ];

  const rows = (users || []).map((user) => ({
    name: user.name || "N/A",
    email: user.email || "N/A",
    role: user.role || "User",
    college: user.college || "N/A",
    event: user.event || "N/A",
    attendance_status: (
      <MDTypography
        variant="caption"
        color={user.attendance_status === "Attended" ? "success" : "warning"}
      >
        {user.attendance_status || "Not Attended"}
      </MDTypography>
    ),
    created_date: formatDateTime(user.created_date),
    actions: (
      <MDBox display="flex" alignItems="center">
        <IconButton size="small" color="info" onClick={() => handleViewUser(user)}>
          <Visibility />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => handleDeleteUser(user.id)}>
          <Delete />
        </IconButton>
      </MDBox>
    ),
  }));

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
                <MDBox display="flex" justifyContent="space-between" alignItems="center">
                  <MDBox>
                    <MDTypography variant="h6" color="white">
                      User Management
                    </MDTypography>
                    <MDTypography variant="body2" color="white" opacity={0.8}>
                      Total Users: {totalCount}
                    </MDTypography>
                  </MDBox>
                  <MDButton
                    variant="contained"
                    color="white"
                    startIcon={<FileDownload />}
                    onClick={() => setReportModalOpen(true)}
                  >
                    Generate Report
                  </MDButton>
                </MDBox>
              </MDBox>
              <MDBox pt={3} px={3}>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} md={3}>
                    <MDInput
                      label="Search by name or email"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by College</InputLabel>
                      <Select
                        value={collegeFilter}
                        onChange={(e) => setCollegeFilter(e.target.value)}
                        label="Filter by College"
                        sx={{ height: 45 }}
                      >
                        <MenuItem value="">All Colleges</MenuItem>
                        {Array.isArray(colleges)
                          ? colleges.map((college) => (
                              <MenuItem key={college} value={college}>
                                {college}
                              </MenuItem>
                            ))
                          : []}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Event</InputLabel>
                      <Select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                        label="Filter by Event"
                        sx={{ height: 45 }}
                      >
                        <MenuItem value="">All Events</MenuItem>
                        {Array.isArray(events)
                          ? events.map((event) => (
                              <MenuItem key={event} value={event}>
                                {event}
                              </MenuItem>
                            ))
                          : []}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Attendance</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Filter by Attendance"
                        sx={{ height: 45 }}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="Attended">Attended</MenuItem>
                        <MenuItem value="Not Attended">Not Attended</MenuItem>
                      </Select>
                    </FormControl>
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
      {/* View User Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h5">User Details</MDTypography>
            <IconButton onClick={() => setViewModalOpen(false)}>
              <Close />
            </IconButton>
          </MDBox>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Name:
                </MDTypography>
                <MDTypography variant="h6">{selectedUser.name}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Email:
                </MDTypography>
                <MDTypography variant="h6">{selectedUser.email}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Role:
                </MDTypography>
                <MDTypography variant="h6">{selectedUser.role}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  College:
                </MDTypography>
                <MDTypography variant="h6">{selectedUser.college}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Event:
                </MDTypography>
                <MDTypography variant="h6">{selectedUser.event}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Status:
                </MDTypography>
                <MDTypography
                  variant="h6"
                  color={selectedUser.status === "active" ? "success" : "error"}
                >
                  {selectedUser.status}
                </MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Attendance:
                </MDTypography>
                <MDTypography
                  variant="h6"
                  color={selectedUser.attendance_status === "Attended" ? "success" : "warning"}
                >
                  {selectedUser.attendance_status}
                </MDTypography>
              </MDBox>
            </MDBox>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h5">Edit User</MDTypography>
            <IconButton onClick={() => setEditModalOpen(false)}>
              <Close />
            </IconButton>
          </MDBox>
        </DialogTitle>
        <DialogContent>
          <MDBox component="form" pt={2}>
            <MDBox mb={2}>
              <TextField
                fullWidth
                label="Name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </MDBox>
            <MDBox mb={2}>
              <TextField
                fullWidth
                label="Email"
                value={editFormData.email || ""}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </MDBox>
            <MDBox mb={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editFormData.role || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="Student">Student</MenuItem>
                  <MenuItem value="Faculty">Faculty</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </MDBox>
            <MDBox mb={2}>
              <FormControl fullWidth>
                <InputLabel>College</InputLabel>
                <Select
                  value={editFormData.college || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
                  label="College"
                >
                  {Array.isArray(colleges)
                    ? colleges.map((college) => (
                        <MenuItem key={college} value={college}>
                          {college}
                        </MenuItem>
                      ))
                    : []}
                </Select>
              </FormControl>
            </MDBox>
            <MDBox mb={2}>
              <FormControl fullWidth>
                <InputLabel>Attendance Status</InputLabel>
                <Select
                  value={editFormData.attendance_status || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, attendance_status: e.target.value })
                  }
                  label="Attendance Status"
                >
                  <MenuItem value="Attended">Attended</MenuItem>
                  <MenuItem value="Not Attended">Not Attended</MenuItem>
                </Select>
              </FormControl>
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton variant="outlined" color="secondary" onClick={() => setEditModalOpen(false)}>
            Cancel
          </MDButton>
          <MDButton variant="gradient" color="info" onClick={handleSaveEdit}>
            Save Changes
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Generate Report Modal */}
      <Dialog
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h5">Generate User Report</MDTypography>
            <IconButton onClick={() => setReportModalOpen(false)}>
              <Close />
            </IconButton>
          </MDBox>
        </DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <MDBox mb={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by College</InputLabel>
                <Select
                  value={reportFilters.college}
                  onChange={(e) => setReportFilters({ ...reportFilters, college: e.target.value })}
                  label="Filter by College"
                  sx={{ height: 45 }}
                >
                  <MenuItem value="">All Colleges</MenuItem>
                  {Array.isArray(colleges)
                    ? colleges.map((college) => (
                        <MenuItem key={college} value={college}>
                          {college}
                        </MenuItem>
                      ))
                    : []}
                </Select>
              </FormControl>
            </MDBox>
            <MDBox mb={2}>
              <FormControl fullWidth>
                <InputLabel>Filter by Event</InputLabel>
                <Select
                  value={reportFilters.event}
                  onChange={(e) => setReportFilters({ ...reportFilters, event: e.target.value })}
                  label="Filter by Event"
                  sx={{ height: 45 }}
                >
                  <MenuItem value="">All Events</MenuItem>
                  {Array.isArray(events)
                    ? events.map((event) => (
                        <MenuItem key={event} value={event}>
                          {event}
                        </MenuItem>
                      ))
                    : []}
                </Select>
              </FormControl>
            </MDBox>
            <MDBox mb={2}>
              <FormControl fullWidth>
                <InputLabel>Report Format</InputLabel>
                <Select
                  value={reportFilters.format}
                  onChange={(e) => setReportFilters({ ...reportFilters, format: e.target.value })}
                  label="Report Format"
                  sx={{ height: 45 }}
                >
                  <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                  <MenuItem value="pdf">PDF (.pdf)</MenuItem>
                </Select>
              </FormControl>
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton variant="outlined" color="secondary" onClick={() => setReportModalOpen(false)}>
            Cancel
          </MDButton>
          <MDButton
            variant="gradient"
            color="info"
            onClick={handleGenerateReport}
            disabled={reportLoading}
          >
            {reportLoading ? "Generating..." : "Generate Report"}
          </MDButton>
        </DialogActions>
      </Dialog>
      <ViewOnlyAlert
        open={viewOnlyAlert.open}
        onClose={() => setViewOnlyAlert({ open: false, action: "" })}
        action={viewOnlyAlert.action}
      />
      <MDNotification />
      <Footer />
    </DashboardLayout>
  );
}

export default Users;
