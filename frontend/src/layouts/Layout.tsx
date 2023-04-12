import Footer from "../components/Footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <nav className="bg-white shadow py-4">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <a className="text-lg font-bold text-gray-800" href="/">
            MisoAuto
          </a>
          <a
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
            href="/login"
          >
            Login
          </a>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
