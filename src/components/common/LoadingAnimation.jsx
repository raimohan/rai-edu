import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext'; // Assuming this context provides theme colors

const LoadingAnimation = () => {
    // We import ThemeContext, though for the plane color, we'll use a fixed light blue
    // as per your request, allowing the theme to influence other aspects if needed.
    const { theme } = useContext(ThemeContext);

    // The specific light blue color for the paper plane.
    const planeColor = '#ADD8E6';

    return (
        // The main container, centered and taking full available height.
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {/* CSS styles for the animations and elements are embedded here. */}
            <style>{`
                /* Keyframes for the paper plane's subtle hovering movement */
                @keyframes planeHover {
                    0% {
                        transform: translate(-50%, -50%) rotate(-5deg); /* Start slightly rotated */
                    }
                    50% {
                        transform: translate(-50%, -60%) rotate(5deg);  /* Move up and rotate */
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(-5deg); /* Return to start position */
                    }
                }

                /* Keyframes for clouds moving from right to left, simulating flight */
                @keyframes cloudScroll {
                    0% {
                        transform: translateX(100vw); /* Start off-screen to the right */
                        opacity: 0; /* Fully transparent */
                    }
                    5% {
                        opacity: 1; /* Fade in as they enter the screen */
                    }
                    95% {
                        opacity: 1; /* Stay fully visible while on screen */
                    }
                    100% {
                        transform: translateX(-100vw); /* Move off-screen to the left */
                        opacity: 0; /* Fade out as they leave */
                    }
                }

                /* Basic styling for all cloud elements */
                .cloud {
                    background-color: white; /* White color for clouds */
                    border-radius: 50%; /* Makes them circular */
                    box-shadow: 0 0 10px rgba(0,0,0,0.05); /* Soft shadow for depth */
                    position: absolute; /* Allows positioning relative to its parent */
                    animation: cloudScroll linear infinite; /* Apply the scrolling animation */
                }

                /* Specific dimensions, animation durations, and delays for individual cloud instances.
                   Negative delays make them appear to already be in motion when the animation starts,
                   creating a continuous flow. */
                .cloud-instance-1 {
                    width: 70px; height: 40px;
                    animation-duration: 20s;
                    animation-delay: 0s;
                    top: 20%; left: -10%; /* Initial position (off-screen left for continuous loop) */
                }
                .cloud-instance-2 {
                    width: 50px; height: 30px;
                    animation-duration: 18s;
                    animation-delay: -5s;
                    top: 50%; left: -20%;
                }
                .cloud-instance-3 {
                    width: 90px; height: 50px;
                    animation-duration: 22s;
                    animation-delay: -10s;
                    top: 70%; left: -5%;
                }
                .cloud-instance-4 {
                    width: 60px; height: 35px;
                    animation-duration: 19s;
                    animation-delay: -15s;
                    top: 35%; left: -25%;
                }
                .cloud-instance-5 {
                    width: 80px; height: 45px;
                    animation-duration: 21s;
                    animation-delay: -20s;
                    top: 10%; left: -30%;
                }
            `}</style>

            {/* Container for the paper plane and clouds.
                It has a relative position, fixed height, and hides overflowing content. */}
            <div className="relative w-full h-48 overflow-hidden">
                {/* Paper Plane SVG: Positioned absolutely in the center,
                    with z-index to ensure it appears above the clouds. */}
                <div className="absolute top-1/2 left-1/2 z-10" style={{ animation: 'planeHover 3s infinite ease-in-out' }}>
                    {/* Inline SVG for a clean, scalable paper plane icon.
                        Fill and stroke are set to the defined light blue color. */}
                    <svg width="40" height="40" viewBox="0 0 24 24" fill={planeColor} stroke={planeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </div>

                {/* Cloud elements: Multiple div elements, each with a unique
                    `cloud-instance` class to apply varying sizes, positions,
                    and animation delays for a dynamic cloud background. */}
                <div className="cloud cloud-instance-1"></div>
                <div className="cloud cloud-instance-2"></div>
                <div className="cloud cloud-instance-3"></div>
                <div className="cloud cloud-instance-4"></div>
                <div className="cloud cloud-instance-5"></div>
            </div>
        </div>
    );
};

export default LoadingAnimation;
                
