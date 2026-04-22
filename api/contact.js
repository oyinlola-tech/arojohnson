const RATE_LIMIT_WINDOW_MS =
    Number.parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "15", 10) * 60 * 1000;
const RATE_LIMIT_MAX = Number.parseInt(process.env.RATE_LIMIT_MAX || "5", 10);
const MAX_CONTENT_LENGTH_BYTES = Number.parseInt(process.env.MAX_CONTENT_LENGTH_BYTES || "16384", 10);
const MIN_SUBMISSION_AGE_MS = 2500;

const rateLimitStore = globalThis.__aroContactRateLimit || new Map();
globalThis.__aroContactRateLimit = rateLimitStore;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /(https?:\/\/|www\.)/gi;
const ALLOWED_SERVICES = new Set([
    "Inbox and communication management",
    "Calendar and meeting coordination",
    "Client and customer support",
    "Administrative operations",
    "Research and reporting",
    "Workflow support and recurring task management"
]);

const setSecurityHeaders = (response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    response.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
};

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const cleanText = (value = "") =>
    String(value)
        .normalize("NFKC")
        .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
        .replace(/\r/g, "")
        .trim();

const normalizeWhitespace = (value = "") =>
    cleanText(value)
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n");

const validateLength = (value, max) => value.length <= max;

const getClientIp = (request) => {
    const forwarded = request.headers["x-forwarded-for"];

    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }

    return request.socket?.remoteAddress || "unknown";
};

const purgeExpiredRateLimits = () => {
    const now = Date.now();

    for (const [key, timestamps] of rateLimitStore.entries()) {
        const recentEntries = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

        if (recentEntries.length === 0) {
            rateLimitStore.delete(key);
            continue;
        }

        rateLimitStore.set(key, recentEntries);
    }
};

const isRateLimited = (key) => {
    const recentEntries = rateLimitStore.get(key) || [];
    return recentEntries.length >= RATE_LIMIT_MAX;
};

const recordAttempt = (key) => {
    const entries = rateLimitStore.get(key) || [];
    entries.push(Date.now());
    rateLimitStore.set(key, entries);
};

const countUrls = (value = "") => {
    const matches = String(value).match(URL_PATTERN);
    return matches ? matches.length : 0;
};

const getAllowedOrigin = () => {
    const allowedOrigin = cleanText(process.env.CONTACT_ALLOWED_ORIGIN || "");
    return allowedOrigin.replace(/\/+$/, "");
};

const isAllowedRequestSource = (request) => {
    const allowedOrigin = getAllowedOrigin();

    if (!allowedOrigin) {
        return true;
    }

    const origin = cleanText(request.headers.origin || "").replace(/\/+$/, "");
    const referer = cleanText(request.headers.referer || "");

    if (origin && origin !== allowedOrigin) {
        return false;
    }

    if (referer && !referer.startsWith(`${allowedOrigin}/`) && referer !== allowedOrigin) {
        return false;
    }

    return true;
};

const getParsedBody = (body) => {
    if (!body) {
        return {};
    }

    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch (error) {
            return null;
        }
    }

    if (typeof body === "object" && !Array.isArray(body)) {
        return body;
    }

    return null;
};

