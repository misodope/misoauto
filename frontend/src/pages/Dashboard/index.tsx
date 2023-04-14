import { useEffect, useState } from "react";

export const Dashboard = () => {
  const [userData, setUserData] = useState<Record<string, string | number>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch("https://misoauto.up.railway.app/api/user", {
        credentials: "include",
      });

      if (res.ok) {
        const { data } = await res.json();
        setUserData(data.user);
        console.log(data);
      }
    })();
  }, []);
  return (
    <div>
      <div className="mt-8 flex items-center flex-col">
        <h1 className="text-3xl font-bold mb-10 text-center">
          Hello, {userData.display_name || "Welcome!"}
        </h1>
        <img
          className="w-20 h-20 rounded-full mr-4"
          src={(userData.avatar_url as string) || ""}
          alt="Profile"
        />
        <div>
          <div className="text-sm text-gray-600">
            {userData.bio_description}
          </div>
          <a
            href={
              (userData.profile_deep_link as string) || "https://tiktok.com"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 text-sm hover:text-blue-700"
          >
            View profile
          </a>
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
    </div>
  );
};
