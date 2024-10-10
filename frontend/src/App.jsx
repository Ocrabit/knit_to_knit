// App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useState } from "react";
import "./App.css";
import authService from "./services/auth.service";

// Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'bootstrap/dist/css/bootstrap.min.css';

// Base Components
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";

// Page Components
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Create from './pages/Create.jsx';
import Patterns from './pages/Patterns.jsx';
import Profile from "./pages/Profile";


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

  // Login Method
  login = async (event) => {
    event.preventDefault();
    const response = await authService.login(this.state.username, this.state.password);
    if (response.status === 200) {
      this.setState({ isLoggedIn: true, user: response.data.user });
    } else {
      this.setState({ error: 'Login failed' });
    }
  };

  // Logout Method
  logout = async (event) => {
    event.preventDefault();
    const response = await authService.logout();
    if (response.status === 200) {
      this.setState({ isLoggedIn: false, user: null });
    }
  };

  // Handle form inputs
  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    const { username, password, user, isLoggedIn, error } = this.state;

    return (
        <>
          {isLoggedIn ? (
              <HelmetProvider>
            <Router>
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
                <div id="wrapper" style={{ backgroundColor: '#b08968' }}>
                  <Sidebar />
                  <div className="content" style={{ backgroundColor: 'white' }}>
                    <Routes>
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/create" element={<Create />} />
                      <Route path="/patterns" element={<Patterns />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </Router>
          </HelmetProvider>
          ) : (
              <form
                  style={{display: "flex", flexDirection: "column"}}
                  onSubmit={this.login}
              >
                {error && <div style={{ color: 'red' }}>{error}</div>}
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    value={username}
                    onChange={this.handleInputChange}
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    value={password}
                    onChange={this.handleInputChange}
                    required
                />

                <button type="submit" style={{marginTop: "10px"}}>
                  Login
                </button>
              </form>
          )}
        </>
    );
  }
}

export default App;