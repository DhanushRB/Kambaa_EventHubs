import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
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
  IconButton,
  Divider,
  Chip,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import axios from "axios";

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

      if (isEditing) {
        await axios.put(`http://localhost:8000/api/forms/${formId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const response = await axios.post("http://localhost:8000/api/forms", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Form created successfully:", response.data);
      }

      navigate("/forms");
    } catch (error) {
      console.error("Error creating form:", error);
      const errorMessage =
        error.response?.data?.detail || error.message || "Unknown error occurred";
      alert(`Error creating form: ${errorMessage}`);
    } finally {
      setLoading(false);
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
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={<Icon>save</Icon>}
                  >
                    {loading ? "Saving..." : isEditing ? "Update Form" : "Save Form"}
                  </MDButton>
                </MDBox>
              </MDBox>

              <MDBox p={3}>
                {/* Form Settings */}
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

                {/* Questions */}
                <Card>
                  <MDBox p={3}>
                    <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <MDTypography variant="h6">
                        {type === "attendance" ? "Attendance Fields" : "Questions"}
                      </MDTypography>
                      {type !== "attendance" && (
                        <MDButton
                          variant="gradient"
                          color="info"
                          onClick={addQuestion}
                          startIcon={<Icon>add</Icon>}
                        >
                          Add Question
                        </MDButton>
                      )}
                    </MDBox>

                    {formData.questions.length === 0 && type !== "attendance" ? (
                      <MDBox textAlign="center" py={4}>
                        <Icon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}>
                          help_outline
                        </Icon>
                        <MDTypography variant="h6" color="text.secondary" mb={1}>
                          No questions yet
                        </MDTypography>
                        <MDTypography variant="body2" color="text.secondary">
                          Add your first question to get started
                        </MDTypography>
                      </MDBox>
                    ) : type === "attendance" ? (
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
                    ) : (
                      formData.questions.map((question, index) => (
                        <MDBox key={question.id}>
                          <Paper sx={{ p: 3, mb: 2, border: "1px solid", borderColor: "divider" }}>
                            <MDBox
                              display="flex"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              mb={2}
                            >
                              <Chip label={`Question ${index + 1}`} color="primary" size="small" />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeQuestion(question.id)}
                              >
                                <Icon>delete</Icon>
                              </IconButton>
                            </MDBox>

                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label="Question Text"
                                  value={question.question_text}
                                  onChange={(e) =>
                                    updateQuestion(question.id, "question_text", e.target.value)
                                  }
                                  required
                                />
                              </Grid>

                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                  <InputLabel>Question Type</InputLabel>
                                  <Select
                                    value={question.question_type}
                                    onChange={(e) =>
                                      updateQuestion(question.id, "question_type", e.target.value)
                                    }
                                    variant="outlined"
                                    sx={{
                                      minHeight: 56,
                                      "& .MuiOutlinedInput-root": {
                                        minHeight: 56,
                                        "& fieldset": {
                                          borderColor: "rgba(0, 0, 0, 0.23)",
                                        },
                                        "&:hover fieldset": {
                                          borderColor: "rgba(0, 0, 0, 0.87)",
                                        },
                                        "&.Mui-focused fieldset": {
                                          borderColor: "#1976d2",
                                          borderWidth: 2,
                                        },
                                      },
                                    }}
                                  >
                                    {questionTypes.map((qt) => (
                                      <MenuItem key={qt.value} value={qt.value}>
                                        <Box display="flex" alignItems="center">
                                          <Icon sx={{ mr: 1 }}>{qt.icon}</Icon>
                                          {qt.label}
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>

                              {type === "quiz" && (
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    label="Points"
                                    type="number"
                                    value={question.points}
                                    onChange={(e) =>
                                      updateQuestion(
                                        question.id,
                                        "points",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                  />
                                </Grid>
                              )}

                              <Grid item xs={12}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={question.is_required}
                                      onChange={(e) =>
                                        updateQuestion(question.id, "is_required", e.target.checked)
                                      }
                                    />
                                  }
                                  label="Required"
                                />
                              </Grid>

                              {/* Options for choice questions */}
                              {["multiple_choice", "single_choice"].includes(
                                question.question_type
                              ) && (
                                <Grid item xs={12}>
                                  <MDTypography variant="subtitle2" mb={1}>
                                    Options
                                  </MDTypography>
                                  {question.options.map((option, optionIndex) => (
                                    <MDBox
                                      key={optionIndex}
                                      display="flex"
                                      alignItems="center"
                                      mb={1}
                                    >
                                      <TextField
                                        fullWidth
                                        size="small"
                                        value={option}
                                        placeholder={`Option ${optionIndex + 1}`}
                                        onChange={(e) =>
                                          updateOption(question.id, optionIndex, e.target.value)
                                        }
                                        sx={{ mr: 1 }}
                                      />
                                      {type === "quiz" && (
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              size="small"
                                              checked={question.correct_answer === option}
                                              onChange={(e) =>
                                                updateQuestion(
                                                  question.id,
                                                  "correct_answer",
                                                  e.target.checked ? option : ""
                                                )
                                              }
                                            />
                                          }
                                          label="Correct"
                                          sx={{ mr: 1 }}
                                        />
                                      )}
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => removeOption(question.id, optionIndex)}
                                        disabled={question.options.length <= 2}
                                      >
                                        <Icon>remove</Icon>
                                      </IconButton>
                                    </MDBox>
                                  ))}
                                  <MDButton
                                    size="small"
                                    onClick={() => addOption(question.id)}
                                    startIcon={<Icon>add</Icon>}
                                  >
                                    Add Option
                                  </MDButton>
                                </Grid>
                              )}

                              {/* Yes/No options */}
                              {question.question_type === "yes_no" && type === "quiz" && (
                                <Grid item xs={12}>
                                  <FormControl fullWidth>
                                    <InputLabel>Correct Answer</InputLabel>
                                    <Select
                                      value={question.correct_answer || ""}
                                      onChange={(e) =>
                                        updateQuestion(
                                          question.id,
                                          "correct_answer",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <MenuItem value="Yes">Yes</MenuItem>
                                      <MenuItem value="No">No</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                          <MDBox display="flex" justifyContent="center" mb={2}>
                            <MDButton
                              variant="outlined"
                              color="info"
                              onClick={addQuestion}
                              startIcon={<Icon>add</Icon>}
                              size="small"
                            >
                              Add Question
                            </MDButton>
                          </MDBox>
                        </MDBox>
                      ))
                    )}
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

export default CreateForm;
