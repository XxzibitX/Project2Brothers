import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/navigation/Layout";
import { ManagerAway } from "./components/auth/ManagerAway";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Home from "./pages/home/Home";
import Account from "./pages/account/Account";
import Cart from "./pages/cart/Cart";
import Manager from "./pages/manager/Manager";
import OrderPage from "./pages/orders/OrderPage";
import LegalDocumentPage from "./pages/legal/LegalDocumentPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <ManagerAway>
              <Home />
            </ManagerAway>
          }
        />
        <Route
          path="cart"
          element={
            <ManagerAway>
              <Cart />
            </ManagerAway>
          }
        />
        <Route path="account" element={<Account />} />
        <Route path="orders/:id" element={<OrderPage />} />
        <Route path="privacy" element={<LegalDocumentPage />} />
        <Route path="offer" element={<LegalDocumentPage />} />
        <Route path="delivery-info" element={<LegalDocumentPage />} />
        <Route path="legal/:slug" element={<LegalDocumentPage />} />
        <Route
          path="manager"
          element={
            <ProtectedRoute allowedRoles={["manager", "owner"]}>
              <Manager />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
