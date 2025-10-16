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

/** 
  All of the routes for the Material Dashboard 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard";
import Events from "layouts/events";
import Email from "layouts/email";
import Chat from "layouts/chat";
import UserChatLogin from "layouts/user-chat";
import UserChatRoom from "layouts/user-chat/chat-room";
import Tables from "layouts/tables";
import Forms from "layouts/forms";
import CreateForm from "layouts/forms/create";
import FormAnalytics from "layouts/forms/analytics";
import FillForm from "layouts/forms/fill";
import QAUser from "layouts/qa-user";
import Logs from "layouts/logs";
import Users from "layouts/users";
import Payments from "layouts/payments";
import Profile from "layouts/profile";
import Settings from "layouts/settings";
import Reports from "layouts/reports";
import SignIn from "layouts/authentication/sign-in";

import EventRegistration from "layouts/forms/EventRegistration";

// @mui icons
import Icon from "@mui/material/Icon";

const allRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
    roles: ["admin", "manager", "presenter"],
  },
  {
    type: "collapse",
    name: "Events",
    key: "events",
    icon: <Icon fontSize="small">event</Icon>,
    route: "/events",
    component: <Events />,
    roles: ["admin", "manager", "presenter"],
  },
  {
    type: "collapse",
    name: "Users",
    key: "users",
    icon: <Icon fontSize="small">people</Icon>,
    route: "/users",
    component: <Users />,
    roles: ["admin", "manager", "presenter"],
  },
  {
    type: "collapse",
    name: "Campaigns",
    key: "email",
    icon: <Icon fontSize="small">email</Icon>,
    route: "/email",
    component: <Email />,
    roles: ["admin", "manager"],
  },
  {
    type: "collapse",
    name: "Payments",
    key: "payments",
    icon: <Icon fontSize="small">payment</Icon>,
    route: "/payments",
    component: <Payments />,
    roles: ["admin"],
  },
  {
    type: "collapse",
    name: "Forms",
    key: "forms",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/forms",
    component: <Forms />,
    roles: ["admin", "manager", "presenter"],
  },
  {
    type: "collapse",
    name: "Q/A",
    key: "qa",
    icon: <Icon fontSize="small">question_answer</Icon>,
    route: "/qa",
    component: <Chat />,
    roles: ["admin", "manager", "presenter"],
  },
  {
    type: "collapse",
    name: "Reports",
    key: "reports",
    icon: <Icon fontSize="small">assessment</Icon>,
    route: "/reports",
    component: <Reports />,
    roles: ["admin", "manager"],
  },
  {
    type: "collapse",
    name: "Logs",
    key: "logs",
    icon: <Icon fontSize="small">history</Icon>,
    route: "/logs",
    component: <Logs />,
    roles: ["admin"],
  },
];

const getFilteredRoutes = (userRole) => {
  if (!userRole) return allRoutes;
  return allRoutes.filter((route) => route.roles.includes(userRole));
};

// Hidden routes (accessible but not shown in sidebar)
const hiddenRoutes = [
  {
    type: "route",
    name: "Settings",
    key: "settings",
    route: "/settings",
    component: <Settings />,
    roles: ["admin", "manager"],
  },
  {
    type: "route",
    name: "Tables",
    key: "tables",
    route: "/tables",
    component: <Tables />,
    roles: ["admin", "manager"],
  },
];

// Public routes (no authentication required)
const publicRoutes = [
  {
    type: "route",
    name: "Q/A User",
    key: "qa-user",
    route: "/qa-user",
    component: <QAUser />,
  },
  {
    type: "route",
    name: "User Chat Login",
    key: "user-chat-login",
    route: "/user-chat-login",
    component: <UserChatLogin />,
  },
  {
    type: "route",
    name: "User Chat Room",
    key: "user-chat-room",
    route: "/user-chat-room",
    component: <UserChatRoom />,
  },
  {
    type: "route",
    name: "Event Registration",
    key: "event-registration",
    route: "/register/:slug",
    component: <EventRegistration />,
  },
];

const routes = allRoutes;

export default routes;
export { getFilteredRoutes, publicRoutes, hiddenRoutes };
