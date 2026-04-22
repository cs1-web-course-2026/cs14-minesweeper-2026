import { BrowserRouter, Routes, Route } from "react-router-dom";
import LepunovBogdan from "./pages/LepunovBogdan";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LepunovBogdan />} />
      </Routes>
    </BrowserRouter>
  );
}