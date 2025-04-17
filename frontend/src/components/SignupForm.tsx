import { useState } from 'react';
import axios from 'axios';

export default function SignupForm() {
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        contraseña: '',
        telefono: '',
        rol: 'lector', // lector, escritor o admin
    });

    const [qrCode, setQrCode] = useState('');
    const [responseMsg, setResponseMsg] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/auth/signup/', formData);
            setQrCode(res.data['2fa_qr']);
            setResponseMsg(res.data.message);
        } catch (error: any) {
            setResponseMsg(error.response?.data?.error || 'Error en el registro');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: 'auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Registro con 2FA</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} required />
                <input type="email" name="correo" placeholder="Correo" onChange={handleChange} required />
                <input type="password" name="contraseña" placeholder="Contraseña" onChange={handleChange} required />
                <input type="tel" name="telefono" placeholder="Teléfono (+57...)" onChange={handleChange} required />
                <select name="rol" onChange={handleChange}>
                    <option value="lector">Lector</option>
                    <option value="escritor">Escritor</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit">Registrarse</button>
            </form>

            {responseMsg && <p>{responseMsg}</p>}

            {qrCode && (
                <div style={{ marginTop: '1rem' }}>
                    <p>Escanea este QR en tu app de autenticación:</p>
                    <img src={`data:image/png;base64,${qrCode}`} alt="QR de 2FA" />
                </div>
            )}
        </div>
    );
}
