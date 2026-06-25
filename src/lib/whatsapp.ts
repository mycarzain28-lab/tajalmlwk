export const WHATSAPP_NUMBER = "967782222919";
export const SALES_PHONE = "782222919";
export const DEV_PHONE = "780687704";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
