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
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import axios from "axios";
import FormBuilder from "components/FormBuilder";

function CreateForm() {
  const { type, formId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!formId);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: type || "quiz",
    questions: [],
    settings: {
      timeLimit: type === "quiz" ? 30 : 0,
      showResults: type === "quiz",
      allowRetake: false,
      randomizeQuestions: false,
      requireLogin: true,
    },
    event_id: null,
    register_link: "",
    // Branding fields
    banner_image: null,
    logo_image: null,
    footer_text: "",
    brand_colors: {
      primary: "#1976d2",
      secondary: "#dc004e",
    },
  });

  const [events, setEvents] = useState([]);

  const questionTypes = [
    { value: "multiple_choice", label: "Multiple Choice", icon: "radio_button_checked" },
    { value: "single_choice", label: "Single Choice", icon: "check_circle" },
    { value: "text", label: "Text Answer", icon: "text_fields" },
    { value: "textfield", label: "Text Field", icon: "short_text" },
    {
      value: "textfield_with_limit",
      label: "Text Field (150 chars min)",
      icon: "format_align_left",
    },
    { value: "rating", label: "Rating Scale", icon: "star" },
    { value: "yes_no", label: "Yes/No", icon: "toggle_on" },
  ];

  useEffect(() => {
    if (isEditing && formId) {
      fetchFormData();
    }
    if (type === "attendance") {
      fetchEvents();
    }
  }, [formId, isEditing, type]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:8000/api/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const form = response.data;
      setFormData({
        id: form.id,
        title: form.title,
        description: form.description,
        type: form.type,
        questions: form.questions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          is_required: q.is_required,
          points: q.points,
          correct_answer: q.correct_answer,
        })),
        settings: form.settings,
        register_link: form.register_link || "",
        // Branding fields
        banner_image: form.banner_image || null,
        logo_image: form.logo_image || null,
        footer_text: form.footer_text || "",
        brand_colors: form.brand_colors || {
          primary: "#1976d2",
          secondary: "#dc004e",
        },
      });
    } catch (error) {
      console.error("Error fetching form:", error);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question_text: "",
      question_type: "multiple_choice",
      options: ["", ""],
      is_required: true,
      points: type === "quiz" ? 1 : 0,
      correct_answer: "",
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
    }));
  };

  const removeQuestion = (questionId) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const addOption = (questionId) => {
    const question = formData.questions.find((q) => q.id === questionId);
    const newOptions = [...question.options, ""];
    updateQuestion(questionId, "options", newOptions);
  };

  const updateOption = (questionId, optionIndex, value) => {
    const question = formData.questions.find((q) => q.id === questionId);
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, "options", newOptions);
  };

  const removeOption = (questionId, optionIndex) => {
    const question = formData.questions.find((q) => q.id === questionId);
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, "options", newOptions);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a form title");
      return;
    }

    if (formData.questions.length === 0 && type !== "attendance") {
      alert("Please add at least one question");
      return;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (!question.question_text.trim()) {
        alert(`Please enter text for question ${i + 1}`);
        return;
      }
      if (["multiple_choice", "single_choice"].includes(question.question_type)) {
        if (question.options.length < 2 || question.options.some((opt) => !opt.trim())) {
          alert(`Question ${i + 1} must have at least 2 non-empty options`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        questions:
          type === "attendance"
            ? []
            : formData.questions.map((q) => ({
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                is_required: q.is_required,
                points: q.points,
                correct_answer: q.correct_answer,
              })),
      };

      console.log("Submitting form payload:", payload);

      let response;
      if (isEditing) {
        response = await axios.put(`http://localhost:8000/api/forms/${formId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Return the form ID for editing case
        return { id: formId };
      } else {
        // Use enhanced API for new forms with branding
        response = await axios.post(
          "http://localhost:8000/api/forms/create-with-branding",
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Form created successfully:", response.data);
        // Store form ID for QR code generation
        setFormData((prev) => ({ ...prev, id: response.data.id }));
        // Return the response data with form ID
        return response.data;
      }
    } catch (error) {
      console.error("Error creating form:", error);
      const errorMessage =
        error.response?.data?.detail || error.message || "Unknown error occurred";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOnly = async () => {
    try {
      await handleSubmit();
      navigate("/forms");
    } catch (error) {
      alert("Error saving form: " + (error.message || error));
    }
  };

  const getTypeConfig = () => {
    const configs = {
      quiz: { title: "Quiz", icon: "quiz", color: "info" },
      poll: { title: "Poll", icon: "poll", color: "success" },
      feedback: { title: "Feedback", icon: "feedback", color: "warning" },
      attendance: { title: "Attendance", icon: "how_to_reg", color: "primary" },
    };
    return configs[type] || configs.quiz;
  };

  const typeConfig = getTypeConfig();

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
                bgColor={typeConfig.color}
                borderRadius="lg"
                coloredShadow={typeConfig.color}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDBox display="flex" alignItems="center">
                  <Icon sx={{ mr: 1, color: "white" }}>{typeConfig.icon}</Icon>
                  <MDTypography variant="h6" color="white">
                    {isEditing ? "Edit" : "Create"} {typeConfig.title}
                  </MDTypography>
                </MDBox>
                <MDBox>
                  <MDButton
                    variant="contained"
                    color="white"
                    onClick={() => navigate("/forms")}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </MDButton>
                  <MDButton
                    variant="contained"
                    color="white"
                    onClick={handleSaveOnly}
                    disabled={loading}
                    startIcon={<Icon>save</Icon>}
                  >
                    {loading ? "Saving..." : isEditing ? "Update Form" : "Save Form"}
                  </MDButton>
                </MDBox>
              </MDBox>

              <MDBox p={3}>
                {/* Basic Form Settings */}
                <Card sx={{ mb: 3 }}>
                  <MDBox p={3}>
                    <MDTypography variant="h6" mb={2}>
                      Form Details
                    </MDTypography>

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Form Title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, title: e.target.value }))
                          }
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description (Optional)"
                          multiline
                          rows={3}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                          }
                        />
                      </Grid>
                      {type === "attendance" && (
                        <>
                          <Grid item xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>Select Event</InputLabel>
                              <Select
                                value={formData.event_id || ""}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, event_id: e.target.value }))
                                }
                                required
                              >
                                {events.map((event) => (
                                  <MenuItem key={event.id} value={event.id}>
                                    {event.name} - {event.event_date}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Registration Link (Optional)"
                              value={formData.register_link}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, register_link: e.target.value }))
                              }
                              placeholder="https://example.com/register"
                              helperText="Link to registration page for unregistered users"
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>

                    {/* Settings */}
                    {type !== "attendance" && (
                      <Accordion sx={{ mt: 3 }}>
                        <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                          <MDTypography variant="h6">Settings</MDTypography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            {type === "quiz" && (
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Time Limit (minutes)"
                                  type="number"
                                  value={formData.settings.timeLimit}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        timeLimit: parseInt(e.target.value) || 0,
                                      },
                                    }))
                                  }
                                />
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.settings.showResults}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          showResults: e.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                }
                                label="Show results after submission"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.settings.allowRetake}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          allowRetake: e.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                }
                                label="Allow multiple submissions"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.settings.randomizeQuestions}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          randomizeQuestions: e.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                }
                                label="Randomize question order"
                              />
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </MDBox>
                </Card>

                {/* Enhanced Form Builder */}
                {type !== "attendance" && (
                  <FormBuilder
                    formData={formData}
                    setFormData={setFormData}
                    formType={type}
                    onSave={handleSubmit}
                    loading={loading}
                    isEditing={isEditing}
                  />
                )}

                {/* Attendance Form Display */}
                {type === "attendance" && (
                  <Card>
                    <MDBox p={3}>
                      <MDBox textAlign="center" py={4}>
                        <Icon sx={{ fontSize: 48, color: "success.main", mb: 2 }}>how_to_reg</Icon>
                        <MDTypography variant="h6" color="text.secondary" mb={1}>
                          Attendance Form
                        </MDTypography>
                        <MDTypography variant="body2" color="text.secondary">
                          This form will automatically collect Registration ID and Email for
                          attendance marking
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                  </Card>
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

export default CreateForm;
