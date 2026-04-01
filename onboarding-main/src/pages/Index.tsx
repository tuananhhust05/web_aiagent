import { useEffect } from "react";

const MOUSEFLOW_SRC = "https://cdn.mouseflow.com/projects/8002b794-c4a1-4999-bc9f-753bfd71d119.js";

const Index = () => {
  useEffect(() => {
    window._mfq = window._mfq || [];

    const existingScript = document.querySelector(`script[src="${MOUSEFLOW_SRC}"]`);
    if (existingScript) return;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.defer = true;
    script.src = MOUSEFLOW_SRC;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <iframe
      src="/forskale.html"
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
      title="ForSkale — Il Tuo AI Sales Coach"
    />
  );
};

declare global {
  interface Window {
    _mfq: unknown[];
  }
}

export default Index;
