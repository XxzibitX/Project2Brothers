import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AuthModalProvider } from "./features/auth/context/AuthModalContext.tsx";
import { CartProvider } from "./features/cart/context/CartContext.tsx";
import { ToastProvider } from "./shared/ui/toast.tsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
} else {
  createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthModalProvider>
          <CartProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </CartProvider>
        </AuthModalProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}
