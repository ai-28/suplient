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

export const sendClientToCoachEmail = async (contactData) => {
    try {
        // Validate required data
        if (!contactData.coachEmail) {
            throw new Error('Coach email address is required');
        }
        if (!contactData.message) {
            throw new Error('Message content is required');
        }

        console.log('Sending email to coach:', {
            coachEmail: contactData.coachEmail,
            coachName: contactData.coachName,
            clientName: contactData.clientName
        });

        const templateParams = {
            email: contactData.coachEmail, // This matches your template's "To Email" field
            name: contactData.clientName, // This matches your template's "From Name" field
            coach_name: contactData.coachName,
            client_name: contactData.clientName,
            client_email: contactData.clientEmail,
            message: contactData.message,
            reply_to: contactData.clientEmail,
            support_email: 'amin@suplient.com',
            website_url: 'https://app.suplient.com',
        };

        console.log('EmailJS template parameters:', templateParams);

        await emailjs.send(
            process.env.EMAIL_SERVICE_ID,
            process.env.EMAIL_CLIENT_TO_COACH_TEMPLATE_ID || 'template_client_to_coach',
            templateParams,
            emailUserId
        );

        console.log('Email sent successfully to coach:', contactData.coachEmail);
    } catch (error) {
        console.log('Error sending client to coach email:', error);
        throw error;
    }
}
