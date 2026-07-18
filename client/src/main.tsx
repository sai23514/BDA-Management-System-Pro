import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import App from './App';
import store from './redux/store';
import { ColorModeProvider } from './context/ColorModeContext';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ColorModeProvider>
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <App />
          </SnackbarProvider>
        </ColorModeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
