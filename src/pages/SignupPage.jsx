import React from 'react';
import { Link } from 'react-router-dom';

// Abhi ke liye yeh ek simple page hai. Sign up ka logic baad me add karenge.
const SignupPage = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-800">
            <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center text-blue-500 mb-6">Create an Account</h2>
                <form>
                    {/* ... (Yahan username, email, password ke fields aayenge) ... */}
                     <button type="submit" className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600">
                        Sign Up
                    </button>
                </form>
                 <p className="text-center mt-4 text-gray-600 dark:text-gray-300 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
