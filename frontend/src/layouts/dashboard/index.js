/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Data
import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

// Dashboard components
import Projects from "layouts/dashboard/components/Projects";
import TopColleges from "layouts/dashboard/components/TopColleges";
import DashboardHeader from "components/DashboardHeader";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import API_BASE_URL from "config/api";
import { useEvent } from "context/EventContext";

const Dashboard = memo(() => {
  const { selectedEvent } = useEvent();
  const [dashboardStats, setDashboardStats] = useState({
    total_registrations: 0,
    today_registrations: 0,
    week_registrations: 0,
    total_events: 0,
  });
  const [chartData, setChartData] = useState({
    barChart: reportsBarChartData,
    registrations: reportsLineChartData.registrations,
    attendance: reportsLineChartData.attendance,
    payments: reportsLineChartData.registrations,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const eventParam = selectedEvent !== "all" ? `?event_id=${selectedEvent}` : "";

      // Parallel API calls for better performance
      const [
        statsResponse,
        barChartResponse,
        monthlyResponse,
        attendanceResponse,
        paymentsResponse,
      ] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/dashboard/stats${eventParam}`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard/registration-chart${eventParam}`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard/monthly-registrations${eventParam}`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard/attendance-stats${eventParam}`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard/event-payments${eventParam}`, { headers }),
      ]);

      // Process stats
      if (statsResponse.status === "fulfilled" && statsResponse.value.ok) {
        const stats = await statsResponse.value.json();
        setDashboardStats(stats);
      }

      // Process chart data in batch
      const newChartData = { ...chartData };

      if (barChartResponse.status === "fulfilled" && barChartResponse.value.ok) {
        const barData = await barChartResponse.value.json();
        newChartData.barChart = {
          labels: barData.labels,
          datasets: { label: "Daily Registrations", data: barData.data },
        };
      }

      if (monthlyResponse.status === "fulfilled" && monthlyResponse.value.ok) {
        const monthlyData = await monthlyResponse.value.json();
        newChartData.registrations = {
          labels: monthlyData.labels,
          datasets: { label: "Monthly Registrations", data: monthlyData.data },
        };
      }

      if (attendanceResponse.status === "fulfilled" && attendanceResponse.value.ok) {
        const attendanceData = await attendanceResponse.value.json();
        newChartData.attendance = {
          labels: attendanceData.labels,
          datasets: { label: "Attendance Status", data: attendanceData.data },
        };
      }

      if (paymentsResponse.status === "fulfilled" && paymentsResponse.value.ok) {
        const paymentsData = await paymentsResponse.value.json();
        newChartData.payments = {
          labels: paymentsData.labels,
          datasets: { label: "Event Payments", data: paymentsData.data },
        };
      }

      setChartData(newChartData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized statistics cards
  const statisticsCards = useMemo(
    () => [
      {
        color: "dark",
        icon: "group",
        title: "Total Registrations",
        count: dashboardStats.total_registrations,
        label: "All time",
      },
      {
        icon: "today",
        title: "Today's Registrations",
        count: dashboardStats.today_registrations,
        label: "today",
      },
      {
        color: "success",
        icon: "event",
        title: "Total Events",
        count: dashboardStats.total_events,
        label: "events",
      },
      {
        color: "warning",
        icon: "date_range",
        title: "This Week",
        count: dashboardStats.week_registrations,
        label: "registrations",
      },
    ],
    [dashboardStats]
  );

  // Memoized chart components
  const chartComponents = useMemo(
    () => [
      {
        component: ReportsBarChart,
        props: {
          color: "info",
          title: "Registration Flow",
          description: "Daily Registrations",
          date: "last 7 days",
          chart: chartData.barChart,
        },
      },
      {
        component: ReportsLineChart,
        props: {
          color: "success",
          title: "Payment Analytics",
          description: "Event Payments",
          date: "by events",
          chart: chartData.payments,
        },
      },
      {
        component: ReportsLineChart,
        props: {
          color: "warning",
          title: "Attendance Overview",
          description: "Event Participation",
          date: "current status",
          chart: chartData.attendance,
        },
      },
    ],
    [chartData]
  );

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} textAlign="center">
          <MDTypography variant="h6" color="error">
            Error loading dashboard: {error}
          </MDTypography>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={0.3}>
        <DashboardHeader />
        <Grid container spacing={3}>
          {statisticsCards.map((card, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color={card.color}
                  icon={card.icon}
                  title={card.title}
                  count={loading ? "..." : card.count}
                  percentage={{
                    color: card.color || "info",
                    amount: "",
                    label: card.label,
                  }}
                />
              </MDBox>
            </Grid>
          ))}
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            {chartComponents.map((chart, index) => {
              const ChartComponent = chart.component;
              return (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <MDBox mb={3}>
                    <ChartComponent {...chart.props} />
                  </MDBox>
                </Grid>
              );
            })}
          </Grid>
        </MDBox>
        <MDBox>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={8}>
              <Projects />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <TopColleges />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;
