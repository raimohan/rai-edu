import React from 'react';
import { Link } from 'react-router-dom';
import { useTypewriter, Cursor } from 'react-simple-typewriter';

const GetStartedPage = () => {
    // Typewriter effect ke liye hook
    const [raiEduText] = useTypewriter({
        words: ['RaiEdu'],
        loop: 1,
        typeSpeed: 150,
        deleteSpeed: 50,
    });

    const [taglineText] = useTypewriter({
        words: ['Aapki Padhai ka Naya Saathi...'],
        loop: 1,
        typeSpeed: 70,
        deleteSpeed: 50,
        delaySpeed: 2000, // RaiEdu type hone ke 2 second baad shuru hoga
    });

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center p-4 relative overflow-hidden">
             {/* Animated background shapes */}
            <div className="absolute top-10 -left-10 w-40 h-40 md:w-72 md:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-20 right-0 w-40 h-40 md:w-72 md:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-10 left-20 w-40 h-40 md:w-72 md:h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            <div className="z-10 flex flex-col items-center">
                {/* Yahan layout badla gaya hai (icon upar, text neeche) */}
                <div className="flex flex-col items-center mb-4">
                     <svg className="w-16 h-16 md:w-20 md:h-20 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
                    </svg>
                    {/* Yahan naya font aur typewriter effect apply kiya gaya hai */}
                    <h1 className="text-6xl md:text-8xl font-lobster text-gray-800 dark:text-white h-28 md:h-36">
                        <span>{raiEduText}</span>
                        <Cursor cursorStyle='_' />
                    </h1>
                </div>
                 {/* Yahan naya signature font aur typewriter effect apply kiya gaya hai */}
                <p className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl font-dancing-script h-10">
                    <span>{taglineText}</span>
                </p>
                <Link to="/login">
                    <button className="px-10 py-4 text-lg font-semibold text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400 font-poppins">
                        Get Started
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default GetStartedPage;
