export const validateColor = (color, defaultValue = '#000000') => {
  if (!color || typeof color !== 'string') {
    return defaultValue;
  }
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const trimmed = color.trim();
  return hexRegex.test(trimmed) ? trimmed : defaultValue;
};

export const sanitizeText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const trimmed = text.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
};

export const validateAppearance = (appearance) => {
  if (!appearance || typeof appearance !== 'object') {
    return {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      position: 'top',
      text: 'Hurry! Sale ends in',
    };
  }
  const validPositions = ['top', 'bottom', 'middle'];
  return {
    backgroundColor: validateColor(appearance.backgroundColor, '#000000'),
    textColor: validateColor(appearance.textColor, '#FFFFFF'),
    position: validPositions.includes(appearance.position) ? appearance.position : 'top',
    text: sanitizeText(appearance.text, 100) || 'Hurry! Sale ends in',
  };
};

export const validateTimerName = (name, maxLength = 200) => {
  return sanitizeText(name, maxLength);
};
