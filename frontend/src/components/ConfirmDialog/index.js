import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

let showConfirmDialog = null;

function ConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(null);

  useEffect(() => {
    showConfirmDialog = (dialogTitle, dialogMessage, confirmCallback) => {
      setTitle(dialogTitle);
      setMessage(dialogMessage);
      setOnConfirm(() => confirmCallback);
      setOpen(true);
    };
  }, []);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <MDTypography variant="h5">{title}</MDTypography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <MDTypography variant="body1">{message}</MDTypography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={handleCancel} color="secondary">
          Cancel
        </MDButton>
        <MDButton onClick={handleConfirm} variant="gradient" color="error">
          Delete
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export { ConfirmDialog, showConfirmDialog };
