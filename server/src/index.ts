import "dotenv/config";
import cors from "cors";
import express from "express";

import {
  analyzeText,
  getAIProvider,
  isGeminiConfigured,
  isOpenAIConfigured,
  type AnalysisAction
} from "./ai-service.js";

const app = express();

const port =
  Number(process.env.PORT ?? 3000);

app.use(cors());

app.use(
  express.json({
    limit: "100kb"
  })
);

interface AnalyzeRequest {
  action?: AnalysisAction;
  text?: string;
  pageUrl?: string;
}

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    provider: getAIProvider(),
    openaiConfigured:
      isOpenAIConfigured(),
    geminiConfigured:
      isGeminiConfigured()
  });
});

app.post("/analyze", async (request, response) => {
  try {
    const {
      action,
      text,
      pageUrl
    } = request.body as AnalyzeRequest;

    if (
      action !== "summarize" &&
      action !== "explain" &&
      action !== "suggest-reply"
    ) {
      response.status(400).json({
        error: "Ação inválida."
      });
      return;
    }

    if (
      typeof text !== "string" ||
      text.trim().length === 0
    ) {
      response.status(400).json({
        error: "Texto não informado."
      });
      return;
    }

    if (text.length > 20000) {
      response.status(400).json({
        error:
          "O texto selecionado é muito grande."
      });
      return;
    }

    const result =
      await analyzeText({
        action,
        text,
        pageUrl
      });

    response.json({
      result,
      provider: getAIProvider()
    });
  } catch (error) {
    console.error(
      "Erro ao analisar texto:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    if (
      message.includes(
        "OPENAI_API_KEY"
      ) ||
      message.includes(
        "GEMINI_API_KEY"
      )
    ) {
      response.status(503).json({
        error:
          "O provedor selecionado não está configurado."
      });

      return;
    }

    if (
      message.startsWith(
        "GEMINI_HTTP_401"
      )
    ) {
      response.status(401).json({
        error:
          "A autenticação com o Gemini foi recusada."
      });

      return;
    }

    if (
      message.startsWith(
        "GEMINI_HTTP_403"
      )
    ) {
      response.status(403).json({
        error:
          "Acesso ao Gemini negado."
      });

      return;
    }

    if (
      message.startsWith(
        "GEMINI_HTTP_429"
      )
    ) {
      response.status(429).json({
        error:
          "Limite ou quota do Gemini atingida."
      });

      return;
    }

    if (
      message.startsWith(
        "GEMINI_TIMEOUT"
      )
    ) {
      response.status(504).json({
        error:
          "A chamada ao Gemini excedeu o tempo limite."
      });

      return;
    }

    const geminiServerError =
      message.match(
        /^GEMINI_HTTP_(5\d{2})/
      );

    if (geminiServerError) {
      response.status(502).json({
        error:
          "O serviço Gemini apresentou uma falha temporária."
      });

      return;
    }

    if (
      message.startsWith(
        "GEMINI_EMPTY_RESPONSE"
      )
    ) {
      response.status(502).json({
        error:
          "O Gemini respondeu sem conteúdo utilizável."
      });

      return;
    }

    if (
      message.startsWith(
        "GEMINI_HTTP_"
      )
    ) {
      response.status(502).json({
        error:
          "A requisição ao Gemini foi recusada."
      });

      return;
    }

    response.status(500).json({
      error:
        "Não foi possível realizar a análise."
    });
  }
});

app.listen(
  port,
  "127.0.0.1",
  () => {
    console.log(
      `Page Support Assistant API em http://127.0.0.1:${port}`
    );

    console.log(
      `Provedor de IA: ${getAIProvider()}`
    );
  }
);
