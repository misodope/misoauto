interface PageContainerProps {
  children: React.ReactNode;
}
export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <div className="container mx-auto flex flex-col items-center">
      {children}
    </div>
  );
};
