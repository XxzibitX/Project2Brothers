import { useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Hero } from "@/features/catalog/components/Hero";
import { ProductCatalog } from "@/features/catalog/components/ProductCatalog";

type HomeState = { scrollToMenu?: boolean } | null;

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const state = location.state as HomeState;
    const hadMenuHash = location.hash === "#menu";
    const wantMenu = Boolean(state?.scrollToMenu);

    // Убираем #menu из URL, чтобы reload не уводил с hero
    if (hadMenuHash || wantMenu) {
      navigate("/", { replace: true, state: null });
    }

    if (wantMenu) {
      requestAnimationFrame(() => {
        document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }

    if (hadMenuHash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <>
      <Hero />
      <ProductCatalog />
    </>
  );
}
