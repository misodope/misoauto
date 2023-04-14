import { useEffect } from "react";

export const Dashboard = () => {
  useEffect(() => {
    (async () => {
      const res = await fetch("https://misoauto.up.railway.app/api/user");
      const data = await res.json();
      console.log(data);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-10 text-center">Dashboard</h1>
      <div className="grid grid-cols-2 grid-rows-2 gap-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm">Followers</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm">Following</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold">0</div>
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
