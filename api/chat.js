module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY não está configurada no Vercel.'
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : (req.body || {});

    const incoming = Array.isArray(body.messages)
      ? body.messages
      : [];

    const messages = incoming
      .filter(
        m =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
      )
      .slice(-12);

    if (!messages.length) {
      return res.status(400).json({
        error: 'Nenhuma mensagem foi enviada.'
      });
    }

    const response = await fetch(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5.6-luna',
          instructions:
            'Você é o Raven AI, um assistente pessoal em português do Brasil. Responda de forma natural, útil e objetiva.',
          input: messages,
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message =
        data?.error?.message ||
        'A API da OpenAI retornou um erro.';

      return res.status(response.status).json({
        error: message
      });
    }

    let text = '';

    if (typeof data.output_text === 'string') {
      text = data.output_text;
    }

    if (!text && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          for (const part of item.content) {
            if (
              part.type === 'output_text' &&
              typeof part.text === 'string'
            ) {
              text += part.text;
            }
          }
        }
      }
    }

    if (!text) {
      text = 'A IA respondeu, mas não retornou texto.';
    }

    return res.status(200).json({ text });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Erro interno ao falar com a OpenAI.'
    });
  }
};
