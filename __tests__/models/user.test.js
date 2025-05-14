import mongoose from 'mongoose';
import User from '../../Models/User.js';
import bcrypt from 'bcrypt';

// Przed każdym testem
beforeEach(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    await User.deleteMany({});
});

// Po każdym teście
afterEach(async () => {
    await mongoose.connection.close();
});

describe('User Model Test', () => {
    // Test 1: Tworzenie użytkownika z poprawnymi danymi
    it('should create & save user successfully', async () => {
        const validUser = new User({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            password: 'Password123!',
            role: '0x01'
        });

        const savedUser = await validUser.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.first_name).toBe(validUser.first_name);
        expect(savedUser.last_name).toBe(validUser.last_name);
        expect(savedUser.email).toBe(validUser.email);
        expect(savedUser.password).not.toBe(validUser.password); // hasło powinno być zahashowane
        expect(savedUser.role).toBe(validUser.role);
    });

    // Test 2: Walidacja wymaganych pól
    it('should fail to save user without required fields', async () => {
        const userWithoutRequiredField = new User({ first_name: 'John' });
        let err;

        try {
            await userWithoutRequiredField.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.last_name).toBeDefined();
        expect(err.errors.email).toBeDefined();
        expect(err.errors.password).toBeDefined();
    });

    // Test 3: Generowanie tokenu JWT
    it('should generate valid JWT token', async () => {
        const user = new User({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            password: 'Password123!',
            role: '0x01'
        });

        await user.save();
        const token = user.generateAccessJWT();

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT token składa się z 3 części oddzielonych kropkami
    });
}); 