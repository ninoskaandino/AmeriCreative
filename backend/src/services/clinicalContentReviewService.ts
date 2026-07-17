import { config } from '../config.js';
import { bedrockTextService } from './bedrockTextService.js';

export interface ReviewResult {
  safe: boolean;
  issues: string[];
  suggestions: string[];
}

export const clinicalContentReviewService = {
  /**
   * Scans content to identify clinical or promotional compliance issues
   */
  async reviewContent(text: string, specialty: string, treatment: string): Promise<ReviewResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Offline scanning rules (for Demo Mode and as primary local checks)
    const lowerText = text.toLowerCase();

    // 1. Check for absolute guarantees
    if (lowerText.includes('garantiza') || lowerText.includes('100%') || lowerText.includes('perfecto') || lowerText.includes('para siempre')) {
      issues.push('Afirmaciones absolutas o promesas de resultados permanentes.');
      suggestions.push('Añade términos moderados como "diseñado para durar", "resultados óptimos bajo control clínico" o "sujeto a valoración".');
    }

    // 2. Check for "no pain" claims
    if (lowerText.includes('sin dolor') || lowerText.includes('cero dolor') || lowerText.includes('no duele')) {
      issues.push('Promesa de tratamiento 100% libre de dolor.');
      suggestions.push('Suaviza la frase mencionando técnicas modernas de confort, sedación consciente o "mínimamente invasivas" para evitar falsas expectativas.');
    }

    // 3. Check for diagnostic claims
    if (lowerText.includes('diagnóstic') && (lowerText.includes('inmediat') || lowerText.includes('automátic'))) {
      issues.push('Insinuación de diagnóstico automatizado o instantáneo.');
      suggestions.push('Aclara que todo diagnóstico definitivo requiere examen clínico presencial y radiografías por un odontólogo certificado.');
    }

    // 4. Check for warning presence
    const hasDisclaimer = lowerText.includes('revisado') || lowerText.includes('evaluación') || lowerText.includes('consulta') || lowerText.includes('cita');
    if (!hasDisclaimer) {
      issues.push('Falta llamado a la valoración clínica presencial.');
      suggestions.push('Incorpora una frase recordando al lector agendar una cita previa de diagnóstico.');
    }

    if (config.demoMode) {
      return {
        safe: issues.length === 0,
        issues,
        suggestions
      };
    }

    try {
      // Prompt Claude to do a structured clinical review
      const prompt = `Analiza el siguiente texto de marketing odontológico para identificar si infringe alguna regla ética de comunicación médica o promesas engañosas.
Tratamiento: ${treatment}
Especialidad: ${specialty}

Texto a analizar:
"""
${text}
"""

Reglas a verificar:
1. No debe prometer resultados permanentes, infalibles o garantizados al 100% ("para siempre", "garantizado").
2. No debe prometer ausencia absoluta de dolor ("no duele nada", "cero dolor").
3. Debe invitar al paciente a una consulta de valoración presencial previa.
4. No debe realizar diagnósticos sin examen clínico.

Responde ÚNICAMENTE en formato JSON con la siguiente estructura (no agregues texto fuera del JSON):
{
  "safe": true/false,
  "issues": ["lista de problemas encontrados"],
  "suggestions": ["lista de recomendaciones para corregirlos"]
}`;

      const clauderesponse = await bedrockTextService.editText({
        text: prompt,
        action: 'mejorar'
      });

      // Parse JSON
      const jsonStart = clauderesponse.indexOf('{');
      const jsonEnd = clauderesponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = clauderesponse.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr) as ReviewResult;
        return parsed;
      }

      return {
        safe: issues.length === 0,
        issues,
        suggestions
      };
    } catch (err) {
      console.error('Error in Claude clinical review. Using offline scanner.', err);
      return {
        safe: issues.length === 0,
        issues,
        suggestions
      };
    }
  }
};
