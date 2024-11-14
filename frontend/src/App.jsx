// App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import "./App.css";
import authService from "./services/auth.service";

// Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'bootstrap/dist/css/bootstrap.min.css';

// Base Components
import ErrorBoundary from "./pages/ErrorBoundary/ErrorBoundary.jsx";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";

// Page Components
import About from './pages/About/About.jsx';
import Contact from './pages/Contact/Contact.jsx';
import Create from './pages/Create.jsx';
import Patterns from './pages/Patterns/Patterns.jsx';
import Profile from "./pages/Profile";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import PatternCreate from "./pages/patternCreate/PatternCreate.jsx";
import PatternView from "./pages/patternView/PatternView.jsx";
import AccountSettings from "./pages/AccountSettings/AccountSettings.jsx";
import StepGuide from "./components/StepGuide/StepGuide.jsx";


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      error: "",
      isLoggedIn: false,
      user: null,
    };
  }

  componentDidMount() {
    this.restoreSession();
  }

  restoreSession = async () => {
    try {
      const user = await authService.checkSession();
      if (user) {
        this.setState({ isLoggedIn: true, user: user, username: user.username });
      } else {
        this.setState({ isLoggedIn: false });
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      this.setState({ isLoggedIn: false });
    }
  };

  // Login Method
  login = async (event) => {
    event.preventDefault();
    try {
      const response = await authService.login(this.state.username, this.state.password);
      this.setState({ isLoggedIn: true, user: response.user });
    } catch (error) {
      this.setState({ error: 'Login failed' });
      console.error(error);
    }
  };

  // Logout Method
  logout = async (event) => {
    event.preventDefault();
    try {
      await authService.logout();
      this.setState({ isLoggedIn: false, user: null });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Handle form inputs
  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    const {username, password, user, isLoggedIn, error} = this.state;

    if (isLoggedIn) {
      return (
          <HelmetProvider>
            <Router>
              <ErrorBoundary>
                <Helmet>
                  <title>Knit-to-Knit</title>
                </Helmet>
                <div className="App">
                  <Navbar
                      isAuthenticated={isLoggedIn}
                      user={user}
                      username={username}
                      logout={this.logout}
                  />
                  <div id="wrapper" style={{backgroundColor: '#b08968'}}>
                    <Sidebar/>
                    <div className="content" style={{backgroundColor: 'white'}}>
                      <Routes>
                        <Route path="/" element={<Dashboard/>}/>
                        <Route path="/create-pattern" element={<PatternCreate/>}/>
                        <Route path="/pattern-view/:patternId" element={<PatternView/>}/>
                        <Route path="/about" element={<About/>}/>
                        <Route path="/contact" element={<Contact/>}/>
                        <Route path="/account-settings" element={<AccountSettings/>}/>
                        <Route path="/create-design" element={<Create/>}/>
                        <Route path="/patterns" element={<Patterns/>}/>
                        <Route path="/stepguide/:patternId" element={<StepGuide/>}/>
                      </Routes>
                    </div>
                  </div>
                </div>
              </ErrorBoundary>
            </Router>
          </HelmetProvider>
      )
    } else {
      return (
          <form
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#242424", // Background color
                color: "white",             // Text color to be visible on dark background
                width: "100vw",
                height: "100vh",
                justifyContent: "center",
                alignItems: "center",
              }}
              onSubmit={this.login}
          >
            {error && <div style={{color: 'red'}}>{error}</div>}
            <label htmlFor="username">Username</label>
            <input
                type="text"
                name="username"
                id="username"
                value={username}
                onChange={this.handleInputChange}
                required
                autoComplete="username"
            />

            <label htmlFor="password">Password</label>
            <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={this.handleInputChange}
                required
                autoComplete="current-password"
            />

            <button type="submit" style={{marginTop: "10px"}}>
              Login
            </button>
          </form>
      )
    }
  }
}

export default App;