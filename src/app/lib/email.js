import emailjs from '@emailjs/nodejs';

const emailUserId = {
    publicKey: process.env.EMAIL_PUBLIC_KEY,
    privateKey: process.env.EMAIL_PRIVATE_KEY,
};

export const sendClientRegistrationEmail = async (newClient) => {
    try {
        const templateParams = {
            name: newClient.name,
            login_url: `${process.env.NEXTAUTH_URL}/login`,
            user_email: newClient.email,
            user_pwd: newClient.tempPassword,
            support_email: 'amin@suplient.com',
            website_url: 'https://app.suplient.com',
            email: newClient.email,
        };

        await emailjs.send(
            process.env.EMAIL_SERVICE_ID,
            process.env.EMAIL_CLIENT_TEMPLATE_ID,
            templateParams,
            emailUserId
        );
    } catch (error) {
        console.log(error);
    }
}

export const sendCoachRegistrationEmail = async (newCoach) => {
    try {
        const templateParams = {
            name: newCoach.name,
            login_url: `${process.env.NEXTAUTH_URL}/login`,
            user_email: newCoach.email,
            user_pwd: newCoach.tempPassword,
            support_email: 'amin@suplient.com',
            website_url: 'https://app.suplient.com',
            email: newCoach.email,
        }

        await emailjs.send(
            process.env.EMAIL_SERVICE_ID,
            process.env.EMAIL_COACH_TEMPLATE_ID,
            templateParams,
            emailUserId
        );
    } catch (error) {
        console.log(error);
    }
}
