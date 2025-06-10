import React from 'react';
import { Link } from 'react-router-dom';

// Abhi ke liye yeh ek simple page hai. Login ka logic baad me add karenge.
const LoginPage = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-800">
            <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center text-blue-500 mb-6">Login to RaiEdu</h2>
                <form>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">Email Address</label>
                        <input className="w-full px-3 py-2 border rounded-lg" type="email" id="email" placeholder="you@example.com" />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">Password</label>
                        <input className="w-full px-3 py-2 border rounded-lg" type="password" id="password" placeholder="********" />
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600">
                        Login
                    </button>
                </form>
                <p className="text-center mt-4 text-gray-600 dark:text-gray-300 text-sm">
                    Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
