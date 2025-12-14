// Middleware Autorisation Admin
// - exige un utilisateur connecté avec le rôle 'admin'
import { isLoggedInJWT } from "./isLoggedInJwt.mjs";
// - renvoie 403 si l'utilisateur n'est pas admin
export function isAdmin() {
  const base = isLoggedInJWT();
  return async (req, res, next) => {
    await base(req, res, () => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé' });
      }
      next();
    });
  };
}
