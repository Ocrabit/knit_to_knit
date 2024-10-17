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

  componentDidMount() {
    // Check if the user is logged in on page load
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userData = localStorage.getItem("user");

    let user = null;
    try {
      user = userData ? JSON.parse(userData) : null; // Safely parse the user data if it exists
    } catch (error) {
      console.error("Failed to parse user from local storage.", error);
      // If parsing fails, ensure that the application state is updated accordingly
      localStorage.removeItem("user"); // Clear the invalid user data
    }

    if (isLoggedIn && user) {
      this.setState({ isLoggedIn, user });
    }
  }

  // Login Method
  login = async (event) => {
    event.preventDefault();
    try {
      const response = await authService.login(this.state.username, this.state.password);
      this.setState({ isLoggedIn: true, user: response.data.user });
      console.log(response.data)
      localStorage.setItem("user", JSON.stringify(response.data.user));
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
      localStorage.removeItem("user");
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
                      <Route path="/about" element={<About/>}/>
                      <Route path="/contact" element={<Contact/>}/>
                      <Route path="/create" element={<Create/>}/>
                      <Route path="/patterns" element={<Patterns/>}/>
                    </Routes>
                  </div>
                </div>
              </div>
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