// src/utils/formValidators.js

// ---------- Helpers ----------
export const onlyDigits = (v = "") => String(v).replace(/\D/g, "");

// ---------- Máscaras ----------
export const maskArea = (v = "") => {
  const d = onlyDigits(v).slice(0, 2);
  return d.length ? `(${d}` + (d.length === 2 ? ")" : "") : "";
};

export const maskPhone9 = (v = "") => {
  // 9 dígitos: xxxxx-xxxx
  const d = onlyDigits(v).slice(0, 9);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

export const maskCep = (v = "") => {
  // 8 dígitos: 99999-999
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

export const maskCpf = (v = "") => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

export const maskCnpj = (v = "") => {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

// ---------- Validações ----------
export const isValidEmail = (email = "") => {
  // Aceita formatos comuns: exemplo@dominio.com.br, etc.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email).trim());
};

export const isValidName = (name = "") => {
  const v = String(name).trim();

  // mínimo 2 caracteres
  if (v.length < 2) return false;

  // não pode ter números
  if (/\d/.test(v)) return false;

  // só letras (inclui acentos), espaços, apóstrofo e hífen
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v)) return false;

  // bloqueia "aaaa", "bbbb", etc (mesmo caractere repetido)
  const lettersOnly = v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").toLowerCase();
  if (/^(.)\1+$/.test(lettersOnly)) return false;

  // bloqueia nomes com pouca variedade tipo "aa"
  const uniqueChars = new Set(lettersOnly.split(""));
  if (uniqueChars.size < 2) return false;

  return true;
};

export const isValidSobreName = (name = "") => {
  const v = String(name).trim();

  // mínimo 2 caracteres
  if (v.length < 2) return false;

  // não pode ter números
  if (/\d/.test(v)) return false;

  // só letras (inclui acentos), espaços, apóstrofo e hífen
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v)) return false;

  // bloqueia "aaaa", "bbbb", etc (mesmo caractere repetido)
  const lettersOnly = v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").toLowerCase();
  if (/^(.)\1+$/.test(lettersOnly)) return false;

  // bloqueia nomes com pouca variedade tipo "aa"
  const uniqueChars = new Set(lettersOnly.split(""));
  if (uniqueChars.size < 2) return false;

  return true;
};

export const isValidArea = (area = "") => onlyDigits(area).length === 2;
export const isValidPhone9 = (phone = "") => onlyDigits(phone).length === 9;
export const isValidCep = (cep = "") => onlyDigits(cep).length === 8;

// ---------- CPF ----------
export const isValidCpf = (cpf = "") => {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  let first = (sum * 10) % 11;
  if (first === 10) first = 0;
  if (first !== Number(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
  let second = (sum * 10) % 11;
  if (second === 10) second = 0;
  return second === Number(d[10]);
};

// ---------- CNPJ ----------
export const isValidCnpj = (cnpj = "") => {
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const calc = (base, weights) => {
    const sum = base
      .split("")
      .reduce((acc, num, i) => acc + Number(num) * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calc(d.slice(0, 12), w1);
  const d2 = calc(d.slice(0, 12) + d1, w2);

  return d === d.slice(0, 12) + String(d1) + String(d2);
};