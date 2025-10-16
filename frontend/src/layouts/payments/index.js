import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import {
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import { Edit, Delete, Visibility } from "@mui/icons-material";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter, eventFilter, searchTerm]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (methodFilter) params.append("method", methodFilter);
      if (eventFilter) params.append("event", eventFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`http://localhost:8000/api/payments?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setTotalCount(data.total_count);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setViewModalOpen(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("Are you sure you want to delete this payment record?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/api/payments/${paymentId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchPayments();
        }
      } catch (error) {
        console.error("Error deleting payment:", error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      default:
        return "info";
    }
  };

  const columns = [
    { Header: "Payment ID", accessor: "payment_id", align: "left" },
    { Header: "User Name", accessor: "user_name", align: "left" },
    { Header: "Email", accessor: "user_email", align: "left" },
    { Header: "Amount", accessor: "amount", align: "center" },
    { Header: "Status", accessor: "status", align: "center" },
    { Header: "Method", accessor: "method", align: "center" },
    { Header: "Date", accessor: "date", align: "center" },
    { Header: "Actions", accessor: "actions", align: "center" },
  ];

  const rows = payments.map((payment) => ({
    payment_id: payment.payment_id?.substring(0, 12) + "..." || "N/A",
    user_name: payment.user_name || "N/A",
    user_email: payment.user_email || "N/A",
    amount: `₹${payment.amount?.toFixed(2) || "0.00"}`,
    status: (
      <Chip
        label={payment.payment_status || "pending"}
        color={getStatusColor(payment.payment_status)}
        size="small"
      />
    ),
    method: payment.mode_of_payment || "razorpay",
    date: formatDateTime(payment.payment_date),
    actions: (
      <MDBox display="flex" alignItems="center">
        <IconButton size="small" color="info" onClick={() => handleViewPayment(payment)}>
          <Visibility />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDeletePayment(payment.payment_id)}
        >
          <Delete />
        </IconButton>
      </MDBox>
    ),
  }));

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
                <MDBox>
                  <MDTypography variant="h6" color="white">
                    Payment Management
                  </MDTypography>
                  <MDTypography variant="body2" color="white" opacity={0.8}>
                    Total Payments: {totalCount}
                  </MDTypography>
                </MDBox>
              </MDBox>
              <MDBox pt={3} px={3}>
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} md={3}>
                    <MDInput
                      label="Search by name or email"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Filter by Status"
                        sx={{ height: 45 }}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="success">Success</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Method</InputLabel>
                      <Select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        label="Filter by Method"
                        sx={{ height: 45 }}
                      >
                        <MenuItem value="">All Methods</MenuItem>
                        <MenuItem value="razorpay">Razorpay</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                        <MenuItem value="netbanking">Net Banking</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <MDInput
                      label="Filter by Event"
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* View Payment Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <MDTypography variant="h5">Payment Details</MDTypography>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <MDBox pt={2}>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Payment ID:
                </MDTypography>
                <MDTypography variant="h6">{selectedPayment.payment_id}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  User Name:
                </MDTypography>
                <MDTypography variant="h6">{selectedPayment.user_name}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Email:
                </MDTypography>
                <MDTypography variant="h6">{selectedPayment.user_email}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Amount:
                </MDTypography>
                <MDTypography variant="h6">₹{selectedPayment.amount?.toFixed(2)}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Status:
                </MDTypography>
                <Chip
                  label={selectedPayment.payment_status}
                  color={getStatusColor(selectedPayment.payment_status)}
                  size="small"
                />
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Payment Method:
                </MDTypography>
                <MDTypography variant="h6">{selectedPayment.mode_of_payment}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="body2" color="text">
                  Payment Date:
                </MDTypography>
                <MDTypography variant="h6">
                  {formatDateTime(selectedPayment.payment_date)}
                </MDTypography>
              </MDBox>
            </MDBox>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setViewModalOpen(false)} color="secondary">
            Close
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default Payments;
