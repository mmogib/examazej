export function Footer() {
  return (
    <footer className="border-t bg-card/50 py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Dr. Mohammed Alshahrani -{" "}
          <a 
            href="https://mshahrani.website/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline"
          >
            mshahrani.website
          </a>
        </p>
      </div>
    </footer>
  );
}