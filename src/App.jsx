import React, { useState, useEffect } from 'react';
import PublicKioskPage from './pages/PublicKioskPage';
import AdminPage from './pages/AdminPage';
import QueueDisplayPage from './pages/QueueDisplayPage';
import { getAppConfigAsync, saveAppConfigAsync } from './utils/storage';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentSearch, setCurrentSearch] = useState(window.location.search);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  const [config, setConfig] = useState({
    officeName: 'Badan Pusat Statistik Kabupaten Penajam Paser Utara',
    subTitle: 'Pelayanan Statistik Terpadu (PST BPS PPU)',
    address: 'Jl. Provinsi Km.09 Nipah-Nipah, Penajam, 76411',
    webhookUrl: '',
    spreadsheetUrl: '',
    autoSync: true,
    adminPin: '1234'
  });

  // Listen to browser route/navigation changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setCurrentSearch(window.location.search);
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch Public Config
  useEffect(() => {
    const initPublicConfig = async () => {
      const loadedConfig = await getAppConfigAsync();
      setConfig(prev => ({ ...prev, ...loadedConfig }));
    };
    initPublicConfig();
  }, []);

  // Set Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    await saveAppConfigAsync(newConfig);
  };

  // Route Decision: /display renders Queue TV Display Monitor
  const isDisplayRoute = currentPath.startsWith('/display') || currentHash.startsWith('#/display') || currentSearch.includes('view=display');
  const isAdminRoute = currentPath.startsWith('/admin') || currentHash.startsWith('#/admin');

  if (isDisplayRoute) {
    return (
      <QueueDisplayPage 
        config={config}
        onBack={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
          setCurrentSearch('');
          setCurrentHash('');
        }}
      />
    );
  }

  if (isAdminRoute) {
    return (
      <AdminPage 
        config={config}
        onSaveConfig={handleSaveConfig}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <PublicKioskPage 
      config={config}
    />
  );
}
