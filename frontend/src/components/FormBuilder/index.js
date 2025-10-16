import React, { useState, useCallback } from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  QrCode as QrCodeIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import PropTypes from "prop-types";
import DragDropList from "components/DragDropList";

const FormBuilder = ({
  formData,
  setFormData,
  formType,
  onSave,
  loading = false,
  isEditing = false,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [excelImportDialog, setExcelImportDialog] = useState(false);
  const [qrCodeDialog, setQrCodeDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [qrCodeImage, setQrCodeImage] = useState(null);

  const questionTypes = [
    { value: "multiple_choice", label: "Multiple Choice", icon: "☑️" },
    { value: "single_choice", label: "Single Choice", icon: "⚪" },
    { value: "text", label: "Text Answer", icon: "📝" },
    { value: "rating", label: "Rating Scale", icon: "⭐" },
    { value: "yes_no", label: "Yes/No", icon: "✅" },
  ];

  const fieldTemplates = [
    { type: "multiple_choice", label: "Multiple Choice", icon: "☑️" },
    { type: "single_choice", label: "Single Choice", icon: "⚪" },
    { type: "text", label: "Text Field", icon: "📝" },
    { type: "rating", label: "Rating", icon: "⭐" },
    { type: "yes_no", label: "Yes/No", icon: "✅" },
  ];

  const addQuestion = useCallback(
    (questionType = "multiple_choice") => {
      const newQuestion = {
        id: Date.now(),
        question_text: "",
        question_type: questionType,
        options: questionType.includes("choice") ? ["", ""] : [],
        is_required: true,
        points: formType === "quiz" ? 1 : 0,
        correct_answer: "",
      };
      setFormData((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }));
    },
    [formType, setFormData]
  );

  const updateQuestion = useCallback(
    (questionId, field, value) => {
      setFormData((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
      }));
    },
    [setFormData]
  );

  const removeQuestion = useCallback(
    (questionId) => {
      setFormData((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      }));
    },
    [setFormData]
  );

  const handleExcelImport = async (file) => {
    try {
      setUploadProgress(10);
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      formDataObj.append("form_type", formType);

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/forms/import-excel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });

      setUploadProgress(70);
      const result = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          questions: [
            ...prev.questions,
            ...result.questions.map((q) => ({
              ...q,
              id: Date.now() + Math.random(),
            })),
          ],
        }));
        setUploadProgress(100);
        setTimeout(() => {
          setUploadProgress(0);
          setExcelImportDialog(false);
        }, 1000);
      } else {
        throw new Error(result.detail || "Import failed");
      }
    } catch (error) {
      console.error("Excel import error:", error);
      alert("Error importing Excel file: " + error.message);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/forms/excel-template", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "form_template.xlsx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Template download error:", error);
    }
  };

  const handleImageUpload = async (file, type) => {
    try {
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      formDataObj.append("upload_type", type);

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/forms/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });

      const result = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          [type === "banner" ? "banner_image" : "logo_image"]: result.file_path,
        }));
      } else {
        throw new Error(result.detail || "Upload failed");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Error uploading image: " + error.message);
    }
  };

  const handleSaveAndGenerateQR = async () => {
    if (!formData.id) {
      try {
        const result = await onSave();
        // Check if onSave returns the form ID or if formData was updated
        const savedFormId = result?.id || formData.id;

        if (savedFormId) {
          // Use the saved form ID directly
          generateQRCodeWithId(savedFormId);
        } else {
          // Fallback: try again after a short delay
          setTimeout(() => {
            if (formData.id) {
              generateQRCode();
            } else {
              alert("Please try generating QR code again after the form is fully saved.");
            }
          }, 500);
        }
      } catch (error) {
        alert("Error saving form: " + (error.message || error));
      }
    } else {
      generateQRCode();
    }
  };

  const generateQRCodeWithId = async (formId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/forms/${formId}/generate-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          form_title: formData.title || "Untitled Form",
          form_description: formData.description || "",
          logo_path: formData.logo_image,
          banner_path: formData.banner_image,
        }),
      });

      const result = await response.json();

      if (response.ok && result.qr_code) {
        setQrCodeImage(`data:image/png;base64,${result.qr_code}`);
        setQrCodeDialog(true);
      } else {
        throw new Error(result.detail || result.message || "QR generation failed");
      }
    } catch (error) {
      console.error("QR code generation error:", error);
      alert("Error generating QR code: " + error.message);
    }
  };

  const generateQRCode = async () => {
    if (!formData.id) {
      alert("Form must be saved before generating QR code");
      return;
    }
    generateQRCodeWithId(formData.id);
  };

  const downloadQRCode = () => {
    if (qrCodeImage) {
      const a = document.createElement("a");
      a.href = qrCodeImage;
      a.download = `${formData.title || "form"}_qr_code.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Box>
      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Form Builder" />
          <Tab label="Branding" />
          <Tab label="Import/Export" />
          <Tab label="Preview" />
        </Tabs>
      </Box>

      {/* Form Builder Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Field Templates Sidebar */}
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Field Types
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {fieldTemplates.map((template) => (
                  <Button
                    key={template.type}
                    variant="outlined"
                    startIcon={<span>{template.icon}</span>}
                    onClick={() => addQuestion(template.type)}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    {template.label}
                  </Button>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Form Builder Area */}
          <Grid item xs={12} md={9}>
            <Card sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Questions</Typography>
                <Box>
                  <Button
                    startIcon={<UploadIcon />}
                    onClick={() => setExcelImportDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    Import Excel
                  </Button>
                  <Button startIcon={<AddIcon />} variant="contained" onClick={() => addQuestion()}>
                    Add Question
                  </Button>
                </Box>
              </Box>

              {formData.questions.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography variant="h6" color="text.secondary" mb={2}>
                    No questions yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Click field types above or &quot;Add Question&quot; to get started
                  </Typography>
                </Box>
              ) : (
                <DragDropList
                  items={formData.questions}
                  onReorder={(newQuestions) =>
                    setFormData((prev) => ({ ...prev, questions: newQuestions }))
                  }
                  renderItem={(question, index) => (
                    <Box>
                      <Box display="flex" alignItems="flex-start" mb={2}>
                        <Chip label={`Q${index + 1}`} size="small" sx={{ mr: 2, mt: 0.5 }} />
                        <Box flexGrow={1}>
                          <TextField
                            fullWidth
                            label="Question Text"
                            value={question.question_text}
                            onChange={(e) =>
                              updateQuestion(question.id, "question_text", e.target.value)
                            }
                            margin="normal"
                          />

                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                <InputLabel>Question Type</InputLabel>
                                <Select
                                  value={question.question_type}
                                  onChange={(e) =>
                                    updateQuestion(question.id, "question_type", e.target.value)
                                  }
                                >
                                  {questionTypes.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                      <Box display="flex" alignItems="center">
                                        <span style={{ marginRight: 8 }}>{type.icon}</span>
                                        {type.label}
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            {formType === "quiz" && (
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
                          </Grid>

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
                            sx={{ mt: 2 }}
                          />

                          {/* Options for choice questions */}
                          {["multiple_choice", "single_choice"].includes(
                            question.question_type
                          ) && (
                            <Box mt={2}>
                              <Typography variant="subtitle2" mb={1}>
                                Options
                              </Typography>
                              {question.options.map((option, optionIndex) => (
                                <Box key={optionIndex} display="flex" alignItems="center" mb={1}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={option}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      newOptions[optionIndex] = e.target.value;
                                      updateQuestion(question.id, "options", newOptions);
                                    }}
                                    sx={{ mr: 1 }}
                                  />
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      if (question.options.length > 2) {
                                        const newOptions = question.options.filter(
                                          (_, i) => i !== optionIndex
                                        );
                                        updateQuestion(question.id, "options", newOptions);
                                      }
                                    }}
                                    disabled={question.options.length <= 2}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              ))}
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  const newOptions = [...question.options, ""];
                                  updateQuestion(question.id, "options", newOptions);
                                }}
                              >
                                Add Option
                              </Button>
                            </Box>
                          )}
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => removeQuestion(question.id)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                />
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Branding Tab */}
      {activeTab === 1 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" mb={3}>
            Form Branding
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box mb={3}>
                <Typography variant="subtitle1" mb={2}>
                  Banner Image
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleImageUpload(e.target.files[0], "banner");
                    }
                  }}
                  style={{ display: "none" }}
                  id="banner-upload"
                />
                <label htmlFor="banner-upload">
                  <Button variant="outlined" component="span" startIcon={<ImageIcon />} fullWidth>
                    Upload Banner
                  </Button>
                </label>
                {formData.banner_image && (
                  <Box mt={2}>
                    <img
                      src={`http://localhost:8000/api/files/${formData.banner_image?.replace(
                        "uploads/",
                        ""
                      )}`}
                      alt="Banner"
                      style={{ width: "100%", maxHeight: 200, objectFit: "cover" }}
                      onError={(e) => {
                        console.error("Banner image failed to load:", e.target.src);
                        e.target.style.display = "none";
                      }}
                      onLoad={() => console.log("Banner image loaded successfully")}
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box mb={3}>
                <Typography variant="subtitle1" mb={2}>
                  Logo Image
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleImageUpload(e.target.files[0], "logo");
                    }
                  }}
                  style={{ display: "none" }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button variant="outlined" component="span" startIcon={<ImageIcon />} fullWidth>
                    Upload Logo
                  </Button>
                </label>
                {formData.logo_image && (
                  <Box mt={2}>
                    <img
                      src={`http://localhost:8000/api/files/${formData.logo_image?.replace(
                        "uploads/",
                        ""
                      )}`}
                      alt="Logo"
                      style={{ width: 100, height: 100, objectFit: "contain" }}
                      onError={(e) => {
                        console.error("Logo image failed to load:", e.target.src);
                        e.target.style.display = "none";
                      }}
                      onLoad={() => console.log("Logo image loaded successfully")}
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Footer Text"
                multiline
                rows={3}
                value={formData.footer_text || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, footer_text: e.target.value }))}
                placeholder="Enter footer text for your form"
              />
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle1" mb={2}>
                  Brand Colors
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Primary Color"
                      type="color"
                      value={formData.brand_colors?.primary || "#1976d2"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          brand_colors: { ...prev.brand_colors, primary: e.target.value },
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Secondary Color"
                      type="color"
                      value={formData.brand_colors?.secondary || "#dc004e"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          brand_colors: { ...prev.brand_colors, secondary: e.target.value },
                        }))
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="contained"
                startIcon={<QrCodeIcon />}
                onClick={handleSaveAndGenerateQR}
                disabled={loading}
                title={
                  !formData.id
                    ? "Save the form and generate QR code"
                    : "Generate QR code for this form"
                }
              >
                {loading
                  ? "Processing..."
                  : !formData.id
                  ? "Save & Generate QR"
                  : "Generate QR Code"}
              </Button>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Import/Export Tab */}
      {activeTab === 2 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" mb={3}>
            Import & Export
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" mb={2}>
                  Excel Import
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Import questions from an Excel file. Download the template to see the required
                  format.
                </Typography>
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={downloadTemplate}
                  >
                    Download Template
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setExcelImportDialog(true)}
                  >
                    Import Excel
                  </Button>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" mb={2}>
                  QR Code
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Generate a branded QR code for easy form sharing.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<QrCodeIcon />}
                  onClick={handleSaveAndGenerateQR}
                  disabled={loading}
                  title={
                    !formData.id
                      ? "Save the form and generate QR code"
                      : "Generate QR code for this form"
                  }
                >
                  {loading
                    ? "Processing..."
                    : !formData.id
                    ? "Save & Generate QR"
                    : "Generate QR Code"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Preview Tab */}
      {activeTab === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" mb={3}>
            Form Preview
          </Typography>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 3 }}>
            {formData.banner_image && (
              <Box mb={3}>
                <img
                  src={`http://localhost:8000/api/files/${formData.banner_image?.replace(
                    "uploads/",
                    ""
                  )}`}
                  alt="Banner"
                  style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }}
                  onError={(e) => {
                    console.error("Preview banner failed to load:", e.target.src);
                    e.target.style.display = "none";
                  }}
                />
              </Box>
            )}

            <Box display="flex" alignItems="center" mb={3}>
              {formData.logo_image && (
                <img
                  src={`http://localhost:8000/api/files/${formData.logo_image?.replace(
                    "uploads/",
                    ""
                  )}`}
                  alt="Logo"
                  style={{ width: 60, height: 60, objectFit: "contain", marginRight: 16 }}
                  onError={(e) => {
                    console.error("Preview logo failed to load:", e.target.src);
                    e.target.style.display = "none";
                  }}
                />
              )}
              <Box>
                <Typography variant="h4" mb={1}>
                  {formData.title || "Form Title"}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.description || "Form description"}
                </Typography>
              </Box>
            </Box>

            {formData.questions.map((question, index) => (
              <Box
                key={question.id}
                mb={3}
                p={2}
                sx={{ backgroundColor: "grey.50", borderRadius: 1 }}
              >
                <Typography variant="h6" mb={2}>
                  {index + 1}. {question.question_text || "Question text"}
                  {question.is_required && <span style={{ color: "red" }}> *</span>}
                </Typography>

                {["multiple_choice", "single_choice"].includes(question.question_type) && (
                  <Box>
                    {question.options.map((option, optionIndex) => (
                      <Box key={optionIndex} display="flex" alignItems="center" mb={1}>
                        <input
                          type={question.question_type === "multiple_choice" ? "checkbox" : "radio"}
                          disabled
                          style={{ marginRight: 8 }}
                        />
                        <Typography>{option || `Option ${optionIndex + 1}`}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {question.question_type === "text" && (
                  <TextField fullWidth multiline rows={3} placeholder="Text answer..." disabled />
                )}

                {question.question_type === "rating" && (
                  <Box display="flex" gap={1}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} style={{ fontSize: 24, color: "#ddd" }}>
                        ⭐
                      </span>
                    ))}
                  </Box>
                )}

                {question.question_type === "yes_no" && (
                  <Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <input type="radio" disabled style={{ marginRight: 8 }} />
                      <Typography>Yes</Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <input type="radio" disabled style={{ marginRight: 8 }} />
                      <Typography>No</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            ))}

            {formData.footer_text && (
              <Box mt={4} pt={2} sx={{ borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {formData.footer_text}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      )}

      {/* Excel Import Dialog */}
      <Dialog
        open={excelImportDialog}
        onClose={() => setExcelImportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Questions from Excel</DialogTitle>
        <DialogContent>
          {uploadProgress > 0 && (
            <Box mb={2}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary">
                Importing... {uploadProgress}%
              </Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mb: 2 }}>
            Upload an Excel file with questions. Make sure to follow the template format.
          </Alert>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              if (e.target.files[0]) {
                handleExcelImport(e.target.files[0]);
              }
            }}
            style={{ width: "100%", padding: 16, border: "2px dashed #ccc", borderRadius: 8 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={downloadTemplate}>Download Template</Button>
          <Button onClick={() => setExcelImportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialog} onClose={() => setQrCodeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>QR Code Generated</DialogTitle>
        <DialogContent>
          {qrCodeImage && (
            <Box textAlign="center">
              <img src={qrCodeImage} alt="QR Code" style={{ maxWidth: "100%", height: "auto" }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={downloadQRCode}>Download</Button>
          <Button onClick={() => setQrCodeDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

FormBuilder.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  formType: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isEditing: PropTypes.bool,
};

export default FormBuilder;
