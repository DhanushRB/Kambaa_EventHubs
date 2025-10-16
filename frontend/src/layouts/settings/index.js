import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
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
import CircularProgress from "@mui/material/CircularProgress";
import { MDNotification, showNotification } from "components/MDNotification";
import { useAuth } from "context/AuthContext";

function Settings() {
  const [emailSettings, setEmailSettings] = useState({
    smtp_server: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    from_email: "",
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: "", role: "manager", password: "" });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminsList, setAdminsList] = useState({ admins: [], managers: [], presenters: [] });
  const [adminsLoading, setAdminsLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchEmailSettings();
    if (user?.role === "admin") {
      fetchAdminsList();
    }
  }, [user]);

  const fetchEmailSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/email-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setEmailSettings({
            ...data,
            smtp_password: data.smtp_password || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching email settings:", error);
    }
  };

  const fetchAdminsList = async () => {
    setAdminsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAdminsList(data);
      }
    } catch (error) {
      console.error("Error fetching admins list:", error);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEmailSettings((prev) => ({
      ...prev,
      [field]: field === "smtp_port" ? parseInt(value) || 587 : value,
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/email-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailSettings),
      });

      if (response.ok) {
        showNotification("Email settings saved successfully!", "success");
      } else {
        showNotification("Failed to save email settings", "error");
      }
    } catch (error) {
      console.error("Error saving email settings:", error);
      showNotification("Error saving email settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail) {
      showNotification("Please enter an email address for testing", "warning");
      return;
    }

    setTestLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("Authentication token not found. Please login again.", "error");
        setTestLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/test-email-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: testEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      showNotification("Test email sent successfully! Please check your inbox.", "success");
      setTestDialogOpen(false);
      setTestEmail("");
    } catch (error) {
      console.error("Error testing email connection:", error);
      const errorMessage = error.message || "Network error occurred";
      showNotification(`Email test failed: ${errorMessage}`, "error");
    } finally {
      setTestLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setAdminLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/auth/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAdmin),
      });

      if (response.ok) {
        showNotification(`${newAdmin.role} created successfully!`, "success");
        setAdminDialogOpen(false);
        setNewAdmin({ email: "", role: "manager", password: "" });
        fetchAdminsList(); // Refresh the list
      } else {
        const error = await response.json();
        showNotification(error.detail || "Failed to create admin", "error");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      showNotification("Error creating admin", "error");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail, role) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${role} "${adminEmail}"? This action cannot be undone.`
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        console.log(`Deleting ${role} with ID: ${adminId}`);

        const response = await fetch(`http://localhost:8000/api/auth/delete-admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ admin_id: adminId }),
        });

        console.log(`Delete response status: ${response.status}`);

        if (response.ok) {
          showNotification(`${role} deleted successfully!`, "success");
          await fetchAdminsList(); // Refresh the list
        } else {
          const errorText = await response.text();
          console.error(`Delete failed with status ${response.status}:`, errorText);

          let errorMessage;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorData.message || "Failed to delete admin";
          } catch {
            errorMessage = `Failed to delete admin (Status: ${response.status})`;
          }

          showNotification(errorMessage, "error");
        }
      } catch (error) {
        console.error("Error deleting admin:", error);
        showNotification(`Network error: ${error.message}`, "error");
      }
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
                  Email Settings
                </MDTypography>
              </MDBox>

              <MDBox pt={3} px={3} pb={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <MDBox mb={3}>
                      <MDInput
                        label="SMTP Server"
                        value={emailSettings.smtp_server}
                        onChange={(e) => handleInputChange("smtp_server", e.target.value)}
                        fullWidth
                        placeholder="smtp.gmail.com"
                      />
                    </MDBox>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <MDBox mb={3}>
                      <MDInput
                        label="SMTP Port"
                        type="number"
                        value={emailSettings.smtp_port}
                        onChange={(e) => handleInputChange("smtp_port", e.target.value)}
                        fullWidth
                        placeholder="587"
                      />
                    </MDBox>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <MDBox mb={3}>
                      <MDInput
                        label="SMTP Username"
                        value={emailSettings.smtp_username}
                        onChange={(e) => handleInputChange("smtp_username", e.target.value)}
                        fullWidth
                        placeholder="your-email@gmail.com"
                      />
                    </MDBox>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <MDBox mb={3}>
                      <MDInput
                        label="SMTP Password"
                        type="password"
                        value={emailSettings.smtp_password}
                        onChange={(e) => handleInputChange("smtp_password", e.target.value)}
                        fullWidth
                        placeholder="••••••••••••••••"
                      />
                    </MDBox>
                  </Grid>

                  <Grid item xs={12}>
                    <MDBox mb={3}>
                      <MDInput
                        label="From Email Address"
                        value={emailSettings.from_email}
                        onChange={(e) => handleInputChange("from_email", e.target.value)}
                        fullWidth
                        placeholder="noreply@yourdomain.com"
                      />
                    </MDBox>
                  </Grid>

                  <Grid item xs={12}>
                    <MDBox display="flex" gap={2}>
                      <MDButton
                        variant="gradient"
                        color="info"
                        onClick={handleSaveSettings}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Settings"}
                      </MDButton>

                      <MDButton
                        variant="gradient"
                        color="success"
                        onClick={() => setTestDialogOpen(true)}
                        disabled={!emailSettings.smtp_server}
                      >
                        Test Connection
                      </MDButton>
                    </MDBox>
                  </Grid>
                </Grid>

                <MDBox mt={4}>
                  <MDTypography variant="h6" mb={2}>
                    Configuration Help
                  </MDTypography>
                  <MDTypography variant="body2" color="text" mb={1}>
                    <strong>Gmail:</strong> Use smtp.gmail.com, port 587, and generate an app
                    password
                  </MDTypography>
                  <MDTypography variant="body2" color="text" mb={1}>
                    <strong>Outlook:</strong> Use smtp-mail.outlook.com, port 587
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    <strong>Yahoo:</strong> Use smtp.mail.yahoo.com, port 587
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
          {user?.role === "admin" && (
            <Grid item xs={12}>
              <Card>
                <MDBox
                  mx={2}
                  mt={-3}
                  py={3}
                  px={2}
                  variant="gradient"
                  bgColor="success"
                  borderRadius="lg"
                  coloredShadow="success"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <MDTypography variant="h6" color="white">
                    Admin Management
                  </MDTypography>
                  <MDButton
                    variant="gradient"
                    color="dark"
                    onClick={() => setAdminDialogOpen(true)}
                  >
                    Add User
                  </MDButton>
                </MDBox>
                <MDBox pt={3} px={3} pb={3}>
                  {adminsLoading ? (
                    <MDBox textAlign="center" py={3}>
                      <CircularProgress size={24} />
                      <MDTypography variant="body2" color="text" mt={1}>
                        Loading...
                      </MDTypography>
                    </MDBox>
                  ) : (
                    <>
                      <MDBox mb={4}>
                        <MDTypography variant="h6" mb={2}>
                          Administrators
                        </MDTypography>
                        {adminsList.admins.length > 0 ? (
                          adminsList.admins.map((admin) => (
                            <MDBox
                              key={admin.id}
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              p={2}
                              mb={1}
                              sx={{
                                backgroundColor: "grey.100",
                                borderRadius: 1,
                              }}
                            >
                              <MDBox>
                                <MDTypography variant="body1" fontWeight="medium">
                                  {admin.email}
                                </MDTypography>
                                <MDTypography variant="caption" color="text">
                                  Created: {new Date(admin.created_at).toLocaleDateString()}
                                </MDTypography>
                              </MDBox>
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <MDTypography variant="caption" color="success">
                                  Admin
                                </MDTypography>
                                <MDButton
                                  variant="text"
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteAdmin(admin.id, admin.email, "Admin")}
                                >
                                  Delete
                                </MDButton>
                              </MDBox>
                            </MDBox>
                          ))
                        ) : (
                          <MDTypography variant="body2" color="text">
                            No administrators found
                          </MDTypography>
                        )}
                      </MDBox>

                      <MDBox mb={4}>
                        <MDTypography variant="h6" mb={2}>
                          Managers
                        </MDTypography>
                        {adminsList.managers.length > 0 ? (
                          adminsList.managers.map((manager) => (
                            <MDBox
                              key={manager.id}
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              p={2}
                              mb={1}
                              sx={{
                                backgroundColor: "grey.100",
                                borderRadius: 1,
                              }}
                            >
                              <MDBox>
                                <MDTypography variant="body1" fontWeight="medium">
                                  {manager.email}
                                </MDTypography>
                                <MDTypography variant="caption" color="text">
                                  Created: {new Date(manager.created_at).toLocaleDateString()}
                                </MDTypography>
                              </MDBox>
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <MDTypography variant="caption" color="info">
                                  Manager
                                </MDTypography>
                                <MDButton
                                  variant="text"
                                  color="error"
                                  size="small"
                                  onClick={() =>
                                    handleDeleteAdmin(manager.id, manager.email, "Manager")
                                  }
                                >
                                  Delete
                                </MDButton>
                              </MDBox>
                            </MDBox>
                          ))
                        ) : (
                          <MDTypography variant="body2" color="text">
                            No managers found
                          </MDTypography>
                        )}
                      </MDBox>

                      <MDBox>
                        <MDTypography variant="h6" mb={2}>
                          Presenters
                        </MDTypography>
                        {adminsList.presenters?.length > 0 ? (
                          adminsList.presenters.map((presenter) => (
                            <MDBox
                              key={presenter.id}
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              p={2}
                              mb={1}
                              sx={{
                                backgroundColor: "grey.100",
                                borderRadius: 1,
                              }}
                            >
                              <MDBox>
                                <MDTypography variant="body1" fontWeight="medium">
                                  {presenter.email}
                                </MDTypography>
                                <MDTypography variant="caption" color="text">
                                  Created: {new Date(presenter.created_at).toLocaleDateString()}
                                </MDTypography>
                              </MDBox>
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <MDTypography variant="caption" color="warning">
                                  Presenter
                                </MDTypography>
                                <MDButton
                                  variant="text"
                                  color="error"
                                  size="small"
                                  onClick={() =>
                                    handleDeleteAdmin(presenter.id, presenter.email, "Presenter")
                                  }
                                >
                                  Delete
                                </MDButton>
                              </MDBox>
                            </MDBox>
                          ))
                        ) : (
                          <MDTypography variant="body2" color="text">
                            No presenters found
                          </MDTypography>
                        )}
                      </MDBox>
                    </>
                  )}
                </MDBox>
              </Card>
            </Grid>
          )}
        </Grid>
      </MDBox>

      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Test Email Connection</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <MDInput
              label="Test Email Address"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              fullWidth
              placeholder="Enter email to receive test message"
            />
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setTestDialogOpen(false)} color="secondary">
            Cancel
          </MDButton>
          <MDButton
            onClick={handleTestConnection}
            variant="gradient"
            color="success"
            disabled={testLoading || !testEmail}
          >
            {testLoading ? (
              <>
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                Sending...
              </>
            ) : (
              "Send Test Email"
            )}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={adminDialogOpen}
        onClose={() => setAdminDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <MDBox mb={2}>
              <MDInput
                label="Email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
                fullWidth
              />
            </MDBox>
            <MDBox mb={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="presenter">Presenter</MenuItem>
                </Select>
              </FormControl>
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                label="Password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, password: e.target.value }))}
                fullWidth
              />
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setAdminDialogOpen(false)} color="secondary">
            Cancel
          </MDButton>
          <MDButton
            onClick={handleCreateAdmin}
            variant="gradient"
            color="success"
            disabled={adminLoading || !newAdmin.email || !newAdmin.password}
          >
            {adminLoading ? "Creating..." : "Create"}
          </MDButton>
        </DialogActions>
      </Dialog>

      <MDNotification />
      <Footer />
    </DashboardLayout>
  );
}

export default Settings;
