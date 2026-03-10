import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children, initialOpen = true }) => {
  const [userOverride, setUserOverride] = useState(null);
  const isOpen = userOverride !== null ? userOverride : initialOpen;

  const toggle = () => setUserOverride((prev) => (prev !== null ? !prev : !initialOpen));

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
};
