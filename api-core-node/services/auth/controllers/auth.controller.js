import { descope } from "../../../../config/descope.js";

export const oauthExchangeController = async (
    req,
    res
) => {
    try {
        const { code, ref } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code missing' });
        }

        const authInfo = await descope.oauth.exchange(code);

        const loginId = authInfo.data?.user?.loginIds?.[0];
        if (!loginId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existingUser = await descope.management.user.load(loginId);

        await descope.management.user.update(loginId, {
            email: existingUser.data?.email,
            phone: existingUser.data?.phone,
            displayName: existingUser.data?.name,
            givenName: existingUser.data?.givenName,
            familyName: existingUser.data?.familyName,
            verifiedEmail: existingUser.data?.verifiedEmail,
            verifiedPhone: existingUser.data?.verifiedPhone,
            customAttributes: {
                ...existingUser.data?.customAttributes,
                metadata: JSON.stringify({ referral_code: ref }),
            },
            roles: existingUser.data?.roleNames,
        });

        const sessionJwt = authInfo.data?.sessionJwt;
        const refreshJwt = authInfo.data?.refreshJwt;

        if (!sessionJwt || !refreshJwt) {
            return res.status(401).json({ error: 'No session or refresh token' });
        }

        // setAuthCookies(res, { sessionJwt, refreshJwt });

        return res.json({ success: true });
    } catch {
        return res
            .status(401)
            .json({ error: 'Invalid or expired token' });
    }
};
