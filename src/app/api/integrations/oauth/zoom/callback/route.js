import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { integrationRepo } from '@/app/lib/db/integrationSchema';

export async function GET(request) {
    console.log('🎯 Zoom OAuth callback started');
    console.log('🎯 Request URL:', request.url);
    console.log('🎯 Request method:', request.method);

    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
            console.error('Zoom OAuth error:', error);
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/coach/sessions?error=oauth_cancelled`);
        }

        if (!code || !state) {
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/coach/sessions?error=oauth_invalid`);
        }

        let userId, callbackUrl;
        try {
            const stateData = JSON.parse(state);
            userId = stateData.userId;
            callbackUrl = stateData.callbackUrl;
            console.log('✅ State parsed successfully:', { userId, callbackUrl });
        } catch (stateError) {
            console.error('❌ Failed to parse state:', stateError);
            console.error('❌ State value:', state);
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/coach/sessions?error=oauth_invalid_state`);
        }

        // Exchange authorization code for access token
        console.log('🔄 Exchanging authorization code for access token...');
        console.log('🔄 Code:', code ? 'present' : 'missing');
        console.log('🔄 Client ID:', process.env.ZOOM_CLIENT_ID ? 'present' : 'missing');
        console.log('🔄 Client Secret:', process.env.ZOOM_CLIENT_SECRET ? 'present' : 'missing');
        console.log('🔄 Redirect URI:', `${process.env.NEXTAUTH_URL}/api/integrations/oauth/zoom/callback`);

        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/oauth/zoom/callback`,
                client_id: process.env.ZOOM_CLIENT_ID,
                client_secret: process.env.ZOOM_CLIENT_SECRET,
            }),
        });

        console.log('🔄 Token response status:', tokenResponse.status);
        console.log('🔄 Token response ok:', tokenResponse.ok);

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('❌ Token exchange error:', errorData);
            console.error('❌ Response status:', tokenResponse.status);
            console.error('❌ Response headers:', Object.fromEntries(tokenResponse.headers.entries()));
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/coach/sessions?error=token_exchange_failed`);
        }

        const tokenData = await tokenResponse.json();
        console.log('✅ Token data received:', {
            hasAccessToken: !!tokenData.access_token,
            hasRefreshToken: !!tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            scope: tokenData.scope
        });

        const { access_token, refresh_token, expires_in, scope } = tokenData;

        // Get user info from Zoom (optional - might not be available with meeting:write scope)
        let userInfo = null;
        try {
            const userInfoResponse = await fetch('https://api.zoom.us/v2/users/me', {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (userInfoResponse.ok) {
                userInfo = await userInfoResponse.json();
                console.log('✅ Zoom user info retrieved:', userInfo);
            } else {
                console.log('⚠️ Could not retrieve Zoom user info (scope limitation)');
            }
        } catch (userInfoError) {
            console.log('⚠️ User info request failed (scope limitation):', userInfoError.message);
        }

        // Store integration in database
        console.log('🔄 Storing integration in database...');
        const integrationData = {
            coachId: userId,
            platform: 'zoom',
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
            scope: scope,
            platformUserId: userInfo?.id || 'unknown',
            platformEmail: userInfo?.email || 'unknown@zoom.us',
            platformName: userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : 'Zoom User',
            settings: {
                defaultPassword: true,
                waitingRoom: true,
                joinBeforeHost: false,
                muteUponEntry: true,
                autoRecording: 'none'
            }
        };

        console.log('🔄 Integration data:', {
            coachId: integrationData.coachId,
            platform: integrationData.platform,
            hasAccessToken: !!integrationData.accessToken,
            hasRefreshToken: !!integrationData.refreshToken,
            tokenExpiresAt: integrationData.tokenExpiresAt,
            scope: integrationData.scope
        });

        const integration = await integrationRepo.upsertCoachIntegration(integrationData);
        console.log('✅ Zoom integration stored successfully:', integration?.id);

        // Redirect back to the callback URL with success
        const redirectUrl = `${process.env.NEXTAUTH_URL}${callbackUrl}?zoom_connected=true`;
        console.log('Redirecting to:', redirectUrl);
        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error('❌ Zoom OAuth callback error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            errno: error.errno,
            syscall: error.syscall
        });
        console.error('❌ Request URL:', request.url);
        console.error('❌ Request method:', request.method);
        console.error('❌ Environment check:', {
            hasClientId: !!process.env.ZOOM_CLIENT_ID,
            hasClientSecret: !!process.env.ZOOM_CLIENT_SECRET,
            hasNextAuthUrl: !!process.env.NEXTAUTH_URL
        });
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/coach/sessions?error=oauth_callback_failed`);
    }
}
