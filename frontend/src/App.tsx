import "./App.css"
import { Routes, Route, Navigate } from "react-router-dom"
import LandingPage from "./LandingPage"

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header at the top */}
      {/* <Header /> */}

      {/* Routed content in the middle, expands as needed */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Footer anchored at the bottom */}
      {/* <Footer /> */}
    </div>
  )
}

export default App
