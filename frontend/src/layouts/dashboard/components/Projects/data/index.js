/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
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
import Tooltip from "@mui/material/Tooltip";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDProgress from "components/MDProgress";

// Images
import logoXD from "assets/images/small-logos/logo-xd.svg";
import logoAtlassian from "assets/images/small-logos/logo-atlassian.svg";
import logoSlack from "assets/images/small-logos/logo-slack.svg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";
import logoJira from "assets/images/small-logos/logo-jira.svg";
import logoInvesion from "assets/images/small-logos/logo-invision.svg";
import team1 from "assets/images/team-1.jpg";
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";

export default function data(formsData = []) {
  const avatars = (members) =>
    members.map(([image, name]) => (
      <Tooltip key={name} title={name} placeholder="bottom">
        <MDAvatar
          src={image}
          alt="name"
          size="xs"
          sx={{
            border: ({ borders: { borderWidth }, palette: { white } }) =>
              `${borderWidth[2]} solid ${white.main}`,
            cursor: "pointer",
            position: "relative",

            "&:not(:first-of-type)": {
              ml: -1.25,
            },

            "&:hover, &:focus": {
              zIndex: "10",
            },
          }}
        />
      </Tooltip>
    ));

  const Company = ({ image, name }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={image} name={name} size="sm" />
      <MDTypography variant="button" fontWeight="medium" ml={1} lineHeight={1}>
        {name}
      </MDTypography>
    </MDBox>
  );

  const Form = ({ name, date }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDBox ml={1}>
        <MDTypography variant="button" fontWeight="medium" lineHeight={1}>
          {name}
        </MDTypography>
        <MDTypography variant="caption" color="text" display="block">
          {date}
        </MDTypography>
      </MDBox>
    </MDBox>
  );

  const getProgressColor = (responses) => {
    if (responses >= 50) return "success";
    if (responses >= 20) return "warning";
    return "info";
  };

  const rows =
    formsData.length > 0
      ? formsData.map((form) => {
          const responses = form.response_count || 0;
          const progressValue = Math.min(responses * 2, 100); // Scale for visual progress

          return {
            form: <Form name={form.title} date={new Date(form.created_at).toLocaleDateString()} />,
            responses: (
              <MDTypography variant="caption" color="text" fontWeight="medium">
                {responses}
              </MDTypography>
            ),
            status: (
              <MDTypography variant="caption" color="text" fontWeight="medium">
                {form.is_active ? "Active" : "Inactive"}
              </MDTypography>
            ),
            activity: (
              <MDBox width="8rem" textAlign="left">
                <MDProgress
                  value={progressValue}
                  color={getProgressColor(responses)}
                  variant="gradient"
                  label={false}
                />
              </MDBox>
            ),
          };
        })
      : [
          {
            form: <Form name="No forms available" date="-" />,
            responses: (
              <MDTypography variant="caption" color="text" fontWeight="medium">
                -
              </MDTypography>
            ),
            status: (
              <MDTypography variant="caption" color="text" fontWeight="medium">
                -
              </MDTypography>
            ),
            activity: (
              <MDBox width="8rem" textAlign="left">
                <MDProgress value={0} color="info" variant="gradient" label={false} />
              </MDBox>
            ),
          },
        ];

  return {
    columns: [
      { Header: "form", accessor: "form", width: "45%", align: "left" },
      { Header: "responses", accessor: "responses", width: "15%", align: "center" },
      { Header: "status", accessor: "status", width: "15%", align: "center" },
      { Header: "activity", accessor: "activity", align: "center" },
    ],
    rows,
  };
}
