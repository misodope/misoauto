import { memo } from "react";

interface PageTitleProps {
  children: React.ReactNode;
}

const PageTitleComponent: React.FC<PageTitleProps> = ({ children }) => {
  return <h1 className="text-3xl font-bold mb-10 text-center">{children}</h1>;
};

export const PageTitle = memo(PageTitleComponent) as typeof PageTitleComponent;
