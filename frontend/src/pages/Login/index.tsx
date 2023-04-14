export const Login = () => {
  const handleTikTokLogin = async () => {
    try {
      const response = await fetch(
        "https://misoauto.up.railway.app/oauth/tiktok",
        {
          method: "GET",
          mode: "no-cors",
        }
      );

      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center">
      <h1 className="text-3xl font-bold  mb-10">Login</h1>
      <div
        className="cursor-pointer bg-black text-white py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        onClick={() => handleTikTokLogin()}
      >
        Continue with TikTok
      </div>
    </div>
  );
};
