import { getAuthUrl } from "../../../../services/utils/env";
import { Link } from "react-router-dom";

export const Login = () => {
  return (
    <div className="container mx-auto flex flex-col items-center">
      <h1 className="text-3xl font-bold  mb-10">Login</h1>
      <Link
        className="cursor-pointer bg-black text-white py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        to={getAuthUrl() ?? ""}
      >
        Continue with TikTok
      </Link>
    </div>
  );
};
