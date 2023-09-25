interface LoaderProps {
  isPageLoader?: boolean;
}
const Loader: React.FC<LoaderProps> = ({ isPageLoader = true }) => {
  return (
    <div
      className={`${
        isPageLoader ? "flex justify-center items-center h-screen" : ""
      }`}
    >
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
};

export default Loader;
