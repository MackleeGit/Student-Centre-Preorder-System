import React from "react";
import { Clock, Users, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

import "./index.css";


const Index = () => {
  return (
    <div className="page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container text-center">
          <h1 className="title">The STC Preorder System</h1>
          <p className="subtitle">
            Skip the queues, order ahead, and enjoy your campus meals without the wait.
          </p>
          <div className="buttons">

            <Link to="/login" className="btn btn-primary">
              Log In 
            </Link>

            <Link to ="/register" className="btn btn-outline">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-header text-center">
            <h2 className="features-title">Why Choose Us?</h2>
            <p className="features-subtitle">
              Revolutionizing campus dining with smart preordering technology
            </p>
          </div>

          <div className="feature-cards">
            <div className="card">
              <Clock className="icon" />
              <h3 className="card-title">Save Time</h3>
              <p className="card-desc">
                No more waiting in long queues. Order ahead and pick up when ready.
              </p>
            </div>

            <div className="card">
              <Smartphone className="icon" />
              <h3 className="card-title">Easy Ordering</h3>
              <p className="card-desc">
                Browse menus, customize orders, and track status all from your phone.
              </p>
            </div>

            <div className="card">
              <Users className="icon" />
              <h3 className="card-title">For Everyone</h3>
              <p className="card-desc">
                Students order seamlessly, vendors manage efficiently, admins oversee everything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container text-center">
          <h2 className="cta-title">Ready to Transform Your Campus Dining?</h2>
          <p className="cta-subtitle">
            Join thousands of students and vendors already using Order & Go Campus
          </p>
          <div className="buttons">
            <a href="/register" className="btn btn-primary">
              Sign Up Now
            </a>
            <a href="/login" className="btn btn-outline">
              Already have an account?
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
