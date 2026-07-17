import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';

let bedrockClient: BedrockRuntimeClient | null = null;

if (!config.demoMode) {
  try {
    const credentials: any = {
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    };
    if (config.awsSessionToken) {
      credentials.sessionToken = config.awsSessionToken;
    }
    bedrockClient = new BedrockRuntimeClient({
      region: config.awsRegion,
      credentials,
    });
  } catch (err) {
    console.error('Failed to initialize real AWS Bedrock client. Falling back to Demo Mode.', err);
    config.demoMode = true; // Auto-fallback
  }
}

// Interface for Text Generation inputs
export interface GenerateTextParams {
  objective: string;
  audience: string;
  specialty: string;
  treatment: string;
  channel: string;
  tone: string;
  extension: 'Corto' | 'Medio' | 'Largo';
  cta?: string;
  language: string;
  branchName?: string;
}

export interface EditTextParams {
  text: string;
  action: 'mejorar' | 'corregir' | 'resumir' | 'expandir' | 'simplificar' | 'humano' | 'tono' | 'redes' | 'cta' | 'titulo' | 'ingles' | 'internacional' | 'marca';
  tone?: string;
}

// -------------------------------------------------------------
// DEMO MODE - MOCK DATA GENERATION TEMPLATES
// -------------------------------------------------------------
const mockCopyTemplates: Record<string, Record<string, string>> = {
  ortodoncia: {
    professional: "Estimado paciente: En Amerident, ofrecemos tratamientos de ortodoncia avanzada con tecnología digital de última generación. Logre una alineación perfecta de sus dientes mediante métodos discretos e higiénicos. Solicite una consulta clínica especializada.",
    friendly: "¡Hola! ¿Sabías que tener dientes alineados no es solo por estética, sino por tu salud bucal? En Amerident, te ayudamos a conseguir esa sonrisa que tanto deseas con brackets modernos y cómodos. ¡Escríbenos para agendar tu diagnóstico!",
    premium: "Diseñe su sonrisa con los estándares más elevados. En Amerident, fusionamos la precisión clínica ortodóncica con la discreción que su ritmo de vida exige. Inicie su tratamiento hoy con nuestros especialistas.",
    kids: "¡Atención papis! 🎒 En Amerikids cuidamos las sonrisas de los más pequeños. Una evaluación de ortodoncia preventiva a tiempo ayuda a que sus dientitos crezcan fuertes y alineados. ¡Haz que sonreír sea divertido!"
  },
  implantologia: {
    professional: "La pérdida de piezas dentales puede comprometer su masticación y estética oral. Los implantes de titanio Amerident ofrecen una solución permanente y biocompatible. Agende una evaluación quirúrgica con nuestros especialistas.",
    friendly: "Recupera la confianza para comer y sonreír. Los implantes dentales en Amerident se ven y se sienten exactamente como tus dientes naturales. ¡Volver a sonreír es más fácil de lo que crees!",
    premium: "Restauración de excelencia. Devuelva la armonía y funcionalidad a su sonrisa con nuestros implantes dentales premium, realizados bajo los más estrictos protocolos clínicos y tecnología digital guiada.",
    tranquilizing: "Sabemos que la idea de un implante puede dar temor, pero en Amerident te acompañamos en cada paso con sedación consciente y técnicas sin dolor. Tu tranquilidad y bienestar son lo primero para nosotros."
  },
  estetica: {
    professional: "Optimice el diseño de su sonrisa con carillas de porcelana de alta resistencia y blanqueamientos clínicos controlados. En Amerident, personalizamos cada tratamiento según sus rasgos faciales.",
    friendly: "¡Luce una sonrisa espectacular! Si buscas un cambio de look para tus dientes, nuestras carillas de resina o porcelana son la opción ideal. ¡Rápido, seguro y diseñado para ti!",
    premium: "El arte de la odontología estética. Diseños personalizados de carillas ultrafinas que reflejan naturalidad, brillo y simetría perfectas. Experimente el cuidado exclusivo de Amerident.",
  },
  general: {
    professional: "La salud bucal preventiva reduce en un 90% el riesgo de patologías periodontales. Recomendamos realizarse una profilaxis clínica profesional Amerident cada seis meses. Reserve su espacio.",
    friendly: "¡Una boca limpia es una boca feliz! 🪥 Agenda tu limpieza dental de rutina en Amerident y dile adiós al sarro y a las manchas. ¡Tu sonrisa te lo agradecerá!",
    kids: "🧼 ¡Guerra contra las bacterias! En Amerikids enseñamos a tus niños a cepillarse correctamente y aplicamos flúor protector en una atmósfera llena de juegos. ¡Diles adiós a las caries!"
  }
};

