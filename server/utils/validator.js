// Validação de telefone internacional (formato: DDI + número)
function validatePhone(phone) {
  // Remove espaços e caracteres especiais
  const cleaned = phone.replace(/\D/g, '');
  // Deve ter pelo menos 10 dígitos (DDI + número)
  // DDI geralmente tem 1-3 dígitos
  return cleaned.length >= 10 && cleaned.length <= 15;
}

function formatPhone(phone) {
  return phone.replace(/\D/g, '');
}

module.exports = { validatePhone, formatPhone };

