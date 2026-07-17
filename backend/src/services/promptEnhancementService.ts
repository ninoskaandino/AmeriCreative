import { config } from '../config.js';
import { bedrockTextService } from './bedrockTextService.js';

export const promptEnhancementService = {
  /**
   * Translates or enhances a simple user description into a rich visual prompt
   */
  async enhancePrompt(params: {
    description: string;
    specialty: string;
    audience: string;
    style: string;
    format: string;
  }): Promise<string> {
    // Styling directives based on selections
    let stylingPrefix = '';
    let stylingSuffix = 'commercial advertising photography, high-end production, professional studio lighting, depth of field, sharp focus, clean corporate aesthetic, white and turquoise color accents';

    if (params.style.toLowerCase().includes('infantil')) {
      stylingPrefix = 'Colorful, child-friendly, playful illustration-photographic blend, ';
      stylingSuffix = 'warm soft lighting, cheerful dental clinic environment, bright pastel colors, positive, encouraging';
    } else if (params.style.toLowerCase().includes('premium') || params.style.toLowerCase().includes('editorial')) {
      stylingPrefix = 'Luxury editorial portrait, elegant dental care advertisement, ';
      stylingSuffix = 'soft studio lighting, clean minimal background, professional depth of field, natural teeth translucency, premium lifestyle photoshoot';
    } else if (params.style.toLowerCase().includes('minimalista')) {
      stylingPrefix = 'Minimalist clean flat design, studio setting, ';
      stylingSuffix = 'soft shadows, clean white background, high contrast, focus on natural bright smile';
    }

    // Context additions based on specialty
    let specialtyContext = '';
    if (params.specialty.toLowerCase().includes('orto')) {
      specialtyContext = 'showing discreet modern dental aligners or a beautifully aligned natural smile';
    } else if (params.specialty.toLowerCase().includes('kids') || params.specialty.toLowerCase().includes('pediat')) {
      specialtyContext = 'happy children, fun dentistry tools, soft dental setup';
    } else if (params.specialty.toLowerCase().includes('estét')) {
      specialtyContext = 'brilliant healthy bright white teeth, natural enamel texture, perfect dental alignment';
    }

    // Default enhanced prompt
    const defaultEnhanced = `${stylingPrefix}${params.description}, ${specialtyContext}, target audience: ${params.audience}, ${stylingSuffix}`
      .replace(/,,/g, ',')
      .trim();

    if (config.demoMode) {
      return defaultEnhanced;
    }

    try {
      // Use Claude to write an extremely high-quality SDXL prompt
      const claudeprompt = await bedrockTextService.editText({
        text: `Crea un prompt optimizado para Stable Diffusion XL en inglés.
El usuario quiere una imagen odontológica con las siguientes características:
- Descripción: "${params.description}"
- Especialidad: "${params.specialty}"
- Público: "${params.audience}"
- Estilo visual: "${params.style}"
- Formato: "${params.format}"

Escribe un prompt descriptivo detallado en inglés de máximo 80 palabras. Enfócate en aspectos positivos (bienestar, salud, felicidad, sonrisa perfecta, clínica limpia y moderna, iluminación profesional). Evita instrumental médico atemorizante, sangre o detalles clínicos desagradables.
Responde únicamente con el prompt en inglés listo para usar.`,
        action: 'mejorar'
      });

      return claudeprompt.replace('[IA Mejorado]:', '').trim();
    } catch (err) {
      return defaultEnhanced;
    }
  }
};
