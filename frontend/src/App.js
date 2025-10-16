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

import { useState, useEffect, useMemo } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import Sidenav from "examples/Sidenav";

// Material Dashboard 2 React themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// Material Dashboard 2 React Dark Mode themes
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Material Dashboard 2 React routes
import routes, { getFilteredRoutes, hiddenRoutes, publicRoutes } from "routes";

// Material Dashboard 2 React contexts
import { useMaterialUIController, setMiniSidenav, setOpenConfigurator } from "context";

// Authentication
import { AuthProvider, useAuth } from "context/AuthContext";
import { EventProvider } from "context/EventContext";
import ProtectedRoute from "components/ProtectedRoute";
import SignIn from "layouts/authentication/sign-in";
import UserChatLogin from "layouts/user-chat";
import UserChatRoom from "layouts/user-chat/chat-room";
import CreateForm from "layouts/forms/create";
import FormAnalytics from "layouts/forms/analytics";
import FormResponses from "layouts/forms/responses";
import FillForm from "layouts/forms/fill";
import QAUser from "layouts/qa-user";
import EventRegistration from "layouts/forms/EventRegistration";
import EventAnalytics from "layouts/events/analytics";
import ReportDetail from "layouts/reports/detail";

// Images
import brandWhite from "assets/images/logo-ct.png";
import brandDark from "assets/images/logo-ct-dark.png";

function AppContent() {
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        <Routes>
          <Route path="/authentication/sign-in" element={<SignIn />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                {layout === "dashboard" && (
                  <>
                    <Sidenav
                      color={sidenavColor}
                      brand={
                        (transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite
                      }
                      brandName="Kambaa Events Management Dashboard"
                      routes={getFilteredRoutes(localStorage.getItem("userRole"))}
                      onMouseEnter={handleOnMouseEnter}
                      onMouseLeave={handleOnMouseLeave}
                    />
                  </>
                )}
                <Routes>
                  {getRoutes(routes)}
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      <Routes>
        <Route path="/authentication/sign-in" element={<SignIn />} />
        {getRoutes(publicRoutes)}
        <Route path="/forms/fill/:formHash" element={<FillForm />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              {layout === "dashboard" && (
                <>
                  <Sidenav
                    color={sidenavColor}
                    brand={
                      (transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite
                    }
                    brandName="Kambaa Events Management Dashboard"
                    routes={getFilteredRoutes(localStorage.getItem("userRole"))}
                    onMouseEnter={handleOnMouseEnter}
                    onMouseLeave={handleOnMouseLeave}
                  />
                </>
              )}
              <Routes>
                {getRoutes(routes)}
                {getRoutes(hiddenRoutes)}
                <Route path="/forms/create/:type" element={<CreateForm />} />
                <Route path="/forms/create/:type/:formId" element={<CreateForm />} />
                <Route path="/forms/edit/:formId" element={<CreateForm />} />
                <Route path="/forms/:formId/analytics" element={<FormAnalytics />} />
                <Route path="/forms/:formId/responses" element={<FormResponses />} />
                <Route path="/events/:eventId/analytics" element={<EventAnalytics />} />
                <Route path="/reports/:eventId" element={<ReportDetail />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <AppContent />
      </EventProvider>
    </AuthProvider>
  );
}
