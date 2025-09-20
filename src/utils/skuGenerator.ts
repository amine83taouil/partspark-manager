import { Category, Part } from '@/types/inventory';

// Mapping des catégories vers leurs abréviations
const CATEGORY_ABBREVIATIONS: Record<Category, string> = {
  "Adhésif": "ADH",
  "Antenne": "ANT", 
  "Batterie": "BAT",
  "Caméra": "CAM",
  "Châssis": "CHA",
  "Connecteur de charge": "CON",
  "Écouteur interne": "ECO",
  "Écran complet": "ECR",
  "Haut-parleur": "HAU",
  "Lentille caméra": "LEN",
  "Nappe": "NAP",
  "Tiroir SIM": "SIM",
  "Vibreur": "VIB",
  "Visserie": "VIS",
  "Vitre arrière": "VIT",
};

/**
 * Génère une abréviation de 3 lettres pour une marque/modèle
 */
function generateBrandAbbreviation(brand: string): string {
  // Nettoyer et normaliser
  const cleaned = brand.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (cleaned.length >= 3) {
    return cleaned.substring(0, 3);
  } else {
    return cleaned.padEnd(3, 'X');
  }
}

/**
 * Génère 4 chiffres aléatoires
 */
function generateRandomDigits(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Vérifie si un SKU existe déjà
 */
function isSkuUnique(sku: string, existingParts: Part[]): boolean {
  return !existingParts.some(part => part.sku === sku);
}

/**
 * Génère un SKU unique au format CAT-BRA-1234
 */
export function generateUniqueSku(
  category: Category, 
  brand: string, 
  existingParts: Part[]
): string {
  const categoryAbbr = CATEGORY_ABBREVIATIONS[category];
  const brandAbbr = generateBrandAbbreviation(brand);
  
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const randomDigits = generateRandomDigits();
    const sku = `${categoryAbbr}-${brandAbbr}-${randomDigits}`;
    
    if (isSkuUnique(sku, existingParts)) {
      return sku;
    }
    
    attempts++;
  }
  
  // Fallback si on n'arrive pas à générer un SKU unique
  const timestamp = Date.now().toString().slice(-4);
  return `${categoryAbbr}-${brandAbbr}-${timestamp}`;
}

/**
 * Formate un SKU pour l'affichage (avec tirets)
 */
export function formatSku(sku: string): string {
  return sku;
}

/**
 * Extrait les informations d'un SKU
 */
export function parseSkuInfo(sku: string): {
  categoryAbbr: string;
  brandAbbr: string;
  digits: string;
} | null {
  const parts = sku.split('-');
  if (parts.length !== 3) return null;
  
  return {
    categoryAbbr: parts[0],
    brandAbbr: parts[1],
    digits: parts[2],
  };
}
