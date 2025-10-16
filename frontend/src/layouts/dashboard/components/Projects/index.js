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

import { useState, memo, useMemo, useEffect } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React examples
import DataTable from "examples/Tables/DataTable";

// Data
import data from "layouts/dashboard/components/Projects/data";
import API_BASE_URL from "config/api";
import { useEvent } from "context/EventContext";

const Projects = memo(() => {
  const { selectedEvent } = useEvent();
  const [formsData, setFormsData] = useState([]);
  const [formsCount, setFormsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    const fetchRecentForms = async () => {
      try {
        const token = localStorage.getItem("token");
        const eventParam =
          selectedEvent && selectedEvent !== "all" ? `?event_id=${selectedEvent}` : "";
        const [formsResponse, responsesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/forms${eventParam}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/form-responses${eventParam}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (formsResponse.ok) {
          const forms = await formsResponse.json();
          let responseCounts = {};

          if (responsesResponse.ok) {
            const responses = await responsesResponse.json();
            responseCounts = responses.reduce((acc, response) => {
              acc[response.form_id] = (acc[response.form_id] || 0) + 1;
              return acc;
            }, {});
          }

          const formsWithCounts = forms.map((form) => ({
            ...form,
            response_count: responseCounts[form.id] || 0,
          }));

          setFormsData(formsWithCounts.slice(0, 6));
          setFormsCount(forms.length);
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentForms();
  }, [selectedEvent]);

  const tableData = useMemo(() => data(formsData), [formsData]);
  const { columns, rows } = tableData;

  const openMenu = ({ currentTarget }) => setMenu(currentTarget);
  const closeMenu = () => setMenu(null);

  const renderMenu = (
    <Menu
      id="simple-menu"
      anchorEl={menu}
      anchorOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={Boolean(menu)}
      onClose={closeMenu}
    >
      <MenuItem onClick={closeMenu}>Action</MenuItem>
      <MenuItem onClick={closeMenu}>Another action</MenuItem>
      <MenuItem onClick={closeMenu}>Something else</MenuItem>
    </Menu>
  );

  return (
    <Card>
      <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
        <MDBox>
          <MDTypography variant="h6" gutterBottom>
            Recent Forms
          </MDTypography>
          <MDBox display="flex" alignItems="center" lineHeight={0}>
            <Icon
              sx={{
                fontWeight: "bold",
                color: ({ palette: { info } }) => info.main,
                mt: -0.5,
              }}
            >
              assignment
            </Icon>
            <MDTypography variant="button" fontWeight="regular" color="text">
              &nbsp;<strong>{loading ? "..." : formsCount} forms</strong> total
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox color="text" px={2}>
          <Icon sx={{ cursor: "pointer", fontWeight: "bold" }} fontSize="small" onClick={openMenu}>
            more_vert
          </Icon>
        </MDBox>
        {renderMenu}
      </MDBox>
      <MDBox>
        <DataTable
          table={{ columns, rows }}
          showTotalEntries={false}
          isSorted={false}
          noEndBorder
          entriesPerPage={false}
        />
      </MDBox>
    </Card>
  );
});

Projects.displayName = "Projects";

export default Projects;