const renderInquiryEmail = ({
    inquiryId,
    name,
    email,
    company,
    service,
    timeline,
    message,
    submittedAt
}) => {
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = escapeHtml(company || "Not provided");
    const safeService = escapeHtml(service);
    const safeTimeline = escapeHtml(timeline || "Not provided");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
    const safeSubmittedAt = escapeHtml(submittedAt);
    const safeInquiryId = escapeHtml(inquiryId);

    return `
        <div style="margin:0;padding:32px;background:#eef3ee;font-family:Arial,sans-serif;color:#132018;">
            <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #dce6dc;border-radius:28px;overflow:hidden;">
                <div style="padding:30px 32px;background:#1d6a4a;color:#ffffff;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">New website inquiry</p>
                    <h1 style="margin:0 0 10px;font-size:28px;line-height:1.2;">A new business inquiry is ready for review.</h1>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#d9efe2;">The inquiry has passed the current validation, timing, and spam checks.</p>
                </div>

                <div style="padding:30px 32px;">
                    <div style="margin-bottom:24px;padding:20px;border:1px solid #dce6dc;border-radius:20px;background:#f7faf6;">
                        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1d6a4a;">Inquiry summary</p>
                        <table role="presentation" style="width:100%;border-collapse:collapse;">
                            <tr>
                                <td style="padding:8px 0;color:#56645b;font-weight:700;">Reference</td>
                                <td style="padding:8px 0;color:#132018;">${safeInquiryId}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#56645b;font-weight:700;">Name</td>
                                <td style="padding:8px 0;color:#132018;">${safeName}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#56645b;font-weight:700;">Email</td>
                                <td style="padding:8px 0;color:#132018;"><a href="mailto:${safeEmail}" style="color:#1d6a4a;text-decoration:none;">${safeEmail}</a></td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#56645b;font-weight:700;">Company</td>
                                <td style="padding:8px 0;color:#132018;">${safeCompany}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#56645b;font-weight:700;">Support area</td>
                                <td style="padding:8px 0;color:#132018;">${safeService}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#56645b;font-weight:700;">Timeline</td>
                                <td style="padding:8px 0;color:#132018;">${safeTimeline}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#56645b;font-weight:700;">Submitted</td>
                                <td style="padding:8px 0;color:#132018;">${safeSubmittedAt}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding:22px;border:1px solid #dce6dc;border-radius:20px;background:#ffffff;">
                        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#1d6a4a;">Project details</p>
                        <p style="margin:0;color:#324038;line-height:1.8;">${safeMessage}</p>
                    </div>

                    <div style="margin-top:24px;padding:18px 20px;border-radius:20px;background:#f7faf6;">
                        <p style="margin:0 0 8px;color:#132018;font-weight:700;">Reply directly to continue the conversation.</p>
                        <p style="margin:0;color:#56645b;line-height:1.7;">This notification was generated by the website contact form after origin checks, content validation, submission timing checks, and basic rate limiting.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderInquiryText = ({
    inquiryId,
    name,
    email,
    company,
    service,
    timeline,
    message,
    submittedAt
}) => [
    "New business inquiry",
    `Reference: ${inquiryId}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "Not provided"}`,
    `Support area: ${service}`,
    `Timeline: ${timeline || "Not provided"}`,
    `Submitted: ${submittedAt}`,
    "",
    "Project details:",
    message,
    "",
    "This inquiry passed origin checks, validation, submission timing checks, and rate limiting."
].join("\n");

module.exports = async function handler(request, response) {
    setSecurityHeaders(response);

    if (request.method === "OPTIONS") {
        response.setHeader("Allow", "POST, OPTIONS");
        return response.status(204).end();
    }

    if (request.method !== "POST") {
        response.setHeader("Allow", "POST, OPTIONS");
        return response.status(405).json({ error: "Method not allowed." });
    }

    if (!isAllowedRequestSource(request)) {
        return response.status(403).json({ error: "Origin not allowed." });
    }

    const contentType = request.headers["content-type"] || "";

    if (!String(contentType).includes("application/json")) {
        return response.status(415).json({ error: "Unsupported content type." });
    }

    const contentLength = Number.parseInt(String(request.headers["content-length"] || "0"), 10);

    if (Number.isFinite(contentLength) && contentLength > MAX_CONTENT_LENGTH_BYTES) {
        return response.status(413).json({ error: "Request body is too large." });
    }

    purgeExpiredRateLimits();

    const ip = getClientIp(request);
    const ipRateLimitKey = `ip:${ip}`;

    if (isRateLimited(ipRateLimitKey)) {
        return response.status(429).json({ error: "Too many inquiries. Please try again later." });
    }

    recordAttempt(ipRateLimitKey);

    const parsedBody = getParsedBody(request.body);

    if (!parsedBody) {
        return response.status(400).json({ error: "Invalid request body." });
    }

    const {
        name,
        email,
        company,
        service,
        timeline,
        message,
        website,
        startedAt
    } = parsedBody;

    if (website) {
        return response.status(400).json({ error: "Spam protection triggered." });
    }

    const normalizedName = normalizeWhitespace(name);
    const normalizedEmail = cleanText(email).toLowerCase();
    const normalizedCompany = normalizeWhitespace(company || "");
    const normalizedService = normalizeWhitespace(service);
    const normalizedTimeline = normalizeWhitespace(timeline || "");
    const normalizedMessage = normalizeWhitespace(message);
    const startedAtValue = Number.parseInt(String(startedAt || "0"), 10);

    if (!normalizedName || !normalizedEmail || !normalizedService || !normalizedMessage) {
        return response.status(400).json({ error: "Missing required fields." });
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
        return response.status(400).json({ error: "Email address is invalid." });
    }

    if (!ALLOWED_SERVICES.has(normalizedService)) {
        return response.status(400).json({ error: "Selected service is invalid." });
    }

    if (
        !validateLength(normalizedName, 80) ||
        !validateLength(normalizedEmail, 120) ||
        !validateLength(normalizedCompany, 100) ||
        !validateLength(normalizedService, 80) ||
        !validateLength(normalizedTimeline, 80) ||
        !validateLength(normalizedMessage, 3000)
    ) {
        return response.status(400).json({ error: "One or more fields are too long." });
    }

    if (normalizedMessage.length < 30) {
        return response.status(400).json({ error: "Message is too short." });
    }

    if (countUrls(normalizedMessage) > 2 || countUrls(normalizedCompany) > 1) {
        return response.status(400).json({ error: "Too many links were included in the inquiry." });
    }

    if (!Number.isFinite(startedAtValue) || Date.now() - startedAtValue < MIN_SUBMISSION_AGE_MS) {
        return response.status(400).json({ error: "Submission failed timing validation." });
    }

    const emailRateLimitKey = `email:${normalizedEmail}`;

    if (isRateLimited(emailRateLimitKey)) {
        return response.status(429).json({ error: "Too many inquiries. Please try again later." });
    }

    recordAttempt(emailRateLimitKey);

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = cleanText(process.env.CONTACT_TO_EMAIL || "");
    const fromEmail = cleanText(process.env.CONTACT_FROM_EMAIL || "Aro Johnson <onboarding@resend.dev>");

    if (!apiKey || !toEmail) {
        return response.status(500).json({ error: "Missing email configuration." });
    }

    const inquiryId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `aro-${Date.now()}`;

    const submittedAt = `${new Date().toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "UTC"
    })} UTC`;

    try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                reply_to: normalizedEmail,
                subject: `New inquiry | ${normalizedName} | ${normalizedService}`,
                html: renderInquiryEmail({
                    inquiryId,
                    name: normalizedName,
                    email: normalizedEmail,
                    company: normalizedCompany,
                    service: normalizedService,
                    timeline: normalizedTimeline,
                    message: normalizedMessage,
                    submittedAt
                }),
                text: renderInquiryText({
                    inquiryId,
                    name: normalizedName,
                    email: normalizedEmail,
                    company: normalizedCompany,
                    service: normalizedService,
                    timeline: normalizedTimeline,
                    message: normalizedMessage,
                    submittedAt
                })
            })
        });

        const result = await resendResponse.json().catch(() => ({}));

        if (!resendResponse.ok) {
            return response.status(502).json({
                error: result?.message || "Email delivery failed."
            });
        }

        return response.status(200).json({ success: true, id: result.id, inquiryId });
    } catch (error) {
        return response.status(500).json({ error: "Unexpected server error." });
    }
};
