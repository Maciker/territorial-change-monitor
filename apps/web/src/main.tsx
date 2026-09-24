import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./app.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
