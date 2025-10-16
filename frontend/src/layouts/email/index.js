import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { MDNotification, showNotification } from "components/MDNotification";
import { ConfirmDialog, showConfirmDialog } from "components/ConfirmDialog";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function Email() {
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filterEvent, setFilterEvent] = useState("");
  const [filterCollege, setFilterCollege] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [colleges, setColleges] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sending, setSending] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Dialog states
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);

  // Template form
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTemplates(), fetchStudents(), fetchEvents(), fetchColleges()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, filterEvent, filterCollege, searchTerm]);

  const fetchTemplates = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:8000/api/email-templates", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setTemplates(Array.isArray(data) ? data : []);
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    console.log("Fetching students from API...");
    const response = await fetch("http://localhost:8000/api/students", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      console.log("Students API response:", data);
      console.log("Number of students received:", data.length);
      setStudents(Array.isArray(data) ? data : []);
    } else {
      console.error("Failed to fetch students:", response.status, response.statusText);
    }
  };

  const fetchEvents = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:8000/api/events", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    }
  };

  const fetchColleges = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:8000/api/colleges", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      setColleges(Array.isArray(data) ? data : []);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    console.log("=== FILTERING DEBUG ===");
    console.log("Total students from API:", students.length);
    console.log("Students data:", students);

    if (filterEvent) {
      filtered = filtered.filter((student) => student.event_id === parseInt(filterEvent));
      console.log("After event filter (", filterEvent, "):", filtered.length);
    }

    if (filterCollege) {
      filtered = filtered.filter((student) => student.college === filterCollege);
      console.log("After college filter (", filterCollege, "):", filtered.length);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log("After search filter (", searchTerm, "):", filtered.length);
    }

    console.log("Final filtered students:", filtered.length);
    console.log("Filtered students data:", filtered);
    console.log("=== END FILTERING DEBUG ===");
    setFilteredStudents(filtered);
  };

  const handleCreateTemplate = async () => {
    setTemplateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = editingTemplate
        ? `http://localhost:8000/api/email-templates/${editingTemplate.id}`
        : "http://localhost:8000/api/email-templates";
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: templateName,
          subject: templateSubject,
          content: templateContent,
        }),
      });

      if (response.ok) {
        handleCloseTemplateDialog();
        await fetchTemplates();
        showNotification(
          editingTemplate ? "Template updated successfully!" : "Template created successfully!",
          "success"
        );
      } else {
        const errorData = await response.json();
        showNotification(`Error: ${errorData.detail || "Failed to save template"}`, "error");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      showNotification("Error saving template", "error");
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    showConfirmDialog(
      "Delete Template",
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`http://localhost:8000/api/email-templates/${template.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            if (selectedTemplate?.id === template.id) {
              setSelectedTemplate(null);
            }
            await fetchTemplates();
            showNotification("Template deleted successfully!", "success");
          } else {
            showNotification("Failed to delete template", "error");
          }
        } catch (error) {
          console.error("Error deleting template:", error);
          showNotification("Error deleting template", "error");
        }
      }
    );
  };

  const handleEditTemplate = async (template) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/email-templates/${template.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const fullTemplate = await response.json();
        setEditingTemplate(fullTemplate);
        setTemplateName(fullTemplate.name);
        setTemplateSubject(fullTemplate.subject);
        setTemplateContent(fullTemplate.content);
        setOpenTemplateDialog(true);
      }
    } catch (error) {
      console.error("Error fetching template:", error);
    }
  };

  const handleCloseTemplateDialog = () => {
    setOpenTemplateDialog(false);
    setTemplateName("");
    setTemplateSubject("");
    setTemplateContent("");
    setEditingTemplate(null);
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map((student) => student.id);
    const newSelected = [...new Set([...selectedStudents, ...filteredIds])];
    setSelectedStudents(newSelected);
  };

  const handleUnselectAll = () => {
    setSelectedStudents([]);
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate || selectedStudents.length === 0) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          student_ids: selectedStudents,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showNotification(`Email sent successfully to ${result.sent_count} students`, "success");
        setSelectedStudents([]);
      } else {
        showNotification("Failed to send email", "error");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      showNotification("Failed to send email", "error");
    } finally {
      setSending(false);
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
                  Campaign Templates
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="dark"
                  onClick={() => setOpenTemplateDialog(true)}
                >
                  Create Template
                </MDButton>
              </MDBox>

              <MDBox pt={3} px={3} pb={3}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" p={3}>
                    <MDTypography variant="body1">Loading templates...</MDTypography>
                  </MDBox>
                ) : (
                  <Grid container spacing={3}>
                    {templates.map((template) => (
                      <Grid item xs={12} md={6} lg={4} key={template.id}>
                        <Card
                          sx={{
                            cursor: "pointer",
                            border:
                              selectedTemplate?.id === template.id
                                ? "2px solid #1976d2"
                                : "1px solid #e0e0e0",
                            "&:hover": { boxShadow: 3 },
                          }}
                        >
                          <MDBox
                            p={3}
                            onClick={() => {
                              console.log("Template selected:", template);
                              setSelectedTemplate(template);
                            }}
                          >
                            <MDTypography variant="h6" mb={1}>
                              {template.name}
                            </MDTypography>
                            <MDTypography variant="body2" color="text" mb={2}>
                              Subject: {template.subject}
                            </MDTypography>
                            <MDTypography variant="caption" color="text" mb={2}>
                              Created: {new Date(template.created_at).toLocaleDateString()}
                            </MDTypography>
                          </MDBox>
                          <MDBox px={3} pb={2} display="flex" alignItems="center" mt={2}>
                            <MDBox mr={1}>
                              <MDButton
                                variant="text"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template);
                                }}
                              >
                                <DeleteIcon />
                                &nbsp;delete
                              </MDButton>
                            </MDBox>
                            <MDButton
                              variant="text"
                              color="dark"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTemplate(template);
                              }}
                            >
                              <EditIcon />
                              &nbsp;edit
                            </MDButton>
                          </MDBox>
                        </Card>
                      </Grid>
                    ))}
                    {templates.length === 0 && !loading && (
                      <Grid item xs={12}>
                        <Card sx={{ p: 3, textAlign: "center" }}>
                          <MDTypography variant="body1" color="text">
                            No email templates found. Create your first template to get started.
                          </MDTypography>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                )}
              </MDBox>
            </Card>
          </Grid>

          {selectedTemplate && (
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
                    {selectedTemplate.name} - Select Recipients
                  </MDTypography>
                  <MDButton
                    variant="gradient"
                    color="dark"
                    onClick={handleSendEmail}
                    disabled={selectedStudents.length === 0 || sending}
                  >
                    {sending ? "Sending..." : `Send email (${selectedStudents.length})`}
                  </MDButton>
                </MDBox>

                <MDBox pt={3} px={3} pb={3}>
                  <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        select
                        label="Filter by College"
                        value={filterCollege}
                        onChange={(e) => setFilterCollege(e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: "45px",
                            "& fieldset": {
                              borderWidth: "2px",
                            },
                          },
                        }}
                      >
                        <MenuItem value="">All Colleges</MenuItem>
                        {colleges.map((college) => (
                          <MenuItem key={college.id} value={college.name}>
                            {college.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        select
                        label="Filter by Event"
                        value={filterEvent}
                        onChange={(e) => setFilterEvent(e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: "45px",
                            "& fieldset": {
                              borderWidth: "2px",
                            },
                          },
                        }}
                      >
                        <MenuItem value="">All Events</MenuItem>
                        {events.map((event) => (
                          <MenuItem key={event.id} value={event.id}>
                            {event.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <MDInput
                        label="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <MDBox display="flex" flexDirection="column" gap={1}>
                        <MDButton
                          size="small"
                          variant="gradient"
                          color="success"
                          onClick={handleSelectAll}
                          disabled={filteredStudents.length === 0}
                        >
                          Select All
                        </MDButton>
                        <MDButton
                          size="small"
                          variant="gradient"
                          color="error"
                          onClick={handleUnselectAll}
                          disabled={selectedStudents.length === 0}
                        >
                          Unselect All
                        </MDButton>
                      </MDBox>
                    </Grid>
                  </Grid>

                  <MDBox mb={3}>
                    <MDTypography variant="h6" mb={2}>
                      Students ({filteredStudents.length} of {students.length} total)
                    </MDTypography>
                    {filteredStudents.length === 0 ? (
                      <Card sx={{ p: 3, textAlign: "center" }}>
                        <MDTypography variant="body1" color="text">
                          {students.length === 0
                            ? "No students found in database."
                            : "No students match the current filters."}
                        </MDTypography>
                      </Card>
                    ) : (
                      <MDBox>
                        {filteredStudents.map((student) => (
                          <Card key={student.id} sx={{ mb: 1, p: 2 }}>
                            <MDBox
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <MDBox display="flex" alignItems="center">
                                <Checkbox
                                  checked={selectedStudents.includes(student.id)}
                                  onChange={() => handleStudentSelect(student.id)}
                                />
                                <MDBox ml={2}>
                                  <MDTypography variant="h6">{student.name}</MDTypography>
                                  <MDTypography variant="body2" color="text">
                                    {student.email} | {student.phone}
                                  </MDTypography>
                                  {student.college && (
                                    <MDTypography variant="caption" color="text">
                                      {student.college}
                                    </MDTypography>
                                  )}
                                </MDBox>
                              </MDBox>
                              <MDBox display="flex" gap={1}>
                                <Chip
                                  label={student.event_name || "Unknown Event"}
                                  size="small"
                                  color="primary"
                                />
                              </MDBox>
                            </MDBox>
                          </Card>
                        ))}
                      </MDBox>
                    )}
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
          )}
        </Grid>
      </MDBox>

      <Dialog open={openTemplateDialog} onClose={handleCloseTemplateDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? "Edit Campaign Template" : "Create Campaign Template"}
        </DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <MDBox mb={2}>
              <MDInput
                label="Template Name"
                fullWidth
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                label="Campaign Subject"
                fullWidth
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
              />
            </MDBox>
            <MDBox mb={2}>
              <TextField
                label="Campaign Content"
                multiline
                rows={8}
                fullWidth
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                helperText="Use {{name}}, {{email}}, {{college}}  for personalization"
              />
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseTemplateDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton
            onClick={handleCreateTemplate}
            variant="gradient"
            color="info"
            disabled={templateLoading}
          >
            {templateLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingTemplate ? (
              "Update Template"
            ) : (
              "Create Template"
            )}
          </MDButton>
        </DialogActions>
      </Dialog>

      <MDNotification />
      <ConfirmDialog />
      <Footer />
    </DashboardLayout>
  );
}

export default Email;
