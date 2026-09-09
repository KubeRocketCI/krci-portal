import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./fonts";
import "./tailwind.css";

createRoot(document.getElementById("root")!).render(<App />);
