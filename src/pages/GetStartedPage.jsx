import React from 'react';
import { Link } from 'react-router-dom';

const GetStartedPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center p-4 relative overflow-hidden">
             {/* Animated background shapes */}
            <div className="absolute top-10 -left-10 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-20 right-0 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-10 left-20 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            <div className="z-10">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-800 dark:text-white mb-4">
                    Welcome to <span className="text-blue-500">RaiEdu</span>
                </h1>
                <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
                    Aapki Padhai ka Naya Saathi.
                </p>
                <Link to="/login">
                    <button className="px-10 py-4 text-lg font-semibold text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-all duration-300">
                        Get Started
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default GetStartedPage;
