const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

module.exports = async function handler(request, response) {
    if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        return response.status(405).json({ error: "Method not allowed." });
    }

    const { name, email, company, service, timeline, message, website } = request.body || {};

    if (website) {
        return response.status(400).json({ error: "Spam protection triggered." });
    }

    if (!name || !email || !service || !message) {
        return response.status(400).json({ error: "Missing required fields." });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "Aro Johnson <onboarding@resend.dev>";

    if (!apiKey || !toEmail) {
        return response.status(500).json({ error: "Missing email configuration." });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = escapeHtml(company || "Not provided");
    const safeService = escapeHtml(service);
    const safeTimeline = escapeHtml(timeline || "Not provided");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

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
                reply_to: email,
                subject: `New inquiry from ${name}`,
                html: `
                    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1d2430;">
                        <h2 style="margin-bottom:16px;">New project inquiry</h2>
                        <p><strong>Name:</strong> ${safeName}</p>
                        <p><strong>Email:</strong> ${safeEmail}</p>
                        <p><strong>Company:</strong> ${safeCompany}</p>
                        <p><strong>Service needed:</strong> ${safeService}</p>
                        <p><strong>Preferred start timeline:</strong> ${safeTimeline}</p>
                        <p><strong>Project details:</strong><br>${safeMessage}</p>
                    </div>
                `,
                text: [
                    "New project inquiry",
                    `Name: ${name}`,
                    `Email: ${email}`,
                    `Company: ${company || "Not provided"}`,
                    `Service needed: ${service}`,
                    `Preferred start timeline: ${timeline || "Not provided"}`,
                    "Project details:",
                    message
                ].join("\n")
            })
        });

        const result = await resendResponse.json();

        if (!resendResponse.ok) {
            return response.status(502).json({
                error: result?.message || "Resend could not send the email."
            });
        }

        return response.status(200).json({ success: true, id: result.id });
    } catch (error) {
        return response.status(500).json({ error: "Unexpected server error." });
    }
};
