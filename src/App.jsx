import Spectator from "./pages/Spectator.jsx";
import Performer from "./pages/Performer.jsx";

export default function App() {
  const path = window.location.pathname;
  if (path === "/performer") return <Performer />;
  return <Spectator />;
}
