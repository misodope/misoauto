import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container mx-auto flex flex-col items-center">
      <h1 className="text-3xl font-bold underline">MisoAuto</h1>
      <button
        className="bg-sky-500/100 p-2 rounded text-white"
        onClick={() => setCount((count) => count + 1)}
      >
        count is {count}
      </button>
    </div>
  );
}

export default App;
