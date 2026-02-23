// components/Footer.jsx
export const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-foreground border-t border-border mt-24">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-text-secondary">
        <p>&copy; {currentYear} Manger. All Rights Reserved.</p>
      </div>
    </footer>
  );
};