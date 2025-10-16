import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { Info } from "@mui/icons-material";

function ViewOnlyAlert({ open, onClose, action }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Info color="info" />
        View Only Access
      </DialogTitle>
      <DialogContent>
        <Typography>
          You have view-only access and cannot {action}. Please contact an administrator if you need
          to make changes.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ViewOnlyAlert.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  action: PropTypes.string,
};

ViewOnlyAlert.defaultProps = {
  action: "perform this action",
};

export default ViewOnlyAlert;
