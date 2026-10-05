module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Diagnóstico: verifica se a variável chegou à função
  if (!apiKey) {
    return res.status(500).json({
      error: "DIAGNÓSTICO: OPENAI_API_KEY não chegou à função."
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : (req.body || {});

    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    if (!messages.length) {
      return res.status(400).json({
        error: "DIAGNÓSTICO: nenhuma mensagem recebida."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-6-luna",
          instructions:
            "Você é o Raven AI, um assistente pessoal em português do Brasil. Responda de forma natural, útil e objetiva.",
          input: messages.slice(-12),
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("ERRO OPENAI:", data);

      return res.status(500).json({
        error:
          "DIAGNÓSTICO OPENAI: " +
          (data?.error?.message || "erro desconhecido")
      });
    }

    let text = data.output_text || "";

    if (!text && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          for (const part of item.content) {
            if (
              part.type === "output_text" &&
              typeof part.text === "string"
            ) {
              text += part.text;
            }
          }
        }
      }
    }

    return res.status(200).json({
      text: text || "A IA respondeu sem texto."
    });

  } catch (error) {
    console.error("ERRO INTERNO:", error);

    return res.status(500).json({
      error:
        "DIAGNÓSTICO SERVIDOR: " +
        (error?.message || "erro desconhecido")
    });
  }
};
