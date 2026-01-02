import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export const signToken = (payload: object, expiresIn: string = '1d') => {
    return jwt.sign(payload, SECRET, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, SECRET);
    } catch (error) {
        return null;
    }
};
