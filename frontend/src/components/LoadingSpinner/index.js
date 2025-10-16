import { CircularProgress, Box } from "@mui/material";
import MDTypography from "components/MDTypography";

const LoadingSpinner = ({ message = "Loading..." }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="200px"
    gap={2}
  >
    <CircularProgress size={40} />
    <MDTypography variant="body2" color="text">
      {message}
    </MDTypography>
  </Box>
);

export default LoadingSpinner;
