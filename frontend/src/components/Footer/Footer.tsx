const Footer = () => (
  <footer className="bg-gray-100 py-4 sm:py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-around">
      <p className="text-gray-600 text-sm sm:mb-0 mb-4">
        &copy; 2023 MisoAuto. All rights reserved.
      </p>
      <div className="flex flex-wrap flex-col">
        <p className="text-gray-600 text-sm sm:mb-0 font-bold">Legal</p>
        <a
          href="/privacy"
          className="text-gray-600 text-sm hover:text-gray-800 mr-4"
        >
          Privacy Policy
        </a>
        <a href="/terms" className="text-gray-600 text-sm hover:text-gray-800">
          Terms of Service
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
