import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createContext, useContext, useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

interface LayoutContextType {
  openClientDialog: () => void;
  isClientDialogOpen: boolean;
  setIsClientDialogOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext must be used within Layout");
  }
  return context;
};

export const Layout = ({ children }: LayoutProps) => {
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const openClientDialog = () => {
    setIsClientDialogOpen(true);
  };

  return (
    <LayoutContext.Provider value={{ openClientDialog, isClientDialogOpen, setIsClientDialogOpen }}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <Sidebar onOpenClientDialog={openClientDialog} />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-3 md:p-6 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </LayoutContext.Provider>
  );
};
