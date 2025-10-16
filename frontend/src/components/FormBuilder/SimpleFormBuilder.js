import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import PropTypes from "prop-types";

const SimpleFormBuilder = ({ formData, setFormData, onAddQuestion }) => {
  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Enhanced Form Builder
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Advanced form building features are being integrated. Current questions:{" "}
        {formData.questions.length}
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAddQuestion}>
        Add Question
      </Button>
    </Box>
  );
};

SimpleFormBuilder.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  onAddQuestion: PropTypes.func.isRequired,
};

export default SimpleFormBuilder;
