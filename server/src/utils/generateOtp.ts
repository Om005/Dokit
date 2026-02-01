import crypto from "crypto";

const generateOtp = (): string => {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

export default generateOtp;