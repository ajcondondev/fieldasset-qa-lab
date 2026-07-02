import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./app/store";
import { AppLayout } from "./app/AppLayout";
import { FacilityListPage } from "./pages/FacilityListPage";
import { FacilityDetailPage } from "./pages/FacilityDetailPage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<FacilityListPage />} />
            <Route path="/facility/:facilityId" element={<FacilityDetailPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </StrictMode>,
);
