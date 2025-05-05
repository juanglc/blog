// frontend/src/pages/auth/Signup.tsx
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './SignUp.css';
import '../../App.css';
import {API_URL} from "../../api/config.ts";

const SignUp: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        correo: '',
        nombre: '',
        telefono: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            navigate(+1)
        }
    }, [navigate]);

    const validateForm = () => {
        // Username validation (6-20 characters)
        if (!formData.username || formData.username.length < 6 || formData.username.length > 20) {
            setError('Username must be between 6 and 20 characters');
            return false;
        }

        // Email validation (11-40 characters)
        if (!formData.correo || formData.correo.length < 11 || formData.correo.length > 40) {
            setError('Email must be between 11 and 40 characters');
            return false;
        }

        // Full name validation (12-50 characters)
        if (!formData.nombre || formData.nombre.length < 12 || formData.nombre.length > 50) {
            setError('Full name must be between 12 and 50 characters');
            return false;
        }

        // Phone validation (10-15 characters)
        if (!formData.telefono || formData.telefono.length < 10 || formData.telefono.length > 15) {
            setError('Phone number must be between 10 and 15 characters');
            return false;
        }

        // Password validation (8-32 characters)
        if (!formData.password || formData.password.length < 8 || formData.password.length > 32) {
            setError('Password must be between 8 and 32 characters');
            return false;
        }

        // Password confirmation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate all fields
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const signupResponse = await axios.post(`${API_URL}/api/auth/signup/`, {
                username: formData.username,
                correo: formData.correo,
                nombre: formData.nombre,
                telefono: formData.telefono,
                password: formData.password
            });

            if (signupResponse.status === 201) {
                // Registration successful, now auto-login
                const loginResponse = await axios.post(`${API_URL}/api/auth/login/`, {
                    username: formData.username,
                    password: formData.password
                });

                if (loginResponse.data && loginResponse.data.token) {
                    // Store token and user info
                    localStorage.setItem('token', loginResponse.data.token);
                    localStorage.setItem('user', JSON.stringify(loginResponse.data.user));

                    // Redirect to articles page
                    navigate('/articles');
                } else {
                    // If auto-login fails, redirect to login
                    navigate('/login', { state: { message: 'Registration successful! Please login.' } });
                }
            }

            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            if (error.response && error.response.data && error.response.data.error) {
                setError(error.response.data.error);
            } else {
                setError('An error occurred during registration');
            }
            console.error('Signup error:', error);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                            Username (6-20 characters)
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            minLength={6}
                            maxLength={20}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">
                            Full Name (12-50 characters)
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            minLength={12}
                            maxLength={50}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="correo" className="block text-gray-700 text-sm font-bold mb-2">
                            Email (11-40 characters)
                        </label>
                        <input
                            type="email"
                            id="correo"
                            name="correo"
                            value={formData.correo}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            minLength={11}
                            maxLength={40}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="telefono" className="block text-gray-700 text-sm font-bold mb-2">
                            Phone Number (10-15 characters)
                        </label>
                        <input
                            type="text"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            minLength={10}
                            maxLength={15}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                            Password (8-32 characters)
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            minLength={8}
                            maxLength={32}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                    </div>
                    <hr/>
                    <Link to="/login" className="to_login">
                        Already have an account?
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default SignUp;