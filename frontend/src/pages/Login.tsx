import { useEffect } from "react";

export const Login = () => {
  const handleTikTokLogin = async () => {
    const response = await fetch("http://localhost:8000/oauth/tiktok");
    const data = await response.json();
    console.log(data);
  };

  return (
    <div className="container mx-auto flex flex-col items-center">
      <h1 className="text-3xl font-bold underline mb-10">MisoAuto</h1>
      <div
        className="cursor-pointer bg-black text-white py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        onClick={() => handleTikTokLogin()}
      >
        Continue with TikTok
      </div>
    </div>
  );
};
