import { useState, useEffect, useCallback, memo } from "react";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import API_BASE_URL from "config/api";
import { useEvent } from "context/EventContext";

const TopColleges = memo(() => {
  const { selectedEvent } = useEvent();
  const [menu, setMenu] = useState(null);
  const [collegesData, setCollegesData] = useState({ colleges: [], total_colleges: 0 });
  const [loading, setLoading] = useState(true);

  const openMenu = ({ currentTarget }) => setMenu(currentTarget);
  const closeMenu = () => setMenu(null);

  const fetchCollegesData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const eventParam =
        selectedEvent && selectedEvent !== "all" ? `?event_id=${selectedEvent}` : "";
      const response = await fetch(`${API_BASE_URL}/api/dashboard/colleges${eventParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCollegesData(data);
      }
    } catch (error) {
      console.error("Error fetching colleges data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    fetchCollegesData();
  }, [fetchCollegesData]);

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
    <Card sx={{ height: "100%" }}>
      <MDBox display="flex" justifyContent="space-between" alignItems="center" pt={3} px={2}>
        <MDBox>
          <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
            Top Colleges by Registration
          </MDTypography>
          <MDBox display="flex" alignItems="center" lineHeight={0}>
            <Icon
              sx={{
                fontWeight: "bold",
                color: ({ palette: { info } }) => info.main,
                mt: -0.5,
              }}
            >
              done
            </Icon>
            <MDTypography variant="button" fontWeight="regular" color="text">
              &nbsp;<strong>{collegesData.total_colleges}</strong> colleges registered
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
      <MDBox p={2}>
        {loading ? (
          <MDTypography variant="body2">Loading...</MDTypography>
        ) : collegesData.colleges.length === 0 ? (
          <MDTypography variant="body2" color="text">
            No college data available
          </MDTypography>
        ) : (
          collegesData.colleges.map((college, index) => (
            <MDBox key={index} display="flex" alignItems="center" px={1} py={1}>
              <MDBox
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                justifyContent="center"
              >
                <MDTypography variant="button" fontWeight="medium" textTransform="capitalize">
                  {college.name}
                </MDTypography>
                <MDTypography variant="caption" color="text">
                  {college.count} registrations
                </MDTypography>
              </MDBox>
              <MDBox ml="auto">
                <MDBox
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width="2rem"
                  height="2rem"
                  borderRadius="50%"
                  variant="gradient"
                  bgColor="success"
                  color="white"
                  fontSize="0.875rem"
                  fontWeight="bold"
                >
                  {college.count}
                </MDBox>
              </MDBox>
            </MDBox>
          ))
        )}
      </MDBox>
    </Card>
  );
});

TopColleges.displayName = "TopColleges";

export default TopColleges;
