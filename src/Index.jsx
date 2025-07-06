import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Users, Smartphone } from "lucide-react";
import { supabase } from "./utils/supabaseClient"; // Make sure this path is correct
import "./index.css";

// 1. Array of images for the hero slideshow background
const heroImages = [
 " https://klkzlnwozpmvtqwqdexz.supabase.co/storage/v1/object/public/hero-images//hero1.jpeg",
  "https://klkzlnwozpmvtqwqdexz.supabase.co/storage/v1/object/public/hero-images//hero2.jpeg"
  
];


const Index = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 2. State to track the current image index for the slideshow
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 3. useEffect to handle the slideshow timer
    useEffect(() => {
        const timer = setInterval(() => {
            // Cycle to the next image, looping back to the start if at the end
            setCurrentImageIndex(prevIndex => 
                (prevIndex + 1) % heroImages.length
            );
        }, 5000); // Change image every 5 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const { data, error } = await supabase.from('vendors').select('*');
                if (error) throw error;
                setVendors(data || []);
            } catch (error) {
                console.error("Error fetching vendors:", error);
                setError("Failed to load vendors. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchVendors();
    }, []);

    // 4. Function to handle smooth scrolling to page sections
    const handleScroll = (event, targetId) => {
        event.preventDefault();
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading available vendors...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="page">
            <nav className="navbar">
                <div className="container">
                    <img src="/logo-nobg.png" alt="STC Logo" className="logo" />
                    <div className="nav-links">
                        <a href="#features" className="nav-link" onClick={(e) => handleScroll(e, 'features')}>Features</a>
                        <a href="#vendors" className="nav-link" onClick={(e) => handleScroll(e, 'vendors')}>Vendors</a>
                        <Link to="/login" className="nav-link">Log In</Link>
                        <Link to="/register" className="nav-link">Sign Up</Link>
                    </div>
                </div>
            </nav>

            {/* 5. Updated Hero Section with slideshow elements */}
            <section className="hero">
                <div className="hero-slideshow">
                    {heroImages.map((src, index) => (
                        <img
                            key={src}
                            src={src}
                            alt="Hero background slideshow"
                            className={index === currentImageIndex ? 'active' : ''}
                        />
                    ))}
                </div>
                <div className="hero-overlay"></div>
                <div className="container text-center hero-content">
                    <h1 className="title">STC Food Preorder</h1>
                    <p className="subtitle">
                        Skip the queues, order ahead, and enjoy your campus meals without the wait.
                    </p>
                    <div className="buttons">
                        <Link to="/login" className="btn btn-primary">Log In</Link>
                        <Link to="/register" className="btn btn-outline">Get Started</Link>
                    </div>
                </div>
            </section>

            {/* 6. Corrected nested section tags */}
            <section id="features" className="features">
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

            {/* 7. Corrected nested section tags */}
            <section id="vendors" className="vendors">
                <div className="container">
                    <h2 className="vendors-title">Our Vendors</h2>
                    <div className="vendor-carousel-container">
                        <div className="vendor-cards">
                            {vendors.map(vendor => (
                                <Link to={`/vendor/${vendor.vendorid}`} key={vendor.vendorid} className="vendor-card">
                                    <div className="vendor-image-container">
                                        <img src={vendor.banner_url} alt={vendor.name} className="vendor-image" />
                                    </div>
                                    <div className="vendor-content">
                                        <h3 className="vendor-name">{vendor.name}</h3>
                                        <p className="vendor-desc">{vendor.description}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container text-center">
                    <h2 className="cta-title">Ready to Transform Your Campus Dining?</h2>
                    <p className="cta-subtitle">
                        Join thousands of students and vendors already using Order & Go Campus
                    </p>
                    <div className="buttons">
                        <Link to="/register" className="btn btn-primary">Sign Up Now</Link>
                        <Link to="/login" className="btn btn-outline">Already have an account?</Link>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="container text-center">
                    <p>&copy; {new Date().getFullYear()} STC Food Preorder. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Index;
