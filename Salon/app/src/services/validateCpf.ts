// src/utils/validateCPF.ts
import { cpf } from "cpf-cnpj-validator";

/**
 * Retorna true se o CPF for válido, ou false se inválido.
 */
export const isValidCPF = (value: string): boolean => {
  const unmasked = value.replace(/\D/g, "");
  return cpf.isValid(unmasked);
};
