import admin from "../config/firebase.js";

export const protect = async (req, res, next) => {
  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(401).json({ message: "No session cookie" });
  }

  try {
    const decoded = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid session" });
  }
};