function generateMockContent(params: GenerateTextParams): string {
  const specKey = params.specialty.toLowerCase().includes('orto') ? 'ortodoncia' 
                  : params.specialty.toLowerCase().includes('implante') || params.specialty.toLowerCase().includes('cirugía') ? 'implantologia'
                  : params.specialty.toLowerCase().includes('estética') || params.specialty.toLowerCase().includes('rehabilitación') ? 'estetica'
                  : 'general';

  const toneKey = params.tone.toLowerCase().includes('prof') ? 'professional'
                  : params.tone.toLowerCase().includes('cerca') || params.tone.toLowerCase().includes('educ') || params.tone.toLowerCase().includes('emp') ? 'friendly'
                  : params.tone.toLowerCase().includes('prem') ? 'premium'
                  : params.tone.toLowerCase().includes('tranq') ? 'tranquilizing'
                  : params.tone.toLowerCase().includes('inf') || params.audience.toLowerCase().includes('niño') ? 'kids'
                  : 'friendly';

  let baseText = mockCopyTemplates[specKey]?.[toneKey] || mockCopyTemplates.general.friendly;

  // Adapt for channel
  if (params.channel.toLowerCase().includes('whatsapp')) {
    baseText = `📲 *Amerident* \n\n${baseText}\n\n👉 Escríbenos para programar tu cita hoy.`;
  } else if (params.channel.toLowerCase().includes('instagram') || params.channel.toLowerCase().includes('redes')) {
    baseText = `✨ ¡Sonríe con confianza! ✨\n\n${baseText}\n\n📍 Disponible en ${params.branchName || 'todas las sucursales Amerident'}.\n\n#Amerident #SaludBucal #DiseñoDeSonrisa #DientesSanos`;
  } else if (params.channel.toLowerCase().includes('correo')) {
    baseText = `Asunto: Cuida tu sonrisa con Amerident 🦷\n\nEstimado(a) paciente,\n\nEsperamos que se encuentre muy bien.\n\n${baseText}\n\nEn Amerident, nos preocupamos por brindarle una experiencia cómoda y de la más alta calidad. Aproveche esta oportunidad y reserve su cita respondiendo a este correo.\n\nAtentamente,\nEl equipo de Amerident Grupo Odontológico`;
  } else if (params.channel.toLowerCase().includes('guion')) {
    baseText = `[VOZ EN OFF - Tono cálido]: ¿Cuándo fue la última vez que sonreíste sin preocupaciones?\n[VIDEO]: Toma corta de un paciente riendo en Amerident.\n[VOZ EN OFF]: ${baseText}\n[VIDEO/CTA]: Pantalla muestra logo de Amerident y teléfono de contacto. ¡Haz tu cita hoy!`;
  }

  // Adjust for CTA
  if (params.cta) {
    baseText += `\n\n📢 Llamada a la acción: ${params.cta}`;
  }

  // Adjust for English translation
  if (params.language.toLowerCase().includes('ing') || params.language.toLowerCase().includes('en')) {
    baseText = `[Translated to English for International Patients]:\n\n${
      specKey === 'ortodoncia' ? 'Discover the comfort of Amerident Orthodontics. Invisible aligners and modern treatments designed just for you. Schedule your appointment today!'
      : specKey === 'implantologia' ? 'Restore your smile and chew with confidence. Premium dental implants at Amerident. Book your surgical evaluation now!'
      : 'Keep your smile healthy and bright. Professional dental cleanings and general dentistry at Amerident. Contact us today!'
    }`;
  }

  return baseText;
}

function generateMockEdit(params: EditTextParams): string {
  switch (params.action) {
    case 'mejorar':
      return `${params.text}\n\n[IA Mejorado]: ✨ Optimizado para mayor impacto y fluidez. Hemos refinado la estructura para conectar mejor con tus pacientes, elevando la claridad y profesionalismo de la marca Amerident.`;
    case 'corregir':
      return `${params.text}\n\n[IA Corrección Ortográfica]: (Gramática corregida y pulida con éxito.)`;
    case 'resumir':
      return `${params.text.substring(0, Math.min(params.text.length, 120))}... (Versión resumida por IA de Amerident)`;
    case 'expandir':
      return `${params.text}\n\nAdemás, en Amerident Grupo Odontológico contamos con instalaciones equipadas con la última tecnología y profesionales especializados listos para brindarte una atención 100% personalizada en cada una de tus visitas.`;
    case 'simplificar':
      return `[IA Simplificado para Paciente]: Reemplazamos términos médicos complejos (como profilaxis, periodontitis o maloclusión) por explicaciones más sencillas: una limpieza profunda para proteger tus encías y acomodar tus dientes para que mastiques bien de forma cómoda.`;
    case 'humano':
      return `¡Hola! Sabemos lo valiosa que es tu sonrisa. 😊 ${params.text} Queremos que te sientas como en casa al visitarnos. ¡Te esperamos pronto!`;
    case 'tono':
      return `[Tono adaptado a ${params.tone || 'Profesional'}]: ${params.text}`;
    case 'redes':
      return `📸✨ ${params.text} ¡Haz clic en el enlace de la bio para agendar! #SonrisaAmerident #EstéticaDental`;
    case 'cta':
      return `${params.text}\n\n👉 ¡No esperes más! Haz clic en el enlace para reservar tu cita y comenzar a sonreír con tranquilidad.`;
    case 'titulo':
      return `¡Una Sonrisa Radiante te Espera en Amerident!`;
    case 'ingles':
      return `[English Translation]: Welcome to Amerident Dental Group. We care about your oral health with premium dental services. Book your appointment now!`;
    case 'internacional':
      return `[Turismo Dental]: ¡Viaja a la República Dominicana y renueva tu sonrisa con Amerident! Ahorra hasta un 60% en implantes y carillas dentales con la misma calidad de EE.UU. e incluye asistencia en tu estadía.`;
    case 'marca':
      return `${params.text}\n\n[Branding Amerident]: Coherente con los valores de excelencia clínica, trato humano y la red de sucursales de Amerident Grupo Odontológico.`;
    default:
      return params.text;
  }
}

