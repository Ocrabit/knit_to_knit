// App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import "./styles/brand.css";
import "./App.css";
import authService from "./services/auth.service";
import { ThemeProvider } from "./context/ThemeContext";

// Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'bootstrap/dist/css/bootstrap.min.css';

// Base Components
import ErrorBoundary from "./pages/ErrorBoundary/ErrorBoundary.jsx";
import Sidebar from "./components/Sidebar/Sidebar";
import UserMenu from "./components/UserMenu/UserMenu";

// Page Components
import About from './pages/About/About.jsx';
import Contact from './pages/Contact/Contact.jsx';
import Create from './pages/Create.jsx';
import Designs from './pages/Designs/Designs.jsx';
import Patterns from './pages/Patterns/Patterns.jsx';
import Profile from "./pages/Profile";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import PatternCreate from "./pages/patternCreate/PatternCreate.jsx";
import PatternView from "./pages/patternView/PatternView.jsx";
import AccountSettings from "./pages/AccountSettings/AccountSettings.jsx";
import StepGuide from "./components/StepGuide/StepGuide.jsx";
import YouFoundMe from "./pages/YouFoundMe/YouFoundMe.jsx";


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

  // Test User Login
  loginAsTestUser = async (event) => {
    event.preventDefault();
    try {
      const response = await authService.login('test_user', 'TestPassword123!');
      this.setState({ isLoggedIn: true, user: response.user });
    } catch (error) {
      this.setState({ error: 'Test user login failed' });
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
              <ThemeProvider>
                <ErrorBoundary>
                  <Helmet>
                    <title>Knit-to-Knit</title>
                  </Helmet>
                  <div className="App">
                    <Sidebar/>
                    <UserMenu user={user} username={username} logout={this.logout} />
                    <div id="wrapper">
                      <div className="content" style={{backgroundColor: 'var(--cream)'}}>
                      <Routes>
                        <Route path="/" element={<Dashboard/>}/>
                        <Route path="/create-pattern" element={<PatternCreate/>}/>
                        <Route path="/pattern-view/:patternId" element={<PatternView/>}/>
                        <Route path="/about" element={<About/>}/>
                        <Route path="/contact" element={<Contact/>}/>
                        <Route path="/account-settings" element={<AccountSettings/>}/>
                        <Route path="/create-design" element={<Create/>}/>
                        <Route path="/patterns" element={<Patterns/>}/>
                        <Route path="/designs" element={<Designs/>}/>
                        <Route path="/stepguide/:patternId" element={<StepGuide/>}/>
                        <Route path="/youfoundme" element={<YouFoundMe/>}/>
                      </Routes>
                    </div>
                  </div>
                </div>
                </ErrorBoundary>
              </ThemeProvider>
            </Router>
          </HelmetProvider>
      )
    } else {
      return <div style={{
        backgroundColor: "var(--wool)",
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}>
        <form
            style={{
              display: "flex",
              flexDirection: "column",
              color: "var(--walnut)",
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              fontFamily: "var(--font-family-primary)",
            }}
            onSubmit={this.login}
        >
          {error && <div style={{color: 'var(--petal)', marginBottom: '1rem'}}>{error}</div>}
          <label htmlFor="username" style={{marginBottom: '0.5rem', fontWeight: 'var(--font-weight-bold)'}}>Username</label>
          <input
              type="text"
              name="username"
              id="username"
              value={username}
              onChange={this.handleInputChange}
              required
              autoComplete="username"
              style={{
                marginBottom: '1rem',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '2px solid var(--beige)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '1rem'
              }}
          />

          <label htmlFor="password" style={{marginBottom: '0.5rem', fontWeight: 'var(--font-weight-bold)'}}>Password</label>
          <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={this.handleInputChange}
              required
              autoComplete="current-password"
              style={{
                marginBottom: '1rem',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '2px solid var(--beige)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '1rem'
              }}
          />

          <button type="submit" className="btn-brand" style={{ marginTop: "10px", cursor: "pointer" }}>
            Login
          </button>
        </form>

        {/* Test User Section */}
        {<div style={{
                padding: "20px",
                borderTop: "2px solid var(--beige)",
                textAlign: "center",
                color: "var(--walnut)",
                backgroundColor: "var(--cream)",
                fontFamily: "var(--font-family-primary)"
            }}>
                <p style={{marginBottom: "10px", fontSize: "14px"}}>
                    Don't have an account? Check out the platform by signing in as a test user!
                </p>
                <button
                    type="button"
                    onClick={this.loginAsTestUser}
                    className="btn-brand-secondary"
                    style={{ marginTop: "10px", cursor: "pointer" }}
                >
                    Login as Test User
                </button>
            </div>}
      </div>
    }
  }
}

export default App;