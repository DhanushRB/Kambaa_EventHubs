import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Icon from "@mui/material/Icon";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import axios from "axios";
import FRONTEND_DOMAIN from "config/domain";
import ViewOnlyAlert from "components/ViewOnlyAlert";

function Forms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [userPrivileges, setUserPrivileges] = useState({
    is_admin: false,
    can_manage_all_forms: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [viewOnlyAlert, setViewOnlyAlert] = useState({ open: false, message: "" });
  const navigate = useNavigate();

  const formTypes = [
    {
      type: "quiz",
      title: "Quiz",
      description: "Create timed quizzes with scoring",
      icon: "quiz",
      color: "info",
    },
    {
      type: "poll",
      title: "Poll",
      description: "Gather opinions and votes",
      icon: "poll",
      color: "success",
    },
    {
      type: "feedback",
      title: "Feedback",
      description: "Collect feedback and reviews",
      icon: "feedback",
      color: "warning",
    },
    {
      type: "attendance",
      title: "Attendance",
      description: "Mark attendance for events",
      icon: "how_to_reg",
      color: "primary",
    },
  ];

  useEffect(() => {
    fetchForms();
    fetchUserPrivileges();
  }, []);

  const fetchForms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/forms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForms(response.data);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPrivileges = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/user/privileges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserPrivileges(response.data);
    } catch (error) {
      console.error("Error fetching user privileges:", error);
    }
  };

  const handleCreateForm = (type) => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, message: "View Only - Presenters cannot create forms" });
      setCreateDialogOpen(false);
      return;
    }
    navigate(`/forms/create/${type}`);
    setCreateDialogOpen(false);
  };

  const handleMenuClick = (event, form) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedForm(null);
  };

  const handleViewAnalytics = () => {
    navigate(`/forms/${selectedForm.id}/analytics`);
    handleMenuClose();
  };

  const handleEditForm = () => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, message: "View Only - Presenters cannot edit forms" });
      handleMenuClose();
      return;
    }
    navigate(`/forms/create/${selectedForm.type}/${selectedForm.id}`);
    handleMenuClose();
  };

  const handleViewResponses = () => {
    navigate(`/forms/${selectedForm.id}/responses`);
    handleMenuClose();
  };

  const handleCopyLink = async () => {
    try {
      // Use the hashed form link from the backend response
      let formLink;
      if (selectedForm.form_link) {
        formLink = selectedForm.form_link;
      } else {
        // Fallback: fetch the hashed link from the API
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8000/api/forms/${selectedForm.id}/link`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        formLink = response.data.link;
      }

      await navigator.clipboard.writeText(formLink);
      setSnackbar({ open: true, message: "Form link copied to clipboard!", severity: "success" });
    } catch (error) {
      console.error("Error copying link:", error);
      setSnackbar({
        open: true,
        message: "Error copying link. Please try again.",
        severity: "error",
      });
    }
    handleMenuClose();
  };

  const handleCloneForm = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:8000/api/forms/${selectedForm.id}/clone`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchForms();
      setSnackbar({ open: true, message: "Form cloned successfully!", severity: "success" });
    } catch (error) {
      console.error("Error cloning form:", error);
      const errorMessage = error.response?.data?.detail || "Error cloning form. Please try again.";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
    handleMenuClose();
  };

  const handleDeleteForm = () => {
    if (userPrivileges.role === "presenter") {
      setViewOnlyAlert({ open: true, message: "View Only - Presenters cannot delete forms" });
      handleMenuClose();
      return;
    }
    setConfirmDialog({
      open: true,
      title: "Delete Form",
      message: "Are you sure you want to delete this form? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`http://localhost:8000/api/forms/${selectedForm.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchForms();
          setSnackbar({ open: true, message: "Form deleted successfully!", severity: "success" });
        } catch (error) {
          console.error("Error deleting form:", error);
          setSnackbar({
            open: true,
            message: "Error deleting form. Please try again.",
            severity: "error",
          });
        }
        setConfirmDialog({ open: false, title: "", message: "", onConfirm: null });
      },
    });
    handleMenuClose();
  };

  const handleToggleForm = async (formId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8000/api/forms/${formId}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchForms();
      setSnackbar({
        open: true,
        message: `Form ${!currentStatus ? "activated" : "deactivated"} successfully!`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error toggling form:", error);
      setSnackbar({
        open: true,
        message: "Error updating form status. Please try again.",
        severity: "error",
      });
    }
  };

  const getFormTypeConfig = (type) => {
    return formTypes.find((ft) => ft.type === type) || formTypes[0];
  };

  const filteredForms =
    selectedTab === 0
      ? forms
      : forms.filter((form) => form.type === formTypes[selectedTab - 1].type);

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
                  Forms
                </MDTypography>
                <MDButton
                  variant="contained"
                  color="white"
                  onClick={() => setCreateDialogOpen(true)}
                  startIcon={<Icon>add</Icon>}
                >
                  Create Form
                </MDButton>
              </MDBox>

              <MDBox p={3}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                  <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="All Forms" />
                    <Tab label="Quizzes" />
                    <Tab label="Polls" />
                    <Tab label="Feedback" />
                    <Tab label="Attendance" />
                  </Tabs>
                </Box>

                {loading ? (
                  <MDTypography variant="body2">Loading forms...</MDTypography>
                ) : filteredForms.length === 0 ? (
                  <MDBox textAlign="center" py={6}>
                    <Icon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}>description</Icon>
                    <MDTypography variant="h5" color="text.secondary" mb={1}>
                      No forms yet
                    </MDTypography>
                    <MDTypography variant="body2" color="text.secondary" mb={3}>
                      Create your first form to get started
                    </MDTypography>
                    <MDButton
                      variant="gradient"
                      color="info"
                      onClick={() => setCreateDialogOpen(true)}
                      startIcon={<Icon>add</Icon>}
                    >
                      Create Form
                    </MDButton>
                  </MDBox>
                ) : (
                  <Grid container spacing={3}>
                    {filteredForms.map((form) => {
                      const typeConfig = getFormTypeConfig(form.type);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={form.id}>
                          <Card
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                              },
                              borderRadius: 4,
                              border: "1px solid",
                              borderColor: "grey.200",
                            }}
                          >
                            <MDBox
                              p={3}
                              flexGrow={1}
                              sx={{
                                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                                borderRadius: 3,
                              }}
                            >
                              <MDBox
                                display="flex"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                mb={2}
                              >
                                <Chip
                                  icon={<Icon>{typeConfig.icon}</Icon>}
                                  label={typeConfig.title}
                                  color={typeConfig.color}
                                  size="small"
                                />
                                <IconButton size="small" onClick={(e) => handleMenuClick(e, form)}>
                                  <Icon>more_vert</Icon>
                                </IconButton>
                              </MDBox>

                              <MDBox
                                sx={{
                                  backgroundColor: "rgba(255,255,255,0.9)",
                                  borderRadius: 2,
                                  p: 1.5,
                                  mb: 1,
                                }}
                              >
                                <MDTypography variant="h6" fontWeight="bold">
                                  {form.title}
                                </MDTypography>
                              </MDBox>

                              {form.description && (
                                <MDTypography variant="body2" color="text.secondary" mb={2}>
                                  {form.description.length > 100
                                    ? `${form.description.substring(0, 100)}...`
                                    : form.description}
                                </MDTypography>
                              )}

                              <MDBox
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mt={2}
                              >
                                <MDTypography variant="caption" color="text.secondary">
                                  {form.response_count} responses
                                </MDTypography>
                                <MDBox display="flex" alignItems="center" ml={-1.5}>
                                  <MDBox mt={0.5}>
                                    <Switch
                                      checked={form.is_active}
                                      onChange={() => handleToggleForm(form.id, form.is_active)}
                                    />
                                  </MDBox>
                                  <MDBox ml={0.5}>
                                    <MDTypography
                                      variant="button"
                                      fontWeight="regular"
                                      color="text"
                                    >
                                      {form.is_active ? "Active" : "Inactive"}
                                    </MDTypography>
                                  </MDBox>
                                </MDBox>
                              </MDBox>

                              <MDTypography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                mt={1}
                              >
                                Created: {new Date(form.created_at).toLocaleDateString()}
                              </MDTypography>
                            </MDBox>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Form</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {formTypes.map((type) => (
              <Grid item xs={12} key={type.type}>
                <Card
                  sx={{
                    cursor: "pointer",
                    "&:hover": { boxShadow: 3 },
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                  onClick={() => handleCreateForm(type.type)}
                >
                  <MDBox p={3} display="flex" alignItems="center">
                    <Icon sx={{ fontSize: 40, mr: 2, color: `${type.color}.main` }}>
                      {type.icon}
                    </Icon>
                    <MDBox>
                      <MDTypography variant="h6" mb={0.5}>
                        {type.title}
                      </MDTypography>
                      <MDTypography variant="body2" color="text.secondary">
                        {type.description}
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setCreateDialogOpen(false)}>Cancel</MDButton>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewAnalytics}>
          <Icon sx={{ mr: 1 }}>analytics</Icon>
          View Analytics
        </MenuItem>
        <MenuItem onClick={handleViewResponses}>
          <Icon sx={{ mr: 1 }}>list</Icon>
          View Responses
        </MenuItem>
        <MenuItem onClick={handleEditForm}>
          <Icon sx={{ mr: 1 }}>edit</Icon>
          Edit Form
        </MenuItem>
        <MenuItem onClick={handleCopyLink}>
          <Icon sx={{ mr: 1 }}>link</Icon>
          Copy Link
        </MenuItem>
        <MenuItem onClick={handleCloneForm}>
          <Icon sx={{ mr: 1 }}>content_copy</Icon>
          Clone Form
        </MenuItem>
        <MenuItem onClick={handleDeleteForm} sx={{ color: "error.main" }}>
          <Icon sx={{ mr: 1 }}>delete</Icon>
          Delete Form
        </MenuItem>
      </Menu>

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

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <MDTypography variant="body1">{confirmDialog.message}</MDTypography>
        </DialogContent>
        <DialogActions>
          <MDButton
            onClick={() =>
              setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })
            }
          >
            Cancel
          </MDButton>
          <MDButton onClick={confirmDialog.onConfirm} color="error" variant="gradient">
            Delete
          </MDButton>
        </DialogActions>
      </Dialog>

      <ViewOnlyAlert
        open={viewOnlyAlert.open}
        onClose={() => setViewOnlyAlert({ open: false, message: "" })}
        message={viewOnlyAlert.message}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default Forms;