// -------------------------------------------------------------
// SERVICE EXPORTS
// -------------------------------------------------------------
export const bedrockTextService = {
  /**
   * Generates Copy content from scratch using Claude or Simulated Templates
   */
  async generateText(params: GenerateTextParams): Promise<string> {
    if (config.demoMode || !bedrockClient) {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateMockContent(params);
    }

    try {
      console.log(`[Bedrock Text] Invoking text model: "${config.bedrockTextModel}"`);
      const prompt = `Actúa como redactor publicitario senior y especialista en marketing odontológico para "Amerident Grupo Odontológico".
Crea un texto publicitario enfocado en:
- Especialidad: ${params.specialty}
- Tratamiento: ${params.treatment}
- Objetivo: ${params.objective}
- Público objetivo: ${params.audience}
- Canal de publicación: ${params.channel}
- Tono de voz: ${params.tone}
- Extensión aproximada: ${params.extension}
- Idioma de respuesta: ${params.language}
${params.cta ? `- Llamada a la acción requerida: ${params.cta}` : ''}
${params.branchName ? `- Sucursal asociada: ${params.branchName}` : ''}

IMPORTANTE: Evita promesas absolutas, diagnósticos automáticos, o dar a entender resultados garantizados al 100% sin evaluación previa. La redacción debe ser elegante, moderna, humana y reflejar el prestigio de Amerident.

Responde únicamente con el texto generado listo para publicar, sin introducciones ni comentarios adicionales.`;

      const isNova = config.bedrockTextModel.includes('nova');
      let payload;

      if (isNova) {
        payload = {
          messages: [
            {
              role: 'user',
              content: [
                {
                  text: prompt
                }
              ]
            }
          ]
        };
      } else {
        payload = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        };
      }

      const command = new InvokeModelCommand({
        modelId: config.bedrockTextModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (isNova) {
        return responseBody.output?.message?.content?.[0]?.text?.trim() || '';
      } else {
        return responseBody.content[0].text.trim();
      }
    } catch (error) {
      console.error('Error invoking Bedrock Claude. Falling back to simulated text.', error);
      return generateMockContent(params);
    }
  },

  /**
   * Refines, summarizes, translates, or edits text using Claude or Simulated edits
   */
  async editText(params: EditTextParams): Promise<string> {
    if (config.demoMode || !bedrockClient) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return generateMockEdit(params);
    }

    try {
      console.log(`[Bedrock Text] Invoking text model for edit: "${config.bedrockTextModel}"`);
      const prompt = `Actúa como editor senior de contenidos odontológicos para Amerident Grupo Odontológico.
Modifica el siguiente texto basándote en esta instrucción: "${params.action}" ${params.tone ? `y aplicando el tono "${params.tone}"` : ''}.

Texto original:
"""
${params.text}
"""

Responde únicamente con el texto modificado, sin preámbulos.`;

      const isNova = config.bedrockTextModel.includes('nova');
      let payload;

      if (isNova) {
        payload = {
          messages: [
            {
              role: 'user',
              content: [
                {
                  text: prompt
                }
              ]
            }
          ]
        };
      } else {
        payload = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        };
      }

      const command = new InvokeModelCommand({
        modelId: config.bedrockTextModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (isNova) {
        return responseBody.output?.message?.content?.[0]?.text?.trim() || '';
      } else {
        return responseBody.content[0].text.trim();
      }
    } catch (error) {
      console.error('Error invoking Bedrock Claude for edit. Falling back to simulated edit.', error);
      return generateMockEdit(params);
    }
  }
};
