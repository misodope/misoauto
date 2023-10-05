import { Link } from "react-router-dom";
import Loader from "../../components/Loader/Loader";
import { useFetch } from "../../hooks/useFetch";
import { useAuthContext } from "../../hooks/useAuth";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import { PageContainer } from "../../components/PageContainer/PageContainer";
import { useEffect } from "react";

export const Dashboard = () => {
  const { authData } = useAuthContext();

  const [getUser, { data: userData, error, loading }] = useFetch({
    url: `/tiktok/user`,
    method: "POST",
    body: JSON.stringify({ accessToken: authData?.access_token }),
  });

  useEffect(() => {
    getUser();
  }, []);

  if (!userData) {
    return <Loader />;
  }

  return (
    <PageContainer>
      <PageTitle>Hello, {userData.display_name || "Welcome!"}</PageTitle>
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
      <div className="grid grid-cols-2 grid-rows-2 gap-4 mt-8 w-full">
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
    </PageContainer>
  );
};
