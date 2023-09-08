import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth";
import Loader from "../../components/Loader/Loader";
import { getApiUrl } from "../../utils/env";

export const Dashboard = () => {
  const [userData, setUserData] = useState<Record<
    string,
    string | number
  > | null>(null);
  const { authData } = useAuthContext();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const url = `${getApiUrl()}/tiktok/user`;
        console.log("AUTH DATA", authData);
        const fetchConfig: RequestInit = {
          method: "POST",
          mode: "cors",
          body: JSON.stringify({ accessToken: authData?.access_token }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        };
        console.log("FETCH CONFIG", fetchConfig);
        const response = await fetch(url, fetchConfig);

        if (!response.ok) {
          throw new Error(
            `Network response was not ok:  ${response?.statusText}`,
          );
        }

        const data = await response.json();

        setUserData(data.response);
      } catch (error: unknown) {
        console.error(error);
      }
    };

    if (authData) {
      fetchUserData();
    }
  }, [authData]);

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
