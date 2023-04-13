export const Landing = () => {
  return (
    <div className="flex flex-col justify-center py-6">
      <h1 className="text-5xl mb-4 font-bold text-gray-900">
        Streamline your content creation process with just a few clicks.
      </h1>
      <p className="my-4 text-lg text-gray-500">
        Automating your workflow with ease.
      </p>
      <div className="mt-6">
        <a
          href="/login"
          className="inline-block px-6 py-3 text-lg font-medium leading-6 text-center text-white uppercase transition bg-indigo-600 rounded-md shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Get started
        </a>
      </div>
    </div>
  );
};
