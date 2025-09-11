// validateRequest: centralise la gestion des erreurs de validation
import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Retourner le premier message d'erreur proprement
    const first = errors.array()[0];
    return res.status(400).json({ message: first.msg, errors: errors.array() });
  }
  return next();
};

export default validateRequest;
