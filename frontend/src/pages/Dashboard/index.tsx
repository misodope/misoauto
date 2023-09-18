import { Link } from "react-router-dom";
import Loader from "../../components/Loader/Loader";
import { getApiUrl } from "../../utils/env";
import { useFetch } from "../../hooks/useFetch";

export const Dashboard = () => {
  const {
    data: userData,
    error,
    loading,
  } = useFetch({
    url: `/tiktok/user`,
    method: "GET",
  });

  if (!userData) {
    return <Loader />;
  }

  return (
    <div>
      <div className="mt-8 flex items-center flex-col">
        <h1 className="text-3xl font-bold mb-10 text-center">
          Hello, {userData.display_name || "Welcome!"}
        </h1>
        <img
          className="w-20 h-20 rounded-full mb-4"
          src={(userData.avatar_url as string) || ""}
          alt="Profile"
        />
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold text-gray-600 mb-4">
            {userData.bio_description}
          </div>
          <Link
            to={(userData.profile_deep_link as string) || "https://tiktok.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
          >
            View profile
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold">
            {userData.follower_count || 0}
          </div>
          <div className="text-sm">Followers</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold">
            {userData.following_count || 0}
          </div>
          <div className="text-sm">Following</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold">{userData.likes_count || 0}</div>
          <div className="text-sm">Likes</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm">Comments</div>
        </div>
      </div>
      <div className="mt-8">
        <Link
          to="/videos"
          className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded block w-full text-center"
        >
          Go to Video Page
        </Link>
      </div>
    </div>
  );
};
