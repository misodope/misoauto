const Footer = () => (
  <footer className="bg-gray-100 py-4">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <p className="text-gray-600 text-sm">
        &copy; 2023 MisoAuto. All rights reserved.
      </p>
      <div>
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
